import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createOwnerToken, createStaffToken } from "@/lib/admin-auth";
import { getActivePassword, clearTempPassword } from "@/lib/admin-password";

const ROLE_BASE: Record<string, string> = {
  owner:        "/admin",
  manager:      "/manager",
  collaborator: "/collaborator",
  partner:      "/partner",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password, email } = body as { password?: string; email?: string };

  let token: string | null = null;
  let role = "owner";

  // ── Staff login ──────────────────────────────────────────────────
  if (email) {
    try {
      const supabase = createAdminClient();
      const { data: staff } = await supabase
        .from("staff")
        .select("id, role, password, is_active")
        .eq("email", email.toLowerCase())
        .single();

      if (!staff || !staff.is_active || staff.password !== password) {
        return NextResponse.json({ error: "Email hoặc mật khẩu không đúng." }, { status: 401 });
      }

      token = await createStaffToken(staff.id, staff.role);
      role = staff.role;

      // Ghi log đăng nhập
      createAdminClient()
        .from("activity_logs")
        .insert({ staff_id: staff.id, action_type: "login" })
        .then(() => {});
    } catch {
      return NextResponse.json({ error: "Lỗi hệ thống." }, { status: 500 });
    }
  } else {
    // ── Owner login ──────────────────────────────────────────────────
    const active = await getActivePassword();
    if (!active || password !== active.password) {
      return NextResponse.json({ error: "Sai mật khẩu." }, { status: 401 });
    }

    // Nếu đăng nhập bằng mật khẩu tạm → xóa temp sau khi đăng nhập thành công
    if (active.type === "temp") {
      await clearTempPassword();
    }

    token = await createOwnerToken();
    role = "owner";
  }

  const basePath = ROLE_BASE[role] ?? "/admin";
  const res = NextResponse.json({ ok: true, basePath });
  res.cookies.set("admin_token", token!, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin_token");
  return res;
}
