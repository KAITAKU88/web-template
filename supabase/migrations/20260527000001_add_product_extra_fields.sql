-- Thêm các cột bổ sung cho bảng products
-- Chạy trong Supabase Dashboard → SQL Editor

-- Giá gốc (trước khuyến mãi). NULL = không có khuyến mãi
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS original_price NUMERIC CHECK (original_price IS NULL OR original_price >= 0);

-- Điểm đánh giá trung bình (0.0 - 5.0)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0.0
    CHECK (rating >= 0 AND rating <= 5);

-- Số lượt đánh giá
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS rating_count INT4 NOT NULL DEFAULT 0
    CHECK (rating_count >= 0);

-- Số lượt tải / mua
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS download_count INT4 NOT NULL DEFAULT 0
    CHECK (download_count >= 0);

COMMENT ON COLUMN public.products.original_price IS 'Giá gốc trước khuyến mãi. NULL = không giảm giá';
COMMENT ON COLUMN public.products.rating IS 'Điểm đánh giá trung bình 0-5';
COMMENT ON COLUMN public.products.rating_count IS 'Số lượt đánh giá';
COMMENT ON COLUMN public.products.download_count IS 'Số lượt tải / mua thành công';
