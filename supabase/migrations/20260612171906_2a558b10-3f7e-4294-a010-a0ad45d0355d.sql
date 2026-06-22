-- 1. Restrict product_colors public read to active products (admins see all)
DROP POLICY IF EXISTS "Anyone can view product colors" ON public.product_colors;

CREATE POLICY "Public can view colors of active products"
ON public.product_colors
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_colors.product_id
      AND p.status = 'active'
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- 2. Prevent users from self-verifying their reviews on insert
DROP POLICY IF EXISTS "reviews user insert" ON public.reviews;

CREATE POLICY "reviews user insert"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND verified = false);
