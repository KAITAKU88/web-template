import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminRole } from "@/lib/get-role";

// Xóa tham chiếu URL ảnh khỏi DB sau khi file bị xóa khỏi Storage
export async function POST(req: NextRequest) {
  const role = await getAdminRole();
  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { urls } = await req.json() as { urls: string[] };
  if (!urls?.length) return NextResponse.json({ updated: 0 });

  const supabase = createAdminClient();
  let updated = 0;

  for (const url of urls) {
    // 1. products.image_url → set null
    const { data: byImageUrl } = await supabase
      .from("products")
      .update({ image_url: null })
      .eq("image_url", url)
      .select("id");
    updated += byImageUrl?.length ?? 0;

    // 2. products.gallery_images (TEXT[]) → xóa URL khỏi mảng
    const { data: withGallery } = await supabase
      .from("products")
      .select("id, gallery_images")
      .contains("gallery_images", [url]);
    for (const row of withGallery ?? []) {
      const newGallery = (row.gallery_images as string[]).filter((u: string) => u !== url);
      await supabase.from("products").update({ gallery_images: newGallery }).eq("id", row.id);
      updated++;
    }

    // 3. settings: logo_url, favicon_url, og_image_url → set null
    const imageKeys = ["logo_url", "favicon_url", "og_image_url"];
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", imageKeys);
    for (const s of settings ?? []) {
      if (s.value === url) {
        await supabase.from("settings").update({ value: null }).eq("key", s.key);
        updated++;
      }
    }
  }

  return NextResponse.json({ updated });
}
