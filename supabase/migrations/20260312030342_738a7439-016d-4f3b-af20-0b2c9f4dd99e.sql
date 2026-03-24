ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS payment_status text DEFAULT NULL;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS original_session_id uuid DEFAULT NULL;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;