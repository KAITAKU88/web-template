"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "./Sidebar";
import type { AdminRole } from "@/lib/admin-auth";

type Theme = "light" | "dark" | "system";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else if (t === "light") root.classList.remove("dark");
  else root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme) || "system";
    setTheme(stored);
  }, []);

  function cycleTheme() {
    const next: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
    const t = next[theme];
    setTheme(t);
    localStorage.setItem("theme", t);
    applyTheme(t);
  }

  const icons: Record<Theme, string> = { light: "☀️", dark: "🌙", system: "💻" };
  const labels: Record<Theme, string> = { light: "Sáng", dark: "Tối", system: "Tự động" };

  return (
    <button
      onClick={cycleTheme}
      title={`Giao diện: ${labels[theme]} — nhấn để đổi`}
      className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors" /* đã đồng bộ design system */
    >
      <span>{icons[theme]}</span>
      <span className="hidden sm:inline">{labels[theme]}</span>
    </button>
  );
}

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
    <div className="fixed inset-0 z-[9999] flex bg-gray-50 dark:bg-gray-950 overflow-hidden">
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
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="Mở menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">{brandName}</span>
          <ThemeToggle />
        </div>

        <div className="flex-1 overflow-y-auto relative">
          {children}
        </div>
      </div>
    </div>
  );
}
