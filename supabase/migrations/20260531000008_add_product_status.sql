-- Thêm trường status cho sản phẩm: 'published' (hiển thị) | 'draft' (bản nháp)
-- Mặc định 'published' để sản phẩm cũ không bị ảnh hưởng
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';

-- Index để lọc nhanh sản phẩm published
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
