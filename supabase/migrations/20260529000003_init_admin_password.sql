-- Khởi tạo admin_default_password nếu chưa có
INSERT INTO settings (key, value, updated_at)
VALUES ('admin_default_password', 'admin12345678', NOW())
ON CONFLICT (key) DO NOTHING;

-- Đảm bảo các key khác tồn tại (null = rỗng)
INSERT INTO settings (key, value, updated_at)
VALUES
  ('admin_password',           NULL, NOW()),
  ('admin_temp_password',      NULL, NOW()),
  ('admin_temp_password_expiry', NULL, NOW())
ON CONFLICT (key) DO NOTHING;
