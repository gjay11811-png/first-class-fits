ALTER TABLE public.products
ALTER COLUMN currency SET DEFAULT 'GBP';

ALTER TABLE public.orders
ALTER COLUMN currency SET DEFAULT 'GBP';

UPDATE public.products
SET currency = 'GBP'
WHERE currency IS NULL OR currency <> 'GBP';

UPDATE public.orders
SET currency = 'GBP'
WHERE currency IS NULL OR currency <> 'GBP';