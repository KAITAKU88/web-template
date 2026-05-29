import { getSettings } from "@/lib/settings";
import { getAdminRole } from "@/lib/get-role";
import AdminSidebar from "./Sidebar";

export async function generateMetadata() {
  const settings = await getSettings();
  const brandName = settings.brand_name ?? settings.site_name ?? "Admin";
  return { title: brandName };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [settings, role] = await Promise.all([getSettings(), getAdminRole()]);
  const brandName = settings.brand_name ?? settings.site_name ?? "Admin";

  return (
    <div className="fixed inset-0 z-[9999] flex bg-gray-950 overflow-hidden">
      <AdminSidebar brandName={brandName} role={role} />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
