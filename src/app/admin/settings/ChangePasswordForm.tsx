"use client";

import { useState, useTransition } from "react";
import { changePassword } from "./actions";

function PasswordInput({ name, placeholder, label }: { name: string; placeholder?: string; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative max-w-sm">
        <input
          name={name}
          type={show ? "text" : "password"}
          required
          minLength={8}
          placeholder={placeholder ?? "••••••••"}
          autoComplete="new-password"
          className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 pr-10 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
        >
          {show ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

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
        <p className="mt-0.5 text-xs text-gray-500">Mật khẩu mới có hiệu lực ngay lập tức.</p>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <PasswordInput name="new_password" label="Mật khẩu mới (tối thiểu 8 ký tự)" />
        <PasswordInput name="confirm_password" label="Xác nhận mật khẩu mới" />

        {error && <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}
        {success && <p className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">✓ Đổi mật khẩu thành công.</p>}

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
