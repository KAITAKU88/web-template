-- Bảng automation rules: tự động gửi email khi xảy ra sự kiện
CREATE TABLE IF NOT EXISTS automation_rules (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  trigger_event   TEXT        NOT NULL,
  -- Sự kiện: 'order_success' | 'order_cancelled' | 'cart_abandoned'
  --          | 'product_published' | 'new_product'
  action_type     TEXT        NOT NULL DEFAULT 'send_email',
  target_segment  TEXT        NOT NULL DEFAULT 'all',
  -- 'all' | 'buyer' (người vừa mua) | 'group:{group_id}'
  email_subject   TEXT,
  email_html      TEXT,
  delay_minutes   INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access automation_rules"
  ON automation_rules USING (true) WITH CHECK (true);

-- Mở rộng email_campaigns: thêm lên lịch và nhóm khách hàng
ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS target_group_id UUID REFERENCES customer_groups(id) ON DELETE SET NULL;

-- Campaign template mẫu (sample data để hướng dẫn user)
INSERT INTO automation_rules (name, trigger_event, action_type, target_segment, email_subject, email_html, delay_minutes)
VALUES
  (
    'Chào mừng sau mua hàng',
    'order_success',
    'send_email',
    'buyer',
    'Cảm ơn bạn đã mua {{product_name}}! 🎉',
    '<p>Xin chào,</p><p>Cảm ơn bạn đã tin tưởng mua <strong>{{product_name}}</strong>. Chúc bạn sử dụng hiệu quả!</p>',
    0
  ),
  (
    'Nhắc nhở giỏ hàng bỏ quên',
    'cart_abandoned',
    'send_email',
    'buyer',
    'Bạn còn quên {{product_name}} trong giỏ hàng 🛒',
    '<p>Xin chào,</p><p>Bạn đã quan tâm đến <strong>{{product_name}}</strong> nhưng chưa hoàn tất thanh toán.</p><p><a href="{{checkout_url}}">Mua ngay →</a></p>',
    60
  ),
  (
    'Thông báo sản phẩm mới',
    'product_published',
    'send_email',
    'all',
    '🆕 Sản phẩm mới: {{product_name}}',
    '<p>Xin chào,</p><p>Chúng tôi vừa ra mắt <strong>{{product_name}}</strong>. Khám phá ngay!</p><p><a href="{{product_url}}">Xem sản phẩm →</a></p>',
    0
  )
ON CONFLICT DO NOTHING;
