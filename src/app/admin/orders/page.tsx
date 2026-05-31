import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { expireStaleOrders, EXPIRE_MINUTES } from "@/lib/expireOrders";
import ResendEmailButton from "./ResendEmailButton";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "success", label: "Thành công" },
  { value: "pending", label: "Chờ thanh toán" },
  { value: "cancelled", label: "Đã hủy" },
];

const PERIOD_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "today", label: "Hôm nay" },
  { value: "week", label: "7 ngày" },
  { value: "month", label: "Tháng này" },
  { value: "year", label: "Năm này" },
];

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  success:   { label: "Thành công",     cls: "bg-emerald-500/10 text-emerald-400" },
  pending:   { label: "Chờ thanh toán", cls: "bg-yellow-500/10 text-yellow-400"  },
  cancelled: { label: "Đã hủy",         cls: "bg-red-500/10 text-red-400"        },
};

function getPeriodFrom(period: string): string | null {
  if (!period) return null;
  const vnOffset = 7 * 60 * 60 * 1000;
  const now = new Date();
  const vnNow = new Date(now.getTime() + vnOffset);

  if (period === "today") {
    const from = new Date(
      Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()) - vnOffset
    );
    return from.toISOString();
  }
  if (period === "week") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (period === "month") {
    const from = new Date(
      Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), 1) - vnOffset
    );
    return from.toISOString();
  }
  if (period === "year") {
    const from = new Date(
      Date.UTC(vnNow.getUTCFullYear(), 0, 1) - vnOffset
    );
    return from.toISOString();
  }
  return null;
}

interface PageProps {
  searchParams: Promise<{ status?: string; email?: string; page?: string; period?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  await expireStaleOrders();

  const params = await searchParams;
  const status      = params.status ?? "";
  const emailFilter = (params.email ?? "").trim().toLowerCase();
  const period      = params.period ?? "";
  const page        = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize    = 20;

  const supabase = createAdminClient();

  let query = supabase
    .from("orders")
    .select("id, customer_email, customer_phone, amount, status, paid_at, created_at, product_id, bump_product_id, main_product:products!orders_product_id_fkey(name), bump_product:products!orders_bump_product_id_fkey(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (status) query = query.eq("status", status);
  if (emailFilter) query = query.ilike("customer_email", `%${emailFilter}%`);
  const periodFrom = getPeriodFrom(period);
  if (periodFrom) query = query.gte("created_at", periodFrom);

  const { data: orders, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  const buildUrl = (overrides: Record<string, string>) => {
    const p = new URLSearchParams();
    if (status)      p.set("status", status);
    if (emailFilter) p.set("email", emailFilter);
    if (period)      p.set("period", period);
    p.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k);
    });
    return `?${p.toString()}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Đơn hàng</h1>
          <p className="mt-1 text-xs text-gray-500">
            Đơn chờ quá <span className="text-yellow-400">{EXPIRE_MINUTES} phút</span> tự động hủy
          </p>
        </div>
        <span className="text-sm text-gray-400">{count ?? 0} đơn</span>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Thời gian */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-16 shrink-0">Thời gian</span>
          <div className="flex gap-1.5 flex-wrap">
            {PERIOD_OPTIONS.map((opt) => (
              <Link key={opt.value} href={buildUrl({ period: opt.value, page: "1" })}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === opt.value
                    ? "bg-blue-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}>
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Trạng thái */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-16 shrink-0">Trạng thái</span>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <Link key={opt.value} href={buildUrl({ status: opt.value, page: "1" })}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  status === opt.value
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}>
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-16 shrink-0">Email</span>
          <form method="GET" className="flex gap-2">
            {status && <input type="hidden" name="status" value={status} />}
            {period && <input type="hidden" name="period" value={period} />}
            <input type="text" name="email" defaultValue={emailFilter}
              placeholder="Tìm theo email…"
              className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500" />
            <button type="submit"
              className="rounded-xl bg-gray-700 px-3 py-1.5 text-xs text-white hover:bg-gray-600">
              Tìm
            </button>
            {emailFilter && (
              <Link href={buildUrl({ email: "", page: "1" })}
                className="rounded-xl bg-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:text-white">
                Xóa
              </Link>
            )}
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">Mã đơn</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Sản phẩm</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-left">Thời gian</th>
                <th className="px-4 py-3 text-center">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {(orders ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    Không có đơn hàng nào.
                  </td>
                </tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (orders ?? []).map((order: any) => {
                  const s = STATUS_LABEL[order.status] ?? { label: order.status, cls: "bg-gray-700 text-gray-300" };
                  const time = order.paid_at ?? order.created_at;
                  const mainRaw = order.main_product;
                  const bumpRaw = order.bump_product;
                  const mainName = (Array.isArray(mainRaw) ? mainRaw[0] : mainRaw)?.name ?? "—";
                  const bumpName = (Array.isArray(bumpRaw) ? bumpRaw[0] : bumpRaw)?.name;
                  return (
                    <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{order.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-gray-300 max-w-[180px] truncate">{order.customer_email}</td>
                      <td className="px-4 py-3 text-gray-300 max-w-[200px]">
                        <span className="block truncate">{mainName}</span>
                        {bumpName && (
                          <span className="block truncate text-xs text-amber-400">+ {bumpName}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-400">{formatCurrency(order.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(time).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {order.status === "success" && (
                          <ResendEmailButton orderId={order.id} />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Trang {page}/{totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })}
                className="rounded-xl bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">
                ← Trước
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })}
                className="rounded-xl bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">
                Tiếp →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
