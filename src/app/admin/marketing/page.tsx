import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const supabase = createAdminClient();

  const [{ data: campaigns }, { data: products }, { count: totalCustomers }] = await Promise.all([
    supabase.from("email_campaigns").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("id, name").order("name"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "success"),
  ]);

  type Campaign = {
    id: string; name: string; subject: string; segment: string;
    status: string; sent_count: number; created_at: string; sent_at: string | null;
  };

  const STATUS_BADGE: Record<string, string> = {
    draft:   "bg-gray-700 text-gray-600 dark:text-gray-300",
    sending: "bg-yellow-500/20 text-yellow-400",
    sent:    "bg-emerald-500/20 text-emerald-400",
    failed:  "bg-red-500/20 text-red-400",
  };

  const segmentLabel = (seg: string) => {
    if (seg === "all") return "Tất cả khách hàng";
    if (seg === "recent_30d") return "Mua trong 30 ngày";
    if (seg.startsWith("product:")) {
      const pid = seg.replace("product:", "");
      const p = (products ?? []).find((x) => x.id === pid);
      return `Người mua: ${p?.name ?? pid.slice(0, 8)}`;
    }
    return seg;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketing</h1>
          <p className="mt-1 text-sm text-gray-400">
            {totalCustomers ?? 0} khách hàng trong database
          </p>
        </div>
        <Link
          href="/admin/marketing/new"
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors"
        >
          <span>+</span> Tạo campaign
        </Link>
      </div>

      {/* Segments overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Tất cả khách hàng", value: totalCustomers ?? 0, desc: "Đã mua ít nhất 1 lần", color: "border-emerald-500/30 bg-emerald-500/5" },
          { label: "Mua trong 30 ngày", value: "—", desc: "Khách hàng gần đây", color: "border-gray-200 dark:border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" },
          { label: "Campaigns đã gửi", value: (campaigns ?? []).filter((c) => c.status === "sent").length, desc: "Tổng lượt campaigns", color: "border-gray-200 dark:border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl border p-5 ${item.color}`}>
            <p className="text-xs font-medium text-gray-400">{item.label}</p>
            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
            <p className="mt-1 text-xs text-gray-600">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Campaigns list */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Email Campaigns</h2>
        </div>
        {!campaigns?.length ? (
          <div className="px-6 py-16 text-center">
            <p className="text-4xl mb-3">📧</p>
            <p className="text-gray-400 text-sm mb-4">Chưa có campaign nào.</p>
            <Link href="/admin/marketing/new" className="text-sm text-emerald-400 hover:text-emerald-300">
              Tạo campaign đầu tiên →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {(campaigns as Campaign[]).map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status] ?? STATUS_BADGE.draft}`}>
                      {c.status === "draft" ? "Nháp" : c.status === "sending" ? "Đang gửi" : c.status === "sent" ? "Đã gửi" : "Lỗi"}
                    </span>
                    <span className="text-xs text-gray-600">{segmentLabel(c.segment)}</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.subject}</p>
                </div>
                <div className="shrink-0 text-right">
                  {c.status === "sent" && (
                    <p className="text-sm font-semibold text-emerald-400">{c.sent_count} đã gửi</p>
                  )}
                  <p className="text-xs text-gray-600">
                    {new Date(c.sent_at ?? c.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                {c.status === "draft" && (
                  <Link
                    href={`/admin/marketing/${c.id}/edit`}
                    className="shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-700 transition-colors" /* đã đồng bộ design system */
                  >
                    Sửa
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
