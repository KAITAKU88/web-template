import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("download_tokens")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Link không hợp lệ</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:80px 20px">
        <h1 style="color:#ef4444">❌ Link không hợp lệ</h1>
        <p>Link này không tồn tại hoặc đã bị xóa.</p>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  // Kiểm tra hết hạn
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Link đã hết hạn</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:80px 20px">
        <h1 style="color:#f59e0b">⏰ Link đã hết hạn</h1>
        <p>Link tải này đã hết hạn vào <strong>${new Date(data.expires_at).toLocaleString("vi-VN")}</strong>.</p>
        <p style="color:#6b7280;font-size:14px">Vui lòng liên hệ hỗ trợ nếu bạn cần trợ giúp.</p>
      </body></html>`,
      { status: 410, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  // Kiểm tra giới hạn truy cập
  if (data.max_accesses > 0 && data.access_count >= data.max_accesses) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Link đã hết lượt</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:80px 20px">
        <h1 style="color:#f59e0b">🚫 Link đã hết lượt truy cập</h1>
        <p>Link này đã được sử dụng tối đa <strong>${data.max_accesses} lần</strong>.</p>
        <p style="color:#6b7280;font-size:14px">Vui lòng liên hệ hỗ trợ nếu bạn cần trợ giúp.</p>
      </body></html>`,
      { status: 410, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  // Tăng access_count
  await supabase
    .from("download_tokens")
    .update({ access_count: data.access_count + 1 })
    .eq("id", data.id);

  // Redirect tới link gốc
  return NextResponse.redirect(data.template_link, { status: 302 });
}
