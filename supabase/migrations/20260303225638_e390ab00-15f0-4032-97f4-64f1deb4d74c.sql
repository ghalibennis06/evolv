
-- Table coaches
CREATE TABLE IF NOT EXISTS public.coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  photo text,
  specialties text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  instagram text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view coaches" ON public.coaches FOR SELECT USING (true);

-- Table pricing
CREATE TABLE IF NOT EXISTS public.pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  original_price integer,
  sessions_included integer,
  validity_days integer,
  is_popular boolean NOT NULL DEFAULT false,
  features text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  cta_text text NOT NULL DEFAULT 'Réserver',
  cta_link text NOT NULL DEFAULT '/reserver',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view pricing" ON public.pricing FOR SELECT USING (true);

-- Table site_content (key-value store for editable content)
CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL UNIQUE,
  content jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view site content" ON public.site_content FOR SELECT USING (true);

-- Add SELECT policy on bookings (was missing)
CREATE POLICY "Anyone can view bookings" ON public.bookings FOR SELECT USING (true);

-- Add SELECT policy on orders
CREATE POLICY "Anyone can view orders" ON public.orders FOR SELECT USING (true);

-- Enable realtime for coaches and pricing
ALTER PUBLICATION supabase_realtime ADD TABLE public.coaches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing;
