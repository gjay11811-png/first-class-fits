
DROP POLICY IF EXISTS "product_images public read" ON public.product_images;
CREATE POLICY "product_images active read" ON public.product_images
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_images.product_id AND p.status = 'active')
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "product-images public read" ON storage.objects;
CREATE POLICY "product-images active read" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'product-images'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.product_images pi
      JOIN public.products p ON p.id = pi.product_id
      WHERE p.status = 'active'
        AND pi.url LIKE '%/' || storage.objects.name
    )
    OR EXISTS (
      SELECT 1
      FROM public.product_colors pc
      JOIN public.products p ON p.id = pc.product_id
      WHERE p.status = 'active'
        AND (
          pc.image_url LIKE '%/' || storage.objects.name
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(pc.images) AS u(val)
            WHERE u.val LIKE '%/' || storage.objects.name
          )
        )
    )
  )
);

DROP POLICY IF EXISTS "reviews user update own" ON public.reviews;
CREATE POLICY "reviews user update own" ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND verified = false);

ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
