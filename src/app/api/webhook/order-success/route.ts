import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";

interface SupabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: {
    id: string;
    customer_email: string;
    customer_phone: string | null;
    product_id: string;
    bump_product_id: string | null;
    amount: number;
    status: string;
    paid_at: string | null;
    created_at: string;
  };
  old_record: { status: string };
}

export async function POST(req: NextRequest) {
  // Đọc settings 1 lần — dùng cho cả xác thực webhook lẫn gửi email
  // Ưu tiên settings DB (cấu hình qua Dashboard), fallback về env var
  const [settings, payload] = await Promise.all([
    getSettings(),
    req.json() as Promise<SupabaseWebhookPayload>,
  ]);

  const incomingSecret = req.headers.get("x-webhook-secret");
  const expectedSecret = settings.supabase_webhook_secret || process.env.SUPABASE_WEBHOOK_SECRET;
  if (incomingSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    payload.type !== "UPDATE" ||
    payload.record.status !== "success" ||
    payload.old_record.status === "success"
  ) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const order = payload.record;
  const supabase = createAdminClient();

  const productIds = [order.product_id, order.bump_product_id].filter(Boolean) as string[];
  const { data: products } = await supabase
    .from("products")
    .select("id, name, template_link, type")
    .in("id", productIds);

  type ProductRow = { id: string; name: string; template_link: string; type: string | null };
  const mainProduct = (products as ProductRow[] | null)?.find((p) => p.id === order.product_id);
  const bumpProduct = order.bump_product_id
    ? (products as ProductRow[] | null)?.find((p) => p.id === order.bump_product_id)
    : null;

  if (!mainProduct) {
    console.error("order-success webhook: product not found", order.id);
    return NextResponse.json({ error: "Product not found" }, { status: 500 });
  }

  // settings đã được đọc ở đầu hàm (dùng chung)
  const siteName   = settings.site_name   ?? "TemplateLab";
  const brandColor = settings.brand_color ?? "#16a34a";
  const apiKey     = settings.resend_api_key  || process.env.RESEND_API_KEY || "";
  const fromName   = settings.resend_from_name  ?? siteName;
  const fromEmail  = settings.resend_from_email || process.env.RESEND_FROM?.match(/<(.+)>/)?.[1] || "no-reply@example.com";
  const from       = `${fromName} <${fromEmail}>`;

  const paidAt = order.paid_at
    ? new Date(order.paid_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: order.customer_email,
    subject: `✅ Đơn hàng ${order.id} đã được xác nhận – ${siteName}`,
    html: buildEmailHtml({ order, mainProduct, bumpProduct, paidAt, siteName, brandColor }),
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function buildEmailHtml(params: {
  order: SupabaseWebhookPayload["record"];
  mainProduct: { name: string; template_link: string; type: string | null };
  bumpProduct: { name: string; template_link: string; type: string | null } | null | undefined;
  paidAt: string;
  siteName: string;
  brandColor: string;
}) {
  const { order, mainProduct, bumpProduct, paidAt, siteName, brandColor } = params;

  const typeLabel = (type: string | null) =>
    type === "google_sheet" ? "Google Sheets" : "Notion";

  const templateButton = (name: string, link: string, type: string | null) => `
    <div style="margin-bottom:12px;">
      <p style="margin:0 0 6px;font-size:14px;color:#374151;font-weight:600;">${name}
        <span style="font-size:12px;font-weight:400;color:#6b7280;">(${typeLabel(type)})</span>
      </p>
      <a href="${link}"
         style="display:inline-block;background:${brandColor};color:#fff;text-decoration:none;
                padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;">
        Truy cập template →
      </a>
    </div>`;

  // Màu nhạt cho background box (10% opacity giả lập bằng hex)
  const lightBg = "#f0fdf4";
  const lightBorder = "#bbf7d0";

  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:${brandColor};padding:28px 32px;">
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,.7);letter-spacing:.5px;text-transform:uppercase;">${siteName}</p>
      <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700;">
        ✅ Thanh toán thành công!
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#374151;">
        Xin chào,<br>
        Đơn hàng của bạn đã được xác nhận. Dưới đây là link truy cập template:
      </p>

      <!-- Template links -->
      <div style="background:${lightBg};border:1px solid ${lightBorder};border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.5px;">
          Template của bạn
        </p>
        ${templateButton(mainProduct.name, mainProduct.template_link, mainProduct.type)}
        ${bumpProduct ? templateButton(bumpProduct.name, bumpProduct.template_link, bumpProduct.type) : ""}
      </div>

      <!-- Order info -->
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Mã đơn hàng</td>
          <td style="padding:8px 0;text-align:right;font-family:monospace;font-weight:600;border-bottom:1px solid #f3f4f6;">${order.id}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Số tiền</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;color:${brandColor};border-bottom:1px solid #f3f4f6;">${formatCurrency(order.amount)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Email</td>
          <td style="padding:8px 0;text-align:right;border-bottom:1px solid #f3f4f6;">${order.customer_email}</td>
        </tr>
        ${order.customer_phone ? `
        <tr>
          <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Số điện thoại</td>
          <td style="padding:8px 0;text-align:right;border-bottom:1px solid #f3f4f6;">${order.customer_phone}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Thời điểm thanh toán</td>
          <td style="padding:8px 0;text-align:right;">${paidAt}</td>
        </tr>
      </table>

      <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.6;">
        Link template dùng được vĩnh viễn — chỉ cần Duplicate 1 lần vào tài khoản của bạn.<br>
        Nếu cần hỗ trợ, hãy liên hệ qua trang web.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        © ${siteName} · Email này được gửi tự động, vui lòng không reply trực tiếp.
      </p>
    </div>
  </div>
</body>
</html>`;
}
