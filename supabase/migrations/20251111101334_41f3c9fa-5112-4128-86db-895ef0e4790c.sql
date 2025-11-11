-- Create payment_settings table for photographers
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT,
  paystack_account_id TEXT,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Photographers can manage their own settings
CREATE POLICY "Photographers can manage their payment settings"
ON public.payment_settings
FOR ALL
USING (auth.uid() = user_id);

-- Admins can view all settings
CREATE POLICY "Admins can view all payment settings"
ON public.payment_settings
FOR SELECT
USING (is_admin());

-- Add updated_at trigger
CREATE TRIGGER update_payment_settings_updated_at
BEFORE UPDATE ON public.payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();