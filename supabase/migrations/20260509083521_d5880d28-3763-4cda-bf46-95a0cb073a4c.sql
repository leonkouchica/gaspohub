
-- push_subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subs" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all push subs" ON public.push_subscriptions FOR SELECT USING (is_admin());

-- contracts
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  client_id uuid NOT NULL,
  photographer_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Service Agreement',
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  client_signed_at timestamptz,
  client_signature text,
  client_ip text,
  photographer_signed_at timestamptz,
  photographer_signature text,
  photographer_ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties view contracts" ON public.contracts FOR SELECT USING (auth.uid() = client_id OR auth.uid() = photographer_id OR is_admin());
CREATE POLICY "Parties create contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = photographer_id OR auth.uid() = client_id);
CREATE POLICY "Parties sign contracts" ON public.contracts FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = photographer_id OR is_admin());
CREATE POLICY "Admins manage contracts" ON public.contracts FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER trg_contracts_updated BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- tax_rates
CREATE TABLE public.tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  region_code text,
  label text NOT NULL,
  rate_percent numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone reads tax rates" ON public.tax_rates FOR SELECT USING (true);
CREATE POLICY "Admins manage tax rates" ON public.tax_rates FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER trg_tax_rates_updated BEFORE UPDATE ON public.tax_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- chargebacks
CREATE TABLE public.chargebacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid,
  order_id uuid,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  reason text,
  status text NOT NULL DEFAULT 'open',
  gateway text,
  gateway_reference text,
  risk_score numeric,
  flagged_reason text,
  resolved_at timestamptz,
  resolved_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chargebacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage chargebacks" ON public.chargebacks FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER trg_chargebacks_updated BEFORE UPDATE ON public.chargebacks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- shipments
CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  carrier text,
  tracking_number text,
  tracking_url text,
  label_url text,
  status text NOT NULL DEFAULT 'pending',
  ship_to jsonb,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order owner views shipments" ON public.shipments FOR SELECT USING (
  is_admin() OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = shipments.order_id AND o.client_id = auth.uid())
);
CREATE POLICY "Admins manage shipments" ON public.shipments FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER trg_shipments_updated BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_contracts_booking ON public.contracts(booking_id);
CREATE INDEX idx_shipments_order ON public.shipments(order_id);
CREATE INDEX idx_chargebacks_status ON public.chargebacks(status);
CREATE INDEX idx_push_subs_user ON public.push_subscriptions(user_id);
