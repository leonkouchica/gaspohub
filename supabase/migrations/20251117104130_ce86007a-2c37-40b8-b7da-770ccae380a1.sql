-- Add review moderation fields
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderator_id UUID REFERENCES auth.users(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_notes TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;

-- Add cancellation and refund fields to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'processed', 'failed'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'review', 'message', 'system', 'approval')),
  is_read BOOLEAN DEFAULT FALSE,
  related_id UUID,
  related_type TEXT,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications"
ON notifications FOR ALL
USING (is_admin());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);

-- Update reviews RLS policy to only show approved reviews publicly
DROP POLICY IF EXISTS "Everyone can view public reviews" ON reviews;
CREATE POLICY "Everyone can view approved public reviews"
ON reviews FOR SELECT
USING (
  (is_public = true AND is_approved = true) 
  OR auth.uid() = reviewer_id 
  OR auth.uid() = photographer_id 
  OR is_admin()
);