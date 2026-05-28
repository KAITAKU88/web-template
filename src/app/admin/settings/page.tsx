import { getSettings } from "@/lib/settings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cấu hình hệ thống</h1>
        <p className="mt-1 text-sm text-gray-400">
          Thay đổi giao diện, tích hợp thanh toán và email — không cần sửa code
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
