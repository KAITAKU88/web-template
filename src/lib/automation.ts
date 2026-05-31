import { createAdminClient } from "@/lib/supabase/server";

export type AutomationEvent =
  | "order_success"
  | "order_cancelled"
  | "cart_abandoned"
  | "product_published";

export interface AutomationContext {
  customer_email?: string;
  product_id?: string;
  product_name?: string;
  product_url?: string;
  checkout_url?: string;
  order_id?: string;
  site_name?: string;
  site_url?: string;
}

/**
 * Tìm tất cả automation rules khớp event và đưa vào hàng đợi.
 * Gọi sau khi sự kiện xảy ra — không block response (fire-and-forget).
 */
export async function queueAutomation(
  event: AutomationEvent,
  context: AutomationContext,
): Promise<void> {
  const supabase = createAdminClient();

  const { data: rules } = await supabase
    .from("automation_rules")
    .select("id, delay_minutes, target_segment")
    .eq("trigger_event", event)
    .eq("is_active", true);

  if (!rules?.length) return;

  const items = rules.map((rule) => ({
    rule_id: rule.id,
    execute_at: new Date(
      Date.now() + (rule.delay_minutes ?? 0) * 60 * 1000,
    ).toISOString(),
    context_data: context,
  }));

  await supabase.from("automation_execution_queue").insert(items);
}

/**
 * Thay thế biến {{key}} trong text bằng giá trị từ context.
 */
export function replaceVars(text: string, context: AutomationContext): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = (context as Record<string, string | undefined>)[key];
    return val ?? `{{${key}}}`;
  });
}
