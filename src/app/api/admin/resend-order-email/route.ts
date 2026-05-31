import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { getAdminRole } from "@/lib/get-role";
import { formatCurrency } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const role = await getAdminRole();
  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orderId = new URL(req.url).searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "Thiếu orderId" }, { status: 400 });

  const supabase = createAdminClient();
  const settings = await getSettings();

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_email, amount, paid_at, product_id, bump_product_id")
    .eq("id", orderId)
    .eq("status", "success")
    .single();

  if (!order) return NextResponse.json({ error: "Đơn hàng không tồn tại hoặc chưa thanh toán" }, { status: 404 });

  const productIds = [order.product_id, order.bump_product_id].filter(Boolean) as string[];
  const { data: products } = await supabase
    .from("products")
    .select("id, name, template_link, type")
    .in("id", productIds);

  type P = { id: string; name: string; template_link: string; type: string | null };
  const mainProduct = (products as P[] | null)?.find((p) => p.id === order.product_id);
  const bumpProduct = order.bump_product_id
    ? (products as P[] | null)?.find((p) => p.id === order.bump_product_id)
    : null;

  if (!mainProduct) return NextResponse.json({ error: "Sản phẩm không tồn tại" }, { status: 404 });

  const apiKey    = settings.resend_api_key  || process.env.RESEND_API_KEY || "";
  const fromName  = settings.resend_from_name  ?? settings.site_name ?? "TemplateLab";
  const fromEmail = settings.resend_from_email || "no-reply@example.com";
  const adminEmail = settings.admin_email || undefined;
  const zaloLink   = settings.zalo_link   || undefined;
  const siteName  = settings.site_name   ?? "TemplateLab";
  const brandColor = settings.brand_color ?? "#16a34a";

  if (!apiKey || !fromEmail) {
    return NextResponse.json({ error: "Resend chưa cấu hình" }, { status: 400 });
  }

  const paidAt = order.paid_at
    ? new Date(order.paid_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : "—";

  const typeLabel = (type: string | null) => type === "google_sheet" ? "Google Sheets" : "Notion";
  const templateButton = (name: string, link: string, type: string | null) => `
    <div style="margin-bottom:12px;">
      <p style="margin:0 0 6px;font-size:14px;color:#374151;font-weight:600;">${name}
        <span style="font-size:12px;font-weight:400;color:#6b7280;">(${typeLabel(type)})</span>
      </p>
      <a href="${link}" style="display:inline-block;background:${brandColor};color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;">
        Truy cập template →
      </a>
    </div>`;

  const contactBlock = (adminEmail || zaloLink) ? `
    <div style="margin-top:20px;padding:16px 20px;background:#f9fafb;border-radius:12px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#374151;">Cần hỗ trợ?</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        ${adminEmail ? `<a href="mailto:${adminEmail}" style="display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:8px 14px;font-size:13px;color:#374151;text-decoration:none;"><span>✉️</span> ${adminEmail}</a>` : ""}
        ${zaloLink ? `<a href="${zaloLink}" style="display:inline-flex;align-items:center;gap:6px;background:#0068ff;border-radius:8px;padding:8px 14px;font-size:13px;color:#fff;text-decoration:none;font-weight:600;"><span>💬</span> Nhắn Zalo</a>` : ""}
      </div>
    </div>` : "";

  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
    <div style="background:${brandColor};padding:28px 32px;">
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,.7);">${siteName}</p>
      <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700;">✅ Thông tin template của bạn</h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#374151;">Xin chào,<br>Dưới đây là link truy cập template bạn đã mua:</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
        ${templateButton(mainProduct.name, mainProduct.template_link, mainProduct.type)}
        ${bumpProduct ? templateButton(bumpProduct.name, bumpProduct.template_link, bumpProduct.type) : ""}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
        <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Mã đơn hàng</td>
            <td style="padding:8px 0;text-align:right;font-family:monospace;font-weight:600;border-bottom:1px solid #f3f4f6;">${order.id}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Số tiền</td>
            <td style="padding:8px 0;text-align:right;font-weight:700;color:${brandColor};border-bottom:1px solid #f3f4f6;">${formatCurrency(order.amount)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Thời gian</td>
            <td style="padding:8px 0;text-align:right;">${paidAt}</td></tr>
      </table>
      ${contactBlock}
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">© ${siteName} · Gửi lại theo yêu cầu</p>
    </div>
  </div>
</body></html>`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: order.customer_email,
    replyTo: adminEmail,
    subject: `[Gửi lại] Template của đơn hàng ${order.id} – ${siteName}`,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Gửi email thất bại" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
