CREATE TABLE public.client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email text NOT NULL,
  note text NOT NULL,
  created_by text DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

-- Only service_role (edge functions) can manage notes
CREATE POLICY "Service role full access on client_notes"
  ON public.client_notes
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read client_notes"
  ON public.client_notes
  FOR SELECT
  TO public
  USING (true);