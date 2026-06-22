
DELETE FROM public.reviews WHERE user_id IS NULL;

-- Orders
DROP POLICY IF EXISTS "orders own read" ON public.orders;
CREATE POLICY "orders own read"
  ON public.orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- Order items
DROP POLICY IF EXISTS "order_items via order" ON public.order_items;
CREATE POLICY "order_items via order"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );

-- user_roles privilege escalation guards
CREATE POLICY "user_roles admin insert"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "user_roles admin update"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "user_roles admin delete"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Reviews: enforce linked user
ALTER TABLE public.reviews ALTER COLUMN user_id SET NOT NULL;
DROP POLICY IF EXISTS "reviews user insert" ON public.reviews;
CREATE POLICY "reviews user insert"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
