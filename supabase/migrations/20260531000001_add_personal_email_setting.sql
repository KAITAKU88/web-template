INSERT INTO settings (key, value)
VALUES ('personal_email', 'null')
ON CONFLICT (key) DO NOTHING;
