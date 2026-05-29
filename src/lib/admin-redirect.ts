import { getAdminRole } from "./get-role";

const ROLE_BASE: Record<string, string> = {
  owner:        "/admin",
  manager:      "/manager",
  collaborator: "/collaborator",
};

export async function adminPath(subPath: string): Promise<string> {
  const role = await getAdminRole();
  const base = ROLE_BASE[role] ?? "/admin";
  return `${base}${subPath}`;
}
