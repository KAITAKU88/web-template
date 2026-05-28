-- Bổ sung các settings keys còn thiếu cho white-label deployment
-- Khách hàng cần cấu hình sepay_webhook_secret và supabase_webhook_secret qua Admin Dashboard

INSERT INTO public.settings (key, value) VALUES
  -- Các key đã có form nhưng chưa có seed ban đầu
  ('site_description',        'null'),
  ('brand_name',              'null'),
  ('favicon_url',             'null'),
  ('og_image_url',            'null'),
  ('bank_code',               'null'),
  ('ai_provider',             '"claude"'),
  ('claude_api_key',          'null'),
  ('gemini_api_key',          'null'),
  -- Keys mới: webhook secrets (quản lý qua Dashboard, không cần sửa env)
  ('sepay_webhook_secret',    'null'),
  ('supabase_webhook_secret', 'null'),
  -- Google Analytics ID (riêng từng khách hàng)
  ('ga_id',                   'null')
ON CONFLICT (key) DO NOTHING;
