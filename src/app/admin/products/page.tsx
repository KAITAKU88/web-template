import { createAdminClient } from "@/lib/supabase/server";
import { getAdminRole } from "@/lib/get-role";
import Link from "next/link";
import AdminProductsClient from "./AdminProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = createAdminClient();
  const [role, { data: products }, { data: categories }] = await Promise.all([
    getAdminRole(),
    supabase
      .from("products")
      .select("id, name, type, price, original_price, image_url, landing_content, download_count, created_at, status, slug, rating, rating_count")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name").order("sort_order"),
  ]);

  const canEdit = role !== "collaborator";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sản phẩm</h1>
          <p className="mt-1 text-sm text-gray-400">{products?.length ?? 0} sản phẩm</p>
        </div>
        {canEdit && (
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors"
          >
            <span>+</span> Thêm sản phẩm
          </Link>
        )}
      </div>

      {!products?.length ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-16 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-400 text-sm">Chưa có sản phẩm nào.</p>
          {canEdit && (
            <Link href="/admin/products/new" className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300">
              Thêm sản phẩm đầu tiên →
            </Link>
          )}
        </div>
      ) : (
        <AdminProductsClient
          products={products as Parameters<typeof AdminProductsClient>[0]["products"]}
          canEdit={canEdit}
          categories={categories ?? []}
        />
      )}
    </div>
  );
}
