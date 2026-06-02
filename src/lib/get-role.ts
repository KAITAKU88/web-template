import { cookies } from "next/headers";
import type { AdminRole } from "./admin-auth";

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

interface AdminSession {
  role: AdminRole;
  staffId: string | null; // null khi là owner
}

async function parseToken(raw: string): Promise<AdminSession> {
  try {
    let token = raw;
    try { if (raw) token = decodeURIComponent(raw); } catch { token = raw; }

    if (!token) return { role: "owner", staffId: null };

    if (token.startsWith("staff:")) {
      const rest = token.slice(6);
      const lastColon = rest.lastIndexOf(":");
      if (lastColon === -1) return { role: "owner", staffId: null };
      const payload = rest.slice(0, lastColon);
      const sig = rest.slice(lastColon + 1);
      const secret = process.env.ADMIN_SECRET ?? "";
      const expected = await hmac(payload, secret);
      if (sig !== expected) return { role: "owner", staffId: null };
      const colonIdx = payload.indexOf(":");
      const staffId = payload.slice(0, colonIdx);
      const role = payload.slice(colonIdx + 1) as AdminRole;
      const validRoles: AdminRole[] = ["manager", "collaborator", "partner"];
      if (validRoles.includes(role)) return { role, staffId };
    }
  } catch { /* fall through */ }

  return { role: "owner", staffId: null };
}

export async function getAdminRole(): Promise<AdminRole> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("admin_token")?.value ?? "";
  const { role } = await parseToken(raw);
  return role;
}

export async function getAdminSession(): Promise<AdminSession> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("admin_token")?.value ?? "";
  return parseToken(raw);
}
