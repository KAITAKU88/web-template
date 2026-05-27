"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency, calcDiscountPercent, formatCount } from "@/lib/utils";
import type { Product } from "@/types";

const TYPE_LABEL: Record<string, string> = { notion: "Notion", google_sheet: "Google Sheets" };
const TYPE_ICON: Record<string, string>  = { notion: "📓", google_sheet: "📊" };

type SortKey = "newest" | "price_asc" | "price_desc" | "popular";

const PRICE_RANGES = [
  { label: "Tất cả",      min: 0,      max: Infinity },
  { label: "Dưới 50k",   min: 0,      max: 50000    },
  { label: "50k – 100k", min: 50000,  max: 100000   },
  { label: "100k – 200k",min: 100000, max: 200000   },
  { label: "Trên 200k",  min: 200000, max: Infinity  },
];

export default function ProductGrid({ products }: { products: Product[] }) {
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
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {/* Type filter */}
        {["all", "notion", "google_sheet"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              typeFilter === t
                ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {t === "all" ? "Tất cả" : t === "notion" ? "📓 Notion" : "📊 Google Sheets"}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {/* Price range */}
          <select
            value={priceIdx}
            onChange={(e) => setPriceIdx(Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {PRICE_RANGES.map((r, i) => (
              <option key={i} value={i}>{r.label}</option>
            ))}
          </select>

          {/* Sort */}
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
            className="mt-3 text-sm text-green-600 underline"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => {
            const discount = product.original_price && product.original_price > product.price
              ? calcDiscountPercent(product.price, product.original_price) : null;
            const isBestseller = product.download_count >= 1000;
            const isHot = !isBestseller && (product.download_count >= 500 || product.rating >= 4.9);

            return (
              <div key={product.id} className="card flex flex-col overflow-hidden transition hover:shadow-md dark:bg-gray-800">
                {/* Thumbnail */}
                <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <span className="text-6xl">{product.type ? TYPE_ICON[product.type] ?? "📄" : "📄"}</span>
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
                    <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {TYPE_ICON[product.type]} {TYPE_LABEL[product.type]}
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
                    <Link href={`/products/${product.id}`} className="btn-secondary flex-shrink-0 px-4 py-2 text-xs">
                      Xem thêm →
                    </Link>
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
