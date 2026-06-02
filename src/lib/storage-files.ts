"use server";

import { createAdminClient } from "@/lib/supabase/server";

/** Ghi lại ownership sau khi upload */
export async function recordStorageFile(bucket: string, path: string, creatorId: string | null) {
  if (!creatorId) return;
  const supabase = createAdminClient();
  await supabase.from("storage_files").upsert({ bucket, path, creator_id: creatorId });
}

/** Lấy danh sách path được phép xem (cho partner) */
export async function getPartnerFilePaths(bucket: string, creatorId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("storage_files")
    .select("path")
    .eq("bucket", bucket)
    .eq("creator_id", creatorId);
  return (data ?? []).map((r) => r.path);
}

/** Xóa record khỏi storage_files */
export async function deleteStorageFileRecord(bucket: string, path: string) {
  const supabase = createAdminClient();
  await supabase.from("storage_files").delete().eq("bucket", bucket).eq("path", path);
}

/** Cập nhật path khi đổi tên file */
export async function renameStorageFileRecord(bucket: string, oldPath: string, newPath: string) {
  const supabase = createAdminClient();
  await supabase.from("storage_files").update({ path: newPath }).eq("bucket", bucket).eq("path", oldPath);
}
