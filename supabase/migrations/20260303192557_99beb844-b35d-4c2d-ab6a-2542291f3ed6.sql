
-- Sessions table for admin planning
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  duration integer NOT NULL DEFAULT 50,
  capacity integer NOT NULL DEFAULT 8,
  instructor text NOT NULL,
  level text NOT NULL DEFAULT 'Tous niveaux',
  type text NOT NULL DEFAULT 'Reformer',
  price integer NOT NULL DEFAULT 350,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sessions" ON public.sessions
  FOR SELECT USING (true);

-- Session participants
CREATE TABLE public.session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text NOT NULL,
  payment_status text NOT NULL DEFAULT 'En attente',
  notes text,
  registered_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register as participant" ON public.session_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view participants" ON public.session_participants
  FOR SELECT USING (true);

-- Admin drinks menu
CREATE TABLE public.admin_drinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Smoothie',
  price integer NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  tags text[],
  image text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_drinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view drinks" ON public.admin_drinks
  FOR SELECT USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;
