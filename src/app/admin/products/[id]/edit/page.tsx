import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductForm from "../../ProductForm";
import { updateProduct } from "../../actions";
import { redirect } from "next/navigation";
import type { Product } from "@/types";

interface Props { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).single();
  if (!data) notFound();

  const product = data as Product;

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateProduct(id, formData);
    redirect("/admin/products");
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="text-gray-500 hover:text-gray-300 transition-colors">
          ← Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-white">Chỉnh sửa: {product.name}</h1>
      </div>

      <ProductForm product={product} onSubmit={handleUpdate} submitLabel="Lưu thay đổi" />
    </div>
  );
}
