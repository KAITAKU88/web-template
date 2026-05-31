"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
    >
      <span className="text-base">{icons[theme]}</span>
      <span>Giao diện: {labels[theme]}</span>
    </button>
  );
}

type NavItem = {
  href: string;
  label: string;
  roles: AdminRole[];
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    href: "/admin",
    label: "Tổng quan",
    roles: ["owner", "manager", "collaborator"],
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    href: "/admin/products",
    label: "Sản phẩm",
    roles: ["owner", "manager", "collaborator"],
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  },
  {
    href: "/admin/categories",
    label: "Danh mục",
    roles: ["owner", "manager", "collaborator"],
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  },
  {
    href: "/admin/orders",
    label: "Đơn hàng",
    roles: ["owner", "manager", "collaborator"],
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    href: "/admin/customers",
    label: "Khách hàng",
    roles: ["owner", "manager"],
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
  {
    href: "/admin/staff",
    label: "Nhân viên",
    roles: ["owner"],
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    href: "/admin/storage",
    label: "Thư viện ảnh",
    roles: ["owner", "manager"],
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
  {
    href: "/admin/discounts",
    label: "Mã giảm giá",
    roles: ["owner", "manager"],
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  },
  {
    href: "/admin/marketing",
    label: "Marketing",
    roles: ["owner", "manager"],
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  },
  {
    href: "/admin/automation",
    label: "Automation",
    roles: ["owner", "manager"],
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
  {
    href: "/admin/settings",
    label: "Cấu hình",
    roles: ["owner"],
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    href: "/admin/setup",
    label: "Hướng dẫn",
    roles: ["owner"],
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  },
];

const ROLE_BASE: Record<AdminRole, string> = {
  owner: "/admin",
  manager: "/manager",
  collaborator: "/collaborator",
};

const ROLE_LABEL: Record<AdminRole, string> = {
  owner: "Owner",
  manager: "Quản lý",
  collaborator: "Cộng tác viên",
};

export default function AdminSidebar({
  brandName = "Admin",
  role = "owner",
  mobileOpen = false,
  onMobileClose,
}: {
  brandName?: string;
  role?: AdminRole;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = ROLE_BASE[role];

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  // Chặn navigation khi đang có unsaved changes (bất kỳ form nào)
  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href === pathname) return;
    const dirty = typeof window !== "undefined" &&
      (window as Window & { __adminFormDirty?: boolean }).__adminFormDirty;
    if (dirty) {
      e.preventDefault();
      if (window.confirm("Bạn có thay đổi chưa được lưu.\nRời khỏi trang này không?")) {
        (window as Window & { __adminFormDirty?: boolean }).__adminFormDirty = false;
        router.push(href);
      }
    }
  }

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-[9999] flex w-72 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900
        transform transition-transform duration-200 ease-in-out
        md:static md:w-56 md:translate-x-0 md:transition-none
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Nút đóng sidebar trên mobile */}
      <button
        type="button"
        onClick={onMobileClose}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors md:hidden"
        aria-label="Đóng menu"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Logo → mở trang chủ trong tab mới */}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        title="Xem trang chủ"
        className="flex h-16 shrink-0 items-center gap-2.5 px-5 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{brandName}</span>
      </a>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.filter((item) => item.roles.includes(role)).map((item) => {
          // Đổi /admin prefix → basePath của role hiện tại
          const href = item.href === "/admin"
            ? basePath
            : item.href.replace("/admin", basePath);
          const active =
            item.href === "/admin"
              ? pathname === basePath
              : pathname.startsWith(href.replace(basePath, "").length > 0 ? href : basePath + "/");
          return (
            <Link
              key={item.href}
              href={href}
              onClick={(e) => handleNavClick(e, href)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Role badge + Theme + Logout */}
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 p-3 space-y-1">
        <div className="px-3 py-1.5">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            role === "owner"       ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
            role === "manager"     ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"          :
                                     "bg-gray-500/15 text-gray-500 dark:text-gray-400"
          }`}>
            {ROLE_LABEL[role]}
          </span>
        </div>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
