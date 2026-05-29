"use client";

import { useState, useTransition } from "react";
import { changePassword } from "./actions";

export default function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await changePassword(formData);
      if (result.error) setError(result.error);
      else {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-white">Đổi mật khẩu Admin</h2>
        <p className="mt-0.5 text-xs text-gray-500">Mật khẩu mới sẽ có hiệu lực ngay lập tức.</p>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Mật khẩu hiện tại</label>
          <input
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Mật khẩu mới <span className="text-gray-600">(tối thiểu 8 ký tự)</span></label>
          <input
            name="new_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Xác nhận mật khẩu mới</label>
          <input
            name="confirm_password"
            type="password"
            required
            autoComplete="new-password"
            className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
        )}
        {success && (
          <p className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">✓ Đổi mật khẩu thành công.</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Đang lưu..." : "Đổi mật khẩu"}
        </button>
      </form>
    </div>
  );
}
