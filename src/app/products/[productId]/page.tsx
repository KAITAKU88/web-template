import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { formatCurrency, calcDiscountPercent, formatCount } from "@/lib/utils";
import { getProductCopy, type ProductCopy, type PainItem, type FeatureItem, type TestiItem, type IncludeItem, type FaqItem } from "@/lib/productContent";
import type { Product } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { StarRating } from "@/components/StarRating";
import { FaqAccordion } from "@/components/FaqAccordion";
import SocialProofToast from "@/components/SocialProofToast";
import ImageCarousel from "@/components/ImageCarousel";

const TYPE_LABEL: Record<string, string> = { notion: "Notion", google_sheet: "Google Sheets" };
const TYPE_ICON: Record<string, string>  = { notion: "📓", google_sheet: "📊" };

// ISR: tự regenerate sau 60 giây — thêm sản phẩm mới không cần redeploy
export const revalidate = 60;

interface Props { params: Promise<{ productId: string }> }

export async function generateMetadata({ params }: Props) {
  const { productId } = await params;
  const [supabase, settings] = await Promise.all([createClient(), getSettings()]);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
  const { data } = await supabase.from("products").select("name,description,price,image_url")
    .eq(isUuid ? "id" : "slug", productId).single();
  if (!data) return {};
  const { formatCurrency } = await import("@/lib/utils");
  const siteName = settings.site_name ?? "TemplateLab";
  const desc = data.description ?? `Mua ${data.name} trên ${siteName}. Nhận link qua email tức thì sau khi chuyển khoản.`;
  return {
    title: `${data.name} — ${formatCurrency(data.price)} | ${siteName}`,
    description: desc,
    openGraph: {
      title: data.name,
      description: desc,
      images: data.image_url ? [{ url: data.image_url }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { productId } = await params;
  const supabase = await createClient();

  const isUuid2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
  const { data, error } = await supabase.from("products").select("*")
    .eq(isUuid2 ? "id" : "slug", productId).single();
  if (error || !data) notFound();

  const product = data as Product;
  if (product.status === "draft") notFound();
  const copy: ProductCopy = product.landing_content ?? getProductCopy(product.name);
  const typeKey  = product.type ?? "notion";
  const isBestseller = product.download_count >= 1000;
  const isHot = !isBestseller && (product.download_count >= 500 || product.rating >= 4.9);
  const hasDiscount = !!(product.original_price && product.original_price > product.price);

  return (
    <>
    <div className="mx-auto max-w-3xl">

      {/* ── Breadcrumb ── */}
      <div className="mb-8 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="transition-colors hover:text-gray-600 dark:hover:text-gray-300">Trang chủ</Link>
        <span>/</span>
        <span className="font-medium text-gray-700 dark:text-gray-200">{product.name}</span>
      </div>

      {/* ══════════════════════════════════════════
          1. TIÊU ĐỀ / HERO
      ══════════════════════════════════════════ */}
      <section className="card mb-2 overflow-hidden">
        {/* Ảnh bìa */}
        <div className="relative aspect-video w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill className="object-cover" />
          ) : (
            <span className="text-8xl">{TYPE_ICON[typeKey] ?? "📄"}</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {/* Badges overlay */}
          <div className="absolute left-3 top-3 flex gap-2">
            {isBestseller && <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-white shadow">🏆 Bestseller</span>}
            {isHot        && <span className="rounded-full bg-red-500  px-3 py-1 text-xs font-bold text-white shadow">🔥 Hot</span>}
          </div>
          {hasDiscount && (
            <span className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow">
              -{calcDiscountPercent(product.price, product.original_price!)}%
            </span>
          )}
        </div>

        {/* Hero content */}
        <div className="p-6">
          {product.type && (
            <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
              {TYPE_ICON[typeKey]} {TYPE_LABEL[typeKey]}
            </span>
          )}

          <h1 className="mb-3 text-2xl font-extrabold leading-snug tracking-tight text-gray-900 dark:text-white">
            {copy.headline}
          </h1>
          <p className="mb-5 leading-relaxed text-gray-500 dark:text-gray-400">{copy.subheadline}</p>

          {/* Social proof */}
          {(product.rating > 0 || product.download_count > 0) && (
            <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-4 py-3 text-sm">
              {product.rating > 0 && (
                <StarRating rating={product.rating} count={product.rating_count} size="md" />
              )}
              {product.download_count > 0 && (
                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <span>⬇</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{formatCount(product.download_count)}</span>
                  <span>lượt tải</span>
                </span>
              )}
            </div>
          )}

          {/* Giá + CTA */}
          <div className="flex items-end gap-5">
            <div>
              <div className="text-3xl font-extrabold text-brand">{formatCurrency(product.price)}</div>
              {hasDiscount && (
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-sm text-gray-400 line-through">{formatCurrency(product.original_price!)}</span>
                  <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                    Tiết kiệm {formatCurrency(product.original_price! - product.price)}
                  </span>
                </div>
              )}
            </div>
            <Link href={`/checkout/${product.slug ?? product.id}`} className="btn-primary">
              Mua ngay →
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
            <span>✓ Thanh toán 1 lần — dùng vĩnh viễn</span>
            <span>✓ Nhận link qua email tức thì</span>
            <span>✓ Tự do chỉnh sửa</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          2. NỖI ĐAU
      ══════════════════════════════════════════ */}
      <section className="mb-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-brand">Bạn có đang gặp phải?</span>
        <h2 className="mb-6 text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Nghe quen không?
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {copy.pains.map((p: PainItem, i: number) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="mb-2 text-2xl">{p.icon}</div>
              <div className="mb-1.5 text-sm font-bold text-gray-800 dark:text-gray-100">{p.title}</div>
              <div className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          3. GIẢI PHÁP
      ══════════════════════════════════════════ */}
      <section className="card mb-2 p-6">
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-brand">Giải pháp</span>
        <h2 className="mb-3 text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">{copy.solutionTitle}</h2>
        <p className="mb-6 leading-relaxed text-gray-500 dark:text-gray-400">{copy.solutionDesc}</p>

        {/* Formula */}
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-6 py-5 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl">{copy.solutionFormula.a.split(" ")[0]}</span>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{copy.solutionFormula.a.slice(copy.solutionFormula.a.indexOf(" ") + 1)}</span>
          </div>
          <span className="text-2xl font-black text-gray-300 dark:text-gray-600">+</span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl">{copy.solutionFormula.b.split(" ")[0]}</span>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{copy.solutionFormula.b.slice(copy.solutionFormula.b.indexOf(" ") + 1)}</span>
          </div>
          <span className="text-2xl font-black text-green-400">=</span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl">{copy.solutionFormula.result.split(" ")[0]}</span>
            <span className="text-xs font-bold text-brand">{copy.solutionFormula.result.slice(copy.solutionFormula.result.indexOf(" ") + 1)}</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          4. GIAO DIỆN THỰC TẾ
      ══════════════════════════════════════════ */}
      {(product.gallery_images?.length > 0 || product.image_url) && (
        <section className="mb-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-brand">Giao diện thực tế</span>
          <h2 className="mb-6 text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Nhìn thấy trước khi mua</h2>

          {product.gallery_images?.length > 0 ? (
            <ImageCarousel
              images={product.gallery_images}
              productName={product.name}
            />
          ) : product.image_url ? (
            <div className="overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-md">
              <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-2 flex-1 rounded-xl bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs text-gray-400">
                  notion.so / {product.name.toLowerCase().replace(/\s+/g, "-")}
                </span>
              </div>
              <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-700">
                <Image src={product.image_url} alt={`Preview ${product.name}`} fill className="object-cover" unoptimized />
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* ══════════════════════════════════════════
          5. ĐIỂM KHÁC BIỆT
      ══════════════════════════════════════════ */}
      <section className="card mb-2 p-6">
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-brand">Điểm khác biệt</span>
        <h2 className="mb-6 text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Tất cả những gì bạn cần</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {copy.features.map((f: FeatureItem, i: number) => (
            <div key={i} className="flex gap-3 rounded-xl border border-gray-100 dark:border-gray-700 p-4 transition-colors hover:border-green-200 dark:hover:border-green-800">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/30 text-xl">
                {f.icon}
              </div>
              <div>
                <div className="mb-0.5 text-sm font-bold text-gray-800 dark:text-gray-100">{f.title}</div>
                <div className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          6. ĐÁNH GIÁ CỦA NGƯỜI DÙNG
      ══════════════════════════════════════════ */}
      <section className="mb-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-brand">Đánh giá</span>
        <h2 className="mb-6 text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Người dùng nói gì?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {copy.testimonials.map((t: TestiItem, i: number) => (
            <div key={i} className={`rounded-xl border bg-white dark:bg-gray-800 p-5 ${i === 0 ? "border-green-200 dark:border-green-800 bg-gradient-to-br from-white dark:from-gray-800 to-green-50 dark:to-green-900/20" : "border-gray-200 dark:border-gray-700"}`}>
              {i === 0 && (
                <span className="mb-3 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/40 px-2.5 py-0.5 text-xs font-bold text-green-700 dark:text-green-400">
                  ⭐ Nổi bật
                </span>
              )}
              <div className="mb-3 text-amber-400 text-sm">★★★★★</div>
              <p className="mb-4 text-sm italic leading-relaxed text-gray-600 dark:text-gray-300">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-xl overflow-hidden">
                  {(t.avatar.startsWith("http://") || t.avatar.startsWith("https://") || t.avatar.startsWith("/")) ? (
                    <Image src={t.avatar} alt={t.name} width={36} height={36} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <span>{t.avatar}</span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          7. LỜI CHÀO HÀNG
      ══════════════════════════════════════════ */}
      <section className="card mb-2 overflow-hidden">
        <div className="bg-brand px-6 py-3 text-center text-xs font-bold uppercase tracking-widest text-white">
          🎁 Ưu đãi đặc biệt — Mua 1 lần, dùng vĩnh viễn
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-2">
          {/* Checklist */}
          <div>
            <h3 className="mb-4 font-bold text-gray-800 dark:text-gray-100">Bạn nhận được:</h3>
            <ul className="space-y-3">
              {copy.includes.map((item: IncludeItem, i: number) => (
                <li key={i} className="flex items-start gap-3 border-b border-gray-50 dark:border-gray-700 pb-3 text-sm last:border-0 last:pb-0">
                  <span className="mt-0.5 font-bold text-green-500">✓</span>
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100">{item.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Price card */}
          <div className="flex flex-col rounded-xl border-2 border-green-500 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-5">
            <div className="mb-1 text-4xl font-extrabold tracking-tight text-brand">
              {formatCurrency(product.price)}
            </div>
            {hasDiscount && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm text-gray-400 line-through">{formatCurrency(product.original_price!)}</span>
                <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                  -{calcDiscountPercent(product.price, product.original_price!)}%
                </span>
              </div>
            )}
            <div className="mb-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
              ✓ Thanh toán 1 lần — không subscription<br />
              ✓ Nhận link qua email trong vài phút<br />
              ✓ Dùng vĩnh viễn, tự do chỉnh sửa
            </div>
            <Link href={`/checkout/${product.slug ?? product.id}`} className="btn-primary w-full text-center">
              Mua ngay →
            </Link>
            <p className="mt-2 text-center text-xs text-gray-400">Thanh toán an toàn qua VietQR</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          8. CÁCH NHẬN TEMPLATE
      ══════════════════════════════════════════ */}
      <section className="mb-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-brand">Cách nhận</span>
        <h2 className="mb-6 text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">3 bước đơn giản</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { icon: "📧", step: "01", title: "Nhập email", desc: "Điền email nhận template" },
            { icon: "📱", step: "02", title: "Quét QR", desc: "Chuyển khoản VietQR" },
            { icon: "🎉", step: "03", title: "Nhận ngay", desc: "Link về email tức thì" },
          ].map(({ icon, step, title, desc }) => (
            <div key={step} className="flex flex-col items-center">
              <div className="relative mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-gray-800 shadow-sm text-2xl">
                  {icon}
                </div>
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                  {step.slice(1)}
                </span>
              </div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          9. CÂU HỎI THƯỜNG GẶP
      ══════════════════════════════════════════ */}
      <section className="card mb-6 p-6">
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-brand">FAQ</span>
        <h2 className="mb-6 text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Câu hỏi thường gặp</h2>
        <FaqAccordion items={copy.faqs} />
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════ */}
      <section className="mb-8 rounded-2xl bg-gradient-to-br bg-brand p-8 text-center text-white">
        <div className="mb-1 text-3xl font-extrabold">{formatCurrency(product.price)}</div>
        <p className="mb-5 text-sm text-green-100">Thanh toán 1 lần — dùng vĩnh viễn</p>
        <Link
          href={`/checkout/${product.slug ?? product.id}`}
          className="inline-block rounded-xl bg-white px-8 py-3.5 text-base font-extrabold text-green-700 shadow-lg transition hover:bg-green-50 active:scale-95"
        >
          Mua ngay — nhận link tức thì →
        </Link>
        <p className="mt-3 text-xs text-green-200">
          Tự động 100% · Không cần chờ · An toàn qua VietQR
        </p>
      </section>

    </div>

    <SocialProofToast />
    </>
  );
}
