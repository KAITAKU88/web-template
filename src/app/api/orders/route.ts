import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateOrderId, buildVietQRUrl } from "@/lib/utils";
import type { CreateOrderRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderRequest = await req.json();
    const { product_id, customer_email } = body;

    // Validate input
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

    // Lấy thông tin sản phẩm
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, price, name")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Sản phẩm không tồn tại." }, { status: 404 });
    }

    // Tạo order ID và đơn hàng
    const order_id = generateOrderId();
    const { error: insertError } = await supabase.from("orders").insert({
      id: order_id,
      customer_email,
      product_id,
      amount: product.price,
      status: "pending",
    });

    if (insertError) {
      console.error("Insert order error:", insertError);
      return NextResponse.json(
        { error: "Không thể tạo đơn hàng. Vui lòng thử lại." },
        { status: 500 }
      );
    }

    // Tạo URL QR
    const bankCode = process.env.BANK_CODE ?? "";
    const accountNumber = process.env.BANK_ACCOUNT_NUMBER ?? "";

    let qr_url = "";
    if (bankCode && accountNumber) {
      qr_url = buildVietQRUrl({
        bankCode,
        accountNumber,
        amount: product.price,
        description: order_id,
      });
    }

    return NextResponse.json({ order_id, amount: product.price, qr_url });
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
