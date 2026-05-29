"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Có lỗi xảy ra.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Không thể kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Quên mật khẩu</h1>
          <p className="mt-1 text-sm text-gray-400">Nhập email admin để nhận mật khẩu tạm thời</p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="rounded-xl bg-emerald-500/10 px-4 py-5">
              <p className="text-2xl mb-2">📧</p>
              <p className="text-sm font-medium text-emerald-400">Đã gửi mật khẩu tạm thời!</p>
              <p className="mt-1 text-xs text-gray-400">Kiểm tra hộp thư của bạn. Mật khẩu hết hạn sau 15 phút.</p>
            </div>
            <Link href="/admin/login" className="block w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white text-center transition hover:bg-emerald-600">
              Về trang đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Email Admin</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="admin@yourdomain.com"
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {error && <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {loading ? "Đang gửi…" : "Gửi mật khẩu tạm thời"}
            </button>
            <Link href="/admin/login" className="block text-center text-sm text-gray-500 hover:text-gray-300 transition">
              ← Quay lại đăng nhập
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
