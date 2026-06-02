"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteCustomerOrders(email: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("orders").delete().eq("customer_email", email);
  if (error) throw new Error(error.message);
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
  emails: string[],
  groupId: string,
): Promise<{ added: number; errors: string[] }> {
  const supabase = createAdminClient();
  const rows = emails
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"))
    .map((email) => ({ email, group_id: groupId }));
  if (!rows.length) return { added: 0, errors: ["Không có email hợp lệ"] };
  const { error } = await supabase
    .from("customer_group_members")
    .upsert(rows, { ignoreDuplicates: true });
  if (error) return { added: 0, errors: [error.message] };
  revalidatePath("/admin/customers");
  return { added: rows.length, errors: [] };
}
