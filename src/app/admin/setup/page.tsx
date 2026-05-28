import SetupGuide from "./SetupGuide";

export const dynamic = "force-dynamic";

export default function AdminSetupPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Hướng dẫn triển khai</h1>
        <p className="mt-1 text-sm text-gray-400">
          Làm theo từng bước — checkbox khi xong mỗi bước. Trạng thái được lưu lại tự động.
        </p>
      </div>

      <SetupGuide />
    </div>
  );
}
