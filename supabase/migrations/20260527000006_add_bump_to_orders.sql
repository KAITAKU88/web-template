-- Lưu thông tin sản phẩm bán kèm (Order Bump) trong đơn hàng
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS bump_product_id UUID REFERENCES public.products(id),
  ADD COLUMN IF NOT EXISTS bump_amount     INT4 CHECK (bump_amount IS NULL OR bump_amount > 0);

COMMENT ON COLUMN public.orders.bump_product_id IS 'Sản phẩm bán kèm (Order Bump), NULL nếu không mua thêm';
COMMENT ON COLUMN public.orders.bump_amount     IS 'Giá bán kèm đã trả (= 1/2 giá gốc sản phẩm đó)';
