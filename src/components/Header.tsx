"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

type Theme = "light" | "dark" | "system";

// ── Logo ──────────────────────────────────────────────
function isImageUrl(value: string) {
  return /^https?:\/\/|^\//.test(value);
}

function Logo({ brandName, logoValue }: { brandName: string; logoValue?: string }) {
  const initials = brandName.match(/[A-Z]/g)?.join("") || brandName.slice(0, 2).toUpperCase();
  const showImage = logoValue && isImageUrl(logoValue);
  const showText  = logoValue && !isImageUrl(logoValue);

  return (
    <Link href="/" className="flex items-center gap-2.5 select-none shrink-0">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoValue} alt={brandName} className="h-8 w-auto max-w-[120px] object-contain" />
      ) : (
        <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-brand px-1.5 text-white font-black text-sm shadow-sm">
          {showText ? logoValue : initials}
        </span>
      )}
      {!showImage && (
        <span className="hidden sm:block font-extrabold tracking-tight text-gray-900 dark:text-white text-lg">
          {brandName}
        </span>
      )}
    </Link>
  );
}

// ── Search Bar (cần Suspense vì dùng useSearchParams) ─
type SearchResult = Pick<Product, "id" | "name" | "price" | "type">;

function SearchBarInner() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  const isHomepage = pathname === "/";

  const [value, setValue]               = useState(searchParams.get("q") ?? "");
  const [results, setResults]           = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Đồng bộ khi URL thay đổi trên homepage (ví dụ bấm back)
  useEffect(() => {
    if (isHomepage) setValue(searchParams.get("q") ?? "");
  }, [searchParams, isHomepage]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Tìm kiếm debounce — chỉ khi không ở homepage
  useEffect(() => {
    if (isHomepage) return;
    if (!value.trim()) { setResults([]); setShowDropdown(false); return; }

    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, type")
        .ilike("name", `%${value.trim()}%`)
        .limit(7);
      setResults((data as SearchResult[]) ?? []);
      setShowDropdown(true);
    }, 250);

    return () => clearTimeout(t);
  }, [value, isHomepage, supabase]);

  function handleChange(v: string) {
    setValue(v);
    if (isHomepage) {
      const params = new URLSearchParams(searchParams.toString());
      if (v) params.set("q", v); else params.delete("q");
      router.push(`/${params.toString() ? "?" + params.toString() : ""}`);
    }
    if (!v) { setResults([]); setShowDropdown(false); }
  }

  function handleResultClick(id: string) {
    setShowDropdown(false);
    setValue("");
    router.push(`/products/${id}`);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (!isHomepage && results.length > 0) setShowDropdown(true); }}
        onKeyDown={(e) => { if (e.key === "Escape") setShowDropdown(false); }}
        placeholder="Tìm kiếm template..."
        className="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-7 text-sm outline-none transition focus:border-brand focus:ring-brand dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
      />
      {value && (
        <button
          onClick={() => handleChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-300 hover:text-gray-500"
        >
          ✕
        </button>
      )}

      {/* Dropdown — chỉ hiện khi không ở homepage */}
      {!isHomepage && showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-center text-sm text-gray-400">Không tìm thấy kết quả.</p>
          ) : (
            <>
              {results.map((p) => (
                <button
                  key={p.id}
                  onMouseDown={(e) => e.preventDefault()} // giữ focus khỏi bị mất
                  onClick={() => handleResultClick(p.id)}
                  className="flex w-full items-center justify-between border-b border-gray-50 px-4 py-2.5 transition last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <span className="flex-1 truncate text-left text-sm text-gray-800 dark:text-gray-200">
                    {p.name}
                  </span>
                  <span className="ml-4 shrink-0 text-sm font-semibold text-brand">
                    {formatCurrency(p.price)}
                  </span>
                </button>
              ))}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setShowDropdown(false); router.push(`/?q=${encodeURIComponent(value)}`); }}
                className="w-full border-t border-gray-100 px-4 py-2 text-center text-xs text-brand transition hover:bg-brand-subtle dark:border-gray-700"
              >
                Xem tất cả kết quả →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SearchBar() {
  return (
    <Suspense fallback={
      <div className="h-9 w-full rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
    }>
      <SearchBarInner />
    </Suspense>
  );
}

// ── Settings Menu — gộp Theme + Lịch sử mua hàng ────
function SettingsMenu() {
  const [open, setOpen]     = useState(false);
  const [tab, setTab]       = useState<"theme" | "history">("history");
  const [theme, setTheme]   = useState<Theme>("system");
  const ref     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme) || "system";
    setTheme(stored);
    applyTheme(stored);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === "dark")       root.classList.add("dark");
    else if (t === "light") root.classList.remove("dark");
    else root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function changeTheme(t: Theme) {
    setTheme(t);
    localStorage.setItem("theme", t);
    applyTheme(t);
  }

  const THEME_ICONS:  Record<Theme, string> = { light: "☀️", dark: "🌙", system: "💻" };
  const THEME_LABELS: Record<Theme, string> = { light: "Sáng", dark: "Tối", system: "Tự động" };

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Nút tròn ⚙️ */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Cài đặt"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        aria-expanded={open}
      >
        <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {/* Tab header */}
          <div className="flex border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setTab("history")}
              className={`flex-1 px-2 py-3 text-sm font-medium transition ${
                tab === "history"
                  ? "border-b-2 border-brand text-brand"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              🧾 Lịch sử mua
            </button>
            <button
              onClick={() => setTab("theme")}
              className={`flex-1 px-2 py-3 text-sm font-medium transition ${
                tab === "theme"
                  ? "border-b-2 border-brand text-brand"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {THEME_ICONS[theme]} Giao diện
            </button>
          </div>

          <div className="p-4">
            {/* Tab: Giao diện */}
            {tab === "theme" && (
              <div className="space-y-1">
                {(["light", "dark", "system"] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => changeTheme(t)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                      theme === t
                        ? "bg-brand-subtle font-semibold text-brand"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>{THEME_ICONS[t]}</span>
                    <span>{THEME_LABELS[t]}</span>
                    {theme === t && <span className="ml-auto text-brand">✓</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Tab: Lịch sử */}
            {tab === "history" && (
              <div className="py-2 text-center">
                <p className="mb-3 text-sm text-gray-500">Tra cứu đơn hàng theo email của bạn.</p>
                <Link
                  href="/orders"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dim"
                >
                  🧾 Xem lịch sử mua hàng
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Header ───────────────────────────────────────
export default function Header({ brandName = "TemplateLab", logoValue }: { brandName?: string; logoValue?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/90">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
        <Logo brandName={brandName} logoValue={logoValue} />
        <div className="ml-auto flex items-center gap-3">
          <div className="w-64 min-w-0">
            <SearchBar />
          </div>
          <SettingsMenu />
        </div>
      </div>
    </header>
  );
}
