-- Bảng token download: bọc link gốc, có thời hạn và giới hạn truy cập
CREATE TABLE IF NOT EXISTS download_tokens (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token           TEXT        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  order_id        TEXT        NOT NULL,
  product_id      UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_email  TEXT        NOT NULL,
  template_link   TEXT        NOT NULL,
  expires_at      TIMESTAMPTZ,               -- NULL = không hết hạn
  access_count    INTEGER     NOT NULL DEFAULT 0,
  max_accesses    INTEGER     NOT NULL DEFAULT 0, -- 0 = không giới hạn
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE download_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access download_tokens"
  ON download_tokens USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS download_tokens_token_idx ON download_tokens(token);
CREATE INDEX IF NOT EXISTS download_tokens_order_idx ON download_tokens(order_id);

-- Thêm settings cho download tokens
INSERT INTO settings (key, value) VALUES
  ('download_link_expiry_hours', '0'),    -- 0 = unlimited, số giờ: 24, 48, 72, 168...
  ('download_link_max_accesses', '0')    -- 0 = unlimited
ON CONFLICT (key) DO NOTHING;
