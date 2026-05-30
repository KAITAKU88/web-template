-- Bucket lưu asset tĩnh của site: favicon, logo, og-image
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read site-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

CREATE POLICY "Admin upload site-assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-assets');

CREATE POLICY "Admin delete site-assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-assets');
