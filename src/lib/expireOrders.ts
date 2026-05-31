import { createAdminClient } from "@/lib/supabase/server";
import { queueAutomation } from "@/lib/automation";

// Đơn pending quá thời gian này → tự động chuyển sang cancelled
export const EXPIRE_MINUTES = 15;

export async function expireStaleOrders(): Promise<number> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - EXPIRE_MINUTES * 60 * 1000).toISOString();

  // Lấy danh sách đơn sắp hết hạn (kèm info để trigger automation)
  const { data: staleOrders, error: fetchErr } = await supabase
    .from("orders")
    .select("id, customer_email, product_id")
    .eq("status", "pending")
    .lt("created_at", cutoff);

  if (fetchErr || !staleOrders?.length) return 0;

  const ids = staleOrders.map((o) => o.id);
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .in("id", ids);

  if (error) {
    console.error("[expireOrders]", error.message);
    return 0;
  }

  // Lấy tên sản phẩm để điền vào context automation
  const productIds = [...new Set(staleOrders.map((o) => o.product_id))];
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug")
    .in("id", productIds);

  const productMap = new Map(
    (products ?? []).map((p: { id: string; name: string; slug: string | null }) => [p.id, p])
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://web-template-cloudflare.thankful-to-all-88.workers.dev";

  // Trigger automation order_cancelled cho từng đơn (await để đảm bảo queue insert xong)
  await Promise.all(
    staleOrders.map((order) => {
      const product = productMap.get(order.product_id) as { id: string; name: string; slug: string | null } | undefined;
      return queueAutomation("order_cancelled", {
        customer_email: order.customer_email,
        product_id:     order.product_id,
        product_name:   product?.name ?? "",
        product_url:    `${siteUrl}/products/${product?.slug ?? order.product_id}`,
        checkout_url:   `${siteUrl}/checkout/${product?.slug ?? order.product_id}`,
        order_id:       order.id,
        site_url:       siteUrl,
      }).catch((e) => console.error("[expireOrders] automation error:", e));
    })
  );

  return staleOrders.length;
}
