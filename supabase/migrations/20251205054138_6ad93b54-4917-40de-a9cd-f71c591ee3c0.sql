-- Create payment gateway settings table for admin configuration
CREATE TABLE public.payment_gateway_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gateway_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  display_name TEXT NOT NULL,
  test_mode BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_gateway_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage payment gateway settings
CREATE POLICY "Admins can manage payment gateway settings"
ON public.payment_gateway_settings
FOR ALL
USING (is_admin());

-- Everyone can view active gateways (for checkout)
CREATE POLICY "Everyone can view active payment gateways"
ON public.payment_gateway_settings
FOR SELECT
USING (is_active = true);

-- Insert default payment gateways
INSERT INTO public.payment_gateway_settings (gateway_name, display_name, is_active, test_mode, settings) VALUES
('stripe', 'Stripe', false, true, '{"supported_currencies": ["USD", "EUR", "GBP"]}'),
('paystack', 'Paystack', false, true, '{"supported_currencies": ["NGN", "GHS", "ZAR", "USD"]}'),
('flutterwave', 'Flutterwave', false, true, '{"supported_currencies": ["NGN", "GHS", "KES", "USD"]}'),
('manual', 'Manual Payment', true, false, '{"instructions": "Contact us for payment details"}');

-- Add trigger for updated_at
CREATE TRIGGER update_payment_gateway_settings_updated_at
BEFORE UPDATE ON public.payment_gateway_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();