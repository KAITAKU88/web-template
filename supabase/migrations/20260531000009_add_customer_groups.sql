-- Bảng nhóm khách hàng (segment) để gửi marketing theo nhóm
CREATE TABLE IF NOT EXISTS customer_groups (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  color       TEXT        NOT NULL DEFAULT '#6b7280',
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng thành viên nhóm
CREATE TABLE IF NOT EXISTS customer_group_members (
  email       TEXT        NOT NULL,
  group_id    UUID        NOT NULL REFERENCES customer_groups(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (email, group_id)
);

ALTER TABLE customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access customer_groups"
  ON customer_groups USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access customer_group_members"
  ON customer_group_members USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS customer_group_members_email_idx ON customer_group_members(email);
CREATE INDEX IF NOT EXISTS customer_group_members_group_idx ON customer_group_members(group_id);
