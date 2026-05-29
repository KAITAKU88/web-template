import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { getSettings } from "@/lib/settings";

function randomPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => chars[b % chars.length])
    .join("");
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Thiếu email." }, { status: 400 });

  const settings = await getSettings();
  const adminEmail = settings.admin_email;

  if (!adminEmail) {
    return NextResponse.json(
      { error: "Chưa cấu hình email admin. Vui lòng liên hệ để khôi phục thủ công." },
      { status: 400 }
    );
  }

  if (email.toLowerCase() !== adminEmail.toLowerCase()) {
    return NextResponse.json({ error: "Sai địa chỉ email admin." }, { status: 400 });
  }

  const tempPassword = randomPassword();
  const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const supabase = createAdminClient();
  await supabase.from("settings").upsert([
    { key: "admin_temp_password", value: tempPassword, updated_at: new Date().toISOString() },
    { key: "admin_temp_password_expiry", value: expiry, updated_at: new Date().toISOString() },
  ]);

  // Gửi email
  const apiKey = settings.resend_api_key || process.env.RESEND_API_KEY || "";
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email chưa được cấu hình. Vui lòng liên hệ quản trị viên để khôi phục thủ công." },
      { status: 400 }
    );
  }

  const fromName = settings.resend_from_name ?? settings.site_name ?? "Admin";
  const fromEmail = settings.resend_from_email ?? "onboarding@resend.dev";
  const siteName = settings.site_name ?? "Admin";

  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: adminEmail,
    subject: `[${siteName}] Mật khẩu tạm thời`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="margin:0 0 16px;color:#111827;">Mật khẩu tạm thời</h2>
        <p style="color:#4b5563;">Bạn vừa yêu cầu khôi phục mật khẩu admin. Dưới đây là mật khẩu tạm thời:</p>
        <div style="margin:24px 0;padding:20px;background:#fff;border:2px dashed #10b981;border-radius:10px;text-align:center;">
          <span style="font-family:monospace;font-size:28px;font-weight:bold;letter-spacing:4px;color:#059669;">${tempPassword}</span>
        </div>
        <p style="color:#6b7280;font-size:14px;">⏰ Mật khẩu này hết hạn sau <strong>15 phút</strong>.<br>Sau khi đăng nhập, hãy đổi ngay sang mật khẩu mới trong phần <strong>Cấu hình</strong>.</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>
      </div>
    `,
  });

  if (sendError) {
    console.error("Resend error:", sendError);
    return NextResponse.json(
      { error: `Gửi email thất bại: ${sendError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
