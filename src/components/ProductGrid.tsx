"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Lottie from "lottie-react";
import runningCatAnimation from "@/assets/running-cat.json";
import { formatCurrency, calcDiscountPercent, formatCount, productUrl } from "@/lib/utils";
import type { Product } from "@/types";

type SortKey = "newest" | "price_asc" | "price_desc" | "popular";

const LEGACY_TYPE_LABEL: Record<string, string> = {
  notion: "Notion",
  google_sheet: "Google Sheets",
};

const PRICE_RANGES = [
  { label: "Tất cả",      min: 0,      max: Infinity },
  { label: "Dưới 50k",   min: 0,      max: 50000    },
  { label: "50k – 100k", min: 50000,  max: 100000   },
  { label: "100k – 200k",min: 100000, max: 200000   },
  { label: "Trên 200k",  min: 200000, max: Infinity  },
];

interface Category { id: string; name: string; }

export default function ProductGrid({ products, categories = [] }: { products: Product[]; categories?: Category[] }) {
  const searchParams = useSearchParams();

  // Đọc query từ URL (header search) và đồng bộ khi URL thay đổi
  const [query, setQuery]           = useState(searchParams.get("q") ?? "");
  const [priceIdx, setPriceIdx]     = useState(0);
  const [sort, setSort]             = useState<SortKey>("newest");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const filtered = useMemo(() => {
    const range = PRICE_RANGES[priceIdx];
    return products
      .filter((p) => {
        const q = query.toLowerCase();
        const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
        const matchPrice  = p.price >= range.min && p.price < range.max;
        const matchType   = typeFilter === "all" || p.type === typeFilter;
        return matchSearch && matchPrice && matchType;
      })
      .sort((a, b) => {
        if (sort === "price_asc")  return a.price - b.price;
        if (sort === "price_desc") return b.price - a.price;
        if (sort === "popular")    return b.download_count - a.download_count;
        return 0; // newest — giữ thứ tự gốc
      });
  }, [products, query, priceIdx, sort, typeFilter]);

  return (
    <div>
      {/* ── Toolbar: Filter + Sort ── */}

      {/* Mobile: 3 dropdown trên cùng 1 hàng */}
      <div className="mb-6 flex gap-1.5 sm:hidden">
        {categories.length > 0 && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 shadow-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">Tất cả</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <select
          value={priceIdx}
          onChange={(e) => setPriceIdx(Number(e.target.value))}
          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 shadow-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          {PRICE_RANGES.map((r, i) => (
            <option key={i} value={i}>{r.label}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 shadow-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="popular">Phổ biến nhất</option>
        </select>
      </div>

      {/* Desktop: category buttons/dropdown + giá + sắp xếp */}
      <div className="mb-6 hidden sm:flex flex-wrap items-center gap-2">
        {categories.length > 0 && (
          <>
            {categories.length <= 5 ? (
              <div className="flex flex-wrap gap-2">
                {["all", ...categories.map((c) => c.id)].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
                      typeFilter === t
                        ? "border-green-500 bg-green-50 text-green-700 shadow-md shadow-green-200/60 dark:bg-green-900/30 dark:text-green-400 dark:shadow-green-900/40 scale-105"
                        : "border-gray-200 bg-white text-gray-600 hover:-translate-y-0.5 hover:scale-105 hover:border-green-300 hover:text-green-600 hover:shadow-md hover:shadow-green-100/80 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-emerald-600 dark:hover:text-emerald-400 dark:hover:shadow-emerald-900/50"
                    }`}
                  >
                    {t === "all" ? "Tất cả" : categories.find((c) => c.id === t)?.name ?? t}
                  </button>
                ))}
              </div>
            ) : (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="all">Tất cả</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={priceIdx}
            onChange={(e) => setPriceIdx(Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {PRICE_RANGES.map((r, i) => (
              <option key={i} value={i}>{r.label}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="popular">Phổ biến nhất</option>
          </select>
        </div>
      </div>

      {/* Result count khi đang tìm kiếm */}
      {query && (
        <p className="mb-4 text-sm text-gray-400">
          Tìm thấy{" "}
          <strong className="text-gray-700 dark:text-gray-200">{filtered.length}</strong>{" "}
          kết quả cho &quot;{query}&quot;
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">Không tìm thấy template phù hợp.</p>
          <button
            onClick={() => { setQuery(""); setPriceIdx(0); setTypeFilter("all"); }}
            className="mt-3 text-sm text-green-600 underline hover:text-green-700 active:scale-95 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => {
            const discount = product.original_price && product.original_price > product.price
              ? calcDiscountPercent(product.price, product.original_price) : null;
            const customLabel = product.label || null;
            const isBestseller = !customLabel && product.download_count >= 1000;
            const isHot = !customLabel && !isBestseller && (product.download_count >= 500 || product.rating >= 4.9);

            return (
              <div key={product.id} className="group relative card flex flex-col overflow-visible transition-all duration-300 ease-out hover:-translate-y-3 hover:shadow-2xl hover:shadow-emerald-300/40 dark:hover:shadow-emerald-500/20 dark:bg-gray-800 dark:hover:border-emerald-700/60">


                {/* Thumbnail */}
                <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover transition-transform duration-500 ease-out group-hover:scale-110" />
                  ) : (
                    <span className="text-6xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6 inline-block">📄</span>
                  )}

                  {/* Shine sweep */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />

                  {customLabel && (
                    <span className="absolute left-2 top-2 rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-bold text-white shadow">{customLabel}</span>
                  )}
                  {isBestseller && (
                    <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-white shadow">🏆 Bestseller</span>
                  )}
                  {isHot && (
                    <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white shadow">🔥 Hot</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  {product.type && (
                    <span className="mb-2 inline-flex w-fit items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {categories.find((c) => c.id === product.type)?.name
                        ?? LEGACY_TYPE_LABEL[product.type]
                        ?? product.type}
                    </span>
                  )}
                  <h2 className="mb-1 font-bold text-gray-900 leading-snug dark:text-white">{product.name}</h2>
                  {product.description && (
                    <p className="mb-3 text-sm text-gray-500 line-clamp-2 dark:text-gray-400">{product.description}</p>
                  )}

                  {/* Rating + downloads */}
                  {(product.rating > 0 || product.download_count > 0) && (
                    <div className="mb-3 flex items-center gap-3 text-xs text-gray-500">
                      {product.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="text-amber-400">★</span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{product.rating.toFixed(1)}</span>
                          {product.rating_count > 0 && <span>({formatCount(product.rating_count)})</span>}
                        </span>
                      )}
                      {product.download_count > 0 && (
                        <span>⬇ {formatCount(product.download_count)} lượt tải</span>
                      )}
                    </div>
                  )}

                  {/* Price + CTA */}
                  <div className="mt-auto flex items-end justify-between gap-2">
                    <div>
                      <span className="text-xl font-bold text-green-600">{formatCurrency(product.price)}</span>
                      {discount && product.original_price && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400 line-through">{formatCurrency(product.original_price)}</span>
                          <span className="rounded bg-red-50 px-1 py-0.5 text-xs font-semibold text-red-500">-{discount}%</span>
                        </div>
                      )}
                    </div>
                    {/* Nút + mèo chạy Lottie */}
                    <div className="relative flex-shrink-0">
                      {/* Mèo chạy trên mặt đất (= nút Xem thêm) — trượt vào từ trái khi hover */}
                      <div className="pointer-events-none select-none absolute -top-[56px] left-0 w-36 -translate-x-4 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-1 group-hover:opacity-100">
                        <Lottie animationData={runningCatAnimation} loop />
                      </div>
                      <Link
                        href={productUrl(product)}
                        className="relative z-10 block rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition-all duration-200 active:scale-95 group-hover:border-green-500 group-hover:bg-green-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-green-400/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:group-hover:border-emerald-500 dark:group-hover:bg-emerald-500 dark:group-hover:text-white"
                      >
                        Xem thêm →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
