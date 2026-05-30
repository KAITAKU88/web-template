-- Bảng lưu email campaigns (gửi qua Resend trực tiếp từ Dashboard)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  subject     TEXT        NOT NULL,
  html_body   TEXT        NOT NULL,
  segment     TEXT        NOT NULL DEFAULT 'all',  -- 'all' | 'product:{id}' | 'recent_30d'
  status      TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_count  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at     TIMESTAMPTZ
);

-- Chỉ service_role đọc/ghi được
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access email_campaigns"
  ON email_campaigns
  USING (true)
  WITH CHECK (true);
