-- Bảng theo dõi sự kiện click để phân tích hành vi người dùng
CREATE TABLE IF NOT EXISTS public.click_events (
  id          BIGSERIAL PRIMARY KEY,
  event_type  TEXT        NOT NULL,          -- 'buy_click' | 'view_product' | ...
  product_id  UUID        REFERENCES public.products(id) ON DELETE SET NULL,
  session_id  TEXT,                          -- anonymous session (random uuid from localStorage)
  referrer    TEXT,                          -- document.referrer
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index để query nhanh theo product và event type
CREATE INDEX IF NOT EXISTS idx_click_events_product_id  ON public.click_events (product_id);
CREATE INDEX IF NOT EXISTS idx_click_events_event_type  ON public.click_events (event_type);
CREATE INDEX IF NOT EXISTS idx_click_events_created_at  ON public.click_events (created_at DESC);

-- RLS: cho phép insert từ anon (client-side tracking), không cho read
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert click events"
  ON public.click_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Chỉ service_role mới đọc được (dùng cho dashboard)
CREATE POLICY "Service role can read click events"
  ON public.click_events FOR SELECT
  TO service_role
  USING (true);

COMMENT ON TABLE  public.click_events              IS 'Theo dõi click và hành vi người dùng';
COMMENT ON COLUMN public.click_events.event_type   IS 'Loại sự kiện: buy_click, view_product';
COMMENT ON COLUMN public.click_events.session_id   IS 'ID phiên ẩn danh lưu trong localStorage';
