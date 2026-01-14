-- Create a test service for the photographer
INSERT INTO services (id, photographer_id, title, description, price, duration_hours, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '4f295d43-5749-4ece-aa9b-9907815871e9',
  'Wedding Photography Package',
  'Full day wedding coverage with edited photos',
  1000,
  8,
  true
);

-- Create a test booking 
INSERT INTO bookings (
  id,
  client_id,
  photographer_id,
  service_id,
  booking_date,
  total_amount,
  status,
  payment_status,
  commission_rate,
  job_details
)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'f94c89ba-af0f-489d-aeaf-1872f25abf89',
  '4f295d43-5749-4ece-aa9b-9907815871e9',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  NOW() + INTERVAL '7 days',
  1000,
  'pending',
  'pending',
  10,
  'Test wedding photography session for escrow flow testing'
);

-- Enable stripe gateway in test mode
UPDATE payment_gateway_settings SET is_active = true, test_mode = true WHERE gateway_name = 'stripe';