-- Setup schema: products, orders, customers + RLS
-- Theo thiết kế: thietke.md

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Bảng products
-- =============================================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  template_link TEXT NOT NULL,
  type TEXT CHECK (type IS NULL OR type IN ('notion', 'google_sheet')),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.products IS 'Danh mục Template Notion / Google Sheets';
COMMENT ON COLUMN public.products.type IS 'notion | google_sheet';

-- =============================================================================
-- Bảng orders
-- =============================================================================
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  customer_email TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  CONSTRAINT orders_paid_at_requires_success
    CHECK (
      paid_at IS NULL
      OR status = 'success'
    )
);

COMMENT ON TABLE public.orders IS 'Giao dịch và đối soát thanh toán SePay';
COMMENT ON COLUMN public.orders.id IS 'Mã đơn hàng — dùng làm nội dung chuyển khoản';

CREATE INDEX idx_orders_product_id ON public.orders(product_id);
CREATE INDEX idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX idx_orders_status ON public.orders(status);

-- =============================================================================
-- Bảng customers (remarketing / n8n)
-- =============================================================================
CREATE TABLE public.customers (
  email TEXT PRIMARY KEY,
  full_name TEXT,
  total_orders INT4 NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  last_purchase TIMESTAMPTZ
);

COMMENT ON TABLE public.customers IS 'Tệp khách hàng cho remarketing qua n8n';

-- =============================================================================
-- Row Level Security
-- =============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Idempotent khi chạy lại / đã có policy từ Dashboard
DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "orders_select_public" ON public.orders;

-- products: mọi người được xem (anon + authenticated)
CREATE POLICY "products_select_public"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- orders: client được đọc (Realtime checkout); chỉ service_role sửa được
-- (service_role bypass RLS — không cần policy INSERT/UPDATE/DELETE cho anon)
CREATE POLICY "orders_select_public"
  ON public.orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- customers: không policy công khai — chỉ service_role truy cập

-- =============================================================================
-- Realtime (theo luồng lắng nghe order_id)
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
