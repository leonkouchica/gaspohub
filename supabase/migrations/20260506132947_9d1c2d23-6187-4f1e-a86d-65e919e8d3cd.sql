-- ============ FEATURE FLAGS ============
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view feature flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Admins manage feature flags" ON public.feature_flags FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('saved_searches', true, 'Saved searches and email alerts'),
  ('quote_requests', true, 'Request a quote flow'),
  ('map_discovery', true, 'Map-based photographer discovery'),
  ('booking_modes', true, 'Instant booking vs request-to-book'),
  ('verification_badges', true, 'Photographer verification badges'),
  ('photographer_metrics', true, 'Response-time and delivery metrics'),
  ('automated_reminders', true, 'Automated booking reminders'),
  ('multi_currency', true, 'Multi-currency display with FX'),
  ('flexible_deposits', false, 'Custom deposit/installment plans'),
  ('mobile_money_payouts', true, 'Mobile money payout method'),
  ('bulk_payouts', true, 'Bulk payout approval screen'),
  ('portfolio_moderation', true, 'Portfolio moderation queue'),
  ('voice_notes', false, 'Voice notes in chat (deferred)'),
  ('gallery_proofing', false, 'Gallery proofing workflow (deferred)'),
  ('microsites', false, 'Public photographer microsites (deferred)');

-- ============ SAVED SEARCHES ============
CREATE TABLE public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  alert_frequency text NOT NULL DEFAULT 'daily',
  is_paused boolean NOT NULL DEFAULT false,
  last_alert_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved searches" ON public.saved_searches FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view saved searches" ON public.saved_searches FOR SELECT USING (is_admin());
CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON public.saved_searches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.saved_search_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id uuid NOT NULL REFERENCES public.saved_searches(id) ON DELETE CASCADE,
  matched_count integer NOT NULL DEFAULT 0,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_search_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own alerts" ON public.saved_search_alerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.saved_searches s WHERE s.id = saved_search_id AND s.user_id = auth.uid())
);
CREATE POLICY "Admins manage alerts" ON public.saved_search_alerts FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============ QUOTE REQUESTS ============
CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  photographer_id uuid NOT NULL,
  service_id uuid,
  shoot_type text NOT NULL,
  location text,
  preferred_date timestamptz,
  duration_hours numeric,
  party_size integer,
  deliverables text,
  budget numeric,
  special_requirements text,
  reference_urls text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz,
  converted_booking_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties view quotes" ON public.quote_requests FOR SELECT USING (auth.uid() = client_id OR auth.uid() = photographer_id OR is_admin());
CREATE POLICY "Clients create quotes" ON public.quote_requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Parties update quotes" ON public.quote_requests FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = photographer_id OR is_admin());
CREATE POLICY "Admins delete quotes" ON public.quote_requests FOR DELETE USING (is_admin());
CREATE TRIGGER update_quote_requests_updated_at BEFORE UPDATE ON public.quote_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.quote_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  photographer_id uuid NOT NULL,
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  message text,
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quote_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties view quote responses" ON public.quote_responses FOR SELECT USING (
  is_admin() OR auth.uid() = photographer_id OR EXISTS (
    SELECT 1 FROM public.quote_requests q WHERE q.id = quote_request_id AND q.client_id = auth.uid()
  )
);
CREATE POLICY "Photographers send responses" ON public.quote_responses FOR INSERT WITH CHECK (auth.uid() = photographer_id);
CREATE POLICY "Photographers update responses" ON public.quote_responses FOR UPDATE USING (auth.uid() = photographer_id OR is_admin());

-- ============ VERIFICATION ============
CREATE TABLE public.photographer_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid NOT NULL,
  full_name text NOT NULL,
  document_type text NOT NULL,
  document_urls text[] NOT NULL DEFAULT '{}',
  selfie_url text,
  status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid,
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.photographer_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photographers view own verifications" ON public.photographer_verifications FOR SELECT USING (auth.uid() = photographer_id OR is_admin());
CREATE POLICY "Photographers submit verifications" ON public.photographer_verifications FOR INSERT WITH CHECK (auth.uid() = photographer_id);
CREATE POLICY "Admins manage verifications" ON public.photographer_verifications FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER update_photographer_verifications_updated_at BEFORE UPDATE ON public.photographer_verifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.photographer_profiles 
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS avg_response_minutes integer,
  ADD COLUMN IF NOT EXISTS on_time_delivery_rate numeric,
  ADD COLUMN IF NOT EXISTS total_completed_bookings integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS service_radius_km integer DEFAULT 50;

