"use client";

import { useState, useTransition, useRef } from "react";
import { createStaff } from "./actions";

export default function StaffCreateForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createStaff(fd);
      if (result.error) { setError(result.error); return; }
      formRef.current?.reset();
    });
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-white">Thêm nhân viên mới</h2>
      </div>
      <form ref={formRef} onSubmit={handleSubmit} className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Họ tên <span className="text-red-400">*</span></label>
          <input name="name" required placeholder="Nguyễn Văn A"
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Email <span className="text-red-400">*</span></label>
          <input name="email" type="email" required placeholder="nhanvien@example.com"
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Mật khẩu <span className="text-red-400">*</span></label>
          <input name="password" type="password" required minLength={8} placeholder="Tối thiểu 8 ký tự"
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Vai trò <span className="text-red-400">*</span></label>
          <select name="role" required defaultValue=""
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500">
            <option value="" disabled>Chọn vai trò...</option>
            <option value="manager">Quản lý — Toàn quyền trừ Cấu hình</option>
            <option value="collaborator">Cộng tác viên — Chỉ xem</option>
          </select>
        </div>

        <div className="sm:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={pending}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
            {pending ? "Đang tạo..." : "Tạo tài khoản"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </form>
    </div>
  );
}
