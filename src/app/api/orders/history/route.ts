import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ error: "Thiếu email." }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, products!orders_product_id_fkey(name)")
    .eq("customer_email", email)
    .eq("status", "success")
    .order("paid_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [] });
}