-- ============ BOOKING MODES & DEPOSITS ============
ALTER TABLE public.services 
  ADD COLUMN IF NOT EXISTS booking_mode text NOT NULL DEFAULT 'request',
  ADD COLUMN IF NOT EXISTS deposit_percentage numeric NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS installment_count integer NOT NULL DEFAULT 2;

-- ============ CURRENCY ============
CREATE TABLE public.currency_rates (
  code text PRIMARY KEY,
  name text NOT NULL,
  symbol text NOT NULL,
  rate_to_usd numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone reads currencies" ON public.currency_rates FOR SELECT USING (true);
CREATE POLICY "Admins manage currencies" ON public.currency_rates FOR ALL USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO public.currency_rates (code, name, symbol, rate_to_usd) VALUES
  ('USD', 'US Dollar', '$', 1),
  ('NGN', 'Nigerian Naira', '₦', 1500),
  ('GHS', 'Ghanaian Cedi', '₵', 15),
  ('KES', 'Kenyan Shilling', 'KSh', 130),
  ('ZAR', 'South African Rand', 'R', 18),
  ('EUR', 'Euro', '€', 0.92),
  ('GBP', 'British Pound', '£', 0.79);

-- ============ PAYMENT SCHEDULES ============
CREATE TABLE public.payment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  installment_number integer NOT NULL,
  percentage numeric NOT NULL,
  amount numeric NOT NULL,
  due_at timestamptz,
  paid_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Booking parties view schedules" ON public.payment_schedules FOR SELECT USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.client_id = auth.uid() OR b.photographer_id = auth.uid())
  )
);
CREATE POLICY "Admins manage schedules" ON public.payment_schedules FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============ PAYOUT METHODS ============
CREATE TABLE public.payout_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  method_type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payout_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own payout methods" ON public.payout_methods FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read payout methods" ON public.payout_methods FOR SELECT USING (is_admin());
CREATE TRIGGER update_payout_methods_updated_at BEFORE UPDATE ON public.payout_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bulk payout grouping
ALTER TABLE public.payouts 
  ADD COLUMN IF NOT EXISTS approval_batch_id uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

-- ============ PORTFOLIO MODERATION ============
CREATE TABLE public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid NOT NULL,
  image_url text NOT NULL,
  caption text,
  category text,
  status text NOT NULL DEFAULT 'pending',
  moderator_id uuid,
  moderation_notes text,
  moderated_at timestamptz,
  flagged_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone views approved portfolio" ON public.portfolio_items FOR SELECT USING (status = 'approved' OR auth.uid() = photographer_id OR is_admin());
CREATE POLICY "Photographers manage own portfolio" ON public.portfolio_items FOR ALL USING (auth.uid() = photographer_id) WITH CHECK (auth.uid() = photographer_id);
CREATE POLICY "Admins manage all portfolio" ON public.portfolio_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER update_portfolio_items_updated_at BEFORE UPDATE ON public.portfolio_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ NOTIFICATION TEMPLATES & REMINDERS ============
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  subject text,
  body text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_key, channel)
);
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone reads templates" ON public.notification_templates FOR SELECT USING (true);
CREATE POLICY "Admins manage templates" ON public.notification_templates FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.notification_templates (event_key, channel, subject, body) VALUES
  ('booking_confirmed', 'email', 'Your booking is confirmed', 'Your booking on {{date}} with {{photographer}} is confirmed.'),
  ('booking_reminder_24h', 'email', 'Reminder: shoot tomorrow', 'Your shoot with {{photographer}} is in 24 hours.'),
  ('post_shoot_review', 'email', 'How was your shoot?', 'Please leave a review for {{photographer}}.'),
  ('final_delivery_reminder', 'email', 'Final delivery pending', 'Reminder to upload final delivery for booking {{booking_id}}.'),
  ('quote_received', 'email', 'You received a quote', '{{photographer}} sent you a quote of {{price}}.'),
  ('verification_approved', 'email', 'Verification approved', 'Your photographer verification has been approved.'),
  ('verification_rejected', 'email', 'Verification needs attention', 'Your verification was rejected: {{reason}}');

CREATE TABLE public.scheduled_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid,
  user_id uuid NOT NULL,
  event_key text NOT NULL,
  send_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own reminders" ON public.scheduled_reminders FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admins manage reminders" ON public.scheduled_reminders FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "System inserts reminders" ON public.scheduled_reminders FOR INSERT WITH CHECK (true);

-- ============ ANALYTICS ============
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone inserts analytics" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read analytics" ON public.analytics_events FOR SELECT USING (is_admin());
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
