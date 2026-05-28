import Link from "next/link";
import ProductForm from "../ProductForm";
import { createProduct } from "../actions";
import { redirect } from "next/navigation";

export default function NewProductPage() {
  async function handleCreate(formData: FormData) {
    "use server";
    await createProduct(formData);
    redirect("/admin/products");
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="text-gray-500 hover:text-gray-300 transition-colors">
          ← Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-white">Thêm sản phẩm mới</h1>
      </div>

      <ProductForm onSubmit={handleCreate} submitLabel="Tạo sản phẩm" />
    </div>
  );
}
