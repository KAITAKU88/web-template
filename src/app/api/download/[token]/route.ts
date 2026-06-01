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
  const newCount = data.access_count + 1;
  await supabase
    .from("download_tokens")
    .update({ access_count: newCount })
    .eq("id", data.id);

  const remaining = data.max_accesses > 0 ? data.max_accesses - newCount : null;

  // Nếu có giới hạn lượt: hiện trang cảnh báo + auto-redirect 5s
  if (remaining !== null) {
    const isLow = remaining <= 1;
    const warningHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Truy cập template</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#1e293b;border:1px solid #334155;border-radius:20px;padding:40px 32px;max-width:420px;width:100%;text-align:center;box-shadow:0 25px 50px rgba(0,0,0,.4)}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:20px;font-weight:700;margin-bottom:10px;color:#f8fafc}
    .badge{display:inline-block;padding:6px 16px;border-radius:999px;font-size:14px;font-weight:700;margin-bottom:20px}
    .badge-warn{background:#fef3c7;color:#92400e}
    .badge-ok{background:#dcfce7;color:#14532d}
    p{font-size:14px;color:#94a3b8;line-height:1.6;margin-bottom:24px}
    .btn{display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;transition:background .2s}
    .btn:hover{background:#15803d}
    .note{margin-top:16px;font-size:12px;color:#475569}
  </style>
  <meta http-equiv="refresh" content="5;url=${data.template_link}">
</head>
<body>
  <div class="card">
    <div class="icon">${isLow ? "⚠️" : "✅"}</div>
    <h1>Sắp chuyển đến template của bạn</h1>
    <div class="badge ${isLow ? "badge-warn" : "badge-ok"}">
      ${remaining === 0 ? "Đây là lượt truy cập cuối cùng" : `Còn ${remaining} lượt truy cập`}
    </div>
    <p>${isLow
      ? `⚠️ <strong style="color:#fbbf24">Lưu ý:</strong> Link này ${remaining === 0 ? "không còn lượt nào sau lần này" : `chỉ còn <strong style="color:#fbbf24">${remaining} lượt</strong> nữa`}. Vui lòng <strong>không chia sẻ link</strong> này.`
      : `Link của bạn còn <strong style="color:#4ade80">${remaining} lượt</strong> truy cập. Hãy Duplicate template vào tài khoản của bạn ngay sau khi mở.`
    }</p>
    <a href="${data.template_link}" class="btn">Mở template ngay →</a>
    <p class="note">Tự động chuyển hướng sau 5 giây…</p>
  </div>
</body>
</html>`;
    return new NextResponse(warningHtml, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Không giới hạn lượt — redirect thẳng
  return NextResponse.redirect(data.template_link, { status: 302 });
}
