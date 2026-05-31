import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminRole } from "@/lib/get-role";

export async function GET() {
  const role = await getAdminRole();
  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*, product:products(name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const role = await getAdminRole();
  if (!role || role === "collaborator") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const supabase = createAdminClient();

  const { error, data } = await supabase.from("discount_codes").insert({
    code: (body.code as string).trim().toUpperCase(),
    type: body.type,
    value: Number(body.value),
    product_id: body.product_id || null,
    min_amount: Number(body.min_amount ?? 0),
    max_uses: body.max_uses ? Number(body.max_uses) : null,
    expires_at: body.expires_at || null,
    is_active: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const role = await getAdminRole();
  if (!role || role === "collaborator") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...body } = await req.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from("discount_codes").update(body).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const role = await getAdminRole();
  if (!role || role === "collaborator") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from("discount_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
