"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface OrderRow {
  id: string;
  customer_email: string;
  customer_phone: string | null;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  bump_product_id: string | null;
  bump_amount: number | null;
  products: { name: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  success: "Thành công",
  pending: "Chờ thanh toán",
  expired: "Hết hạn",
  cancelled: "Đã hủy",
};
const STATUS_COLOR: Record<string, string> = {
  success:   "bg-green-100 text-green-700",
  pending:   "bg-amber-100 text-amber-700",
  expired:   "bg-red-100 text-red-500",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function OrdersPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders]   = useState<OrderRow[] | null>(null);
  const [error, setError]     = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrders(null);
    try {
      const res = await fetch(`/api/orders/history?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Có lỗi xảy ra."); return; }
      setOrders(data.orders);
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Trang chủ</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Lịch sử mua hàng</h1>
        <p className="mt-1 text-sm text-gray-500">Nhập email để tra cứu các đơn hàng đã thanh toán thành công.</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email của bạn..."
          className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Đang tìm..." : "Tra cứu"}
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {orders !== null && orders.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-4xl mb-3">🧾</p>
          <p className="text-gray-500">Không tìm thấy đơn hàng nào cho email này.</p>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Tìm thấy <strong>{orders.length}</strong> đơn hàng</p>
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {o.products?.name ?? "Template"}
                  </p>
                  {o.bump_product_id && (
                    <p className="text-xs text-gray-400 mt-0.5">+ Order Bump</p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[o.status]}`}>
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Mã đơn</span>
                  <p className="font-mono font-medium text-gray-700 dark:text-gray-300">{o.id}</p>
                </div>
                <div>
                  <span className="text-gray-400">Số tiền</span>
                  <p className="font-semibold text-green-600">{formatCurrency(o.amount)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Email</span>
                  <p className="text-gray-700 dark:text-gray-300 break-all">{o.customer_email}</p>
                </div>
                <div>
                  <span className="text-gray-400">Số điện thoại</span>
                  <p className="text-gray-700 dark:text-gray-300">{o.customer_phone ?? "—"}</p>
                </div>
                <div>
                  <span className="text-gray-400">Thời điểm mua</span>
                  <p className="text-gray-700 dark:text-gray-300">
                    {new Date(o.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Thanh toán lúc</span>
                  <p className="text-gray-700 dark:text-gray-300">
                    {o.paid_at ? new Date(o.paid_at).toLocaleString("vi-VN") : "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
