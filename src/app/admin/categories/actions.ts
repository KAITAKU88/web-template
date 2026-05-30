"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function createCategory(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  if (!name) return;
  const id = toSlug(name);
  const supabase = createAdminClient();
  const { data: maxRow } = await supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).single();
  const sort_order = (maxRow?.sort_order ?? 0) + 1;
  await supabase.from("categories").insert({ id, name, sort_order });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategory(id: string) {
  const supabase = createAdminClient();
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function reorderCategory(id: string, direction: "up" | "down") {
  const supabase = createAdminClient();
  const { data: cats } = await supabase.from("categories").select("id, sort_order").order("sort_order");
  if (!cats) return;
  const idx = cats.findIndex((c) => c.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= cats.length) return;
  await supabase.from("categories").update({ sort_order: cats[swapIdx].sort_order }).eq("id", id);
  await supabase.from("categories").update({ sort_order: cats[idx].sort_order }).eq("id", cats[swapIdx].id);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}
