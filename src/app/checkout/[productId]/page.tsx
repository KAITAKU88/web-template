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

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error || !product) notFound();

  // Tìm sản phẩm bán kèm: ưu tiên cùng loại, phổ biến nhất, khác sản phẩm hiện tại
  let companionQuery = supabase
    .from("products")
    .select("id, name, price")
    .neq("id", productId)
    .order("download_count", { ascending: false })
    .limit(1);

  if (product.type) companionQuery = companionQuery.eq("type", product.type);

  const { data: companionRaw } = await companionQuery.maybeSingle();

  const companion: BumpCompanion | null = companionRaw
    ? {
        id: companionRaw.id,
        name: companionRaw.name,
        originalPrice: companionRaw.price,
        bumpPrice: Math.round(companionRaw.price / 2 / 1000) * 1000,
      }
    : null;

  // Fetch bundle: 2–3 sản phẩm phổ biến nhất, khác sản phẩm đang mua
  const { data: bundleRaw } = await supabase
    .from("products")
    .select("id, name, price")
    .neq("id", productId)
    .order("download_count", { ascending: false })
    .limit(3);

  const bundle: BundleOffer | null =
    bundleRaw && bundleRaw.length >= 2
      ? {
          items: bundleRaw,
          originalPrice: bundleRaw.reduce((s, p) => s + p.price, 0),
          salePrice: Math.round(
            bundleRaw.reduce((s, p) => s + p.price, 0) * 0.5 / 1000
          ) * 1000,
        }
      : null;

  const settings = await getSettings();
  const siteName = settings.site_name ?? "TemplateLab";

  return <CheckoutClient product={product as Product} companion={companion} bundle={bundle} siteName={siteName} />;
}
