-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('products', 'products', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('portfolio', 'portfolio', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- RLS Policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for products bucket
CREATE POLICY "Anyone can view products"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Photographers can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'photographer'
  )
);

CREATE POLICY "Photographers can update their product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Photographers can delete their product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for portfolio bucket
CREATE POLICY "Anyone can view portfolio images"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio');

CREATE POLICY "Photographers can upload portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'photographer'
  )
);

CREATE POLICY "Photographers can update their portfolio images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Photographers can delete their portfolio images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);