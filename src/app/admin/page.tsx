import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

async function getStats() {
  const supabase = createAdminClient();

  const [
    { count: totalOrders },
    { count: successOrders },
    { count: pendingOrders },
    { data: revenueData },
    { data: todayData },
    { data: recentOrders },
    { data: products },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "success"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("amount").eq("status", "success"),
    supabase
      .from("orders")
      .select("amount")
      .eq("status", "success")
      .gte("paid_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase
      .from("orders")
      .select("id, customer_email, amount, status, paid_at, created_at, products!orders_product_id_fkey(name)")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("products").select("id, name, type, price").order("created_at", { ascending: true }),
  ]);

  const totalRevenue = (revenueData ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);
  const todayRevenue = (todayData ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);

  return {
    totalOrders: totalOrders ?? 0,
    successOrders: successOrders ?? 0,
    pendingOrders: pendingOrders ?? 0,
    totalRevenue,
    todayRevenue,
    recentOrders: recentOrders ?? [],
    products: products ?? [],
  };
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  success: { label: "Thành công", cls: "bg-emerald-500/10 text-emerald-400" },
  pending: { label: "Chờ thanh toán", cls: "bg-yellow-500/10 text-yellow-400" },
  cancelled: { label: "Đã hủy", cls: "bg-red-500/10 text-red-400" },
};

export default async function AdminDashboardPage() {
  const stats = await getStats();

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Tổng quan</h1>
        <p className="mt-1 text-sm text-gray-400">
          Cập nhật lúc {new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Doanh thu hôm nay"
          value={formatCurrency(stats.todayRevenue)}
          icon="💰"
          highlight
        />
        <StatCard
          label="Tổng doanh thu"
          value={formatCurrency(stats.totalRevenue)}
          icon="📊"
        />
        <StatCard
          label="Đơn thành công"
          value={String(stats.successOrders)}
          icon="✅"
        />
        <StatCard
          label="Đơn chờ thanh toán"
          value={String(stats.pendingOrders)}
          icon="⏳"
        />
      </div>

      {/* Recent orders + Products */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent orders */}
        <div className="xl:col-span-2 rounded-2xl bg-gray-900 border border-gray-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">Đơn hàng gần đây</h2>
            <a href="/admin/orders" className="text-xs text-emerald-400 hover:text-emerald-300">
              Xem tất cả →
            </a>
          </div>
          <div className="divide-y divide-gray-800">
            {stats.recentOrders.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500">Chưa có đơn hàng nào.</p>
            ) : (
              stats.recentOrders.map((order: {
                id: string;
                customer_email: string;
                amount: number;
                status: string;
                paid_at: string | null;
                created_at: string;
                products?: { name: string } | null;
              }) => {
                const s = STATUS_LABEL[order.status] ?? { label: order.status, cls: "bg-gray-700 text-gray-300" };
                return (
                  <div key={order.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {(order.products as { name: string } | null)?.name ?? "—"}
                      </p>
                      <p className="truncate text-xs text-gray-500">{order.customer_email}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-emerald-400">{formatCurrency(order.amount)}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Products */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">Sản phẩm ({stats.products.length})</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {stats.products.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500">Chưa có sản phẩm nào.</p>
            ) : (
              stats.products.map((p: { id: string; name: string; type: string | null; price: number }) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.type === "google_sheet" ? "Google Sheets" : "Notion"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-emerald-400">
                    {formatCurrency(p.price)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-gray-800 bg-gray-900"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`mt-3 text-2xl font-bold ${highlight ? "text-emerald-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
