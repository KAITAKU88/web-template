import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateOrderId, buildVietQRUrl, buildPaymentDeepLink } from "@/lib/utils";
import { getSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  try {
    const { product_ids, customer_email, customer_phone } = await req.json();

    if (!Array.isArray(product_ids) || product_ids.length === 0 || !customer_email) {
      return NextResponse.json({ error: "Thiếu thông tin." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Lấy giá từ DB — không tin số từ client
    const { data: products } = await supabase
      .from("products")
      .select("id, price")
      .in("id", product_ids);

    if (!products?.length) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
    }

    // Giá bundle = 50% tổng giá lẻ, làm tròn 1.000đ
    const originalTotal = products.reduce((s: number, p: { id: string; price: number }) => s + p.price, 0);
    const bundleAmount  = Math.round(originalTotal * 0.5 / 1000) * 1000;

    const order_id = generateOrderId();
    const { error: insertError } = await supabase.from("orders").insert({
      id: order_id,
      customer_email: customer_email.toLowerCase().trim(),
      customer_phone: customer_phone?.trim() || null,
      product_id: products[0].id, // product chính của bundle
      amount: bundleAmount,
      status: "pending",
    });

    if (insertError) {
      console.error("Insert bundle order error:", insertError);
      return NextResponse.json({ error: "Không thể tạo đơn hàng." }, { status: 500 });
    }

    const settings = await getSettings();
    const bankCode      = settings.bank_code || process.env.BANK_CODE || "";
    const accountNumber = settings.bank_account_number || process.env.BANK_ACCOUNT_NUMBER || "";

    let qr_url = "", payment_url = "";
    if (bankCode && accountNumber) {
      const params = { bankCode, accountNumber, amount: bundleAmount, description: order_id };
      qr_url      = buildVietQRUrl(params);
      payment_url = buildPaymentDeepLink(params);
    }

    return NextResponse.json({ order_id, amount: bundleAmount, qr_url, payment_url });
  } catch (err) {
    console.error("Bundle order error:", err);
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
