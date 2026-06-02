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
  partner:      "/partner",
};


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
  "/partner/login",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Chỉ xử lý các path liên quan đến admin/manager/collaborator
  const isAdminPath        = pathname.startsWith("/admin");
  const isManagerPath      = pathname.startsWith("/manager");
  const isCollaboratorPath = pathname.startsWith("/collaborator");
  const isPartnerPath      = pathname.startsWith("/partner");

  if (!isAdminPath && !isManagerPath && !isCollaboratorPath && !isPartnerPath) {
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

  // Nếu vào sai base path → redirect về đúng path tương đương
  if (isAdminPath && !isManagerPath && !isCollaboratorPath && role !== "owner") {
    // Manager/Collaborator truy cập /admin/xxx → redirect sang /manager/xxx hoặc /collaborator/xxx
    const equivalent = pathname.replace("/admin", basePath);
    return NextResponse.redirect(new URL(equivalent, req.url));
  }
  if (isManagerPath && role !== "manager") {
    const equivalent = pathname.replace("/manager", basePath);
    return NextResponse.redirect(new URL(equivalent, req.url));
  }
  if (isCollaboratorPath && role !== "collaborator") {
    const equivalent = pathname.replace("/collaborator", basePath);
    return NextResponse.redirect(new URL(equivalent, req.url));
  }
  if (isPartnerPath && role !== "partner") {
    const equivalent = pathname.replace("/partner", basePath);
    return NextResponse.redirect(new URL(equivalent, req.url));
  }

  // Owner-only pages — check theo sub-path (bỏ prefix role)
  const OWNER_ONLY_PAGES = ["/settings", "/setup", "/staff"];
  const subPath = pathname.replace(/^\/(admin|manager|collaborator|partner)/, "");
  if (OWNER_ONLY_PAGES.some((p) => subPath.startsWith(p)) && role !== "owner") {
    return NextResponse.redirect(new URL(basePath, req.url));
  }

  // Partner chỉ được xem Tổng quan, Sản phẩm, Đơn hàng, Thư viện ảnh
  const PARTNER_ALLOWED = ["/", "/products", "/orders"];
  if (role === "partner") {
    const cleanPath = subPath || "/"; // "/partner" → subPath="" → treat as "/"
    if (!PARTNER_ALLOWED.some((p) => cleanPath === p || cleanPath.startsWith(p + "/"))) {
      return NextResponse.redirect(new URL(basePath, req.url));
    }
  }

  // Collaborator chỉ được xem, không được thêm/sửa
  const WRITE_PAGES = ["/products/new", "/products/", "/categories"];
  if (role === "collaborator" && WRITE_PAGES.some((p) => subPath.startsWith(p))) {
    if (subPath.includes("/new") || subPath.includes("/edit")) {
      return NextResponse.redirect(new URL(basePath, req.url));
    }
  }

  // Truyền role và staffId qua request header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-admin-role", role);

  // Lấy staffId từ token để filter data theo partner
  if (role === "partner" || role === "manager" || role === "collaborator") {
    const token = req.cookies.get("admin_token")?.value ?? "";
    if (token.startsWith("staff:")) {
      const rest = token.slice(6);
      const lastColon = rest.lastIndexOf(":");
      if (lastColon > -1) {
        const payload = rest.slice(0, lastColon);
        const staffId = payload.slice(0, payload.indexOf(":"));
        if (staffId) requestHeaders.set("x-staff-id", staffId);
      }
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/collaborator/:path*", "/partner/:path*", "/manager/login", "/collaborator/login", "/partner/login"],
};
