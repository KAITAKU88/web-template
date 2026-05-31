import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";

// Gọi bởi cron-job.org mỗi 5 phút — bảo vệ bằng CRON_SECRET
// Gửi email nhắc đơn bỏ rơi: pending > 15 phút, chưa gửi email, chưa quá 2 giờ
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const settings = await getSettings();

  const apiKey    = settings.resend_api_key  || process.env.RESEND_API_KEY || "";
  const fromName  = settings.resend_from_name  ?? settings.site_name ?? "TemplateLab";
  const fromEmail = settings.resend_from_email || process.env.RESEND_FROM?.match(/<(.+)>/)?.[1] || "";
  const siteName  = settings.site_name   ?? "TemplateLab";
  const brandColor = settings.brand_color ?? "#16a34a";
  const adminEmail = settings.admin_email || undefined;
  const zaloLink   = settings.zalo_link   || undefined;
  const siteUrl   = new URL(req.url).origin;

  if (!apiKey || !fromEmail) {
    return NextResponse.json({ skipped: true, reason: "Resend chưa cấu hình" });
  }

  const now = new Date();
  const from15min = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const from2hour = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

  // Lấy đơn pending: 15–120 phút trước, có email, chưa gửi abandoned cart email
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, customer_email, amount, product_id, created_at")
    .eq("status", "pending")
    .is("cart_email_sent_at", null)
    .not("customer_email", "is", null)
    .lt("created_at", from15min)
    .gt("created_at", from2hour)
    .limit(50);

  if (error) {
    console.error("abandoned-cart: query error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Lấy thông tin sản phẩm
  const productIds = [...new Set(orders.map((o) => o.product_id))];
  const { data: products } = await supabase
    .from("products")
    .select("id, name, type")
    .in("id", productIds);

  const productMap = Object.fromEntries(
    (products ?? []).map((p) => [p.id, p])
  );

  const resend = new Resend(apiKey);
  const from = `${fromName} <${fromEmail}>`;
  let sent = 0;
  const failed: string[] = [];

  for (const order of orders) {
    const product = productMap[order.product_id];
    if (!product) continue;

    const productUrl = `${siteUrl}/products/${order.product_id}`;

    const { error: emailError } = await resend.emails.send({
      from,
      to: order.customer_email,
      replyTo: adminEmail,
      subject: `Đơn hàng của bạn chưa hoàn tất — ${product.name}`,
      html: buildAbandonedCartHtml({
        orderId: order.id,
        productName: product.name,
        amount: order.amount,
        productUrl,
        siteName,
        brandColor,
        adminEmail,
        zaloLink,
      }),
    });

    if (emailError) {
      console.error("abandoned-cart email failed:", order.id, emailError);
      failed.push(order.id);
      continue;
    }

    // Đánh dấu đã gửi
    await supabase
      .from("orders")
      .update({ cart_email_sent_at: now.toISOString() })
      .eq("id", order.id);

    sent++;
  }

  return NextResponse.json({ sent, failed: failed.length, total: orders.length });
}

function buildAbandonedCartHtml(p: {
  orderId: string;
  productName: string;
  amount: number;
  productUrl: string;
  siteName: string;
  brandColor: string;
  adminEmail?: string;
  zaloLink?: string;
}) {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:${p.brandColor};padding:28px 32px;">
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,.7);letter-spacing:.5px;text-transform:uppercase;">${p.siteName}</p>
      <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700;">
        Bạn bỏ quên đơn hàng rồi! 🛒
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
        Bạn đã bắt đầu đặt mua <strong>${p.productName}</strong> nhưng chưa hoàn tất thanh toán.
        Template vẫn đang chờ bạn!
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${p.productUrl}"
           style="display:inline-block;background:${p.brandColor};color:#fff;text-decoration:none;
                  padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:.3px;">
          Hoàn tất đơn hàng →
        </a>
      </div>

      <!-- Order info -->
      <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151;">Chi tiết đơn hàng</p>
        <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse;">
          <tr>
            <td style="padding:4px 0;color:#6b7280;">Sản phẩm</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;">${p.productName}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6b7280;">Số tiền</td>
            <td style="padding:4px 0;text-align:right;font-weight:700;color:${p.brandColor};">${formatCurrency(p.amount)}</td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 16px;font-size:13px;color:#9ca3af;line-height:1.6;">
        Nếu bạn gặp vấn đề trong quá trình thanh toán, liên hệ chúng tôi để được hỗ trợ.<br>
        Nếu bạn đã đổi ý, không cần làm gì thêm.
      </p>

      ${(p.adminEmail || p.zaloLink) ? `
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        ${p.adminEmail ? `<a href="mailto:${p.adminEmail}" style="display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:8px 14px;font-size:13px;color:#374151;text-decoration:none;">
          <span>✉️</span> ${p.adminEmail}
        </a>` : ""}
        ${p.zaloLink ? `<a href="${p.zaloLink}" style="display:inline-flex;align-items:center;gap:6px;background:#0068ff;border-radius:8px;padding:8px 14px;font-size:13px;color:#fff;text-decoration:none;font-weight:600;">
          <span>💬</span> Nhắn Zalo
        </a>` : ""}
      </div>` : ""}
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        © ${p.siteName} · Cần hỗ trợ? Reply email này${p.adminEmail ? ` hoặc gửi đến ${p.adminEmail}` : ""}.
      </p>
    </div>
  </div>
</body>
</html>`;
}
