// ci-test
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";
import ProductGrid from "@/components/ProductGrid";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching products:", error);
  const list = (products as Product[]) ?? [];

  return (
    <div>
      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Template chất lượng cao
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Mua ngay, nhận link tức thì — tự động 100% qua QR chuyển khoản
        </p>
      </div>

      {/* Product grid — bọc Suspense vì ProductGrid dùng useSearchParams */}
      <Suspense fallback={<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:3}).map((_,i)=><div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse dark:bg-gray-800"/>)}</div>}>
        <ProductGrid products={list} />
      </Suspense>

      {/* Trust signals */}
      <div className="mt-16 flex flex-wrap justify-center gap-4 text-center text-sm text-gray-500">
        {[
          { icon: "⚡", title: "Nhận ngay tức thì", desc: "Link giao tự động qua email sau khi thanh toán" },
          { icon: "🔒", title: "Thanh toán an toàn", desc: "QR VietQR chuẩn ngân hàng, không qua bên thứ 3" },
          { icon: "♾️", title: "Dùng vĩnh viễn", desc: "Duplicate 1 lần, sử dụng mãi mãi" },
        ].map((item) => (
          <div key={item.title} className="card p-5 dark:bg-gray-800 min-w-64 flex-1">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="font-semibold text-gray-700 dark:text-gray-200">{item.title}</div>
            <div className="dark:text-gray-400">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
