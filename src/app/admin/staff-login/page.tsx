import { getSettings } from "@/lib/settings";
import StaffLoginForm from "./StaffLoginForm";

export default async function StaffLoginPage() {
  const settings = await getSettings();
  const brandName = settings.brand_name ?? settings.site_name ?? "TemplateLab";
  return <StaffLoginForm brandName={brandName} />;
}
