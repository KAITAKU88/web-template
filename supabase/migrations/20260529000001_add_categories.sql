CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (id, name, sort_order) VALUES
  ('notion',       'Notion',        1),
  ('google_sheet', 'Google Sheets', 2)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read"  ON categories FOR SELECT TO anon         USING (true);
CREATE POLICY "categories_service_all"  ON categories FOR ALL    TO service_role USING (true);
