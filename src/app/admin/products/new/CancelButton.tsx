"use client";

import { useRouter } from "next/navigation";
import ProductForm from "../ProductForm";
import type { ComponentProps } from "react";

type ProductFormProps = ComponentProps<typeof ProductForm>;

export default function ProductFormWithCancel(props: Omit<ProductFormProps, "onCancel">) {
  const router = useRouter();
  return <ProductForm {...props} onCancel={() => router.back()} />;
}
