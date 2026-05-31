-- Hàng đợi thực thi automation rules
-- Mỗi khi sự kiện xảy ra, tạo 1 item ở đây với execute_at = now + delay_minutes
CREATE TABLE IF NOT EXISTS automation_execution_queue (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id       UUID        NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  execute_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at   TIMESTAMPTZ,
  failed        BOOLEAN     NOT NULL DEFAULT false,
  error_msg     TEXT,
  context_data  JSONB       NOT NULL DEFAULT '{}',
  -- context: customer_email, product_id, product_name, product_url,
  --          checkout_url, order_id, site_name, site_url
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE automation_execution_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access automation_execution_queue"
  ON automation_execution_queue USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS automation_queue_execute_at_idx
  ON automation_execution_queue(execute_at)
  WHERE executed_at IS NULL AND failed = false;
