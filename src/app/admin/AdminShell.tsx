"use client";

import { useState } from "react";
import AdminSidebar from "./Sidebar";
import type { AdminRole } from "@/lib/admin-auth";

export default function AdminShell({
  children,
  brandName,
  role,
}: {
  children: React.ReactNode;
  brandName: string;
  role: AdminRole;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-[9999] flex bg-gray-950 overflow-hidden">
      {/* Backdrop mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <AdminSidebar
        brandName={brandName}
        role={role}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-900 px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            aria-label="Mở menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-white">{brandName}</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
