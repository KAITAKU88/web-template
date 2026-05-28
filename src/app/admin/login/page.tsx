import { getSettings } from "@/lib/settings";
import LoginForm from "./LoginForm";

export default async function AdminLoginPage() {
  const settings = await getSettings();
  const brandName = settings.brand_name ?? settings.site_name ?? "Admin";
  return <LoginForm brandName={brandName} />;
}
