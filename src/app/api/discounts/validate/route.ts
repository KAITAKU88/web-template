import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { calcDiscountAmount } from "@/lib/discount";

export async function POST(req: NextRequest) {
  const { code, product_id, amount } = await req.json() as {
    code: string; product_id?: string; amount: number;
  };

  if (!code?.trim()) return NextResponse.json({ error: "Thiếu mã giảm giá" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: dc, error: dbError } = await supabase
    .from("discount_codes")
    .select("id, code, type, value, product_id, min_amount, max_uses, used_count, expires_at, is_active")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();

  if (dbError) {
    console.error("[discounts/validate]", dbError.message);
    return NextResponse.json({ error: "Không thể kiểm tra mã giảm giá" }, { status: 500 });
  }
  if (!dc || !dc.is_active) {
    return NextResponse.json({ error: "Mã giảm giá không hợp lệ hoặc đã hết hiệu lực" }, { status: 400 });
  }
  if (dc.expires_at && new Date(dc.expires_at) < new Date()) {
    return NextResponse.json({ error: "Mã giảm giá đã hết hạn" }, { status: 400 });
  }
  if (dc.max_uses !== null && dc.used_count >= dc.max_uses) {
    return NextResponse.json({ error: "Mã giảm giá đã hết lượt sử dụng" }, { status: 400 });
  }
  if (dc.product_id && product_id && dc.product_id !== product_id) {
    return NextResponse.json({ error: "Mã giảm giá không áp dụng cho sản phẩm này" }, { status: 400 });
  }
  if (amount < (dc.min_amount ?? 0)) {
    return NextResponse.json({ error: `Đơn hàng tối thiểu ${dc.min_amount?.toLocaleString("vi-VN")}đ` }, { status: 400 });
  }

  const discountAmount = calcDiscountAmount({ type: dc.type, value: dc.value as number }, amount);

  return NextResponse.json({
    id: dc.id,
    code: dc.code,
    type: dc.type,
    value: dc.value,
    discount_amount: discountAmount,
    final_amount: amount - discountAmount,
  });
}
