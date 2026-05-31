"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

interface Product { id: string; name: string; }
interface Campaign {
  id?: string; name: string; subject: string; html_body: string;
  segment: string; status: string;
}

// Template mẫu cho email marketing
const TEMPLATES = [
  {
    id: "blank",
    label: "Trống",
    subject: "",
    body: `<p>Xin chào,</p>\n<p>Nội dung email tại đây...</p>`,
  },
  {
    id: "new_product",
    label: "Sản phẩm mới",
    subject: "🎉 Sản phẩm mới vừa ra mắt — {{product_name}}",
    body: `<p>Xin chào,</p>
<p>Chúng tôi vừa ra mắt sản phẩm mới: <strong>{{product_name}}</strong></p>
<p>{{product_description}}</p>
<div style="text-align:center;margin:24px 0;">
  <a href="{{product_url}}" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;">Xem ngay →</a>
</div>
<p style="color:#9ca3af;font-size:12px;">Bạn nhận email này vì đã từng mua hàng tại chúng tôi.</p>`,
  },
  {
    id: "re_engage",
    label: "Re-engagement",
    subject: "Lâu rồi không gặp! 30 ngày chưa quay lại",
    body: `<p>Xin chào,</p>
<p>Chúng tôi nhận thấy đã lâu bạn chưa ghé thăm. Có những template mới phù hợp với bạn không?</p>
<div style="text-align:center;margin:24px 0;">
  <a href="{{site_url}}" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;">Xem template mới →</a>
</div>
<p style="color:#9ca3af;font-size:12px;">Bạn nhận email này vì đã từng mua hàng tại chúng tôi.</p>`,
  },
  {
    id: "discount",
    label: "Ưu đãi giảm giá",
    subject: "🎁 Ưu đãi đặc biệt dành riêng cho bạn",
    body: `<p>Xin chào,</p>
<p>Cảm ơn bạn đã tin tưởng chúng tôi. Để tri ân, chúng tôi dành riêng cho bạn ưu đãi đặc biệt:</p>
<div style="text-align:center;margin:24px 0;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;">
  <p style="font-size:32px;font-weight:800;color:#16a34a;margin:0;">Giảm 20%</p>
  <p style="color:#374151;margin:8px 0 0;">Cho tất cả sản phẩm — chỉ trong 48 giờ</p>
</div>
<div style="text-align:center;margin:24px 0;">
  <a href="{{site_url}}" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;">Mua ngay →</a>
</div>`,
  },
];

const inputCls = "w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors";
const textareaCls = `${inputCls} resize-none`;

export default function CampaignForm({
  campaign,
  products,
  recipientPreview,
}: {
  campaign?: Campaign;
  products: Product[];
  recipientPreview: Record<string, number>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name,    setName]    = useState(campaign?.name    ?? "");
  const [subject, setSubject] = useState(campaign?.subject ?? "");
  const [body,    setBody]    = useState(campaign?.html_body ?? TEMPLATES[0].body);
  const [segment, setSegment] = useState(campaign?.segment  ?? "all");

  const isDraft = !campaign || campaign.status === "draft";
  const recipientCount = recipientPreview[segment] ?? 0;

  const isDirty = name !== (campaign?.name ?? "") ||
    subject !== (campaign?.subject ?? "") ||
    body !== (campaign?.html_body ?? TEMPLATES[0].body);
  useUnsavedChanges(isDirty && isDraft);

  function applyTemplate(tpl: typeof TEMPLATES[0]) {
    if (tpl.subject) setSubject(tpl.subject);
    setBody(tpl.body);
  }

  async function handleSave(andSend = false) {
    setError(""); setSuccess("");
    if (!name.trim() || !subject.trim() || !body.trim()) {
      setError("Vui lòng điền đầy đủ tên, tiêu đề và nội dung.");
      return;
    }
    if (andSend) setSending(true); else setSaving(true);
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: campaign?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: campaign?.id,
          name, subject, html_body: body, segment,
          action: andSend ? "send" : "save",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Có lỗi xảy ra."); return; }
      if (andSend) {
        setSuccess(`Đã gửi đến ${data.sent_count} khách hàng!`);
        setTimeout(() => router.push("/admin/marketing"), 2000);
      } else {
        setSuccess("Đã lưu nháp.");
        if (!campaign?.id) router.push(`/admin/marketing/${data.id}/edit`);
      }
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setSaving(false); setSending(false);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => startTransition(() => router.push("/admin/marketing"))}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Quay lại
        </button>
        <h1 className="text-xl font-bold text-white">
          {campaign?.id ? "Chỉnh sửa campaign" : "Tạo campaign mới"}
        </h1>
      </div>

      {/* Template picker */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <p className="text-xs font-medium text-gray-400 mb-3">Template mẫu</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="rounded-xl border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-4">

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">Tên campaign (nội bộ)</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="VD: Ra mắt sản phẩm tháng 6" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">Phân khúc khách hàng</label>
          <select value={segment} onChange={(e) => setSegment(e.target.value)}
            className={inputCls}>
            <option value="all">Tất cả khách hàng ({recipientPreview.all ?? 0} người)</option>
            <option value="recent_30d">Mua trong 30 ngày ({recipientPreview.recent_30d ?? 0} người)</option>
            {products.map((p) => (
              <option key={p.id} value={`product:${p.id}`}>
                Người mua: {p.name} ({recipientPreview[`product:${p.id}`] ?? 0} người)
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-600">Sẽ gửi đến ~{recipientCount} email</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">Tiêu đề email (Subject)</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="🎉 Sản phẩm mới vừa ra mắt!" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">Nội dung HTML</label>
          <p className="text-xs text-gray-600 mb-1">
            Variables: <code className="text-gray-500">{"{{site_url}}"}</code> — tự động thay thế khi gửi
          </p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            className={textareaCls}
            placeholder="<p>Xin chào...</p>"
          />
        </div>

        {error && <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}
        {success && <p className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">{success}</p>}

        {isDraft && (
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving || sending || !!success}
              className="flex-1 rounded-xl border border-gray-700 py-2.5 text-sm font-medium text-gray-300 hover:border-gray-600 hover:text-white transition-colors disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu nháp"}
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || sending || !!success || recipientCount === 0}
              className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Đang gửi..." : `Gửi ngay → ${recipientCount} người`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
