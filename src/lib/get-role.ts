import { headers } from "next/headers";
import type { AdminRole } from "./admin-auth";

export async function getAdminRole(): Promise<AdminRole> {
  const h = await headers();
  const role = h.get("x-admin-role");
  if (role === "manager" || role === "collaborator") return role;
  return "owner";
}
