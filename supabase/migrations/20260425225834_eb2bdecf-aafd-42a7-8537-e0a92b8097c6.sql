-- 1. Add escrow lock columns and lifecycle timestamps
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS escrow_initial_amount numeric,
  ADD COLUMN IF NOT EXISTS escrow_held_amount numeric,
  ADD COLUMN IF NOT EXISTS escrow_commission_amount numeric,
  ADD COLUMN IF NOT EXISTS escrow_final_amount numeric,
  ADD COLUMN IF NOT EXISTS escrow_locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS work_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS work_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- 2. Drop old status check constraint
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

-- 3. Backfill legacy statuses to new state machine vocabulary
UPDATE public.bookings SET status = 'requested'    WHERE status = 'pending';
UPDATE public.bookings SET status = 'accepted'     WHERE status = 'confirmed';
UPDATE public.bookings SET status = 'work_started' WHERE status = 'in_progress';
UPDATE public.bookings SET status = 'complete'     WHERE status = 'completed';
UPDATE public.bookings SET status = 'cancelled'    WHERE status = 'rejected';

-- 4. Add new check constraints
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status = ANY (ARRAY['requested','accepted','work_started','complete','client_confirmed','paid','cancelled','disputed']));

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status = ANY (ARRAY['pending','processing','partial_paid','escrowed','completed','paid','refunded','failed']));

-- 5. State machine validation trigger
CREATE OR REPLACE FUNCTION public.validate_booking_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed boolean := false;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'requested' AND NEW.status IN ('accepted', 'cancelled') THEN allowed := true;
  ELSIF OLD.status = 'accepted' AND NEW.status IN ('work_started', 'cancelled') THEN allowed := true;
  ELSIF OLD.status = 'work_started' AND NEW.status IN ('complete', 'disputed') THEN allowed := true;
  ELSIF OLD.status = 'complete' AND NEW.status IN ('client_confirmed', 'disputed') THEN allowed := true;
  ELSIF OLD.status = 'client_confirmed' AND NEW.status IN ('paid', 'disputed') THEN allowed := true;
  ELSIF OLD.status = 'disputed' AND NEW.status IN ('complete', 'cancelled', 'paid') THEN allowed := true;
  END IF;

  IF NOT allowed THEN
    RAISE EXCEPTION 'Invalid booking status transition: % -> %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_validate_transition ON public.bookings;
CREATE TRIGGER bookings_validate_transition
  BEFORE UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_booking_transition();

-- 6. Lock escrow amounts once set
CREATE OR REPLACE FUNCTION public.lock_escrow_amounts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.escrow_locked_at IS NOT NULL THEN
    IF NEW.escrow_initial_amount    IS DISTINCT FROM OLD.escrow_initial_amount
    OR NEW.escrow_held_amount       IS DISTINCT FROM OLD.escrow_held_amount
    OR NEW.escrow_commission_amount IS DISTINCT FROM OLD.escrow_commission_amount
    OR NEW.escrow_final_amount      IS DISTINCT FROM OLD.escrow_final_amount
    OR NEW.commission_rate          IS DISTINCT FROM OLD.commission_rate
    OR NEW.escrow_locked_at         IS DISTINCT FROM OLD.escrow_locked_at THEN
      RAISE EXCEPTION 'Escrow amounts are locked and cannot be modified after escrow_locked_at is set';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_lock_escrow ON public.bookings;
CREATE TRIGGER bookings_lock_escrow
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_escrow_amounts();