"use server";

import { updateSettings } from "@/lib/settings";
import { setAdminPassword } from "@/lib/admin-password";

const ALL_KEYS = [
  "site_name", "site_tagline", "site_description", "brand_name", "logo_url", "brand_color", "favicon_url", "og_image_url",
  "zalo_link", "admin_email", "personal_email",
  "bank_code", "bank_account_number", "bank_account_holder",
  "sepay_api_key", "sepay_webhook_secret",
  "resend_api_key", "resend_from_email", "resend_from_name",
  "ai_provider", "claude_api_key", "gemini_api_key",
  "supabase_webhook_secret",
  "gtm_id", "ga_id", "meta_pixel_id", "tiktok_pixel_id", "google_ads_id",
  "download_link_expiry_hours", "download_link_max_accesses",
];

// Sensitive keys: if submitted empty → keep existing (skip upsert)
const SENSITIVE_KEYS = new Set([
  "sepay_api_key", "sepay_webhook_secret",
  "resend_api_key", "claude_api_key", "gemini_api_key",
  "supabase_webhook_secret", "meta_access_token",
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
  const newPassword = (formData.get("new_password") as string).trim();
  const confirmPassword = (formData.get("confirm_password") as string).trim();

  if (!newPassword || newPassword.length < 8) {
    return { error: "Mật khẩu mới phải có ít nhất 8 ký tự." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Xác nhận mật khẩu không khớp." };
  }

  // Set admin_password, tự động xóa default và temp
  await setAdminPassword(newPassword);
  return { success: true };
}
