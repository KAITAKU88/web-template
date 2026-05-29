import { createAdminClient } from "@/lib/supabase/server";

type PasswordType = "set" | "temp" | "default";

export interface AdminPasswordResult {
  password: string;
  type: PasswordType;
}

/**
 * Lấy mật khẩu admin hiện tại theo thứ tự ưu tiên:
 * 1. admin_password (đã đổi qua dashboard)
 * 2. admin_temp_password (tạm thời, kiểm tra hạn)
 * 3. admin_default_password (mặc định ban đầu)
 */
export async function getActivePassword(): Promise<AdminPasswordResult | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", [
      "admin_password",
      "admin_temp_password",
      "admin_temp_password_expiry",
      "admin_default_password",
    ]);

  const map: Record<string, string | null> = {};
  (data ?? []).forEach((r: { key: string; value: string | null }) => {
    map[r.key] = r.value;
  });

  // 1. Mật khẩu đã đổi
  if (map["admin_password"]) {
    return { password: map["admin_password"], type: "set" };
  }

  // 2. Mật khẩu tạm — kiểm tra hạn
  if (map["admin_temp_password"]) {
    const expiry = map["admin_temp_password_expiry"];
    const expired = !expiry || new Date() > new Date(expiry);
    if (expired) {
      // Hết hạn → tự xóa
      await clearTempPassword();
    } else {
      return { password: map["admin_temp_password"], type: "temp" };
    }
  }

  // 3. Mật khẩu mặc định
  const defaultPw = map["admin_default_password"] || process.env.ADMIN_PASSWORD || "admin12345678";
  if (defaultPw) {
    return { password: defaultPw, type: "default" };
  }

  return null;
}

/** Sau khi admin đổi mật khẩu: set admin_password, xóa 2 cái kia */
export async function setAdminPassword(newPassword: string) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  await supabase.from("settings").upsert([
    { key: "admin_password",             value: newPassword, updated_at: now },
    { key: "admin_default_password",     value: null,        updated_at: now },
    { key: "admin_temp_password",        value: null,        updated_at: now },
    { key: "admin_temp_password_expiry", value: null,        updated_at: now },
  ]);
}

/** Khi quên mật khẩu: set temp, xóa admin_password */
export async function setTempPassword(tempPassword: string) {
  const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  await supabase.from("settings").upsert([
    { key: "admin_temp_password",        value: tempPassword, updated_at: now },
    { key: "admin_temp_password_expiry", value: expiry,       updated_at: now },
    { key: "admin_password",             value: null,         updated_at: now },
  ]);
}

/** Xóa temp password (hết hạn hoặc đã dùng xong) */
export async function clearTempPassword() {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  await supabase.from("settings").upsert([
    { key: "admin_temp_password",        value: null, updated_at: now },
    { key: "admin_temp_password_expiry", value: null, updated_at: now },
  ]);
}

/** Kiểm tra xem có mật khẩu mặc định đang được dùng không (để hiện hint) */
export async function isUsingDefaultPassword(): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["admin_password", "admin_temp_password"]);

  const map: Record<string, string | null> = {};
  (data ?? []).forEach((r: { key: string; value: string | null }) => {
    map[r.key] = r.value;
  });

  return !map["admin_password"] && !map["admin_temp_password"];
}
