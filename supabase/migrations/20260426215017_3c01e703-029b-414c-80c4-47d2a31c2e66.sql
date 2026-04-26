
-- Disputes table
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL,
  raised_by_role TEXT NOT NULL CHECK (raised_by_role IN ('client','photographer')),
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','under_review','resolved_refund','resolved_release','resolved_partial','closed')),
  admin_notes TEXT,
  resolution TEXT,
  resolution_amount NUMERIC,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_disputes_booking_id ON public.disputes(booking_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- View: parties of the booking + admin
CREATE POLICY "Parties and admins can view disputes"
ON public.disputes FOR SELECT
USING (
  is_admin()
  OR EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = disputes.booking_id
      AND (b.client_id = auth.uid() OR b.photographer_id = auth.uid())
  )
);

-- Insert: client or photographer of the booking
CREATE POLICY "Parties can create disputes"
ON public.disputes FOR INSERT
WITH CHECK (
  raised_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id
      AND (
        (raised_by_role = 'client' AND b.client_id = auth.uid())
        OR (raised_by_role = 'photographer' AND b.photographer_id = auth.uid())
      )
  )
);

-- Update/Delete: admin only
CREATE POLICY "Admins manage disputes"
ON public.disputes FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE TRIGGER update_disputes_updated_at
BEFORE UPDATE ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-mark booking disputed when a dispute is opened
CREATE OR REPLACE FUNCTION public.mark_booking_disputed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.bookings
  SET status = 'disputed', updated_at = now()
  WHERE id = NEW.booking_id
    AND status IN ('work_started','complete','client_confirmed');
  RETURN NEW;
END;
$$;

CREATE TRIGGER mark_booking_disputed_trg
AFTER INSERT ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.mark_booking_disputed();

-- Storage: allow booking parties + admin to read evidence files
CREATE POLICY "Booking parties can view dispute evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'evidence'
  AND (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE (b.client_id = auth.uid() OR b.photographer_id = auth.uid())
        AND position(b.id::text in name) > 0
    )
  )
);

-- Allow any authenticated user to upload to their own folder for dispute evidence
-- (existing INSERT policy already restricts to auth.uid()::text = foldername[1])
