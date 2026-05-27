import { createClient } from "@/lib/supabase/server";
import { formatCurrency, calcDiscountPercent } from "@/lib/utils";
import type { Product } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { StarRating } from "@/components/StarRating";

const TYPE_LABEL: Record<string, string> = {
  notion: "Notion",
  google_sheet: "Google Sheets",
};

const TYPE_ICON: Record<string, string> = {
  notion: "📓",
  google_sheet: "📊",
};


// ISR: tự regenerate sau 60 giây khi có sản phẩm mới
export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
  }

  const list = (products as Product[]) ?? [];

  return (
    <div>
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-gray-900">
          Template chất lượng cao
        </h1>
        <p className="text-lg text-gray-500">
          Mua ngay, nhận link tức thì — tự động 100% qua QR chuyển khoản
        </p>
      </div>

      {/* Product grid */}
      {list.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <p className="text-4xl mb-3">🛒</p>
          <p className="font-medium">Chưa có sản phẩm nào.</p>
          <p className="text-sm mt-1">Thêm sản phẩm trong Supabase Dashboard → Table Editor → products.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((product) => (
            <div key={product.id} className="card flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
              {/* Thumbnail */}
              <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    width={400}
                    height={176}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <span className="text-6xl">
                    {product.type ? TYPE_ICON[product.type] ?? "📄" : "📄"}
                  </span>
                )}
                {/* Badge Bestseller / Hot */}
                {product.download_count >= 1000 ? (
                  <span className="absolute top-2 left-2 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-white shadow">
                    🏆 Bestseller
                  </span>
                ) : product.download_count >= 500 || product.rating >= 4.9 ? (
                  <span className="absolute top-2 left-2 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white shadow">
                    🔥 Hot
                  </span>
                ) : null}
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-5">
                {/* Badge loại */}
                {product.type && (
                  <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    {TYPE_ICON[product.type]} {TYPE_LABEL[product.type]}
                  </span>
                )}

                <h2 className="mb-1 font-bold text-gray-900 leading-snug">{product.name}</h2>

                {product.description && (
                  <p className="mb-3 text-sm text-gray-500 line-clamp-2">
                    {product.description}
                  </p>
                )}

                {/* Rating + lượt tải */}
                {(product.rating > 0 || product.download_count > 0) && (
                  <div className="mb-3 flex items-center gap-3 text-xs text-gray-500">
                    {product.rating > 0 && (
                      <StarRating rating={product.rating} count={product.rating_count} />
                    )}
                    {product.download_count > 0 && (
                      <span className="flex items-center gap-1">
                        <span>⬇</span>
                        <span>{product.download_count >= 1000 ? `${(product.download_count / 1000).toFixed(1)}k` : product.download_count} lượt tải</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Giá */}
                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(product.price)}
                    </span>
                    {product.original_price && product.original_price > product.price && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 line-through">
                          {formatCurrency(product.original_price)}
                        </span>
                        <span className="rounded bg-red-50 px-1 py-0.5 text-xs font-semibold text-red-500">
                          -{calcDiscountPercent(product.price, product.original_price)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/products/${product.id}`}
                    className="btn-secondary text-xs px-4 py-2 flex-shrink-0"
                  >
                    Xem thêm →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trust signals */}
      <div className="mt-16 grid grid-cols-3 gap-4 text-center text-sm text-gray-500">
        <div className="card p-5">
          <div className="text-2xl mb-2">⚡</div>
          <div className="font-semibold text-gray-700">Nhận ngay tức thì</div>
          <div>Link giao tự động qua email sau khi thanh toán</div>
        </div>
        <div className="card p-5">
          <div className="text-2xl mb-2">🔒</div>
          <div className="font-semibold text-gray-700">Thanh toán an toàn</div>
          <div>QR VietQR chuẩn ngân hàng, không qua bên thứ 3</div>
        </div>
        <div className="card p-5">
          <div className="text-2xl mb-2">📋</div>
          <div className="font-semibold text-gray-700">Dùng vĩnh viễn</div>
          <div>Duplicate 1 lần, sử dụng mãi mãi</div>
        </div>
      </div>
    </div>
  );
}
