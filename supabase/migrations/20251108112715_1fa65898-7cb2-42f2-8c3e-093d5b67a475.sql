-- Create photographer availability table
CREATE TABLE public.photographer_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(photographer_id, date, start_time)
);

-- Enable RLS
ALTER TABLE public.photographer_availability ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view available slots"
ON public.photographer_availability
FOR SELECT
USING (is_available = true);

CREATE POLICY "Photographers can manage their availability"
ON public.photographer_availability
FOR ALL
USING (auth.uid() = photographer_id);

CREATE POLICY "Admins can manage all availability"
ON public.photographer_availability
FOR ALL
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_photographer_availability_updated_at
BEFORE UPDATE ON public.photographer_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;