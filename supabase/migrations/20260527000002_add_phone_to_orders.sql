-- Thêm số điện thoại vào đơn hàng (tùy chọn, để hỗ trợ khách hàng)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

COMMENT ON COLUMN public.orders.customer_phone IS 'Số điện thoại liên hệ (tùy chọn)';
