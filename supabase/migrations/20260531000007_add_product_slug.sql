-- Thêm cột slug cho sản phẩm — SEO-friendly URL
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Index để lookup nhanh theo slug
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug) WHERE slug IS NOT NULL;
