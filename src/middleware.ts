import { NextRequest, NextResponse } from "next/server";

async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.ADMIN_SECRET;
    const password = process.env.ADMIN_PASSWORD;
    if (!secret || !password) return false;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(password)
    );
    const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return token === expected;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
