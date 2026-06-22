
-- Reviews: restrict public read to verified only
DROP POLICY IF EXISTS "reviews public read" ON public.reviews;
CREATE POLICY "reviews public read verified"
ON public.reviews FOR SELECT
USING (verified = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Order items: must belong to an order owned by the authenticated user
DROP POLICY IF EXISTS "order_items insert via order" ON public.order_items;
CREATE POLICY "order_items insert via own order"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.user_id = auth.uid()
  )
);

-- Orders: authenticated users may only insert orders they own
DROP POLICY IF EXISTS "orders user insert" ON public.orders;
CREATE POLICY "orders user insert own"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
