import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import type { SepayWebhookPayload } from "@/types";

/**
 * SePay Webhook Handler
 *
 * SePay gọi POST đến endpoint này mỗi khi có biến động số dư.
 * Docs: https://docs.sepay.vn/webhook.html
 *
 * Cấu hình trong SePay Dashboard:
 *   URL: https://<your-domain>/api/webhook/sepay
 *   Secret: trùng với SEPAY_WEBHOOK_SECRET trong .env.local
 */
export async function POST(req: NextRequest) {
  try {
    // Xác thực secret header (SePay gửi trong header Authorization)
    // Ưu tiên đọc từ DB settings (cấu hình qua Dashboard), fallback về env var
    const settings = await getSettings();
    const secret = settings.sepay_webhook_secret || process.env.SEPAY_WEBHOOK_SECRET || null;
    if (secret) {
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.replace("Apikey ", "").trim();
      if (token !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload: SepayWebhookPayload = await req.json();

    // Chỉ xử lý giao dịch tiền vào
    if (payload.transferType !== "in") {
      return NextResponse.json({ success: true, skipped: true });
    }

    // Tìm order_id trong nội dung chuyển khoản
    // SePay trả về referenceCode hoặc description chứa order_id
    const description = (payload.description ?? "").toUpperCase();
    const referenceCode = (payload.referenceCode ?? "").toUpperCase();

    // Order ID có format TML + 8 hex chars
    const orderIdRegex = /TML[0-9A-F]{8}/;
    const matchDesc = description.match(orderIdRegex);
    const matchRef = referenceCode.match(orderIdRegex);
    const orderId = matchDesc?.[0] ?? matchRef?.[0];

    if (!orderId) {
      // Giao dịch không liên quan đến hệ thống
      return NextResponse.json({ success: true, skipped: true });
    }

    const supabase = createAdminClient();

    // Lấy đơn hàng
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, amount, status, customer_email, product_id")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Bỏ qua nếu đã xử lý
    if (order.status !== "pending") {
      return NextResponse.json({ success: true, skipped: true });
    }

    // Kiểm tra số tiền (cho phép sai lệch 1000đ do phí)
    if (Math.abs(payload.transferAmount - order.amount) > 1000) {
      console.warn(
        `Order ${orderId}: amount mismatch — expected ${order.amount}, got ${payload.transferAmount}`
      );
      return NextResponse.json({ error: "Amount mismatch" }, { status: 422 });
    }

    // Cập nhật order thành công
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "success",
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "pending"); // optimistic lock

    if (updateError) {
      console.error("Update order error:", updateError);
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    // Tăng lượt tải của sản phẩm (atomic, fire-and-forget)
    await supabase.rpc("increment_download_count", {
      p_product_id: order.product_id,
    }).catch(() => {});

    // Cập nhật/upsert bảng customers để phục vụ remarketing
    await supabase.rpc("upsert_customer_on_order", {
      p_email: order.customer_email,
    }).catch(() => {
      // Bỏ qua lỗi nếu function chưa tồn tại
    });

    console.log(`✅ Order ${orderId} confirmed — ${payload.transferAmount}đ from ${order.customer_email}`);

    return NextResponse.json({ success: true, order_id: orderId });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
