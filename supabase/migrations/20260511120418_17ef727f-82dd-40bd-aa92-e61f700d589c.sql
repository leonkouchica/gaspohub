-- 1. Studio team helper
CREATE OR REPLACE FUNCTION public.is_studio_member_of(_owner_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.studio_teams t
    JOIN public.studio_members m ON m.team_id = t.id
    WHERE t.owner_id = _owner_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  )
$$;

-- Extend bookings RLS for studio members
DROP POLICY IF EXISTS "Studio members can view bookings" ON public.bookings;
CREATE POLICY "Studio members can view bookings" ON public.bookings
FOR SELECT USING (public.is_studio_member_of(photographer_id));

DROP POLICY IF EXISTS "Studio members can update bookings" ON public.bookings;
CREATE POLICY "Studio members can update bookings" ON public.bookings
FOR UPDATE USING (public.is_studio_member_of(photographer_id));

-- Galleries
DROP POLICY IF EXISTS "Studio members manage galleries" ON public.galleries;
CREATE POLICY "Studio members manage galleries" ON public.galleries
FOR ALL USING (public.is_studio_member_of(photographer_id))
WITH CHECK (public.is_studio_member_of(photographer_id));

-- Gallery images
DROP POLICY IF EXISTS "Studio members manage gallery images" ON public.gallery_images;
CREATE POLICY "Studio members manage gallery images" ON public.gallery_images
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.galleries g
  WHERE g.id = gallery_images.gallery_id AND public.is_studio_member_of(g.photographer_id)
)) WITH CHECK (EXISTS (
  SELECT 1 FROM public.galleries g
  WHERE g.id = gallery_images.gallery_id AND public.is_studio_member_of(g.photographer_id)
));

-- Contracts
DROP POLICY IF EXISTS "Studio members view contracts" ON public.contracts;
CREATE POLICY "Studio members view contracts" ON public.contracts
FOR SELECT USING (public.is_studio_member_of(photographer_id));

-- Products
DROP POLICY IF EXISTS "Studio members manage products" ON public.products;
CREATE POLICY "Studio members manage products" ON public.products
FOR ALL USING (public.is_studio_member_of(photographer_id))
WITH CHECK (public.is_studio_member_of(photographer_id));

-- 2. Referral credits ledger
CREATE TABLE IF NOT EXISTS public.referral_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  source_booking_id uuid,
  source_referral_id uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credits" ON public.referral_credits
FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admins manage credits" ON public.referral_credits
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER trg_referral_credits_updated
BEFORE UPDATE ON public.referral_credits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: credit referrer on booking paid
CREATE OR REPLACE FUNCTION public.credit_referral_on_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ref_row public.referrals%ROWTYPE;
  pct numeric;
  reward numeric;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    SELECT * INTO ref_row FROM public.referrals
      WHERE referred_user_id = NEW.client_id
        AND status = 'pending'
      LIMIT 1;
    IF FOUND THEN
      SELECT COALESCE(reward_percent, 5) INTO pct
        FROM public.referral_codes WHERE code = ref_row.code LIMIT 1;
      reward := ROUND(COALESCE(NEW.total_amount,0) * COALESCE(pct,5) / 100.0, 2);
      INSERT INTO public.referral_credits (user_id, amount, source_booking_id, source_referral_id, status)
        VALUES (ref_row.referrer_id, reward, NEW.id, ref_row.id, 'pending');
      UPDATE public.referrals
        SET status = 'rewarded', reward_amount = reward, rewarded_at = now()
        WHERE id = ref_row.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_referral_on_paid ON public.bookings;
CREATE TRIGGER trg_credit_referral_on_paid
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.credit_referral_on_paid();

-- 3. Gallery downloads log + RPC
CREATE TABLE IF NOT EXISTS public.gallery_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL,
  user_id uuid NOT NULL,
  image_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and clients view downloads" ON public.gallery_downloads
FOR SELECT USING (
  is_admin() OR
  EXISTS (SELECT 1 FROM public.galleries g
    WHERE g.id = gallery_downloads.gallery_id
      AND (g.photographer_id = auth.uid() OR g.client_id = auth.uid()
           OR public.is_studio_member_of(g.photographer_id)))
);

CREATE OR REPLACE FUNCTION public.record_gallery_download(_gallery_id uuid, _image_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  g_client uuid;
  s_limit int;
  s_count int;
  s_allow boolean;
BEGIN
  SELECT client_id INTO g_client FROM public.galleries WHERE id = _gallery_id;
  IF g_client IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'gallery_not_found'); END IF;
  IF g_client <> auth.uid() THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;

  SELECT download_limit, download_count, allow_downloads
    INTO s_limit, s_count, s_allow
    FROM public.gallery_settings WHERE gallery_id = _gallery_id;

  IF s_allow IS NOT NULL AND s_allow = false THEN
    RETURN jsonb_build_object('ok', false, 'error', 'downloads_disabled');
  END IF;
  IF s_limit IS NOT NULL AND s_limit > 0 AND s_count >= s_limit THEN
    RETURN jsonb_build_object('ok', false, 'error', 'limit_reached');
  END IF;

  UPDATE public.gallery_settings
    SET download_count = COALESCE(download_count,0) + 1, updated_at = now()
    WHERE gallery_id = _gallery_id;

  INSERT INTO public.gallery_downloads (gallery_id, user_id, image_id)
    VALUES (_gallery_id, auth.uid(), _image_id);

  RETURN jsonb_build_object('ok', true, 'remaining',
    CASE WHEN s_limit IS NULL OR s_limit = 0 THEN NULL ELSE s_limit - (COALESCE(s_count,0) + 1) END);
END;
$$;

-- 4. Chargeback webhook events
CREATE TABLE IF NOT EXISTS public.chargeback_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway text NOT NULL,
  event_type text,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  chargeback_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chargeback_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read webhook events" ON public.chargeback_webhook_events
FOR SELECT USING (is_admin());