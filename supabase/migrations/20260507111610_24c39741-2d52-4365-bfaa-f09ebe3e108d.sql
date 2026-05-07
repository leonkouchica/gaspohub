-- =========================
-- GALLERIES (proofing)
-- =========================
CREATE TABLE public.galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  photographer_id uuid NOT NULL,
  client_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Your Gallery',
  message text,
  cover_image_url text,
  status text NOT NULL DEFAULT 'draft', -- draft|delivered|approved
  delivered_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers manage own galleries" ON public.galleries
  FOR ALL USING (auth.uid() = photographer_id) WITH CHECK (auth.uid() = photographer_id);
CREATE POLICY "Clients view delivered galleries" ON public.galleries
  FOR SELECT USING (auth.uid() = client_id AND status IN ('delivered','approved'));
CREATE POLICY "Clients update approval on own galleries" ON public.galleries
  FOR UPDATE USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Admins manage galleries" ON public.galleries
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER trg_galleries_updated_at
  BEFORE UPDATE ON public.galleries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_galleries_booking ON public.galleries(booking_id);
CREATE INDEX idx_galleries_photographer ON public.galleries(photographer_id);
CREATE INDEX idx_galleries_client ON public.galleries(client_id);

-- =========================
-- GALLERY IMAGES
-- =========================
CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  position integer NOT NULL DEFAULT 0,
  is_favorite boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT false,
  client_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers manage own gallery images" ON public.gallery_images
  FOR ALL USING (EXISTS (SELECT 1 FROM public.galleries g WHERE g.id = gallery_images.gallery_id AND g.photographer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.galleries g WHERE g.id = gallery_images.gallery_id AND g.photographer_id = auth.uid()));
CREATE POLICY "Clients view delivered gallery images" ON public.gallery_images
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.galleries g WHERE g.id = gallery_images.gallery_id AND g.client_id = auth.uid() AND g.status IN ('delivered','approved')));
CREATE POLICY "Clients update favorites/approval" ON public.gallery_images
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.galleries g WHERE g.id = gallery_images.gallery_id AND g.client_id = auth.uid() AND g.status IN ('delivered','approved')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.galleries g WHERE g.id = gallery_images.gallery_id AND g.client_id = auth.uid()));
CREATE POLICY "Admins manage all gallery images" ON public.gallery_images
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER trg_gallery_images_updated_at
  BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_gallery_images_gallery ON public.gallery_images(gallery_id);

-- =========================
-- MICROSITES
-- =========================
CREATE TABLE public.microsites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  headline text,
  about text,
  hero_image_url text,
  theme_color text DEFAULT '#6366f1',
  contact_email text,
  instagram text,
  website text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.microsites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own microsite" ON public.microsites
  FOR ALL USING (auth.uid() = photographer_id) WITH CHECK (auth.uid() = photographer_id);
CREATE POLICY "Everyone views published microsites" ON public.microsites
  FOR SELECT USING (is_published = true OR auth.uid() = photographer_id OR is_admin());
CREATE POLICY "Admins manage all microsites" ON public.microsites
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER trg_microsites_updated_at
  BEFORE UPDATE ON public.microsites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_microsites_slug ON public.microsites(slug);

-- =========================
-- VOICE NOTES (extend messages with optional attachment columns)
-- =========================
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_type text, -- 'voice' | 'image' | 'file'
  ADD COLUMN IF NOT EXISTS attachment_duration_seconds integer;

-- =========================
-- STORAGE BUCKETS
-- =========================
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', false)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
VALUES ('microsite-assets', 'microsite-assets', true)
ON CONFLICT (id) DO NOTHING;

-- gallery-images: public read, photographers write to their user-id folder
CREATE POLICY "Public read gallery images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery-images');
CREATE POLICY "Photographers upload gallery images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Photographers update own gallery images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'gallery-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Photographers delete own gallery images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- microsite-assets: public read, owner-folder write
CREATE POLICY "Public read microsite assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'microsite-assets');
CREATE POLICY "Owners upload microsite assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'microsite-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners update microsite assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'microsite-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners delete microsite assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'microsite-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- voice-notes: private, owner uploads to own folder; reads via signed URL only
CREATE POLICY "Owners upload voice notes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners read own voice notes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners delete own voice notes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =========================
-- Enable cron + http for scheduled jobs (idempotent)
-- =========================
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;