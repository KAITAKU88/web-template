import { createAdminClient } from "@/lib/supabase/server";

// Đơn pending quá thời gian này → tự động chuyển sang cancelled
export const EXPIRE_MINUTES = 15;

export async function expireStaleOrders(): Promise<number> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - EXPIRE_MINUTES * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    console.error("[expireOrders]", error.message);
    return 0;
  }
  return data?.length ?? 0;
}
