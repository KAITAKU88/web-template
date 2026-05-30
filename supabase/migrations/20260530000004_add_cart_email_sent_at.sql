-- Đánh dấu đơn pending đã gửi abandoned cart email — tránh gửi trùng
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_email_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Index để query nhanh các đơn cần gửi email
CREATE INDEX IF NOT EXISTS idx_orders_abandoned_cart
  ON orders (status, cart_email_sent_at, created_at)
  WHERE status = 'pending' AND cart_email_sent_at IS NULL;
