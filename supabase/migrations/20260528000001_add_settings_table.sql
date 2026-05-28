-- Settings table: lưu toàn bộ cấu hình hệ thống qua Admin Dashboard
-- Không có public policy — chỉ service_role truy cập (API keys an toàn)

CREATE TABLE public.settings (
  key         TEXT        PRIMARY KEY,
  value       JSONB,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.settings IS 'Cấu hình hệ thống — quản lý qua Admin Dashboard';

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Seed defaults
INSERT INTO public.settings (key, value) VALUES
  ('site_name',            '"TemplateLab"'),
  ('logo_url',             'null'),
  ('brand_color',          '"#10b981"'),
  ('zalo_link',            'null'),
  ('facebook_link',        'null'),
  ('sepay_api_key',        'null'),
  ('bank_account_number',  'null'),
  ('bank_name',            'null'),
  ('bank_account_holder',  'null'),
  ('resend_api_key',       'null'),
  ('resend_from_email',    'null'),
  ('resend_from_name',     '"TemplateLab"')
ON CONFLICT (key) DO NOTHING;
