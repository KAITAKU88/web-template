import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateOrderId, buildVietQRUrl, buildPaymentDeepLink } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import type { CreateOrderRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderRequest = await req.json();
    const { product_id, customer_email, customer_phone, bump_product_id } = body;

    if (!product_id || !customer_email) {
      return NextResponse.json(
        { error: "Thiếu product_id hoặc customer_email." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Lấy thông tin sản phẩm chính
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, price, name")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Sản phẩm không tồn tại." }, { status: 404 });
    }

    // Tính giá bump từ DB (không tin giá từ client)
    let bump_amount: number | null = null;
    let resolvedBumpId: string | null = null;

    if (bump_product_id) {
      const { data: bumpProduct } = await supabase
        .from("products")
        .select("id, price")
        .eq("id", bump_product_id)
        .neq("id", product_id)
        .single();

      if (bumpProduct) {
        resolvedBumpId = bumpProduct.id;
        bump_amount = Math.round(bumpProduct.price / 2 / 1000) * 1000;
      }
    }

    const totalAmount = product.price + (bump_amount ?? 0);

    // Tạo đơn hàng
    const order_id = generateOrderId();
    const { error: insertError } = await supabase.from("orders").insert({
      id: order_id,
      customer_email: customer_email.toLowerCase().trim(),
      customer_phone: customer_phone?.trim() || null,
      product_id,
      amount: totalAmount,
      status: "pending",
      bump_product_id: resolvedBumpId,
      bump_amount,
    });

    if (insertError) {
      console.error("Insert order error:", insertError);
      return NextResponse.json(
        { error: "Không thể tạo đơn hàng. Vui lòng thử lại." },
        { status: 500 }
      );
    }

    // Tạo URL QR — đọc từ settings DB (ưu tiên) hoặc env var fallback
    const settings = await getSettings();
    const bankCode = settings.bank_code || process.env.BANK_CODE || "";
    const accountNumber = settings.bank_account_number || process.env.BANK_ACCOUNT_NUMBER || "";

    let qr_url = "";
    let payment_url = "";
    if (bankCode && accountNumber) {
      qr_url = buildVietQRUrl({
        bankCode,
        accountNumber,
        amount: totalAmount,
        description: order_id,
      });
      payment_url = buildPaymentDeepLink({
        bankCode,
        accountNumber,
        amount: totalAmount,
        description: order_id,
      });
    }

    return NextResponse.json({ order_id, amount: totalAmount, qr_url, payment_url });
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
