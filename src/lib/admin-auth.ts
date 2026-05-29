import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";

export type AdminRole = "owner" | "manager" | "collaborator";

export interface AdminSession {
  type: "owner" | "staff";
  role: AdminRole;
  name: string;
  id?: string;
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// ── Owner token (backwards compatible) ──────────────────────────────
export async function createOwnerToken(password: string): Promise<string> {
  const secret = process.env.ADMIN_SECRET ?? "";
  return hmac(password, secret);
}

async function verifyOwnerToken(token: string): Promise<boolean> {
  try {
    const settings = await getSettings();
    const password = settings.admin_password ?? process.env.ADMIN_PASSWORD ?? "admin12345678";
    const secret = process.env.ADMIN_SECRET ?? "";
    const expected = await hmac(password, secret);
    return token === expected;
  } catch {
    return false;
  }
}

// ── Staff token ──────────────────────────────────────────────────────
export async function createStaffToken(staffId: string, role: string): Promise<string> {
  const secret = process.env.ADMIN_SECRET ?? "";
  const payload = `${staffId}:${role}`;
  const sig = await hmac(payload, secret);
  return `staff:${payload}:${sig}`;
}

async function verifyStaffToken(token: string): Promise<{ id: string; role: string } | null> {
  if (!token.startsWith("staff:")) return null;
  const rest = token.slice(6); // remove "staff:"
  const lastColon = rest.lastIndexOf(":");
  if (lastColon === -1) return null;
  const payload = rest.slice(0, lastColon);
  const sig = rest.slice(lastColon + 1);
  const secret = process.env.ADMIN_SECRET ?? "";
  const expected = await hmac(payload, secret);
  if (sig !== expected) return null;
  const colonIdx = payload.indexOf(":");
  if (colonIdx === -1) return null;
  return { id: payload.slice(0, colonIdx), role: payload.slice(colonIdx + 1) };
}

// ── Resolve session from cookie value ───────────────────────────────
export async function resolveSession(token: string): Promise<AdminSession | null> {
  if (!token) return null;

  // Staff token
  if (token.startsWith("staff:")) {
    const verified = await verifyStaffToken(token);
    if (!verified) return null;
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("staff")
        .select("id, name, role, is_active")
        .eq("id", verified.id)
        .single();
      if (!data || !data.is_active) return null;
      return { type: "staff", role: data.role as AdminRole, name: data.name, id: data.id };
    } catch {
      return null;
    }
  }

  // Owner token (backwards compatible)
  const isOwner = await verifyOwnerToken(token);
  if (isOwner) return { type: "owner", role: "owner", name: "Owner" };

  return null;
}

// ── Permission helpers ───────────────────────────────────────────────
const ROLE_ROUTES: Record<string, AdminRole[]> = {
  "/admin/settings": ["owner"],
  "/admin/setup":    ["owner"],
  "/admin/staff":    ["owner"],
};

export function canAccessRoute(role: AdminRole, pathname: string): boolean {
  for (const [prefix, allowed] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix) && !allowed.includes(role)) return false;
  }
  return true;
}

export function canDo(role: AdminRole, action: "create" | "edit" | "delete"): boolean {
  if (role === "owner" || role === "manager") return true;
  return false; // collaborator: view only
}
