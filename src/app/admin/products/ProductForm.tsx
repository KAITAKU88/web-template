"use client";

import { useTransition, useState, useRef, useEffect, useCallback } from "react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { generateLandingContent } from "./actions";
import { AI_PROVIDERS } from "@/lib/ai-providers";
import { buildDefaultLanding } from "@/lib/landingTemplate";
import type { ProductCopy } from "@/lib/productContent";
import type { Product } from "@/types";
import { slugify } from "@/lib/utils";
import LandingEditor from "@/components/LandingEditor";
import ImageUploadField from "@/components/ImageUploadField";
import MediaPicker from "@/components/MediaPicker";
import { createClient } from "@/lib/supabase/client";

interface Category { id: string; name: string; }
interface SimpleProduct { id: string; name: string; type: string | null; price: number; }

interface Props {
  product?: Product;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  categories?: Category[];
  aiProvider?: string | null;
  aiModel?: string | null;
  staffId?: string | null;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "notion", name: "Notion" },
  { id: "google_sheet", name: "Google Sheets" },
];

export default function ProductForm({ product, onSubmit, onCancel, submitLabel = "Lưu sản phẩm", categories = DEFAULT_CATEGORIES, aiProvider, aiModel, staffId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, startSave] = useTransition();
  const [generating, startGenerate] = useTransition();
  const [landing, setLanding] = useState<ProductCopy | null>(
    product?.landing_content ?? null
  );
  const [genError, setGenError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [downloadCount, setDownloadCount] = useState<number>(
    product?.download_count ?? Math.floor(Math.random() * 1451) + 50
  );
  const [rating, setRating] = useState<number>(
    product?.rating ?? parseFloat((4.4 + Math.random() * 0.5).toFixed(1))
  );
  const [ratingCount, setRatingCount] = useState<number>(
    product?.rating_count ?? 0
  );
  const [isDirty, setIsDirty] = useState(false);
  const [productName, setProductName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugLocked, setSlugLocked] = useState(!!(product?.slug));
  const [selectedLabel, setSelectedLabel] = useState<string>(product?.label ?? "");
  const [isCombo, setIsCombo] = useState<boolean>(product?.is_combo ?? false);
  const [comboProductIds, setComboProductIds] = useState<string[]>(product?.combo_product_ids ?? []);
  const [availableProducts, setAvailableProducts] = useState<SimpleProduct[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("products")
      .select("id, name, type, price")
      .eq("is_combo", false)
      .eq("status", "published")
      .order("name")
      .then(({ data }) => {
        if (data) {
          setAvailableProducts(data.filter((p) => p.id !== product?.id));
        }
      });
  }, [product?.id]);

  const handleSlugChange = useCallback((val: string) => {
    setSlug(val);
    setIsDirty(true);
    setSlugLocked(val !== "");
  }, []);
  const [galleryImages, setGalleryImagesRaw] = useState<string[]>(product?.gallery_images ?? []);
  const setGalleryImages: typeof setGalleryImagesRaw = (v) => { setIsDirty(true); setGalleryImagesRaw(v); };
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useUnsavedChanges(isDirty);

  function handleUseTemplate() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const name = (fd.get("name") as string).trim();
    if (!name) { setGenError("Vui lòng nhập tên sản phẩm trước"); return; }
    setGenError(null);
    const category = (fd.get("type") as string) || "notion";
    const description = (fd.get("description") as string) || "";
    setLanding(buildDefaultLanding(name, category, description));
    setIsDirty(true);
  }

  function handleGenerate() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const name = (fd.get("name") as string).trim();
    if (!name) { setGenError("Vui lòng nhập tên sản phẩm trước"); return; }

    setGenError(null);
    startGenerate(async () => {
      const result = await generateLandingContent(
        name,
        fd.get("type") as string,
        fd.get("description") as string ?? "",
        "",
      );
      if ("error" in result) {
        setGenError(result.error);
      } else {
        setLanding(result.data);
        setIsDirty(true);
      }
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (landing) fd.set("landing_content", JSON.stringify(landing));
    fd.set("gallery_images", JSON.stringify(galleryImages));
    fd.set("is_combo", isCombo ? "true" : "false");
    fd.set("combo_product_ids", JSON.stringify(comboProductIds));
    if (isCombo) fd.set("template_link", "");
    startSave(async () => {
      await onSubmit(fd);
      setIsDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} onChange={() => setIsDirty(true)} className="space-y-6">

      {/* ── Thông tin cơ bản ─────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Thông tin sản phẩm</h2>
        </div>
        <div className="p-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Tên */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tên sản phẩm <span className="text-red-400">*</span></label>
            <input
              name="name"
              required
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                setIsDirty(true);
                if (!slugLocked) setSlug(slugify(e.target.value));
              }}
              placeholder="Ví dụ: Notion Second Brain"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          {/* URL Slug */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-xs font-medium text-gray-400">URL sản phẩm</label>
              {!slugLocked
                ? <span className="text-xs text-emerald-500/80 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />Tự động theo tên</span>
                : <span className="text-xs text-gray-600 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-gray-600 inline-block" />Thủ công</span>
              }
            </div>
            <div className={`flex items-center rounded-xl border bg-gray-800 overflow-hidden transition-colors ${slug ? "focus-within:border-emerald-500 border-gray-700" : "border-gray-700 focus-within:border-emerald-500"}`}>
              <span className="px-3 py-2.5 text-xs text-gray-500 border-r border-gray-700 shrink-0 select-none">/products/</span>
              <input
                name="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-"))}
                placeholder="url-san-pham"
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-600 min-w-0"
              />
              {slug && (
                <button type="button" onClick={() => { setSlug(""); setSlugLocked(false); setIsDirty(true); }}
                  title="Xóa để auto-generate lại từ tên sản phẩm"
                  className="px-3 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            {slug && (
              <p className="mt-1 text-xs text-gray-600">Link: <span className="text-gray-500">/products/{slug}</span></p>
            )}
            {!slug && !slugLocked && (
              <p className="mt-1 text-xs text-gray-600">Nhập tên sản phẩm để tự tạo URL</p>
            )}
          </div>

          {/* Danh mục */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Danh mục</label>
            <select
              name="type"
              defaultValue={product?.type ?? categories[0]?.id ?? "notion"}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Giá */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Giá bán (VND) <span className="text-red-400">*</span></label>
            <input
              name="price"
              type="number"
              required
              min={0}
              defaultValue={product?.price ?? ""}
              placeholder="99000"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Giá gốc */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Giá gốc (để trống = không có giảm giá)</label>
            <input
              name="original_price"
              type="number"
              min={0}
              defaultValue={product?.original_price ?? ""}
              placeholder="149000"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Loại sản phẩm: Đơn lẻ / Combo */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-2">Loại sản phẩm</label>
            <div className="flex gap-3">
              {[
                { value: false, label: "Sản phẩm đơn", desc: "1 link tải", icon: "📄" },
                { value: true,  label: "Combo",        desc: "Nhiều sản phẩm gộp lại", icon: "📦" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => { setIsCombo(opt.value); setIsDirty(true); }}
                  className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                    isCombo === opt.value
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  <span>{opt.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-xs opacity-70">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Template link — chỉ hiện với sản phẩm đơn */}
          {!isCombo && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Template Link <span className="text-red-400">*</span></label>
              <input
                name="template_link"
                type="url"
                required
                defaultValue={product?.template_link ?? ""}
                placeholder="https://notion.so/..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Combo product selector — chỉ hiện khi là combo */}
          {isCombo && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Sản phẩm trong combo <span className="text-red-400">*</span>
                {comboProductIds.length > 0 && (
                  <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-400">{comboProductIds.length} đã chọn</span>
                )}
              </label>
              {availableProducts.length === 0 ? (
                <p className="text-xs text-gray-500 py-3">Chưa có sản phẩm đơn nào. Hãy tạo sản phẩm đơn trước.</p>
              ) : (
                <div className="rounded-xl border border-gray-700 divide-y divide-gray-800 max-h-64 overflow-y-auto">
                  {availableProducts.map((p) => {
                    const checked = comboProductIds.includes(p.id);
                    return (
                      <label key={p.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${checked ? "bg-emerald-500/5" : "hover:bg-gray-800/50"}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setComboProductIds(prev =>
                              e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id)
                            );
                            setIsDirty(true);
                          }}
                          className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500/50"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.type === "google_sheet" ? "Google Sheets" : "Notion"} · {(p.price / 1000).toFixed(0)}k</p>
                        </div>
                        {checked && <span className="text-emerald-500 text-xs shrink-0">✓</span>}
                      </label>
                    );
                  })}
                </div>
              )}
              {isCombo && comboProductIds.length < 2 && (
                <p className="mt-1.5 text-xs text-amber-500">Cần chọn ít nhất 2 sản phẩm để tạo combo.</p>
              )}
            </div>
          )}

          {/* Image URL */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Ảnh thumbnail</label>
            <ImageUploadField
              name="image_url"
              bucket="product-images"
              folder="thumbnails"
              defaultValue={product?.image_url ?? ""}
              placeholder="https://... hoặc tải ảnh lên"
              previewSize="md"
              hint="Tỉ lệ 4:3 hoặc 16:9 — tối đa 3 MB (JPG, PNG, WebP, GIF)"
              creatorId={staffId}
            />
          </div>

          {/* Lượt tải */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Lượt tải
              {!product && (
                <span className="ml-2 rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-400">
                  Random
                </span>
              )}
            </label>
            <input
              name="download_count"
              type="number"
              min={0}
              value={downloadCount}
              onChange={(e) => setDownloadCount(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-500"
            />
            <p className="mt-1 text-xs text-gray-600">Hệ thống tự cộng thêm mỗi khi có đơn thành công</p>
          </div>

          {/* Rating */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-400">
                Điểm đánh giá (★)
              </label>
              <button
                type="button"
                onClick={() => {
                  const r = parseFloat((4.4 + Math.random() * 0.5).toFixed(1));
                  const rc = Math.floor(downloadCount * (0.1 + Math.random() * 0.23));
                  setRating(r); setRatingCount(rc); setIsDirty(true);
                }}
                className="rounded-xl bg-violet-500/10 px-2.5 py-1 text-xs text-violet-400 hover:bg-violet-500/20 transition-colors" /* đã đồng bộ design system */
              >
                ✨ Auto-fill
              </button>
            </div>
            <input
              name="rating"
              type="number"
              min={0} max={5} step={0.1}
              value={rating}
              onChange={(e) => { setRating(Number(e.target.value)); setIsDirty(true); }}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-500"
            />
            <p className="mt-1 text-xs text-gray-600">0 = không hiển thị sao. Nhấn Auto-fill để random 4.4–4.9</p>
          </div>

          {/* Rating count */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Số lượt đánh giá</label>
            <input
              name="rating_count"
              type="number"
              min={0}
              value={ratingCount}
              onChange={(e) => { setRatingCount(Number(e.target.value)); setIsDirty(true); }}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-500"
            />
            <p className="mt-1 text-xs text-gray-600">Auto-fill tự tính = 10–33% lượt tải</p>
          </div>

          {/* Label badge */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Label / Badge</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "", text: "Không có" },
                { value: "🔥 Hot", text: "🔥 Hot" },
                { value: "⭐ Bestseller", text: "⭐ Bestseller" },
                { value: "✨ Mới", text: "✨ Mới" },
                { value: "🏷️ Sale", text: "🏷️ Sale" },
                { value: "👑 Premium", text: "👑 Premium" },
                { value: "💎 Exclusive", text: "💎 Exclusive" },
              ].map((opt) => {
                const isSelected = selectedLabel === opt.value;
                return (
                  <label key={opt.value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition-colors ${
                    isSelected ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}>
                    <input type="radio" name="label" value={opt.value} checked={isSelected} onChange={() => { setSelectedLabel(opt.value); setIsDirty(true); }} className="sr-only" tabIndex={-1} />
                    {opt.text}
                  </label>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-gray-600">Hiển thị badge góc trên ảnh sản phẩm — ưu tiên hơn badge tự động (Hot/Bestseller theo lượt tải)</p>
          </div>
        </div>
      </div>

      {/* ── Thư viện ảnh thực tế ─────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Giao diện thực tế</h2>
            <p className="mt-0.5 text-xs text-gray-500">Ảnh hiển thị dạng slideshow trên trang sản phẩm — khách bấm để xem toàn màn hình</p>
          </div>
          <button type="button" onClick={() => setGalleryPickerOpen(true)}
            className="shrink-0 flex items-center gap-2 rounded-xl border border-dashed border-gray-600 px-4 py-2 text-xs font-medium text-gray-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Thêm ảnh
          </button>
        </div>
        <div className="p-6">
          {galleryImages.length === 0 ? (
            <button type="button" onClick={() => setGalleryPickerOpen(true)}
              className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-700 py-10 text-gray-600 hover:border-gray-500 hover:text-gray-400 transition-colors">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="text-sm">Upload ảnh hoặc chọn từ thư viện</span>
            </button>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {galleryImages.map((url, i) => (
                <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
                  {/* Order badge */}
                  <div className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white font-mono">{i + 1}</div>
                  {/* Remove button */}
                  <button type="button"
                    onClick={() => setGalleryImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 rounded-xl bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all" /* đã đồng bộ design system */>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {/* Add more */}
              <button type="button" onClick={() => setGalleryPickerOpen(true)}
                className="aspect-video rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 hover:border-gray-500 hover:text-gray-400 transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}
          <p className="mt-3 text-xs text-gray-600">Thứ tự ảnh từ trái sang phải = thứ tự slide. Kéo để sắp xếp lại (sắp có).</p>
        </div>
      </div>

      {/* Gallery picker modal */}
      {galleryPickerOpen && (
        <MediaPicker
          bucket="product-images"
          folder="gallery"
          onSelect={(url) => {
            setGalleryImages((prev) => prev.includes(url) ? prev : [...prev, url]);
          }}
          onClose={() => setGalleryPickerOpen(false)}
          multiSelect
          creatorId={staffId}
        />
      )}

      {/* ── Landing Page Editor ───────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Landing Page</h2>
            <p className="mt-0.5 text-xs text-gray-500">Tạo trang bán hàng: headline → nỗi đau → giải pháp → tính năng → testimonial → FAQ</p>
          </div>
          {/* Gợi ý AI */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleUseTemplate}
                className="flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
              >
                📋 Template mặc định
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
              >
                {generating ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang tạo…
                  </>
                ) : "✨ Generate AI"}
              </button>
            </div>
            {/* Trạng thái AI provider */}
            {!aiProvider ? (
              <p className="flex items-center gap-1.5 text-xs text-amber-400">
                <span>⚠️</span>
                Chưa cấu hình AI — Generate AI sẽ không hoạt động.{" "}
                <a href="/admin/settings" className="underline hover:text-amber-300 transition-colors">Cấu hình ngay</a>
              </p>
            ) : (() => {
                const p = AI_PROVIDERS.find((p) => p.value === aiProvider);
                return p ? (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    Đang dùng <span className="font-semibold">{p.label}</span>{aiModel ? ` (${aiModel})` : ""}
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-red-400">
                    <span>⚠️</span>
                    Provider không hợp lệ: &quot;{aiProvider}&quot; —{" "}
                    <a href="/admin/settings" className="underline hover:text-red-300 transition-colors">Kiểm tra cấu hình</a>
                  </p>
                );
              })()}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Hints cho AI */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Mô tả gợi ý cho AI</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={product?.description ?? ""}
              placeholder="Template giúp quản lý công việc theo hệ thống PARA, dành cho người đi làm bận rộn muốn tăng năng suất..."
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {genError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {genError}
            </p>
          )}

          {/* Editor thủ công */}
          <LandingEditor
            value={landing}
            onChange={setLanding}
            productId={product?.id}
            productSlug={product?.slug ?? (slug || undefined)}
          />
          {landing && (
            <button
              type="button"
              onClick={() => setLanding(null)}
              className="text-xs text-gray-600 hover:text-red-400 transition-colors"
            >
              ✕ Xóa toàn bộ landing page (dùng nội dung mặc định)
            </button>
          )}
        </div>
      </div>

      {/* ── Submit ────────────────────────────────────────────── */}
      <div className={`rounded-2xl px-6 py-4 border transition-colors duration-200 ${
        isDirty ? "bg-gray-950 border-emerald-500/30 shadow-xl shadow-emerald-900/20" : "bg-gray-900/50 border-gray-800"
      }`}>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 ${
              isDirty && !saving
                ? "bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30"
                : "bg-emerald-500/30 cursor-not-allowed"
            }`}
          >
            {saving ? "Đang lưu…" : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              disabled={saving}
              className="rounded-xl border border-gray-700 px-6 py-2.5 text-sm font-semibold text-gray-400 hover:border-gray-500 hover:text-gray-200 transition-colors disabled:opacity-40"
            >
              Hủy
            </button>
          )}
          {isDirty && !saving && (
            <span className="text-xs text-amber-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Có thay đổi chưa lưu
            </span>
          )}
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 111.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Đã lưu thành công
            </span>
          )}
        </div>
      </div>

      {/* ── Popup xác nhận hủy ───────────────────────────────── */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="mb-1 text-2xl text-center">⚠️</div>
            <h3 className="text-base font-semibold text-white text-center mb-2">Hủy tạo sản phẩm?</h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              {isDirty
                ? "Bạn có thay đổi chưa lưu. Nếu hủy, toàn bộ thông tin đã nhập sẽ mất."
                : "Xác nhận quay lại mà không tạo sản phẩm?"
              }
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => { setShowCancelConfirm(false); onCancel?.(); }}
                className="flex-1 rounded-xl bg-red-500/20 border border-red-500/40 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
