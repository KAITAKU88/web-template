import { createAdminClient } from "@/lib/supabase/server";
import { StaffRow } from "./StaffActions";
import StaffCreateForm from "./StaffCreateForm";

export default async function StaffPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("staff")
    .select("id, name, email, role, is_active, created_at")
    .order("created_at");

  const staffList = data ?? [];
  const activeCount = staffList.filter((s) => s.is_active).length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-white">Quản lý nhân viên</h1>
        <p className="mt-1 text-sm text-gray-400">
          {staffList.length === 0
            ? "Chưa có nhân viên nào."
            : `${activeCount}/${staffList.length} tài khoản đang hoạt động.`}
        </p>
      </div>

      {/* Danh sách */}
      {staffList.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
          <ul className="divide-y divide-gray-800">
            {staffList.map((s) => <StaffRow key={s.id} staff={s} />)}
          </ul>
        </div>
      )}

      {/* Form tạo mới */}
      <StaffCreateForm />
    </div>
  );
}
