"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductCopy, PainItem, FeatureItem, GoalItem, TestiItem, AudienceItem, IncludeItem, FaqItem } from "@/lib/productContent";
import { createClient } from "@/lib/supabase/client";

const MAX_TESTIMONIALS = 4;

const EMPTY: ProductCopy = {
  headline: "",
  subheadline: "",
  pains: [{ icon: "😓", title: "", desc: "" }],
  solutionTitle: "",
  solutionDesc: "",
  solutionFormula: { a: "", b: "", result: "" },
  features: [{ icon: "✅", title: "", desc: "" }],
  goals: [{ icon: "🎯", title: "", desc: "" }],
  testimonials: [{ text: "", name: "", role: "", avatar: "👤" }],
  audience: [{ icon: "👤", title: "", desc: "" }],
  includes: [{ title: "", desc: "" }],
  faqs: [{ q: "", a: "" }],
};

interface Props {
  value: ProductCopy | null;
  onChange: (v: ProductCopy) => void;
  productId?: string;
}

function isImageUrl(s: string) {
  return s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/");
}

function AvatarInput({
  value,
  onChange,
  productId,
  uploading,
  onUpload,
}: {
  value: string;
  onChange: (v: string) => void;
  productId?: string;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const isImg = isImageUrl(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 shrink-0 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center text-xl border border-gray-700">
          {isImg ? (
            <Image src={value} alt="avatar" width={40} height={40} className="h-full w-full object-cover" unoptimized />
          ) : (
            <span>{value || "👤"}</span>
          )}
        </div>
        <input
          value={isImg ? value : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="👤  hoặc paste link https://..."
          className={`${inputCls} flex-1 text-xs`}
        />
        <label
          className={`shrink-0 cursor-pointer rounded-xl border border-gray-700 px-3 py-2 text-xs transition-colors ${
            uploading
              ? "text-gray-600"
              : "text-gray-400 hover:border-emerald-500 hover:text-emerald-400"
          }`}
          title="Upload ảnh nhỏ (tối đa 512 KB)"
        >
          {uploading ? "⏳" : "📷 Upload"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {isImg && (
        <button
          type="button"
          onClick={() => onChange("👤")}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors"
        >
          ✕ Xóa ảnh, dùng emoji
        </button>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-400">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30";
const textareaCls = `${inputCls} resize-none`;

function SectionCard({
  title, badge, open, onToggle, children,
}: { title: string; badge?: number; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-800/40 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          {title}
          {badge !== undefined && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">{badge}</span>
          )}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

function AddBtn({ onClick, label = "Thêm" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl border border-dashed border-gray-700 px-3 py-2 text-xs text-gray-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors w-full justify-center"
    >
      <span className="text-base leading-none">+</span> {label}
    </button>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-lg p-1.5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
      title="Xóa"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LandingEditor({ value, onChange, productId }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({ hero: true });
  const [uploadingIdx, setUploadingIdx] = useState<Record<number, boolean>>({});

  function toggle(key: string) {
    setOpen((o) => ({ ...o, [key]: !o[key] }));
  }

  function patch(partial: Partial<ProductCopy>) {
    onChange({ ...(value ?? EMPTY), ...partial });
  }

  async function handleAvatarUpload(idx: number, file: File) {
    setUploadingIdx((prev) => ({ ...prev, [idx]: true }));
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const folder = productId ?? "general";
      const path = `${folder}/${Date.now()}_${idx}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      updateTesti(idx, "avatar", data.publicUrl);
    } catch (err) {
      console.error("Upload avatar thất bại:", err);
      alert("Upload thất bại. Kiểm tra bucket 'avatars' đã được tạo chưa.");
    } finally {
      setUploadingIdx((prev) => ({ ...prev, [idx]: false }));
    }
  }

  // Initialize with empty template if null
  if (!value) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-700 p-8 text-center">
        <p className="mb-4 text-sm text-gray-500">Chưa có nội dung landing page. Tạo thủ công hoặc dùng AI.</p>
        <button
          type="button"
          onClick={() => onChange(EMPTY)}
          className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
        >
          ✏️ Tạo thủ công
        </button>
      </div>
    );
  }

  const lp = value;

  // ── Array helpers ────────────────────────────────────────────────────────────

  function updatePain(i: number, field: keyof PainItem, val: string) {
    const arr = [...lp.pains];
    arr[i] = { ...arr[i], [field]: val };
    patch({ pains: arr });
  }
  function addPain() { patch({ pains: [...lp.pains, { icon: "😓", title: "", desc: "" }] }); }
  function removePain(i: number) { patch({ pains: lp.pains.filter((_, idx) => idx !== i) }); }

  function updateFeature(i: number, field: keyof FeatureItem, val: string) {
    const arr = [...lp.features];
    arr[i] = { ...arr[i], [field]: val };
    patch({ features: arr });
  }
  function addFeature() { patch({ features: [...lp.features, { icon: "✅", title: "", desc: "" }] }); }
  function removeFeature(i: number) { patch({ features: lp.features.filter((_, idx) => idx !== i) }); }

  function updateGoal(i: number, field: keyof GoalItem, val: string) {
    const arr = [...(lp.goals ?? [])];
    arr[i] = { ...arr[i], [field]: val };
    patch({ goals: arr });
  }
  function addGoal() { patch({ goals: [...(lp.goals ?? []), { icon: "🎯", title: "", desc: "" }] }); }
  function removeGoal(i: number) { patch({ goals: (lp.goals ?? []).filter((_, idx) => idx !== i) }); }

  function updateAudience(i: number, field: keyof AudienceItem, val: string) {
    const arr = [...(lp.audience ?? [])];
    arr[i] = { ...arr[i], [field]: val };
    patch({ audience: arr });
  }
  function addAudience() { patch({ audience: [...(lp.audience ?? []), { icon: "👤", title: "", desc: "" }] }); }
  function removeAudience(i: number) { patch({ audience: (lp.audience ?? []).filter((_, idx) => idx !== i) }); }

  function updateTesti(i: number, field: keyof TestiItem, val: string) {
    const arr = [...lp.testimonials];
    arr[i] = { ...arr[i], [field]: val };
    patch({ testimonials: arr });
  }
  function addTesti() {
    if (lp.testimonials.length >= MAX_TESTIMONIALS) return;
    patch({ testimonials: [...lp.testimonials, { text: "", name: "", role: "", avatar: "👤" }] });
  }
  function removeTesti(i: number) { patch({ testimonials: lp.testimonials.filter((_, idx) => idx !== i) }); }

  function updateInclude(i: number, field: keyof IncludeItem, val: string) {
    const arr = [...lp.includes];
    arr[i] = { ...arr[i], [field]: val };
    patch({ includes: arr });
  }
  function addInclude() { patch({ includes: [...lp.includes, { title: "", desc: "" }] }); }
  function removeInclude(i: number) { patch({ includes: lp.includes.filter((_, idx) => idx !== i) }); }

  function updateFaq(i: number, field: keyof FaqItem, val: string) {
    const arr = [...lp.faqs];
    arr[i] = { ...arr[i], [field]: val };
    patch({ faqs: arr });
  }
  function addFaq() { patch({ faqs: [...lp.faqs, { q: "", a: "" }] }); }
  function removeFaq(i: number) { patch({ faqs: lp.faqs.filter((_, idx) => idx !== i) }); }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Chỉnh sửa từng phần. Header, footer và nút thanh toán cố định theo template.</p>
        <div className="flex gap-2">
          {productId && (
            <a
              href={`/products/${productId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
            >
              👁 Preview
            </a>
          )}
          <button
            type="button"
            onClick={() => onChange(EMPTY)}
            className="rounded-xl border border-gray-700 px-3 py-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Xóa tất cả
          </button>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <SectionCard title="Hero — Tiêu đề & Mô tả" open={!!open.hero} onToggle={() => toggle("hero")}>
        <Field label="Headline (câu hỏi gây đồng cảm hoặc tuyên bố mạnh)">
          <textarea
            rows={2}
            value={lp.headline}
            onChange={(e) => patch({ headline: e.target.value })}
            placeholder="Đầu óc đang chứa quá nhiều thứ — và vẫn sợ quên điều quan trọng?"
            className={textareaCls}
          />
        </Field>
        <Field label="Subheadline (lợi ích cốt lõi, 1-2 câu)">
          <textarea
            rows={2}
            value={lp.subheadline}
            onChange={(e) => patch({ subheadline: e.target.value })}
            placeholder="Hệ thống giúp bạn... mọi lúc mọi nơi."
            className={textareaCls}
          />
        </Field>
      </SectionCard>

      {/* ── Nỗi đau ──────────────────────────────────────────────── */}
      <SectionCard title="Nỗi đau" badge={lp.pains.length} open={!!open.pains} onToggle={() => toggle("pains")}>
        {lp.pains.map((p, i) => (
          <div key={i} className="rounded-xl border border-gray-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Nỗi đau {i + 1}</span>
              <RemoveBtn onClick={() => removePain(i)} />
            </div>
            <div className="grid grid-cols-[60px_1fr] gap-3">
              <Field label="Icon">
                <input value={p.icon} onChange={(e) => updatePain(i, "icon", e.target.value)}
                  placeholder="😓" className={inputCls} />
              </Field>
              <Field label="Tiêu đề ngắn">
                <input value={p.title} onChange={(e) => updatePain(i, "title", e.target.value)}
                  placeholder="Phải nhớ quá nhiều thứ" className={inputCls} />
              </Field>
            </div>
            <Field label="Mô tả chi tiết">
              <textarea rows={2} value={p.desc} onChange={(e) => updatePain(i, "desc", e.target.value)}
                placeholder="Mô tả cảm giác đau của người dùng..." className={textareaCls} />
            </Field>
          </div>
        ))}
        <AddBtn onClick={addPain} label="Thêm nỗi đau" />
      </SectionCard>

      {/* ── Giải pháp ────────────────────────────────────────────── */}
      <SectionCard title="Giải pháp" open={!!open.solution} onToggle={() => toggle("solution")}>
        <Field label="Tiêu đề phần giải pháp">
          <input value={lp.solutionTitle} onChange={(e) => patch({ solutionTitle: e.target.value })}
            placeholder="Một nơi duy nhất cho mọi thứ" className={inputCls} />
        </Field>
        <Field label="Mô tả giải pháp">
          <textarea rows={2} value={lp.solutionDesc} onChange={(e) => patch({ solutionDesc: e.target.value })}
            placeholder="Template hoạt động như..." className={textareaCls} />
        </Field>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-400">Công thức (A + B = Kết quả)</label>
          <div className="grid grid-cols-3 gap-2">
            <input value={lp.solutionFormula.a}
              onChange={(e) => patch({ solutionFormula: { ...lp.solutionFormula, a: e.target.value } })}
              placeholder="📥 Yếu tố 1" className={inputCls} />
            <input value={lp.solutionFormula.b}
              onChange={(e) => patch({ solutionFormula: { ...lp.solutionFormula, b: e.target.value } })}
              placeholder="🗂️ Yếu tố 2" className={inputCls} />
            <input value={lp.solutionFormula.result}
              onChange={(e) => patch({ solutionFormula: { ...lp.solutionFormula, result: e.target.value } })}
              placeholder="🧠 Kết quả" className={inputCls} />
          </div>
        </div>
      </SectionCard>

      {/* ── Tính năng ────────────────────────────────────────────── */}
      <SectionCard title="Tính năng" badge={lp.features.length} open={!!open.features} onToggle={() => toggle("features")}>
        {lp.features.map((f, i) => (
          <div key={i} className="rounded-xl border border-gray-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Tính năng {i + 1}</span>
              <RemoveBtn onClick={() => removeFeature(i)} />
            </div>
            <div className="grid grid-cols-[60px_1fr] gap-3">
              <Field label="Icon">
                <input value={f.icon} onChange={(e) => updateFeature(i, "icon", e.target.value)}
                  placeholder="✅" className={inputCls} />
              </Field>
              <Field label="Tên tính năng">
                <input value={f.title} onChange={(e) => updateFeature(i, "title", e.target.value)}
                  placeholder="Quick Capture" className={inputCls} />
              </Field>
            </div>
            <Field label="Mô tả ngắn (1 câu)">
              <input value={f.desc} onChange={(e) => updateFeature(i, "desc", e.target.value)}
                placeholder="Ghi ý tưởng trong vài giây..." className={inputCls} />
            </Field>
          </div>
        ))}
        <AddBtn onClick={addFeature} label="Thêm tính năng" />
      </SectionCard>

      {/* ── Mục tiêu ─────────────────────────────────────────────── */}
      <SectionCard title="Mục tiêu — Kết quả đạt được" badge={lp.goals?.length} open={!!open.goals} onToggle={() => toggle("goals")}>
        {(lp.goals ?? []).map((g, i) => (
          <div key={i} className="rounded-xl border border-gray-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Mục tiêu {i + 1}</span>
              <RemoveBtn onClick={() => removeGoal(i)} />
            </div>
            <div className="grid grid-cols-[60px_1fr] gap-3">
              <Field label="Icon">
                <input value={g.icon} onChange={(e) => updateGoal(i, "icon", e.target.value)}
                  placeholder="🎯" className={inputCls} />
              </Field>
              <Field label="Tên mục tiêu">
                <input value={g.title} onChange={(e) => updateGoal(i, "title", e.target.value)}
                  placeholder="Tiết kiệm 2 giờ mỗi ngày" className={inputCls} />
              </Field>
            </div>
            <Field label="Mô tả kết quả cụ thể">
              <input value={g.desc} onChange={(e) => updateGoal(i, "desc", e.target.value)}
                placeholder="Sau khi dùng template, bạn sẽ..." className={inputCls} />
            </Field>
          </div>
        ))}
        <AddBtn onClick={addGoal} label="Thêm mục tiêu" />
      </SectionCard>

      {/* ── Đánh giá ─────────────────────────────────────────────── */}
      <SectionCard
        title="Đánh giá khách hàng"
        badge={lp.testimonials.length}
        open={!!open.testimonials}
        onToggle={() => toggle("testimonials")}
      >
        {lp.testimonials.map((t, i) => (
          <div key={i} className="rounded-xl border border-gray-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Đánh giá {i + 1}</span>
              <RemoveBtn onClick={() => removeTesti(i)} />
            </div>
            <Field label="Nội dung đánh giá">
              <textarea
                rows={3}
                value={t.text}
                onChange={(e) => updateTesti(i, "text", e.target.value)}
                placeholder="Template này thực sự thay đổi cách tôi làm việc..."
                className={textareaCls}
              />
            </Field>
            <Field label="Avatar (emoji hoặc ảnh)">
              <AvatarInput
                value={t.avatar}
                onChange={(v) => updateTesti(i, "avatar", v)}
                productId={productId}
                uploading={!!uploadingIdx[i]}
                onUpload={(file) => handleAvatarUpload(i, file)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tên">
                <input
                  value={t.name}
                  onChange={(e) => updateTesti(i, "name", e.target.value)}
                  placeholder="Minh Tuấn"
                  className={inputCls}
                />
              </Field>
              <Field label="Nghề · Thành phố">
                <input
                  value={t.role}
                  onChange={(e) => updateTesti(i, "role", e.target.value)}
                  placeholder="Designer · HCM"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        ))}
        {lp.testimonials.length < MAX_TESTIMONIALS ? (
          <AddBtn onClick={addTesti} label="Thêm đánh giá" />
        ) : (
          <p className="text-center text-xs text-gray-600">Tối đa {MAX_TESTIMONIALS} đánh giá</p>
        )}
      </SectionCard>

      {/* ── Đối tượng sử dụng ───────────────────────────────────── */}
      <SectionCard title="Đối tượng sử dụng" badge={lp.audience?.length} open={!!open.audience} onToggle={() => toggle("audience")}>
        {(lp.audience ?? []).map((a, i) => (
          <div key={i} className="rounded-xl border border-gray-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Đối tượng {i + 1}</span>
              <RemoveBtn onClick={() => removeAudience(i)} />
            </div>
            <div className="grid grid-cols-[60px_1fr] gap-3">
              <Field label="Icon">
                <input value={a.icon} onChange={(e) => updateAudience(i, "icon", e.target.value)}
                  placeholder="👤" className={inputCls} />
              </Field>
              <Field label="Nhóm đối tượng">
                <input value={a.title} onChange={(e) => updateAudience(i, "title", e.target.value)}
                  placeholder="Người đi làm bận rộn" className={inputCls} />
              </Field>
            </div>
            <Field label="Lý do phù hợp (1 câu)">
              <input value={a.desc} onChange={(e) => updateAudience(i, "desc", e.target.value)}
                placeholder="Cần hệ thống tổ chức ngay mà không cần tự build..." className={inputCls} />
            </Field>
          </div>
        ))}
        <AddBtn onClick={addAudience} label="Thêm đối tượng" />
      </SectionCard>

      {/* ── Bao gồm ──────────────────────────────────────────────── */}
      <SectionCard title="Bao gồm trong gói" badge={lp.includes.length} open={!!open.includes} onToggle={() => toggle("includes")}>
        {lp.includes.map((inc, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <input value={inc.title} onChange={(e) => updateInclude(i, "title", e.target.value)}
                placeholder="Tên mục" className={inputCls} />
              <input value={inc.desc} onChange={(e) => updateInclude(i, "desc", e.target.value)}
                placeholder="Mô tả ngắn" className={inputCls} />
            </div>
            <div className="pt-0.5"><RemoveBtn onClick={() => removeInclude(i)} /></div>
          </div>
        ))}
        <AddBtn onClick={addInclude} label="Thêm mục" />
      </SectionCard>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <SectionCard title="Câu hỏi thường gặp (FAQ)" badge={lp.faqs.length} open={!!open.faqs} onToggle={() => toggle("faqs")}>
        {lp.faqs.map((faq, i) => (
          <div key={i} className="rounded-xl border border-gray-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Câu hỏi {i + 1}</span>
              <RemoveBtn onClick={() => removeFaq(i)} />
            </div>
            <Field label="Câu hỏi">
              <input value={faq.q} onChange={(e) => updateFaq(i, "q", e.target.value)}
                placeholder="Template có phù hợp với người mới không?" className={inputCls} />
            </Field>
            <Field label="Câu trả lời">
              <textarea rows={2} value={faq.a} onChange={(e) => updateFaq(i, "a", e.target.value)}
                placeholder="Hoàn toàn phù hợp, vì..." className={textareaCls} />
            </Field>
          </div>
        ))}
        <AddBtn onClick={addFaq} label="Thêm câu hỏi" />
      </SectionCard>
    </div>
  );
}
