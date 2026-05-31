import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Tìm campaigns đã lên lịch và đến giờ gửi
  const { data: campaigns } = await supabase
    .from("email_campaigns")
    .select("id, name, subject, html_body, segment, target_group_id")
    .eq("status", "draft")
    .lte("scheduled_at", new Date().toISOString())
    .not("scheduled_at", "is", null);

  if (!campaigns?.length) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const settings = await getSettings();
  const apiKey    = settings.resend_api_key  || process.env.RESEND_API_KEY || "";
  const fromName  = settings.resend_from_name ?? settings.site_name ?? "TemplateLab";
  const fromEmail = settings.resend_from_email || process.env.RESEND_FROM?.match(/<(.+)>/)?.[1] || "";
  const adminEmail = settings.admin_email || undefined;
  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  if (!apiKey || !fromEmail) {
    return NextResponse.json({ error: "Resend chưa cấu hình" }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const from = `${fromName} <${fromEmail}>`;
  let processed = 0;

  for (const campaign of campaigns) {
    try {
      // Lấy danh sách email theo segment
      let uniqueEmails: string[] = [];
      if (campaign.target_group_id) {
        const { data: members } = await supabase
          .from("customer_group_members")
          .select("email")
          .eq("group_id", campaign.target_group_id);
        uniqueEmails = (members ?? []).map((m: { email: string }) => m.email);
      } else {
        let q = supabase.from("orders").select("customer_email").eq("status", "success");
        if (campaign.segment === "recent_30d") {
          q = q.gte("paid_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        } else if (campaign.segment?.startsWith("product:")) {
          q = q.eq("product_id", campaign.segment.replace("product:", ""));
        }
        const { data: orders } = await q;
        uniqueEmails = [...new Set((orders ?? []).map((o: { customer_email: string }) => o.customer_email))];
      }

      if (!uniqueEmails.length) {
        await supabase.from("email_campaigns").update({ status: "failed" }).eq("id", campaign.id);
        continue;
      }

      await supabase.from("email_campaigns").update({ status: "sending" }).eq("id", campaign.id);

      const html = (campaign.html_body ?? "").replace(/\{\{site_url\}\}/g, siteUrl);
      let sent = 0;

      for (let i = 0; i < uniqueEmails.length; i += 10) {
        const batch = uniqueEmails.slice(i, i + 10);
        await Promise.all(
          batch.map((email) =>
            resend.emails.send({ from, to: email, replyTo: adminEmail, subject: campaign.subject, html })
              .then(() => { sent++; })
              .catch((e) => console.error("Scheduled campaign email error:", email, e))
          )
        );
        if (i + 10 < uniqueEmails.length) await new Promise((r) => setTimeout(r, 300));
      }

      await supabase.from("email_campaigns").update({
        status: sent > 0 ? "sent" : "failed",
        sent_count: sent,
        sent_at: new Date().toISOString(),
      }).eq("id", campaign.id);

      processed++;
    } catch (err) {
      console.error("Scheduled campaign error:", campaign.id, err);
      await supabase.from("email_campaigns").update({ status: "failed" }).eq("id", campaign.id);
    }
  }

  return NextResponse.json({ ok: true, processed });
}
