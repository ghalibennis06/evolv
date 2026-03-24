
-- Allow admins to update and delete waitlist entries
CREATE POLICY "Admins can update waitlist" ON public.waitlist FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete waitlist" ON public.waitlist FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
