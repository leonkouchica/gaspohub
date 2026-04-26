
-- Helper: does this booking have any active dispute?
CREATE OR REPLACE FUNCTION public.has_active_dispute(_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.disputes
    WHERE booking_id = _booking_id
      AND status IN ('open','under_review')
  )
$$;

-- Block forward booking transitions and payment-release flag while dispute is active
CREATE OR REPLACE FUNCTION public.block_progress_when_disputed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_active_dispute(NEW.id) THEN
    -- Block forward status transitions; allow moves to disputed/cancelled and no-op
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status IN ('complete','client_confirmed','paid') THEN
      RAISE EXCEPTION 'Booking has an active dispute; status cannot advance to %', NEW.status;
    END IF;

    -- Block flipping final_payment_released on
    IF COALESCE(NEW.final_payment_released, false) = true
       AND COALESCE(OLD.final_payment_released, false) = false THEN
      RAISE EXCEPTION 'Booking has an active dispute; final payout is locked';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_progress_when_disputed_trg ON public.bookings;
CREATE TRIGGER block_progress_when_disputed_trg
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.block_progress_when_disputed();

-- Block payout completion while booking is under active dispute
CREATE OR REPLACE FUNCTION public.block_payout_when_disputed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_id IS NOT NULL
     AND NEW.status = 'completed'
     AND COALESCE(OLD.status, '') <> 'completed'
     AND public.has_active_dispute(NEW.booking_id) THEN
    RAISE EXCEPTION 'Cannot complete payout: booking has an active dispute';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_payout_when_disputed_trg ON public.payouts;
CREATE TRIGGER block_payout_when_disputed_trg
BEFORE UPDATE ON public.payouts
FOR EACH ROW EXECUTE FUNCTION public.block_payout_when_disputed();
