
DROP POLICY IF EXISTS "newsletter insert anyone" ON public.newsletter_subscribers;
CREATE POLICY "newsletter insert valid email" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND length(email) BETWEEN 5 AND 320 AND email LIKE '%_@_%.__%');
