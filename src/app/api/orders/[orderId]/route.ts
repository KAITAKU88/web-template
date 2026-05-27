import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ orderId: string }>;
}

async function doCancelOrder(orderId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("status", "pending"); // chỉ hủy đơn đang chờ
  if (error) console.error("Cancel order error:", error);
}

// PATCH: dùng cho nút "Xác nhận hủy đơn"
export async function PATCH(_req: NextRequest, { params }: Props) {
  try {
    const { orderId } = await params;
    if (!orderId) return NextResponse.json({ error: "Thiếu orderId." }, { status: 400 });
    await doCancelOrder(orderId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

// POST: dùng cho navigator.sendBeacon (F5 / đóng tab)
export async function POST(_req: NextRequest, { params }: Props) {
  try {
    const { orderId } = await params;
    if (!orderId) return NextResponse.json({ error: "Thiếu orderId." }, { status: 400 });
    await doCancelOrder(orderId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
