import { createAdminClient } from "@/lib/supabase/server";
import AutomationClient from "./AutomationClient";

export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  const supabase = createAdminClient();

  const [{ data: rules }, { data: groups }] = await Promise.all([
    supabase.from("automation_rules").select("*").order("created_at"),
    supabase.from("customer_groups").select("id, name").order("created_at"),
  ]);

  return (
    <AutomationClient
      rules={rules ?? []}
      groups={groups ?? []}
    />
  );
}
