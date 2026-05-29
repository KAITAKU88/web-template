import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "MISSING";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "MISSING";

  let productCount = -1;
  let queryError = null;
  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    productCount = count ?? -1;
    queryError = error?.message ?? null;
  } catch (e) {
    queryError = String(e);
  }

  return NextResponse.json({
    url_prefix: url.slice(0, 35),
    key_prefix: key.slice(0, 25),
    productCount,
    queryError,
  });
}
