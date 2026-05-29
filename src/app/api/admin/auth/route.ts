import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createOwnerToken, createStaffToken } from "@/lib/admin-auth";

async function getAdminPassword(): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "admin_password")
      .single();
    if (data?.value) return data.value as string;
  } catch {}
  return process.env.ADMIN_PASSWORD ?? "admin12345678";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password, email } = body as { password?: string; email?: string };

  let token: string | null = null;

  // ── Staff login (email + password) ──────────────────────────────
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
    } catch {
      return NextResponse.json({ error: "Lỗi hệ thống." }, { status: 500 });
    }
  } else {
    // ── Owner login (password only) ────────────────────────────────
    const correctPassword = await getAdminPassword();
    let valid = password && password === correctPassword;

    // Kiểm tra mật khẩu tạm
    if (!valid) {
      try {
        const supabase = createAdminClient();
        const { data } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["admin_temp_password", "admin_temp_password_expiry"]);
        const map = Object.fromEntries(
          (data ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
        );
        const tempPw = map["admin_temp_password"];
        const expiry = map["admin_temp_password_expiry"];
        if (tempPw && password === tempPw && expiry && new Date() < new Date(expiry)) {
          valid = true;
          // Xóa mật khẩu tạm
          const supabase2 = createAdminClient();
          await supabase2.from("settings").delete().in("key", ["admin_temp_password", "admin_temp_password_expiry"]);
        }
      } catch {}
    }

    if (!valid) {
      return NextResponse.json({ error: "Sai mật khẩu." }, { status: 401 });
    }

    token = await createOwnerToken(password!);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_token", token, {
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
