import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Tìm campaigns đã lên lịch và đến giờ gửi
  const { data: campaigns } = await supabase
    .from("email_campaigns")
    .select("id")
    .eq("status", "draft")
    .lte("scheduled_at", new Date().toISOString())
    .not("scheduled_at", "is", null);

  if (!campaigns?.length) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  // Gửi từng campaign qua API nội bộ
  const origin = new URL(req.url).origin;
  let processed = 0;

  for (const campaign of campaigns) {
    try {
      const res = await fetch(`${origin}/api/marketing/campaigns`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaign.id, action: "send" }),
      });
      if (res.ok) processed++;
    } catch (err) {
      console.error("Scheduled campaign send error:", campaign.id, err);
    }
  }

  return NextResponse.json({ ok: true, processed });
}
