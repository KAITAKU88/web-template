"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createAutomationRule(formData: FormData) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("automation_rules").insert({
    name: formData.get("name") as string,
    trigger_event: formData.get("trigger_event") as string,
    action_type: "send_email",
    target_segment: (formData.get("target_segment") as string) || "all",
    email_subject: (formData.get("email_subject") as string) || null,
    email_html: (formData.get("email_html") as string) || null,
    delay_minutes: Number(formData.get("delay_minutes") ?? 0),
    is_active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/automation");
}

export async function updateAutomationRule(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("automation_rules").update({
    name: formData.get("name") as string,
    trigger_event: formData.get("trigger_event") as string,
    target_segment: (formData.get("target_segment") as string) || "all",
    email_subject: (formData.get("email_subject") as string) || null,
    email_html: (formData.get("email_html") as string) || null,
    delay_minutes: Number(formData.get("delay_minutes") ?? 0),
  }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/automation");
}

export async function toggleAutomationRule(id: string, isActive: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("automation_rules").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/automation");
}

export async function deleteAutomationRule(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("automation_rules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/automation");
}
