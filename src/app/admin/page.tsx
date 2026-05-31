import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

const VN_TZ_OFFSET = 7 * 60 * 60 * 1000;

function toVnDate(iso: string) {
  const d = new Date(new Date(iso).getTime() + VN_TZ_OFFSET);
  return d.toISOString().slice(0, 10);
}

async function getStats() {
  const supabase = createAdminClient();

  const now = new Date();
  const ago30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const ago7d  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalOrders },
    { count: successOrders },
    { count: pendingOrders },
    { data: revenueData },
    { data: todayData },
    { data: recentOrders },
    { data: products },
    { data: clickEvents },
    { data: revenueByDay },
    { data: topProducts },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "success"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("amount").eq("status", "success"),
    supabase.from("orders").select("amount").eq("status", "success")
      .gte("paid_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from("orders")
      .select("id, customer_email, amount, status, paid_at, created_at, products!orders_product_id_fkey(name)")
      .order("created_at", { ascending: false }).limit(10),
    supabase.from("products").select("id, name, type, price").order("created_at", { ascending: true }),
    // Funnel: click events 30 ngày
    supabase.from("click_events")
      .select("event_type")
      .in("event_type", ["product_view", "buy_click", "qr_generate", "purchase"])
      .gte("created_at", ago30d),
    // Doanh thu 7 ngày
    supabase.from("orders")
      .select("paid_at, amount")
      .eq("status", "success")
      .gte("paid_at", ago7d)
      .order("paid_at"),
    // Top sản phẩm được click nhiều nhất (30 ngày)
    supabase.from("click_events")
      .select("product_id, products!click_events_product_id_fkey(name)")
      .eq("event_type", "buy_click")
      .not("product_id", "is", null)
      .gte("created_at", ago30d),
  ]);

  const totalRevenue = (revenueData ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);
  const todayRevenue = (todayData ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);

  // Funnel counts
  type EventRow = { event_type: string };
  const clicks = (clickEvents ?? []) as EventRow[];
  const funnel = {
    product_view: clicks.filter((e) => e.event_type === "product_view").length,
    buy_click:    clicks.filter((e) => e.event_type === "buy_click").length,
    qr_generate:  clicks.filter((e) => e.event_type === "qr_generate").length,
    purchase:     clicks.filter((e) => e.event_type === "purchase").length,
  };

  // Doanh thu theo ngày — 7 ngày gần nhất
  type RevenueRow = { paid_at: string; amount: number };
  const revenueMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    revenueMap[toVnDate(d.toISOString())] = 0;
  }
  for (const row of (revenueByDay ?? []) as RevenueRow[]) {
    if (row.paid_at) {
      const day = toVnDate(row.paid_at);
      if (day in revenueMap) revenueMap[day] = (revenueMap[day] ?? 0) + row.amount;
    }
  }
  const revenueTrend = Object.entries(revenueMap).map(([date, amount]) => ({ date, amount }));

  // Top sản phẩm — đếm buy_click theo product_id
  type TopRow = { product_id: string; products: { name: string } | { name: string }[] | null };
  const countMap: Record<string, { name: string; count: number }> = {};
  for (const row of (topProducts ?? []) as TopRow[]) {
    const id = row.product_id;
    if (!id) continue;
    const prodName = Array.isArray(row.products) ? row.products[0]?.name : row.products?.name;
    const name = prodName ?? id.slice(0, 8);
    if (!countMap[id]) countMap[id] = { name, count: 0 };
    countMap[id].count++;
  }
  const topByClicks = Object.entries(countMap)
    .map(([id, v]) => ({ id, name: v.name, clicks: v.count }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  return {
    totalOrders: totalOrders ?? 0,
    successOrders: successOrders ?? 0,
    pendingOrders: pendingOrders ?? 0,
    totalRevenue,
    todayRevenue,
    recentOrders: recentOrders ?? [],
    products: products ?? [],
    funnel,
    revenueTrend,
    topByClicks,
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
    <div className="p-4 md:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tổng quan</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
        <div className="xl:col-span-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Đơn hàng gần đây</h2>
            <a href="/admin/orders" className="text-xs text-emerald-400 hover:text-emerald-300">
              Xem tất cả →
            </a>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
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
                products?: { name: string }[] | null;
              }) => {
                const s = STATUS_LABEL[order.status] ?? { label: order.status, cls: "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300" };
                return (
                  <div key={order.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
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
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Sản phẩm ({stats.products.length})</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {stats.products.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500">Chưa có sản phẩm nào.</p>
            ) : (
              stats.products.map((p: { id: string; name: string; type: string | null; price: number }) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
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

      {/* ── Analytics ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Phễu chuyển đổi */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Phễu chuyển đổi</h2>
            <p className="text-xs text-gray-500 mt-0.5">30 ngày gần nhất</p>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: "Xem trang sản phẩm", value: stats.funnel.product_view, color: "bg-blue-500" },
              { label: "Bấm Mua ngay",        value: stats.funnel.buy_click,    color: "bg-violet-500" },
              { label: "Tạo mã QR",           value: stats.funnel.qr_generate,  color: "bg-amber-500" },
              { label: "Thanh toán thành công",value: stats.funnel.purchase,     color: "bg-emerald-500" },
            ].map((row, i, arr) => {
              const max = arr[0].value || 1;
              const pct = Math.round((row.value / max) * 100);
              const rate = i > 0 && arr[i - 1].value > 0
                ? Math.round((row.value / arr[i - 1].value) * 100)
                : null;
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate pr-2">{row.label}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {rate !== null && (
                        <span className="text-xs text-gray-600">{rate}%</span>
                      )}
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{row.value.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <div className={`h-full rounded-full ${row.color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {stats.funnel.product_view === 0 && (
              <p className="text-xs text-gray-600 text-center pt-2">Chưa có dữ liệu — tracking sẽ tích lũy dần</p>
            )}
          </div>
        </div>

        {/* Doanh thu 7 ngày */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Doanh thu 7 ngày</h2>
          </div>
          <div className="p-5 space-y-2">
            {(() => {
              const max = Math.max(...stats.revenueTrend.map((d) => d.amount), 1);
              return stats.revenueTrend.map(({ date, amount }) => {
                const pct = Math.round((amount / max) * 100);
                const label = new Date(date + "T00:00:00+07:00")
                  .toLocaleDateString("vi-VN", { weekday: "short", day: "numeric" });
                return (
                  <div key={date} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-xs text-gray-500">{label}</span>
                    <div className="flex-1 h-5 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
                      <div
                        className="h-full bg-emerald-500/70 rounded flex items-center justify-end pr-1.5 transition-all"
                        style={{ width: `${Math.max(pct, amount > 0 ? 8 : 0)}%` }}
                      >
                        {amount > 0 && <span className="text-[10px] font-medium text-white whitespace-nowrap">{formatCurrency(amount)}</span>}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Top sản phẩm được quan tâm */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Sản phẩm được xem nhiều</h2>
            <p className="text-xs text-gray-500 mt-0.5">Theo buy-click 30 ngày</p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {stats.topByClicks.length === 0 ? (
              <p className="px-5 py-6 text-xs text-gray-600 text-center">Chưa có dữ liệu</p>
            ) : (
              stats.topByClicks.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-700 w-4 shrink-0">{i + 1}</span>
                  <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">{p.name}</span>
                  <span className="shrink-0 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-400">
                    {p.clicks} click
                  </span>
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
          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`mt-3 text-2xl font-bold ${highlight ? "text-emerald-400" : "text-gray-900 dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}
