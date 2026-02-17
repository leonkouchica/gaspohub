-- Simulate admin releasing final payout
UPDATE payouts SET 
  status = 'completed',
  transaction_reference = 'final_test_txn_001',
  completed_at = NOW(),
  released_at = NOW(),
  notes = 'Admin approved - evidence verified'
WHERE booking_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901' 
  AND payout_type = 'final' 
  AND status = 'pending';

-- Mark booking as fully paid
UPDATE bookings SET 
  final_payment_released = true,
  payment_status = 'completed',
  admin_review_notes = 'Evidence verified - all photos delivered',
  admin_reviewed_at = NOW()
WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';