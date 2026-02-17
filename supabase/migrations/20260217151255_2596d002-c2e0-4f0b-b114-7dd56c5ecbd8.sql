-- Reset the test booking for retesting
UPDATE bookings SET 
  status = 'pending',
  payment_status = 'pending',
  initial_payment_released = false,
  final_payment_released = false
WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

-- Delete test notifications
DELETE FROM notifications WHERE related_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

-- Delete test payouts
DELETE FROM payouts WHERE booking_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';