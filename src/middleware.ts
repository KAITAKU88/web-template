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

// Routes chỉ Owner được truy cập
const OWNER_ONLY = ["/admin/settings", "/admin/setup", "/admin/staff"];

async function verifyToken(token: string): Promise<{ role: string } | null> {
  const secret = process.env.ADMIN_SECRET ?? "";

  // Staff token
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

  // Owner token: HMAC("owner", secret)
  const expected = await hmac("owner", secret);
  if (token === expected) return { role: "owner" };

  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();
  if (pathname === "/admin/forgot-password") return NextResponse.next();

  const token = req.cookies.get("admin_token")?.value ?? "";
  const session = await verifyToken(token);

  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // Kiểm tra quyền truy cập route
  const isOwnerOnly = OWNER_ONLY.some((p) => pathname.startsWith(p));
  if (isOwnerOnly && session.role !== "owner") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // Truyền role qua header để server components đọc
  const res = NextResponse.next();
  res.headers.set("x-admin-role", session.role);
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
