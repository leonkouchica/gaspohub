-- Simulate photographer evidence submission and set booking date to past
UPDATE bookings SET 
  evidence_urls = ARRAY['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  evidence_notes = 'Wedding photos delivered - 200 edited images',
  evidence_submitted_at = NOW(),
  status = 'completed',
  booking_date = NOW() - INTERVAL '3 days'
WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';