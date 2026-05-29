"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createStaff(formData: FormData): Promise<{ error?: string }> {
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = (formData.get("password") as string).trim();
  const role = formData.get("role") as string;

  if (!name || !email || !password || !role) return { error: "Vui lòng điền đầy đủ thông tin." };
  if (password.length < 8) return { error: "Mật khẩu tối thiểu 8 ký tự." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("staff").insert({ name, email, password, role });
  if (error) {
    if (error.code === "23505") return { error: "Email đã tồn tại." };
    return { error: "Lỗi khi tạo tài khoản." };
  }
  revalidatePath("/admin/staff");
  return {};
}

export async function toggleStaffActive(id: string, isActive: boolean) {
  const supabase = createAdminClient();
  await supabase.from("staff").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/staff");
}

export async function deleteStaff(id: string) {
  const supabase = createAdminClient();
  await supabase.from("staff").delete().eq("id", id);
  revalidatePath("/admin/staff");
}

export async function resetStaffPassword(id: string, formData: FormData): Promise<{ error?: string }> {
  const password = (formData.get("password") as string).trim();
  if (password.length < 8) return { error: "Mật khẩu tối thiểu 8 ký tự." };
  const supabase = createAdminClient();
  await supabase.from("staff").update({ password }).eq("id", id);
  revalidatePath("/admin/staff");
  return {};
}
