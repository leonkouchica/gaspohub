-- Create payouts table to track commission payments
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  order_id UUID REFERENCES public.orders(id),
  amount NUMERIC NOT NULL,
  payout_type TEXT NOT NULL CHECK (payout_type IN ('initial', 'final', 'order_commission')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method TEXT,
  transaction_reference TEXT,
  notes TEXT,
  released_by UUID,
  released_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Photographers can view their own payouts
CREATE POLICY "Photographers can view their own payouts"
ON public.payouts FOR SELECT
USING (auth.uid() = photographer_id OR is_admin());

-- Admins can manage all payouts
CREATE POLICY "Admins can manage all payouts"
ON public.payouts FOR ALL
USING (is_admin());

-- Create index for efficient queries
CREATE INDEX idx_payouts_photographer_id ON public.payouts(photographer_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);
CREATE INDEX idx_payouts_booking_id ON public.payouts(booking_id);
CREATE INDEX idx_payouts_order_id ON public.payouts(order_id);

-- Add trigger for updated_at
CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();