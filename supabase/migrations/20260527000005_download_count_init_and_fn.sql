-- Gán số lượt tải khởi tạo ngẫu nhiên (40–100) cho sản phẩm có download_count = 0
UPDATE public.products
  SET download_count = floor(random() * 61 + 40)::int
WHERE download_count = 0;

-- Hàm atomic tăng download_count 1 đơn vị (tránh race condition)
CREATE OR REPLACE FUNCTION increment_download_count(p_product_id UUID)
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE public.products
    SET download_count = download_count + 1
  WHERE id = p_product_id;
$$;
