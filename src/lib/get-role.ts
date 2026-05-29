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

export async function getAdminRole(): Promise<AdminRole> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value ?? "";

    if (!token) return "owner";

    if (token.startsWith("staff:")) {
      const rest = token.slice(6);
      const lastColon = rest.lastIndexOf(":");
      if (lastColon === -1) return "owner";
      const payload = rest.slice(0, lastColon);
      const sig = rest.slice(lastColon + 1);
      const secret = process.env.ADMIN_SECRET ?? "";
      const expected = await hmac(payload, secret);
      if (sig !== expected) return "owner";
      const role = payload.slice(payload.indexOf(":") + 1);
      if (role === "manager" || role === "collaborator") return role;
    }
  } catch {}

  return "owner";
}
