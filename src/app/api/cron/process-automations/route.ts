import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { replaceVars, type AutomationContext } from "@/lib/automation";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Lấy tất cả items chưa xử lý và đã đến giờ
  const { data: queue } = await supabase
    .from("automation_execution_queue")
    .select("id, rule_id, context_data")
    .is("executed_at", null)
    .eq("failed", false)
    .lte("execute_at", new Date().toISOString())
    .limit(50);

  if (!queue?.length) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const [settings] = await Promise.all([getSettings()]);
  const apiKey    = settings.resend_api_key  || process.env.RESEND_API_KEY || "";
  const fromName  = settings.resend_from_name ?? settings.site_name ?? "TemplateLab";
  const fromEmail = settings.resend_from_email || process.env.RESEND_FROM?.match(/<(.+)>/)?.[1] || "";
  const siteName  = settings.site_name ?? "TemplateLab";
  const siteUrl   = new URL(req.url).origin;

  if (!apiKey || !fromEmail) {
    return NextResponse.json({ error: "Resend chưa cấu hình" }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const from = `${fromName} <${fromEmail}>`;
  let processed = 0;

  for (const item of queue) {
    try {
      // Lấy rule
      const { data: rule } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("id", item.rule_id)
        .eq("is_active", true)
        .single();

      if (!rule?.email_subject || !rule?.email_html) {
        await supabase.from("automation_execution_queue")
          .update({ executed_at: new Date().toISOString(), error_msg: "Rule has no email template" })
          .eq("id", item.id);
        continue;
      }

      const ctx: AutomationContext = {
        ...(item.context_data as AutomationContext),
        site_name: siteName,
        site_url: siteUrl,
      };

      // Lấy danh sách email theo target_segment
      const emails = await getRecipients(supabase, rule.target_segment, ctx);

      if (!emails.length) {
        await supabase.from("automation_execution_queue")
          .update({ executed_at: new Date().toISOString(), error_msg: "No recipients" })
          .eq("id", item.id);
        continue;
      }

      const subject = replaceVars(rule.email_subject, ctx);
      const html    = replaceVars(rule.email_html, ctx);

      // Gửi email đến từng recipient
      let sent = 0;
      for (const email of emails) {
        const emailCtx = { ...ctx, customer_email: email };
        const personalHtml = replaceVars(html, emailCtx);
        const personalSubj = replaceVars(subject, emailCtx);
        const { error } = await resend.emails.send({ from, to: email, subject: personalSubj, html: personalHtml });
        if (!error) sent++;
        else console.error("Automation email error:", email, error);
      }

      await supabase.from("automation_execution_queue")
        .update({ executed_at: new Date().toISOString() })
        .eq("id", item.id);

      processed++;
      console.log(`Automation rule "${rule.name}" → sent to ${sent}/${emails.length}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await supabase.from("automation_execution_queue")
        .update({ failed: true, error_msg: errMsg })
        .eq("id", item.id);
      console.error("Automation queue error:", item.id, errMsg);
    }
  }

  return NextResponse.json({ ok: true, processed });
}

async function getRecipients(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  segment: string,
  ctx: AutomationContext,
): Promise<string[]> {
  // "buyer" = người trực tiếp trigger (email từ context)
  if (segment === "buyer") {
    return ctx.customer_email ? [ctx.customer_email] : [];
  }

  // "group:{id}" = lấy từ customer_group_members
  if (segment.startsWith("group:")) {
    const groupId = segment.replace("group:", "");
    const { data } = await supabase
      .from("customer_group_members")
      .select("email")
      .eq("group_id", groupId);
    return (data ?? []).map((m: { email: string }) => m.email);
  }

  // "all" = tất cả khách hàng đã từng mua thành công
  const { data } = await supabase
    .from("orders")
    .select("customer_email")
    .eq("status", "success");
  const emails = [...new Set((data ?? []).map((o: { customer_email: string }) => o.customer_email))] as string[];
  return emails;
}
