import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

async function signToken(password: string, secret: string): Promise<string> {
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
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

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
  const { password } = await req.json();
  const correctPassword = await getAdminPassword();

  let isTempPassword = false;
  let valid = password && password === correctPassword;

  if (!valid) {
    // Kiểm tra mật khẩu tạm
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["admin_temp_password", "admin_temp_password_expiry"]);
      const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
      const tempPw = map["admin_temp_password"];
      const expiry = map["admin_temp_password_expiry"];
      if (tempPw && password === tempPw) {
        if (expiry && new Date() < new Date(expiry)) {
          valid = true;
          isTempPassword = true;
        }
      }
    } catch {}
  }

  if (!valid) {
    return NextResponse.json({ error: "Sai mật khẩu." }, { status: 401 });
  }

  // Xóa mật khẩu tạm sau khi đăng nhập thành công
  if (isTempPassword) {
    try {
      const supabase = createAdminClient();
      await supabase.from("settings").delete().in("key", ["admin_temp_password", "admin_temp_password_expiry"]);
    } catch {}
  }

  const token = await signToken(password, process.env.ADMIN_SECRET!);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin_token");
  return res;
}
