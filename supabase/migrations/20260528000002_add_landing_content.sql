-- Lưu nội dung landing page do AI sinh ra
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS landing_content JSONB;

COMMENT ON COLUMN public.products.landing_content IS 'Nội dung landing page do Claude sinh — NULL = dùng content tĩnh fallback';
