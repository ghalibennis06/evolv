
-- Table: code_creation_requests (Black Card requests from frontend)
CREATE TABLE public.code_creation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  offer_id UUID,
  offer_name TEXT,
  credits_total INTEGER NOT NULL DEFAULT 10,
  payment_method TEXT NOT NULL DEFAULT 'cash_on_site',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  request_source TEXT DEFAULT 'frontend',
  request_status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.code_creation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert requests" ON public.code_creation_requests
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can view requests" ON public.code_creation_requests
  FOR SELECT TO public USING (true);

-- Table: activity_log (general activity tracking)
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor TEXT,
  action TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on activity_log" ON public.activity_log
  FOR ALL TO public USING (true) WITH CHECK (true);
