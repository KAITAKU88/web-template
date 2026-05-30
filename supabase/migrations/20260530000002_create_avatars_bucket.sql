-- Tạo bucket lưu ảnh avatar cho testimonials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  524288, -- 512 KB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: ai cũng đọc được (public bucket)
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Policy: chỉ authenticated user (admin) mới upload được
CREATE POLICY "Admin upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

-- Policy: admin xóa ảnh
CREATE POLICY "Admin delete avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars');
