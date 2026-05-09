SELECT cron.schedule(
  'dispatch-reminders-every-5-min',
  '*/5 * * * *',
  $$select net.http_post(
    url:='https://khcerhftbxoiqxeatydz.supabase.co/functions/v1/dispatch-reminders',
    headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoY2VyaGZ0YnhvaXF4ZWF0eWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTQ2NTUsImV4cCI6MjA3MjY3MDY1NX0.jjzTOzJcHWv4EtWcT4SdDKCoo1bKJJ9CFV-KwRMIYxw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;$$
);

SELECT cron.schedule(
  'saved-search-alerts-daily',
  '0 9 * * *',
  $$select net.http_post(
    url:='https://khcerhftbxoiqxeatydz.supabase.co/functions/v1/run-saved-search-alerts',
    headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoY2VyaGZ0YnhvaXF4ZWF0eWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTQ2NTUsImV4cCI6MjA3MjY3MDY1NX0.jjzTOzJcHWv4EtWcT4SdDKCoo1bKJJ9CFV-KwRMIYxw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;$$
);