-- Bảng theo dõi ownership của từng file trong Supabase Storage
CREATE TABLE IF NOT EXISTS storage_files (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket      TEXT        NOT NULL,
  path        TEXT        NOT NULL,
  creator_id  UUID        REFERENCES staff(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (bucket, path)
);

CREATE INDEX IF NOT EXISTS storage_files_creator_id_idx ON storage_files(creator_id);
CREATE INDEX IF NOT EXISTS storage_files_bucket_path_idx ON storage_files(bucket, path);

ALTER TABLE storage_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "storage_files_service_all" ON storage_files FOR ALL TO service_role USING (true);
