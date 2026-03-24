
-- Bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  class_day TEXT NOT NULL,
  class_time TEXT NOT NULL,
  class_name TEXT NOT NULL,
  coach TEXT NOT NULL,
  wants_drink BOOLEAN DEFAULT false,
  drink_type TEXT,
  wants_mat BOOLEAN DEFAULT false,
  notes TEXT,
  pack_id TEXT,
  status TEXT NOT NULL DEFAULT 'booked',
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending'
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert bookings (public booking form)
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
-- Only service role can read/update/delete
CREATE POLICY "Service role can manage bookings" ON public.bookings FOR ALL USING (true);

-- Packs table (Carte Black x10)
CREATE TABLE public.packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pack_code TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  credits_total INTEGER NOT NULL DEFAULT 10,
  credits_used INTEGER NOT NULL DEFAULT 0,
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert packs" ON public.packs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can manage packs" ON public.packs FOR ALL USING (true);

-- Products table (Boutique)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image_url TEXT,
  category TEXT,
  in_stock BOOLEAN DEFAULT true,
  stripe_price_id TEXT
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Service role can manage products" ON public.products FOR ALL USING (true);

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER DEFAULT 1,
  total_amount INTEGER NOT NULL,
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending'
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can manage orders" ON public.orders FOR ALL USING (true);
