-- Thêm trường combo vào bảng products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_combo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS combo_product_ids uuid[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS products_is_combo_idx ON products(is_combo) WHERE is_combo = true;
