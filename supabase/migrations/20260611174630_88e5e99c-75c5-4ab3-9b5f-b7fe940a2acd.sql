ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;
CREATE INDEX IF NOT EXISTS products_brand_idx ON public.products (brand);

INSERT INTO public.categories (slug, name, description, sort_order) VALUES
  ('t-shirts', 'T-Shirts', 'Tees and short-sleeve tops.', 10),
  ('shorts', 'Shorts', 'Shorts for every season.', 11),
  ('sets', 'Sets', 'Tracksuits, short sets and matching co-ords.', 12)
ON CONFLICT (slug) DO NOTHING;