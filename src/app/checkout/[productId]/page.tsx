import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import type { Product } from "@/types";
import { notFound } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

export interface BumpCompanion {
  id: string;
  name: string;
  originalPrice: number;
  bumpPrice: number;
}

export interface BundleOffer {
  items: { id: string; name: string; price: number }[];
  originalPrice: number;
  salePrice: number;
}

interface Props {
  params: Promise<{ productId: string }>;
}

export default async function CheckoutPage({ params }: Props) {
  const { productId } = await params;
  const supabase = await createClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq(isUuid ? "id" : "slug", productId)
    .single();

  if (error || !product || product.status === "draft") notFound();

  // creator_id của sản phẩm đang mua — dùng để giới hạn upsell cùng chủ sở hữu
  const creatorId = product.creator_id as string | null;

  // Helper: filter cùng creator_id (null = owner, uuid = partner)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withCreator = (q: any) =>
    creatorId ? q.eq("creator_id", creatorId) : q.is("creator_id", null);

  // Tìm sản phẩm bán kèm: ưu tiên cùng loại, phổ biến nhất, khác sản phẩm hiện tại, không phải combo
  // Chỉ upsell sản phẩm cùng creator (owner upsell owner, partner A upsell partner A)
  let companionQuery = withCreator(
    supabase
      .from("products")
      .select("id, name, price")
      .eq("status", "published")
      .neq("id", product.id)
      .neq("is_combo", true)
      .order("download_count", { ascending: false })
      .limit(1)
  );

  if (product.type) companionQuery = companionQuery.eq("type", product.type);

  const { data: companionRaw } = product.is_combo ? { data: null } : await companionQuery.maybeSingle();

  const companion: BumpCompanion | null = companionRaw
    ? {
        id: companionRaw.id,
        name: companionRaw.name,
        originalPrice: companionRaw.price,
        bumpPrice: Math.round(companionRaw.price / 2 / 1000) * 1000,
      }
    : null;

  // Fetch bundle: 2–3 sản phẩm phổ biến nhất, khác sản phẩm đang mua, không phải combo
  // Không hiện bundle upsell khi đang mua combo (combo đã rẻ, không cần thêm ưu đãi)
  // Chỉ upsell sản phẩm cùng creator
  const { data: bundleRaw } = product.is_combo ? { data: null } : await withCreator(
    supabase
      .from("products")
      .select("id, name, price")
      .eq("status", "published")
      .neq("id", product.id)
      .neq("is_combo", true)
      .order("download_count", { ascending: false })
      .limit(3)
  );

  const bundle: BundleOffer | null =
    bundleRaw && bundleRaw.length >= 2
      ? {
          items: bundleRaw,
          originalPrice: bundleRaw.reduce((s: number, p: { price: number }) => s + p.price, 0),
          salePrice: Math.round(
            bundleRaw.reduce((s: number, p: { price: number }) => s + p.price, 0) * 0.5 / 1000
          ) * 1000,
        }
      : null;

  const settings = await getSettings();
  const siteName = settings.site_name ?? "TemplateLab";

  return <CheckoutClient product={product as Product} companion={companion} bundle={bundle} siteName={siteName} />;
}
