CREATE TABLE IF NOT EXISTS public.admin_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  action_by text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only" ON public.admin_journal FOR ALL USING (true);