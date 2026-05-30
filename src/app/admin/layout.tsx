import { getSettings } from "@/lib/settings";
import { getAdminRole } from "@/lib/get-role";
import AdminShell from "./AdminShell";

export async function generateMetadata() {
  const settings = await getSettings();
  const brandName = settings.brand_name ?? settings.site_name ?? "Admin";
  return { title: brandName };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [settings, role] = await Promise.all([getSettings(), getAdminRole()]);
  const brandName = settings.brand_name ?? settings.site_name ?? "Admin";

  return (
    <AdminShell brandName={brandName} role={role}>
      {children}
    </AdminShell>
  );
}
