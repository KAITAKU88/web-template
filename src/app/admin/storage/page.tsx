import StorageBrowser from "./StorageBrowser";

export default function AdminStoragePage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Thư viện ảnh</h1>
        <p className="mt-1 text-xs text-gray-500">Quản lý toàn bộ ảnh trong Supabase Storage — upload hàng loạt, tạo thư mục, xem và xóa</p>
      </div>
      <StorageBrowser />
    </div>
  );
}
