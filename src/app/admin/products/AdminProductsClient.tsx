"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { DeleteButton } from "./DeleteButton";
import { PublishButton } from "./PublishButton";

interface ProductRow {
  id: string; name: string; type: string | null; price: number;
  original_price: number | null; landing_content: unknown;
  download_count: number; created_at: string; status: string; slug: string | null;
  rating: number; rating_count: number;
}

type SortKey = "newest" | "price" | "downloads";
type StatusFilter = "all" | "published" | "draft";

const TYPE_LABEL: Record<string, string> = { notion: "Notion", google_sheet: "Google Sheets" };

export default function AdminProductsClient({
  products,
  canEdit,
  categories,
}: {
  products: ProductRow[];
  canEdit: boolean;
  categories: { id: string; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        const q = search.toLowerCase();
        const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.slug ?? "").toLowerCase().includes(q);
        const matchStatus = statusFilter === "all" || p.status === statusFilter;
        const matchType   = typeFilter === "all" || p.type === typeFilter;
        return matchSearch && matchStatus && matchType;
      })
      .sort((a, b) => {
        if (sort === "price")     return b.price - a.price;
        if (sort === "downloads") return b.download_count - a.download_count;
        return 0; // newest = giữ thứ tự DB (desc created_at)
      });
  }, [products, search, statusFilter, typeFilter, sort]);

  const publishedCount = products.filter((p) => p.status === "published").length;
  const draftCount     = products.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-4">
      {/* Stats badges */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Tất cả", value: "all",       count: products.length,  color: "bg-gray-800 text-gray-300" },
          { label: "Published", value: "published", count: publishedCount, color: "bg-emerald-500/10 text-emerald-400" },
          { label: "Draft",     value: "draft",     count: draftCount,     color: "bg-gray-700 text-gray-400" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setStatusFilter(item.value as StatusFilter)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === item.value
                ? item.color + " ring-1 ring-white/10"
                : "bg-gray-800/50 text-gray-500 hover:bg-gray-800"
            }`}
          >
            {item.label} <span className="ml-1 opacity-70">{item.count}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên sản phẩm..."
          className="flex-1 min-w-[180px] rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500"
        />
        {categories.length > 0 && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          >
            <option value="all">Tất cả loại</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        >
          <option value="newest">Mới nhất</option>
          <option value="price">Giá cao nhất</option>
          <option value="downloads">Lượt tải nhiều nhất</option>
        </select>
      </div>

      {/* Result count */}
      {(search || statusFilter !== "all" || typeFilter !== "all") && (
        <p className="text-xs text-gray-500">
          Hiển thị <strong className="text-gray-300">{filtered.length}</strong> / {products.length} sản phẩm
          {search && <> · từ khóa "<span className="text-emerald-400">{search}</span>"</>}
        </p>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-400 text-sm">Không tìm thấy sản phẩm phù hợp.</p>
              <button
                onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); }}
                className="mt-3 text-sm text-emerald-400 hover:text-emerald-300"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-medium text-gray-500 uppercase">
                  <th className="px-5 py-3 text-left">Sản phẩm</th>
                  <th className="px-5 py-3 text-left">Loại</th>
                  <th className="px-5 py-3 text-right">Giá</th>
                  <th className="px-5 py-3 text-center">Rating</th>
                  <th className="px-5 py-3 text-center">AI</th>
                  <th className="px-5 py-3 text-right">Lượt tải</th>
                  {canEdit && <th className="px-5 py-3 text-center">Trạng thái</th>}
                  {canEdit && <th className="px-5 py-3 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white truncate max-w-[220px]">{p.name}</p>
                      <p className="text-xs text-gray-600 font-mono mt-0.5">
                        {p.slug ? `/${p.slug}` : p.id.slice(0, 8) + "…"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {catMap.get(p.type ?? "") ?? TYPE_LABEL[p.type ?? ""] ?? p.type ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="font-semibold text-emerald-400">{formatCurrency(p.price)}</p>
                      {p.original_price && (
                        <p className="text-xs text-gray-600 line-through">{formatCurrency(p.original_price)}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {p.rating > 0 ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-amber-400 text-xs">★ {p.rating.toFixed(1)}</span>
                          {p.rating_count > 0 && (
                            <span className="text-gray-600 text-xs">{p.rating_count}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {p.landing_content ? (
                        <span title="Đã có landing page AI" className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-xs text-violet-400">✨</span>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-400">
                      {p.download_count ?? 0}
                    </td>
                    {canEdit && (
                      <td className="px-5 py-4 text-center">
                        <PublishButton id={p.id} status={p.status ?? "published"} />
                      </td>
                    )}
                    {canEdit && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            Sửa
                          </Link>
                          <DeleteButton id={p.id} name={p.name} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
