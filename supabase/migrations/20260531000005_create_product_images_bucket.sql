-- Bucket lưu ảnh thumbnail sản phẩm
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  3145728, -- 3 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read product-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admin upload product-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Admin update product-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images');

CREATE POLICY "Admin delete product-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images');
