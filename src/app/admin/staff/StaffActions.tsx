"use client";

import { useState, useTransition } from "react";
import { toggleStaffActive, deleteStaff, resetStaffPassword } from "./actions";

const ROLE_LABEL: Record<string, string> = { manager: "Quản lý", collaborator: "Cộng tác viên" };
const ROLE_COLOR: Record<string, string> = {
  manager: "bg-blue-500/15 text-blue-400",
  collaborator: "bg-gray-500/15 text-gray-400",
};

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export function StaffRow({ staff }: { staff: Staff }) {
  const [pending, startTransition] = useTransition();
  const [showReset, setShowReset] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");

  function handleToggle() {
    startTransition(() => toggleStaffActive(staff.id, !staff.is_active));
  }

  function handleDelete() {
    if (!confirm(`Xóa tài khoản "${staff.name}"? Hành động này không thể hoàn tác.`)) return;
    startTransition(() => deleteStaff(staff.id));
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    const fd = new FormData();
    fd.set("password", newPw);
    const result = await resetStaffPassword(staff.id, fd);
    if (result.error) { setPwError(result.error); return; }
    setShowReset(false);
    setNewPw("");
  }

  return (
    <li className={`px-5 py-4 transition-opacity ${!staff.is_active ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{staff.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLOR[staff.role] ?? "bg-gray-500/15 text-gray-400"}`}>
              {ROLE_LABEL[staff.role] ?? staff.role}
            </span>
            {!staff.is_active && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400">Đã khóa</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{staff.email}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowReset(!showReset)}
            disabled={pending}
            title="Đặt lại mật khẩu"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </button>
          <button
            onClick={handleToggle}
            disabled={pending}
            title={staff.is_active ? "Khóa tài khoản" : "Mở khóa"}
            className={`rounded-lg p-1.5 transition ${staff.is_active ? "text-gray-400 hover:bg-amber-500/10 hover:text-amber-400" : "text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400"}`}
          >
            {staff.is_active ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            title="Xóa"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {showReset && (
        <form onSubmit={handleResetPassword} className="mt-3 flex gap-2">
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="Mật khẩu mới (≥8 ký tự)"
            className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500"
          />
          <button type="submit" className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition">Lưu</button>
          <button type="button" onClick={() => { setShowReset(false); setNewPw(""); }} className="rounded-xl border border-gray-700 px-3 py-2 text-xs text-gray-400 hover:text-white transition">Hủy</button>
          {pwError && <p className="text-xs text-red-400 self-center">{pwError}</p>}
        </form>
      )}
    </li>
  );
}
