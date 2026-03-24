ALTER TABLE public.coaches
  ADD COLUMN IF NOT EXISTS display_order integer;

UPDATE public.coaches
SET display_order = COALESCE(display_order, sort_order, 0);

ALTER TABLE public.coaches
  ALTER COLUMN display_order SET DEFAULT 0;

ALTER TABLE public.coaches
  ALTER COLUMN display_order SET NOT NULL;

ALTER TABLE public.coaches
  ADD COLUMN IF NOT EXISTS featured_coach boolean;

UPDATE public.coaches
SET featured_coach = COALESCE(featured_coach, is_featured, false);

ALTER TABLE public.coaches
  ALTER COLUMN featured_coach SET DEFAULT false;

ALTER TABLE public.coaches
  ALTER COLUMN featured_coach SET NOT NULL;
