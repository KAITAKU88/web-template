import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import { notFound } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

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

  return <CheckoutClient product={product as Product} />;
}
