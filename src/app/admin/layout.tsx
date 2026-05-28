import { getSettings } from "@/lib/settings";
import AdminSidebar from "./Sidebar";

export async function generateMetadata() {
  const settings = await getSettings();
  const brandName = settings.brand_name ?? settings.site_name ?? "Admin";
  return { title: `Admin — ${brandName}` };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const brandName = settings.brand_name ?? settings.site_name ?? "Admin";

  return (
    <div className="fixed inset-0 z-[9999] flex bg-gray-950 overflow-hidden">
      <AdminSidebar brandName={brandName} />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
