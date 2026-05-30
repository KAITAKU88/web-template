import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { getAdminRole } from "@/lib/get-role";

export async function POST(req: NextRequest) {
  const role = await getAdminRole();
  if (!role || role === "collaborator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, subject, html_body, segment, action } = body as {
    name: string; subject: string; html_body: string; segment: string; action: "save" | "send";
  };

  if (!name?.trim() || !subject?.trim() || !html_body?.trim()) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Lưu nháp trước
  const { data: campaign, error: insertError } = await supabase
    .from("email_campaigns")
    .insert({ name: name.trim(), subject: subject.trim(), html_body, segment, status: "draft" })
    .select("id")
    .single();

  if (insertError || !campaign) {
    return NextResponse.json({ error: insertError?.message ?? "DB error" }, { status: 500 });
  }

  if (action !== "send") {
    return NextResponse.json({ id: campaign.id, status: "draft" });
  }

  // Gửi campaign
  return sendCampaign(campaign.id, req);
}

export async function PUT(req: NextRequest) {
  const role = await getAdminRole();
  if (!role || role === "collaborator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, name, subject, html_body, segment, action } = body as {
    id: string; name: string; subject: string; html_body: string; segment: string; action: "save" | "send";
  };

  if (!id) return NextResponse.json({ error: "Campaign ID bắt buộc." }, { status: 400 });

  const supabase = createAdminClient();
  await supabase.from("email_campaigns")
    .update({ name: name.trim(), subject: subject.trim(), html_body, segment })
    .eq("id", id).eq("status", "draft");

  if (action !== "send") {
    return NextResponse.json({ id, status: "draft" });
  }

  return sendCampaign(id, req);
}

async function sendCampaign(campaignId: string, req: NextRequest) {
  const supabase = createAdminClient();
  const settings = await getSettings();

  const apiKey    = settings.resend_api_key  || process.env.RESEND_API_KEY || "";
  const fromName  = settings.resend_from_name  ?? settings.site_name ?? "TemplateLab";
  const fromEmail = settings.resend_from_email || process.env.RESEND_FROM?.match(/<(.+)>/)?.[1] || "";
  const siteUrl   = new URL(req.url).origin;

  if (!apiKey || !fromEmail) {
    return NextResponse.json({ error: "Resend chưa cấu hình (thiếu API key hoặc From Email)." }, { status: 400 });
  }

  // Lấy thông tin campaign
  const { data: campaign } = await supabase
    .from("email_campaigns").select("*").eq("id", campaignId).single();
  if (!campaign) return NextResponse.json({ error: "Campaign không tồn tại." }, { status: 404 });

  // Lấy danh sách email theo segment
  let emailQuery = supabase.from("orders").select("customer_email, product_id").eq("status", "success");
  if (campaign.segment === "recent_30d") {
    emailQuery = emailQuery.gte("paid_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  } else if (campaign.segment.startsWith("product:")) {
    const pid = campaign.segment.replace("product:", "");
    emailQuery = emailQuery.eq("product_id", pid);
  }
  const { data: orders } = await emailQuery;
  const uniqueEmails = [...new Set((orders ?? []).map((o: { customer_email: string }) => o.customer_email))];

  if (uniqueEmails.length === 0) {
    return NextResponse.json({ error: "Không có email nào trong phân khúc này." }, { status: 400 });
  }

  // Đánh dấu đang gửi
  await supabase.from("email_campaigns")
    .update({ status: "sending" }).eq("id", campaignId);

  const resend = new Resend(apiKey);
  const from = `${fromName} <${fromEmail}>`;
  let sent = 0;

  // Gửi theo batch 10 email/lần để tránh rate limit
  const html = campaign.html_body.replace(/\{\{site_url\}\}/g, siteUrl);

  for (let i = 0; i < uniqueEmails.length; i += 10) {
    const batch = uniqueEmails.slice(i, i + 10);
    await Promise.all(
      batch.map((email) =>
        resend.emails.send({ from, to: email, subject: campaign.subject, html })
          .then(() => { sent++; })
          .catch((e) => console.error("Campaign send error:", email, e))
      )
    );
    // Nhỏ delay giữa các batch
    if (i + 10 < uniqueEmails.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // Cập nhật trạng thái
  await supabase.from("email_campaigns").update({
    status: sent > 0 ? "sent" : "failed",
    sent_count: sent,
    sent_at: new Date().toISOString(),
  }).eq("id", campaignId);

  return NextResponse.json({ id: campaignId, status: "sent", sent_count: sent });
}
