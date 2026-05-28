import AdminSidebar from "./Sidebar";

export const metadata = { title: "Admin — TemplateLab" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] flex bg-gray-950 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
