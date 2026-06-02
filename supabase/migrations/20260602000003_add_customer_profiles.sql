-- Lưu thông tin bổ sung của khách hàng (phone từ CSV import, v.v.)
-- email là khóa chính, liên kết với orders.customer_email
CREATE TABLE IF NOT EXISTS customer_profiles (
  email      TEXT        PRIMARY KEY,
  phone      TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_profiles_service_all"
  ON customer_profiles FOR ALL TO service_role USING (true);
