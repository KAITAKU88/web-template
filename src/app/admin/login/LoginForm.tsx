"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ brandName }: { brandName: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.replace("/admin");
    } else {
      const data = await res.json();
      setError(data.error ?? "Đăng nhập thất bại.");
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Admin — {brandName}</h1>
          <p className="mt-1 text-sm text-gray-400">Đăng nhập để quản lý</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            {loading ? "Đang xác thực…" : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
