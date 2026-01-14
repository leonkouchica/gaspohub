-- Create advertisement banners table
CREATE TABLE public.advertisement_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  link_text TEXT DEFAULT 'Learn More',
  is_active BOOLEAN DEFAULT true,
  display_pages TEXT[] DEFAULT ARRAY['home', 'photographers', 'services'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advertisement_banners ENABLE ROW LEVEL SECURITY;

-- Everyone can view active banners
CREATE POLICY "Everyone can view active banners"
ON public.advertisement_banners
FOR SELECT
USING (is_active = true);

-- Admins can manage all banners
CREATE POLICY "Admins can manage all banners"
ON public.advertisement_banners
FOR ALL
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_advertisement_banners_updated_at
BEFORE UPDATE ON public.advertisement_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default banner
INSERT INTO public.advertisement_banners (title, description, image_url, link_url, link_text)
VALUES (
  'Upgrade Your Photography Gear',
  'Discover premium cameras, lenses, and accessories. Special offers for GASPOHUB members.',
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200&h=300&fit=crop',
  '#',
  'Learn More'
);