import { createAdminClient } from "@/lib/supabase/server";
import { getAdminRole } from "@/lib/get-role";
import { createCategory } from "./actions";
import CategoryActions from "./CategoryActions";

export default async function CategoriesPage() {
  const supabase = createAdminClient();
  const [role, { data: categories }] = await Promise.all([
    getAdminRole(),
    supabase.from("categories").select("id, name, sort_order").order("sort_order"),
  ]);
  const canEdit = role !== "collaborator";
  const cats = categories ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh mục</h1>
        <p className="mt-1 text-sm text-gray-400">Quản lý danh mục sản phẩm. Danh mục sẽ hiển thị dưới dạng bộ lọc trên trang chủ.</p>
      </div>

      {/* Danh sách */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        {cats.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">Chưa có danh mục nào.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {cats.map((cat, idx) => (
              <li key={cat.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{cat.name}</span>
                <span className="font-mono text-xs text-gray-600">{cat.id}</span>
                {canEdit && (
                  <CategoryActions
                    id={cat.id}
                    name={cat.name}
                    isFirst={idx === 0}
                    isLast={idx === cats.length - 1}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Thêm mới — chỉ owner/manager */}
      {canEdit && <div className="rounded-2xl border border-gray-200 dark:border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Thêm danh mục mới</h2>
        <form action={createCategory} className="flex gap-3">
          <input
            name="name"
            required
            placeholder="Ví dụ: Khóa học, Figma Template..."
            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
          />
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Thêm
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-600">ID sẽ tự động tạo từ tên (ví dụ: "Khóa học" → <code>khoa_hoc</code>)</p>
      </div>}
    </div>
  );
}
