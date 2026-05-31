INSERT INTO settings (key, value)
VALUES ('site_tagline', 'null')
ON CONFLICT (key) DO NOTHING;
