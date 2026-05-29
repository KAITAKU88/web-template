"use server";

import { updateSettings, getSettings } from "@/lib/settings";

const ALL_KEYS = [
  "site_name", "site_description", "brand_name", "logo_url", "brand_color", "favicon_url", "og_image_url",
  "zalo_link", "facebook_link", "admin_email",
  "bank_code", "bank_account_number", "bank_account_holder",
  "sepay_api_key", "sepay_webhook_secret",
  "resend_api_key", "resend_from_email", "resend_from_name",
  "ai_provider", "claude_api_key", "gemini_api_key",
  "supabase_webhook_secret",
  "ga_id",
];

// Sensitive keys: if submitted empty → keep existing (skip upsert)
const SENSITIVE_KEYS = new Set([
  "sepay_api_key", "sepay_webhook_secret",
  "resend_api_key", "claude_api_key", "gemini_api_key",
  "supabase_webhook_secret",
]);

export async function saveSettings(formData: FormData) {
  const updates: Record<string, string | null> = {};

  for (const key of ALL_KEYS) {
    const raw = (formData.get(key) as string | null) ?? "";
    const value = raw.trim();

    if (SENSITIVE_KEYS.has(key) && value === "") continue;

    updates[key] = value === "" ? null : value;
  }

  await updateSettings(updates);
}

export async function changePassword(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const currentPassword = (formData.get("current_password") as string).trim();
  const newPassword = (formData.get("new_password") as string).trim();
  const confirmPassword = (formData.get("confirm_password") as string).trim();

  if (!newPassword || newPassword.length < 8) {
    return { error: "Mật khẩu mới phải có ít nhất 8 ký tự." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Xác nhận mật khẩu không khớp." };
  }

  // Kiểm tra mật khẩu hiện tại
  const settings = await getSettings();
  const storedPassword = settings.admin_password ?? process.env.ADMIN_PASSWORD ?? "";
  if (currentPassword !== storedPassword) {
    return { error: "Mật khẩu hiện tại không đúng." };
  }

  await updateSettings({ admin_password: newPassword });
  return { success: true };
}
