-- Add evidence columns to bookings table for photographer job completion
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS evidence_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS evidence_notes TEXT,
ADD COLUMN IF NOT EXISTS evidence_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_review_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_reviewed_by UUID;

-- Create index for faster queries on bookings needing review
CREATE INDEX IF NOT EXISTS idx_bookings_awaiting_release 
ON public.bookings(status, payment_status, final_payment_released) 
WHERE status = 'completed' AND payment_status = 'paid' AND final_payment_released = false;

-- Create storage bucket for evidence uploads if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for evidence bucket
CREATE POLICY "Photographers can upload evidence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'evidence' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin()
  )
);

CREATE POLICY "Photographers can delete their evidence"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);