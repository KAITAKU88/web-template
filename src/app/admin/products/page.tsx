import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { DeleteButton } from "./DeleteButton";

interface ProductRow {
  id: string; name: string; type: string | null; price: number;
  original_price: number | null; image_url: string | null;
  landing_content: unknown; download_count: number; created_at: string;
}

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, type, price, original_price, image_url, landing_content, download_count, created_at")
    .order("created_at", { ascending: false });

  const TYPE_LABEL: Record<string, string> = { notion: "Notion", google_sheet: "Google Sheets" };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sản phẩm</h1>
          <p className="mt-1 text-sm text-gray-400">{products?.length ?? 0} sản phẩm</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors"
        >
          <span>+</span> Thêm sản phẩm
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        {!products?.length ? (
          <div className="px-6 py-16 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-400 text-sm">Chưa có sản phẩm nào.</p>
            <Link href="/admin/products/new" className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300">
              Thêm sản phẩm đầu tiên →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs font-medium text-gray-500 uppercase">
                <th className="px-5 py-3 text-left">Sản phẩm</th>
                <th className="px-5 py-3 text-left">Loại</th>
                <th className="px-5 py-3 text-right">Giá</th>
                <th className="px-5 py-3 text-center">AI</th>
                <th className="px-5 py-3 text-right">Lượt tải</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {(products as ProductRow[]).map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-white truncate max-w-[240px]">{p.name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{p.id.slice(0, 8)}…</p>
                  </td>
                  <td className="px-5 py-4 text-gray-400">
                    {TYPE_LABEL[p.type ?? ""] ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="font-semibold text-emerald-400">{formatCurrency(p.price)}</p>
                    {p.original_price && (
                      <p className="text-xs text-gray-500 line-through">{formatCurrency(p.original_price)}</p>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
