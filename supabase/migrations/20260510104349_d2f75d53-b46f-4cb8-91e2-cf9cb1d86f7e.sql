
-- 2FA
CREATE TABLE public.user_two_factor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  method text NOT NULL DEFAULT 'totp',
  secret text,
  is_enabled boolean NOT NULL DEFAULT false,
  backup_codes text[] DEFAULT '{}',
  phone text,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_two_factor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own 2FA" ON public.user_two_factor FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Admins view 2FA" ON public.user_two_factor FOR SELECT USING (is_admin());
CREATE TRIGGER trg_user_two_factor_updated BEFORE UPDATE ON public.user_two_factor FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Studio teams
CREATE TABLE public.studio_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.studio_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages team" ON public.studio_teams FOR ALL USING (auth.uid()=owner_id) WITH CHECK (auth.uid()=owner_id);
CREATE POLICY "Admins manage all teams" ON public.studio_teams FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER trg_studio_teams_updated BEFORE UPDATE ON public.studio_teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.studio_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.studio_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  member_role text NOT NULL DEFAULT 'assistant',
  invited_email text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.studio_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages members" ON public.studio_members FOR ALL USING (
  EXISTS(SELECT 1 FROM public.studio_teams t WHERE t.id=team_id AND t.owner_id=auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.studio_teams t WHERE t.id=team_id AND t.owner_id=auth.uid())
);
CREATE POLICY "Members view own membership" ON public.studio_members FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "Admins manage members" ON public.studio_members FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Referrals
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  reward_percent numeric NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own code" ON public.referral_codes FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "Users create own code" ON public.referral_codes FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Public reads codes for validation" ON public.referral_codes FOR SELECT USING (is_active=true);
CREATE POLICY "Admins manage codes" ON public.referral_codes FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL,
  code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reward_amount numeric DEFAULT 0,
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own referrals" ON public.referrals FOR SELECT USING (auth.uid()=referrer_id OR auth.uid()=referred_user_id);
CREATE POLICY "Authenticated insert referral" ON public.referrals FOR INSERT WITH CHECK (auth.uid()=referred_user_id);
CREATE POLICY "Admins manage referrals" ON public.referrals FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Gallery settings
CREATE TABLE public.gallery_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL UNIQUE,
  watermark_enabled boolean NOT NULL DEFAULT true,
  watermark_text text,
  download_limit integer NOT NULL DEFAULT 0,
  download_count integer NOT NULL DEFAULT 0,
  allow_downloads boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photographer manages gallery settings" ON public.gallery_settings FOR ALL USING (
  EXISTS(SELECT 1 FROM public.galleries g WHERE g.id=gallery_id AND g.photographer_id=auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.galleries g WHERE g.id=gallery_id AND g.photographer_id=auth.uid())
);
CREATE POLICY "Client views gallery settings" ON public.gallery_settings FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.galleries g WHERE g.id=gallery_id AND g.client_id=auth.uid())
);
CREATE POLICY "Admins manage gallery settings" ON public.gallery_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER trg_gallery_settings_updated BEFORE UPDATE ON public.gallery_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User locale
CREATE TABLE public.user_locale (
  user_id uuid PRIMARY KEY,
  locale text NOT NULL DEFAULT 'en',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_locale ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own locale" ON public.user_locale FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Contracts: add pdf_url
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS pdf_url text;

-- Bookings & orders: tax columns
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tax_rate_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_rate_id uuid;

CREATE INDEX IF NOT EXISTS idx_studio_members_user ON public.studio_members(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
