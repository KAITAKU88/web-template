"use server";

import { updateSettings } from "@/lib/settings";

const ALL_KEYS = [
  "site_name", "brand_name", "logo_url", "brand_color",
  "zalo_link", "facebook_link",
  "sepay_api_key", "bank_account_number", "bank_name", "bank_account_holder",
  "resend_api_key", "resend_from_email", "resend_from_name",
  "ai_provider", "claude_api_key", "gemini_api_key",
];

// Sensitive keys: if submitted empty → keep existing (skip upsert)
const SENSITIVE_KEYS = new Set(["sepay_api_key", "resend_api_key", "claude_api_key", "gemini_api_key"]);

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
