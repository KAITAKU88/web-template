"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteCustomerOrders(email: string) {
  const supabase = createAdminClient();
  // Xóa đồng thời orders, group memberships, và profile để không tái xuất hiện sau reload
  const [ordersResult, membersResult, profileResult] = await Promise.all([
    supabase.from("orders").delete().eq("customer_email", email),
    supabase.from("customer_group_members").delete().eq("email", email),
    supabase.from("customer_profiles").delete().eq("email", email),
  ]);
  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (membersResult.error) throw new Error(membersResult.error.message);
  if (profileResult.error) throw new Error(profileResult.error.message);
  revalidatePath("/admin/customers");
}

export async function createCustomerGroup(name: string, color: string, description: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("customer_groups").insert({ name, color, description });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/customers");
}

export async function deleteCustomerGroup(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("customer_groups").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/customers");
}

export async function addToGroup(email: string, groupId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("customer_group_members").upsert({ email, group_id: groupId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/customers");
}

export async function removeFromGroup(email: string, groupId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("customer_group_members")
    .delete().eq("email", email).eq("group_id", groupId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/customers");
}

export async function bulkAddToGroup(
  rows: { email: string; phone?: string }[],
  groupId: string,
): Promise<{ added: number; errors: string[] }> {
  const supabase = createAdminClient();

  // Deduplicate và validate email
  const seen = new Set<string>();
  const validRows = rows
    .map((r) => ({ email: r.email.trim().toLowerCase(), phone: r.phone?.trim() || null }))
    .filter((r) => r.email.includes("@") && !seen.has(r.email) && seen.add(r.email));

  if (!validRows.length) return { added: 0, errors: ["Không có email hợp lệ"] };

  const uniqueEmails = validRows.map((r) => r.email);

  // Upsert group memberships — DB unique constraint handles duplicates natively
  // Count pre-existing members to report accurate "newly added" count
  const { data: existing } = await supabase
    .from("customer_group_members")
    .select("email")
    .eq("group_id", groupId)
    .in("email", uniqueEmails);
  const existingSet = new Set((existing ?? []).map((r) => r.email));
  const newCount = validRows.filter((r) => !existingSet.has(r.email)).length;

  const memberRows = uniqueEmails.map((email) => ({ email, group_id: groupId }));
  const { error: memberError } = await supabase
    .from("customer_group_members")
    .upsert(memberRows, { onConflict: "email,group_id", ignoreDuplicates: true });
  if (memberError) return { added: 0, errors: [memberError.message] };

  // Lưu/cập nhật phone vào customer_profiles (cho tất cả row có phone)
  const withPhone = validRows.filter((r) => r.phone);
  if (withPhone.length > 0) {
    const { error: phoneError } = await supabase.from("customer_profiles").upsert(
      withPhone.map(({ email, phone }) => ({ email, phone, updated_at: new Date().toISOString() })),
      { onConflict: "email" }
    );
    if (phoneError) return { added: newCount, errors: [`Phone lưu thất bại: ${phoneError.message}`] };
  }

  revalidatePath("/admin/customers");
  return { added: newCount, errors: [] };
}
