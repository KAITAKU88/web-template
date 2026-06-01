"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

interface DiscountCode {
  id: string; code: string; type: "percent" | "flat"; value: number;
  product_id: string | null; min_amount: number; max_uses: number | null;
  used_count: number; expires_at: string | null; is_active: boolean; created_at: string;
  product?: { name: string } | null;
}
interface Product { id: string; name: string; }

const EMPTY_FORM = { code: "", type: "percent" as "percent" | "flat", value: "", product_id: "", min_amount: "", max_uses: "", expires_at: "" };

export default function DiscountsClient({ codes: init, products }: { codes: DiscountCode[]; products: Product[] }) {
  const [codes, setCodes] = useState(init);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const formHasContent = showForm && Object.values(form).some((v) => v !== "" && v !== "percent");
  useUnsavedChanges(formHasContent);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr("");
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? "Lỗi"); setSaving(false); return; }
    setCodes([data, ...codes]);
    setShowForm(false); setForm(EMPTY_FORM);
    setSaving(false);
  }

  async function toggleActive(id: string, is_active: boolean) {
    await fetch("/api/admin/discounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !is_active }),
    });
    setCodes(codes.map((c) => c.id === id ? { ...c, is_active: !is_active } : c));
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa mã giảm giá này?")) return;
    await fetch("/api/admin/discounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCodes(codes.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Nút tạo */}
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors">
          + Tạo mã mới
        </button>
      </div>

      {/* Form tạo */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Tạo mã giảm giá mới</h2>
          {err && <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{err}</p>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Mã <span className="text-red-400">*</span></label>
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER20" className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white font-mono uppercase outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Loại giảm</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "flat" })}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500">
                <option value="percent">Phần trăm (%)</option>
                <option value="flat">Số tiền cố định (đ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Giá trị <span className="text-red-400">*</span></label>
              <input required type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === "percent" ? "20 (= 20%)" : "50000 (= 50.000đ)"}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Chỉ áp dụng cho sản phẩm</label>
              <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500">
                <option value="">Tất cả sản phẩm</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Đơn tối thiểu (đ)</label>
              <input type="number" min={0} value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })}
                placeholder="0 = không giới hạn" className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Số lần dùng tối đa</label>
              <input type="number" min={1} value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                placeholder="Để trống = không giới hạn" className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Hết hạn</label>
              <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50 transition-colors">
              {saving ? "Đang tạo…" : "Tạo mã"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setErr(""); }}
              className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Bảng danh sách */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">Mã</th>
                <th className="px-4 py-3 text-left">Giảm</th>
                <th className="px-4 py-3 text-left">Sản phẩm</th>
                <th className="px-4 py-3 text-center">Lượt dùng</th>
                <th className="px-4 py-3 text-left">Hết hạn</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {codes.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Chưa có mã giảm giá nào.</td></tr>
              ) : codes.map((dc) => (
                <tr key={dc.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">{dc.code}</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">
                    {dc.type === "percent" ? `${dc.value}%` : formatCurrency(dc.value)}
                    {dc.min_amount > 0 && <span className="ml-1 text-xs text-gray-500">(min {formatCurrency(dc.min_amount)})</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{dc.product?.name ?? <span className="text-gray-500">Tất cả</span>}</td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">
                    {dc.used_count}{dc.max_uses ? `/${dc.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {dc.expires_at ? new Date(dc.expires_at).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(dc.id, dc.is_active)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${dc.is_active ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-600"}`}>
                      {dc.is_active ? "Đang dùng" : "Tắt"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(dc.id)}
                      className="rounded-xl px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"> /* đã đồng bộ design system */
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
