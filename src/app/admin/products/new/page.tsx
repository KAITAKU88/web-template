import ProductForm from "../ProductForm";
import { createProduct } from "../actions";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { adminPath } from "@/lib/admin-redirect";
import CancelButton from "./CancelButton";

export default async function NewProductPage() {
  const supabase = createAdminClient();
  const [{ data }, productsPath, settings] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    adminPath("/products"),
    getSettings(),
  ]);
  const categories = data ?? [{ id: "notion", name: "Notion" }, { id: "google_sheet", name: "Google Sheets" }];

  async function handleCreate(formData: FormData) {
    "use server";
    await createProduct(formData);
    redirect(await adminPath("/products"));
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Thêm sản phẩm mới</h1>
      <CancelButton onSubmit={handleCreate} submitLabel="Tạo sản phẩm" categories={categories} aiProvider={settings.ai_provider ?? null} />
    </div>
  );
}
