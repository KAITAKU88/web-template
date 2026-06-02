import { createAdminClient } from "@/lib/supabase/server";
import { StaffRow } from "./StaffActions";
import StaffCreateForm from "./StaffCreateForm";

const ROLE_LABEL: Record<string, string> = { manager: "Quản lý", collaborator: "Nhân viên", partner: "Cộng tác viên" };

export default async function StaffPage() {
  const supabase = createAdminClient();
  const [{ data }, { data: logs }] = await Promise.all([
    supabase.from("staff").select("id, name, email, role, is_active, created_at").order("created_at"),
    supabase
      .from("activity_logs")
      .select("staff_id, action_type, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const staffList = data ?? [];
  const activeCount = staffList.filter((s) => s.is_active).length;

  // Thống kê đăng nhập theo nhân viên
  const now = new Date();
  const dayAgo   = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const statsMap = Object.fromEntries(staffList.map((s) => {
    const myLogs = (logs ?? []).filter((l) => l.staff_id === s.id);
    const loginLogs = myLogs.filter((l) => l.action_type === "login");
    const lastLogin = loginLogs[0]?.created_at ?? null;
    return [s.id, {
      loginToday:  loginLogs.filter((l) => l.created_at >= dayAgo).length,
      loginWeek:   loginLogs.filter((l) => l.created_at >= weekAgo).length,
      loginMonth:  loginLogs.filter((l) => l.created_at >= monthAgo).length,
      totalActions: myLogs.filter((l) => l.action_type !== "login").length,
      lastLogin,
    }];
  }));

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Người dùng</h1>
        <p className="mt-1 text-sm text-gray-400">
          {staffList.length === 0
            ? "Chưa có tài khoản nào."
            : `${activeCount}/${staffList.length} tài khoản đang hoạt động.`}
        </p>
      </div>

      {/* Danh sách */}
      {staffList.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {staffList.map((s) => <StaffRow key={s.id} staff={s} />)}
          </ul>
        </div>
      )}

      {/* Form tạo mới */}
      <StaffCreateForm />

      {/* ── Thống kê — chỉ admin (owner) thấy ── */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Thống kê hoạt động</h2>
        <p className="text-xs text-gray-500 mb-4">Chỉ Admin mới thấy mục này</p>
        {staffList.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
        ) : (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500">
                  <th className="px-4 py-3 text-left">Tên</th>
                  <th className="px-4 py-3 text-left">Vai trò</th>
                  <th className="px-4 py-3 text-center">Login hôm nay</th>
                  <th className="px-4 py-3 text-center">Login 7 ngày</th>
                  <th className="px-4 py-3 text-center">Login 30 ngày</th>
                  <th className="px-4 py-3 text-center" title="Số hành động: tạo/sửa/xóa sản phẩm và các thao tác khác (không tính đăng nhập)">Hành động</th>
                  <th className="px-4 py-3 text-left">Lần cuối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {staffList.map((s) => {
                  const st = statsMap[s.id];
                  return (
                    <tr key={s.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                      <td className="px-4 py-3 text-gray-400">{ROLE_LABEL[s.role] ?? s.role}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-gray-300">{st.loginToday}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-gray-300">{st.loginWeek}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-gray-300">{st.loginMonth}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-gray-300">{st.totalActions}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {st.lastLogin
                          ? new Date(st.lastLogin).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
