import { createAdminClient } from "@/lib/supabase/server";

export type SettingsMap = Record<string, string | null>;

export async function getSettings(): Promise<SettingsMap> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("settings").select("key, value");
  const map: SettingsMap = {};
  (data ?? []).forEach(({ key, value }: { key: string; value: unknown }) => {
    if (value == null) {
      map[key] = null;
    } else if (typeof value === "string") {
      map[key] = value;
    } else {
      map[key] = String(value);
    }
  });
  return map;
}

export async function updateSettings(updates: Record<string, string | null>) {
  const supabase = createAdminClient();
  const rows = Object.entries(updates).map(([key, value]) => ({
    key,
    value: value === null ? null : value,
    updated_at: new Date().toISOString(),
  }));
  await supabase.from("settings").upsert(rows);
}
