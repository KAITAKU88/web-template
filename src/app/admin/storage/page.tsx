import StorageBrowser from "./StorageBrowser";
import { getAdminSession } from "@/lib/get-role";

export default async function AdminStoragePage() {
  const { role, staffId } = await getAdminSession();
  // Partner chỉ được thao tác trong folder riêng của họ
  const partnerFolder = role === "partner" && staffId ? `partner/${staffId}` : undefined;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thư viện ảnh</h1>
        <p className="mt-1 text-xs text-gray-500">
          {partnerFolder
            ? "Thư viện ảnh của bạn — chỉ xem và thao tác được với ảnh do bạn upload"
            : "Quản lý toàn bộ ảnh trong Supabase Storage — upload hàng loạt, tạo thư mục, xem và xóa"}
        </p>
      </div>
      <StorageBrowser partnerFolder={partnerFolder} creatorId={role === "partner" ? staffId ?? undefined : undefined} />
    </div>
  );
}
