-- Create email settings table for admin configuration
CREATE TABLE public.email_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider VARCHAR(50) NOT NULL DEFAULT 'resend',
  api_key TEXT,
  from_email VARCHAR(255) DEFAULT 'onboarding@resend.dev',
  from_name VARCHAR(255) DEFAULT 'Lovable',
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage email settings
CREATE POLICY "Admins can manage email settings"
  ON public.email_settings
  FOR ALL
  USING (public.is_admin());

-- Insert default settings
INSERT INTO public.email_settings (provider, from_email, from_name, is_enabled)
VALUES ('resend', 'onboarding@resend.dev', 'Lovable', false);