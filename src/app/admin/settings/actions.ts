"use server";

import { updateSettings } from "@/lib/settings";

const ALL_KEYS = [
  "site_name", "site_description", "brand_name", "logo_url", "brand_color", "favicon_url", "og_image_url",
  "zalo_link", "facebook_link",
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
