import { createAdminClient } from "@/lib/supabase/server";
import DiscountsClient from "./DiscountsClient";

export default async function AdminDiscountsPage() {
  const supabase = createAdminClient();

  const [{ data: codes }, { data: products }] = await Promise.all([
    supabase.from("discount_codes")
      .select("*, product:products(name)")
      .order("created_at", { ascending: false }),
    supabase.from("products").select("id, name").order("name"),
  ]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mã giảm giá</h1>
        <p className="mt-1 text-xs text-gray-500">Tạo và quản lý mã giảm giá cho khách hàng</p>
      </div>
      <DiscountsClient codes={codes ?? []} products={products ?? []} />
    </div>
  );
}
