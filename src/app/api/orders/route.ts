import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateOrderId, buildVietQRUrl, buildPaymentDeepLink } from "@/lib/utils";
import { calcDiscountAmount } from "@/lib/discount";
import { getSettings } from "@/lib/settings";
import type { CreateOrderRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderRequest = await req.json();
    const { product_id, customer_email, customer_phone, bump_product_id, discount_code } = body as typeof body & { discount_code?: string };

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
      .select("id, price, name, status")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Sản phẩm không tồn tại." }, { status: 404 });
    }
    if (product.status === "draft") {
      return NextResponse.json({ error: "Sản phẩm không còn bán." }, { status: 400 });
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

    const subtotal = product.price + (bump_amount ?? 0);

    // Áp dụng mã giảm giá nếu có
    let discountCodeId: string | null = null;
    let discountAmount = 0;
    if (discount_code) {
      const { data: dc } = await supabase
        .from("discount_codes")
        .select("id, type, value, product_id, min_amount, max_uses, used_count, expires_at, is_active")
        .eq("code", discount_code.trim().toUpperCase())
        .single();

      if (dc && dc.is_active &&
          !(dc.expires_at && new Date(dc.expires_at) < new Date()) &&
          !(dc.max_uses !== null && dc.used_count >= dc.max_uses) &&
          !(dc.product_id && dc.product_id !== product_id) &&
          subtotal >= (dc.min_amount ?? 0)) {
        discountCodeId = dc.id;
        discountAmount = calcDiscountAmount({ type: dc.type, value: dc.value as number }, subtotal);
      }
    }

    const totalAmount = Math.max(subtotal - discountAmount, 1000);

    // Tạo đơn hàng
    const order_id = generateOrderId();
    const { error: insertError } = await supabase.from("orders").insert({
      id: order_id,
      customer_email: customer_email.toLowerCase().trim(),
      customer_phone: customer_phone?.trim() || null,
      product_id,
      amount: totalAmount,
      original_amount: discountAmount > 0 ? subtotal : null,
      discount_amount: discountAmount,
      discount_code_id: discountCodeId,
      status: "pending",
      bump_product_id: resolvedBumpId,
      bump_amount,
    });

    // Cộng used_count khi tạo đơn thành công (fire-and-forget)
    if (!insertError && discountCodeId) {
      void supabase.rpc("increment_discount_used", { p_id: discountCodeId });
    }

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
