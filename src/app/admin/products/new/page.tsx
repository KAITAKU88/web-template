import Link from "next/link";
import ProductForm from "../ProductForm";
import { createProduct } from "../actions";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { adminPath } from "@/lib/admin-redirect";

export default async function NewProductPage() {
  const supabase = createAdminClient();
  const [{ data }, productsPath] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    adminPath("/products"),
  ]);
  const categories = data ?? [{ id: "notion", name: "Notion" }, { id: "google_sheet", name: "Google Sheets" }];

  async function handleCreate(formData: FormData) {
    "use server";
    await createProduct(formData);
    redirect(await adminPath("/products"));
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={productsPath} className="text-gray-500 hover:text-gray-300 transition-colors">
          ← Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-white">Thêm sản phẩm mới</h1>
      </div>

      <ProductForm onSubmit={handleCreate} submitLabel="Tạo sản phẩm" categories={categories} />
    </div>
  );
}
