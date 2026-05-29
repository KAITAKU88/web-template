import { getSettings } from "@/lib/settings";
import { isUsingDefaultPassword } from "@/lib/admin-password";
import LoginForm from "./LoginForm";

export default async function AdminLoginPage() {
  const [settings, usingDefault] = await Promise.all([
    getSettings(),
    isUsingDefaultPassword(),
  ]);
  const brandName = settings.brand_name ?? settings.site_name ?? "Admin";
  return <LoginForm brandName={brandName} showHint={usingDefault} />;
}
