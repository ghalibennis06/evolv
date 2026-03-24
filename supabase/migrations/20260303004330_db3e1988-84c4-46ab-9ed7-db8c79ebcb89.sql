
-- Drop overly permissive policies
DROP POLICY "Service role can manage bookings" ON public.bookings;
DROP POLICY "Service role can manage packs" ON public.packs;
DROP POLICY "Service role can manage products" ON public.products;
DROP POLICY "Service role can manage orders" ON public.orders;

-- Bookings: only insert allowed publicly, no public read
-- Admin reads via service role key (bypasses RLS)

-- Packs: only insert allowed publicly  
-- Admin reads via service role key

-- Products: public read already exists, no other public access needed

-- Orders: only insert allowed publicly
-- Admin reads via service role key
