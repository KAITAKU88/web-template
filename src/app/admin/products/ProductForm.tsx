"use client";

import { useTransition, useState, useRef } from "react";
import { generateLandingContent } from "./actions";
import type { ProductCopy } from "@/lib/productContent";
import type { Product } from "@/types";

interface Props {
  product?: Product;
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel?: string;
}

export default function ProductForm({ product, onSubmit, submitLabel = "Lưu sản phẩm" }: Props) {
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
        setGenError(e instanceof Error ? e.message : "Lỗi khi gọi AI");
      }
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (landing) fd.set("landing_content", JSON.stringify(landing));
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

          {/* Loại */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Loại template</label>
            <select
              name="type"
              defaultValue={product?.type ?? "notion"}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="notion">Notion</option>
              <option value="google_sheet">Google Sheets</option>
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
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Ảnh thumbnail URL</label>
            <input
              name="image_url"
              type="url"
              defaultValue={product?.image_url ?? ""}
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500"
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
        </div>
      </div>

      {/* ── AI Landing Page ───────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Landing Page (AI)</h2>
            <p className="mt-0.5 text-xs text-gray-500">Claude sẽ sinh tự động headline, nỗi đau, tính năng, testimonial, FAQ</p>
          </div>
          {landing && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Đã có nội dung AI
            </span>
          )}
        </div>
        <div className="p-6 space-y-4">
          {/* Hints cho AI */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Mô tả ngắn (gợi ý cho AI)</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={product?.description ?? ""}
                placeholder="Template giúp quản lý công việc cá nhân theo hệ thống PARA..."
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Đối tượng mục tiêu (gợi ý cho AI)</label>
              <textarea
                name="audience"
                rows={3}
                placeholder="Người đi làm văn phòng, freelancer muốn tổ chức công việc..."
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Generate button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
            >
              {generating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang sinh nội dung…
                </>
              ) : (
                <>✨ Generate với AI</>
              )}
            </button>
            {landing && (
              <button
                type="button"
                onClick={() => setLanding(null)}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Xóa nội dung AI
              </button>
            )}
          </div>

          {genError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {genError}
            </p>
          )}

          {/* Preview nội dung đã generate */}
          {landing && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Preview nội dung AI</p>
              <div>
                <p className="text-xs text-gray-500 mb-1">Headline</p>
                <p className="text-sm font-semibold text-white">{landing.headline}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Subheadline</p>
                <p className="text-sm text-gray-300">{landing.subheadline}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Tính năng ({landing.features?.length ?? 0})</p>
                <div className="flex flex-wrap gap-2">
                  {landing.features?.map((f, i) => (
                    <span key={i} className="rounded-lg bg-gray-800 px-2.5 py-1 text-xs text-gray-300">
                      {f.icon} {f.title}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">FAQ ({landing.faqs?.length ?? 0} câu hỏi)</p>
                <div className="space-y-1">
                  {landing.faqs?.slice(0, 2).map((f, i) => (
                    <p key={i} className="text-xs text-gray-400 truncate">• {f.q}</p>
                  ))}
                  {(landing.faqs?.length ?? 0) > 2 && (
                    <p className="text-xs text-gray-600">+{(landing.faqs?.length ?? 0) - 2} câu nữa…</p>
                  )}
                </div>
              </div>
            </div>
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
