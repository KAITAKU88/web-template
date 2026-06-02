"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/get-role";
import { revalidatePath } from "next/cache";
import type { ProductCopy } from "@/lib/productContent";
import { queueAutomation } from "@/lib/automation";



function logActivity(staffId: string | null, actionType: string, resourceType: string, resourceId?: string) {
  if (!staffId) return; // owner không cần log
  createAdminClient()
    .from("activity_logs")
    .insert({ staff_id: staffId, action_type: actionType, resource_type: resourceType, resource_id: resourceId })
    .then(() => {}); // fire-and-forget
}

export async function createProduct(formData: FormData) {
  const supabase = createAdminClient();
  const { role, staffId } = await getAdminSession();

  const landingRaw = formData.get("landing_content") as string | null;
  const landing = landingRaw ? JSON.parse(landingRaw) : null;

  const isCombo = formData.get("is_combo") === "true";
  const comboProductIds = JSON.parse((formData.get("combo_product_ids") as string) || "[]");

  const { error } = await supabase.from("products").insert({
    name: formData.get("name") as string,
    slug: (formData.get("slug") as string) || null,
    type: (formData.get("type") as string) || null,
    price: Number(formData.get("price")),
    original_price: formData.get("original_price") ? Number(formData.get("original_price")) : null,
    template_link: isCombo ? "" : (formData.get("template_link") as string),
    description: (formData.get("description") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    download_count: Number(formData.get("download_count") ?? 0),
    rating: Number(formData.get("rating") ?? 0),
    rating_count: Number(formData.get("rating_count") ?? 0),
    landing_content: landing,
    label: (formData.get("label") as string) || null,
    gallery_images: JSON.parse((formData.get("gallery_images") as string) || "[]"),
    is_combo: isCombo,
    combo_product_ids: comboProductIds,
    status: "draft",
    // Partner: tự động gán creator_id
    creator_id: (role === "partner" && staffId) ? staffId : null,
  });

  if (error) throw new Error(error.message);
  logActivity(staffId, "create_product", "product");
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const { role, staffId } = await getAdminSession();

  // Partner chỉ được sửa sản phẩm do chính họ tạo — validate ở server
  if (role === "partner" && staffId) {
    const { data: existing } = await supabase.from("products").select("creator_id").eq("id", id).single();
    if (!existing || existing.creator_id !== staffId) {
      throw new Error("Không có quyền chỉnh sửa sản phẩm này.");
    }
  }

  const landingRaw = formData.get("landing_content") as string | null;
  const landing = landingRaw ? JSON.parse(landingRaw) : null;

  const slugVal = (formData.get("slug") as string) || null;
  const isCombo = formData.get("is_combo") === "true";
  const comboProductIds = JSON.parse((formData.get("combo_product_ids") as string) || "[]");

  const { error } = await supabase.from("products").update({
    name: formData.get("name") as string,
    slug: slugVal,
    type: (formData.get("type") as string) || null,
    price: Number(formData.get("price")),
    original_price: formData.get("original_price") ? Number(formData.get("original_price")) : null,
    template_link: isCombo ? "" : (formData.get("template_link") as string),
    description: (formData.get("description") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    download_count: Number(formData.get("download_count") ?? 0),
    rating: Number(formData.get("rating") ?? 0),
    rating_count: Number(formData.get("rating_count") ?? 0),
    landing_content: landing,
    label: (formData.get("label") as string) || null,
    gallery_images: JSON.parse((formData.get("gallery_images") as string) || "[]"),
    is_combo: isCombo,
    combo_product_ids: comboProductIds,
  }).eq("id", id);

  if (error) throw new Error(error.message);
  logActivity(staffId, "edit_product", "product", id);
  revalidatePath("/admin/products");
  revalidatePath(`/products/${id}`);
  if (slugVal) revalidatePath(`/products/${slugVal}`);
}

export async function deleteProduct(id: string) {
  const supabase = createAdminClient();
  const { role, staffId } = await getAdminSession();

  // Partner chỉ được xóa sản phẩm do chính họ tạo
  if (role === "partner" && staffId) {
    const { data: existing } = await supabase.from("products").select("creator_id").eq("id", id).single();
    if (!existing || existing.creator_id !== staffId) {
      throw new Error("Không có quyền xóa sản phẩm này.");
    }
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  logActivity(staffId, "delete_product", "product", id);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function toggleProductStatus(id: string, newStatus: "published" | "draft") {
  const supabase = createAdminClient();
  const { staffId } = await getAdminSession();
  const { data: product, error } = await supabase
    .from("products")
    .update({ status: newStatus })
    .eq("id", id)
    .select("id, name, slug")
    .single();
  if (error) throw new Error(error.message);
  logActivity(staffId, newStatus === "published" ? "publish_product" : "unpublish_product", "product", id);
  revalidatePath("/admin/products");
  revalidatePath("/");

  // Trigger automation khi publish sản phẩm mới
  if (newStatus === "published" && product) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://web-template-cloudflare.thankful-to-all-88.workers.dev";
    queueAutomation("product_published", {
      product_id:   product.id,
      product_name: product.name,
      product_url:  `${siteUrl}/products/${product.slug ?? product.id}`,
      checkout_url: `${siteUrl}/checkout/${product.slug ?? product.id}`,
      site_url:     siteUrl,
    }).catch((e) => console.error("product_published automation error:", e));
  }
}
