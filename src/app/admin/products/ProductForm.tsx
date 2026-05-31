"use client";

import { useTransition, useState, useRef } from "react";
import { generateLandingContent } from "./actions";
import { buildDefaultLanding } from "@/lib/landingTemplate";
import type { ProductCopy } from "@/lib/productContent";
import type { Product } from "@/types";
import LandingEditor from "@/components/LandingEditor";
import ImageUploadField from "@/components/ImageUploadField";
import MediaPicker from "@/components/MediaPicker";

interface Category { id: string; name: string; }

interface Props {
  product?: Product;
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel?: string;
  categories?: Category[];
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "notion", name: "Notion" },
  { id: "google_sheet", name: "Google Sheets" },
];

export default function ProductForm({ product, onSubmit, submitLabel = "Lưu sản phẩm", categories = DEFAULT_CATEGORIES }: Props) {
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
  const [galleryImages, setGalleryImages] = useState<string[]>(product?.gallery_images ?? []);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);

  function handleUseTemplate() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const name = (fd.get("name") as string).trim();
    if (!name) { setGenError("Vui lòng nhập tên sản phẩm trước"); return; }
    setGenError(null);
    const category = (fd.get("type") as string) || "notion";
    const description = (fd.get("description") as string) || "";
    setLanding(buildDefaultLanding(name, category, description));
  }

  function handleGenerate() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const name = (fd.get("name") as string).trim();
    if (!name) { setGenError("Vui lòng nhập tên sản phẩm trước"); return; }

    setGenError(null);
    startGenerate(async () => {
      try {
        const content = await generateLandingContent(
          name,
          fd.get("type") as string,
          fd.get("description") as string ?? "",
          fd.get("audience") as string ?? "",
        );
        setLanding(content);
      } catch (e) {
        setGenError(e instanceof Error ? e.message : "Lỗi khi gọi AI. Thử dùng Template mặc định.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (landing) fd.set("landing_content", JSON.stringify(landing));
    fd.set("gallery_images", JSON.stringify(galleryImages));
    startSave(async () => {
      await onSubmit(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">

      {/* ── Thông tin cơ bản ─────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Thông tin sản phẩm</h2>
        </div>
        <div className="p-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Tên */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tên sản phẩm <span className="text-red-400">*</span></label>
            <input
              name="name"
              required
              defaultValue={product?.name ?? ""}
              placeholder="Ví dụ: Notion Second Brain"
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          {/* Danh mục */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Danh mục</label>
            <select
              name="type"
              defaultValue={product?.type ?? categories[0]?.id ?? "notion"}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
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
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500"
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
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Template link */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Template Link <span className="text-red-400">*</span></label>
            <input
              name="template_link"
              type="url"
              required
              defaultValue={product?.template_link ?? ""}
              placeholder="https://notion.so/..."
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500"
            />
          </div>

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
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500"
            />
            <p className="mt-1 text-xs text-gray-600">Hệ thống tự cộng thêm mỗi khi có đơn thành công</p>
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
                const checked = (product?.label ?? "") === opt.value;
                return (
                  <label key={opt.value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition-colors ${
                    checked ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}>
                    <input type="radio" name="label" value={opt.value} defaultChecked={checked} className="sr-only" />
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
      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Giao diện thực tế</h2>
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
                    className="absolute right-1 top-1 rounded-lg bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">
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
        />
      )}

      {/* ── Landing Page Editor ───────────────────────────────── */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-white">Landing Page</h2>
            <p className="mt-0.5 text-xs text-gray-500">Tạo trang bán hàng: headline → nỗi đau → giải pháp → tính năng → testimonial → FAQ</p>
          </div>
          {/* Gợi ý AI */}
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
        </div>

        <div className="p-6 space-y-4">
          {/* Hints cho AI — thu gọn */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Mô tả ngắn (gợi ý cho AI)</label>
              <textarea
                name="description"
                rows={2}
                defaultValue={product?.description ?? ""}
                placeholder="Template giúp quản lý công việc theo hệ thống PARA..."
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Đối tượng mục tiêu (gợi ý cho AI)</label>
              <textarea
                name="audience"
                rows={2}
                placeholder="Người đi làm văn phòng, freelancer..."
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          <p className="text-xs text-gray-600">
            <span className="text-emerald-500">Template mặc định</span> — hoạt động ngay, không cần API key.
            <span className="ml-2 text-violet-400">Generate AI</span> — cần Claude/Gemini API trong Cấu hình.
          </p>

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
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50 transition-colors"
        >
          {saving ? "Đang lưu…" : submitLabel}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-400">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 111.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Đã lưu
          </span>
        )}
      </div>
    </form>
  );
}
