import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminRole } from "@/lib/get-role";

export async function POST(req: NextRequest) {
  const role = await getAdminRole();
  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { oldUrl, newUrl } = await req.json() as { oldUrl: string; newUrl: string };
  if (!oldUrl || !newUrl || oldUrl === newUrl) return NextResponse.json({ updated: 0 });

  const supabase = createAdminClient();
  let updated = 0;

  // 1. products.image_url (TEXT)
  const { data: byImageUrl } = await supabase
    .from("products")
    .update({ image_url: newUrl })
    .eq("image_url", oldUrl)
    .select("id");
  updated += byImageUrl?.length ?? 0;

  // 2. products.gallery_images (TEXT[])
  const { data: withGallery } = await supabase
    .from("products")
    .select("id, gallery_images")
    .contains("gallery_images", [oldUrl]);
  for (const row of withGallery ?? []) {
    const newGallery = (row.gallery_images as string[]).map((u: string) => (u === oldUrl ? newUrl : u));
    await supabase.from("products").update({ gallery_images: newGallery }).eq("id", row.id);
    updated++;
  }

  // 3. settings: logo_url, favicon_url, og_image_url (stored as JSONB)
  const imageKeys = ["logo_url", "favicon_url", "og_image_url"];
  const { data: settings } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", imageKeys);
  for (const s of settings ?? []) {
    if (s.value === oldUrl) {
      await supabase.from("settings").update({ value: newUrl }).eq("key", s.key);
      updated++;
    }
  }

  return NextResponse.json({ updated });
}
