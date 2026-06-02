-- 1. Thêm role "partner" vào staff table
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;
ALTER TABLE staff ADD CONSTRAINT staff_role_check
  CHECK (role IN ('manager', 'collaborator', 'partner'));

-- 2. Thêm creator_id vào products (link tới staff tạo sản phẩm)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS products_creator_id_idx ON products(creator_id);

-- 3. Bảng activity_logs — theo dõi hành vi người dùng
CREATE TABLE IF NOT EXISTS activity_logs (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id     UUID        REFERENCES staff(id) ON DELETE CASCADE,
  action_type  TEXT        NOT NULL,   -- 'login', 'create_product', 'edit_product', 'delete_product', ...
  resource_type TEXT,                  -- 'product', 'order', 'storage'
  resource_id  TEXT,
  details      JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_logs_staff_id_idx  ON activity_logs(staff_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_action_type_idx ON activity_logs(action_type);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_logs_service_all"
  ON activity_logs FOR ALL TO service_role USING (true);
