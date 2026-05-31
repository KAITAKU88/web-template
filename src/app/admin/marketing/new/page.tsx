import { createAdminClient } from "@/lib/supabase/server";
import CampaignForm from "../CampaignForm";

export default async function NewCampaignPage() {
  const supabase = createAdminClient();

  const [{ data: products }, { data: allOrders }, { data: recentOrders }, { data: groups }] = await Promise.all([
    supabase.from("products").select("id, name").order("name"),
    supabase.from("orders").select("customer_email, product_id").eq("status", "success"),
    supabase.from("orders").select("customer_email")
      .eq("status", "success")
      .gte("paid_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("customer_groups").select("id, name").order("created_at"),
  ]);

  // Tính số người nhận theo từng segment
  const recipientPreview: Record<string, number> = {};

  const allEmails = new Set((allOrders ?? []).map((o) => o.customer_email));
  recipientPreview.all = allEmails.size;

  const recentEmails = new Set((recentOrders ?? []).map((o) => o.customer_email));
  recipientPreview.recent_30d = recentEmails.size;

  for (const p of (products ?? [])) {
    const pEmails = new Set(
      (allOrders ?? []).filter((o) => o.product_id === p.id).map((o) => o.customer_email)
    );
    recipientPreview[`product:${p.id}`] = pEmails.size;
  }

  return (
    <CampaignForm
      products={products ?? []}
      groups={groups ?? []}
      recipientPreview={recipientPreview}
    />
  );
}
