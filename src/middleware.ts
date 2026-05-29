import { NextRequest, NextResponse } from "next/server";

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

// Role → base path
const ROLE_BASE: Record<string, string> = {
  owner:        "/admin",
  manager:      "/manager",
  collaborator: "/collaborator",
};

// Owner-only sub-paths (trong /admin/...)
const OWNER_ONLY_SUBPATHS = ["/admin/settings", "/admin/setup", "/admin/staff"];

async function verifyToken(token: string): Promise<{ role: string } | null> {
  const secret = process.env.ADMIN_SECRET ?? "";

  if (token.startsWith("staff:")) {
    const rest = token.slice(6);
    const lastColon = rest.lastIndexOf(":");
    if (lastColon === -1) return null;
    const payload = rest.slice(0, lastColon);
    const sig = rest.slice(lastColon + 1);
    const expected = await hmac(payload, secret);
    if (sig !== expected) return null;
    const role = payload.slice(payload.indexOf(":") + 1);
    return { role };
  }

  const expected = await hmac("owner", secret);
  if (token === expected) return { role: "owner" };
  return null;
}

const PUBLIC_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/staff-login",
  "/manager/login",
  "/collaborator/login",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Chỉ xử lý các path liên quan đến admin/manager/collaborator
  const isAdminPath        = pathname.startsWith("/admin");
  const isManagerPath      = pathname.startsWith("/manager");
  const isCollaboratorPath = pathname.startsWith("/collaborator");

  if (!isAdminPath && !isManagerPath && !isCollaboratorPath) {
    return NextResponse.next();
  }

  // Public paths không cần auth
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const token = req.cookies.get("admin_token")?.value ?? "";
  const session = await verifyToken(token);

  // Chưa đăng nhập → về login
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const role = session.role;
  const basePath = ROLE_BASE[role] ?? "/admin";

  // Nếu vào sai base path → redirect về đúng base path
  if (isAdminPath && !isManagerPath && !isCollaboratorPath && role !== "owner") {
    return NextResponse.redirect(new URL(basePath, req.url));
  }
  if (isManagerPath && role !== "manager") {
    return NextResponse.redirect(new URL(basePath, req.url));
  }
  if (isCollaboratorPath && role !== "collaborator") {
    return NextResponse.redirect(new URL(basePath, req.url));
  }

  // Owner-only sub-paths (chỉ owner mới vào /admin/settings, /admin/setup, /admin/staff)
  const isOwnerOnly = OWNER_ONLY_SUBPATHS.some((p) => pathname.startsWith(p));
  if (isOwnerOnly && role !== "owner") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // Truyền role qua request header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-admin-role", role);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/collaborator/:path*", "/manager/login", "/collaborator/login"],
};
