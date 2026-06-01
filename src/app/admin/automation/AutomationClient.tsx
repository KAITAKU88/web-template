"use client";

import { useState, useTransition } from "react";
import { createAutomationRule, toggleAutomationRule, deleteAutomationRule, updateAutomationRule } from "./actions";

interface Rule {
  id: string;
  name: string;
  trigger_event: string;
  target_segment: string;
  email_subject: string | null;
  email_html: string | null;
  delay_minutes: number;
  is_active: boolean;
  created_at: string;
}

interface Group { id: string; name: string; }

const TRIGGER_LABELS: Record<string, { label: string; desc: string; icon: string }> = {
  order_success:    { label: "Thanh toán thành công", desc: "Khi đơn hàng được xác nhận", icon: "✅" },
  order_cancelled:  { label: "Đơn hàng hủy",         desc: "Khi đơn hàng bị hủy/hết hạn", icon: "❌" },
  cart_abandoned:   { label: "Bỏ giỏ hàng",           desc: "Khách nhập email nhưng không thanh toán", icon: "🛒" },
  product_published:{ label: "Sản phẩm mới publish",  desc: "Khi admin publish 1 sản phẩm", icon: "🆕" },
};

const SEGMENT_LABELS: Record<string, string> = {
  all: "Tất cả khách hàng",
  buyer: "Người vừa trigger sự kiện",
};

const TEMPLATE_VARS = [
  { var: "{{product_name}}", desc: "Tên sản phẩm" },
  { var: "{{product_url}}", desc: "Link sản phẩm" },
  { var: "{{checkout_url}}", desc: "Link thanh toán" },
  { var: "{{customer_email}}", desc: "Email khách hàng" },
  { var: "{{order_id}}", desc: "Mã đơn hàng" },
  { var: "{{site_name}}", desc: "Tên website" },
];

const DELAY_OPTIONS = [
  { value: 0,    label: "Ngay lập tức" },
  { value: 15,   label: "Sau 15 phút" },
  { value: 30,   label: "Sau 30 phút" },
  { value: 60,   label: "Sau 1 giờ" },
  { value: 360,  label: "Sau 6 giờ" },
  { value: 1440, label: "Sau 1 ngày" },
];

export default function AutomationClient({ rules: initial, groups }: { rules: Rule[]; groups: Group[] }) {
  const [rules, setRules] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editRule, setEditRule] = useState<Rule | null>(null);
  const [showVars, setShowVars] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("order_success");
  const [segment, setSegment] = useState("buyer");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [delay, setDelay] = useState(0);

  function resetForm() {
    setName(""); setTrigger("order_success"); setSegment("buyer");
    setSubject(""); setHtml(""); setDelay(0); setEditRule(null);
  }

  function openEdit(r: Rule) {
    setEditRule(r);
    setName(r.name);
    setTrigger(r.trigger_event);
    setSegment(r.target_segment);
    setSubject(r.email_subject ?? "");
    setHtml(r.email_html ?? "");
    setDelay(r.delay_minutes);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      if (editRule) {
        await updateAutomationRule(editRule.id, fd);
        setRules((rs) => rs.map((r) => r.id === editRule.id
          ? { ...r, name, trigger_event: trigger, target_segment: segment,
              email_subject: subject, email_html: html, delay_minutes: delay } : r
        ));
      } else {
        await createAutomationRule(fd);
        window.location.reload();
      }
      setShowForm(false);
      resetForm();
    });
  }

  async function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleAutomationRule(id, !current);
      setRules((rs) => rs.map((r) => r.id === id ? { ...r, is_active: !current } : r));
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa rule này?")) return;
    startTransition(async () => {
      await deleteAutomationRule(id);
      setRules((rs) => rs.filter((r) => r.id !== id));
    });
  }

  const activeCount = rules.filter((r) => r.is_active).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automation</h1>
          <p className="mt-1 text-sm text-gray-400">
            {activeCount} rule đang hoạt động · Tự động gửi email khi sự kiện xảy ra
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors"
        >
          + Tạo rule
        </button>
      </div>

      {/* Event types info */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(TRIGGER_LABELS).map(([key, { label, icon }]) => {
          const count = rules.filter((r) => r.trigger_event === key && r.is_active).length;
          return (
            <div key={key} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span>{icon}</span>
                <span className={`text-xs font-bold ${count > 0 ? "text-emerald-400" : "text-gray-600"}`}>
                  {count} rule
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-tight">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Rules list */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-16 text-center">
            <p className="text-4xl mb-3">⚡</p>
            <p className="text-gray-400 text-sm mb-3">Chưa có automation rule nào.</p>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              Tạo rule đầu tiên →
            </button>
          </div>
        ) : rules.map((r) => {
          const trigger = TRIGGER_LABELS[r.trigger_event];
          const segmentLabel = r.target_segment.startsWith("group:")
            ? groups.find((g) => g.id === r.target_segment.replace("group:", ""))?.name ?? r.target_segment
            : SEGMENT_LABELS[r.target_segment] ?? r.target_segment;
          const delayLabel = DELAY_OPTIONS.find((d) => d.value === r.delay_minutes)?.label
            ?? `Sau ${r.delay_minutes} phút`;

          return (
            <div key={r.id} className={`rounded-2xl border transition-colors ${
              r.is_active ? "border-emerald-500/20 bg-white dark:bg-gray-900" : "border-gray-200 dark:border-gray-800 bg-gray-900/50"
            }`}>
              <div className="flex items-start gap-4 p-4">
                <span className="text-2xl">{trigger?.icon ?? "⚡"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white">{r.name}</span>
                    {!r.is_active && (
                      <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">Tắt</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-gray-600 dark:text-gray-300">
                      Sự kiện: {trigger?.label ?? r.trigger_event}
                    </span>
                    <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-gray-600 dark:text-gray-300">
                      Gửi đến: {segmentLabel}
                    </span>
                    <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-gray-600 dark:text-gray-300">
                      {delayLabel}
                    </span>
                  </div>
                  {r.email_subject && (
                    <p className="mt-1.5 text-xs text-gray-500 truncate">📧 {r.email_subject}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(r.id, r.is_active)}
                    disabled={isPending}
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                      r.is_active ? "bg-emerald-500" : "bg-gray-700"
                    }`}
                    title={r.is_active ? "Tắt rule" : "Bật rule"}
                  >
                    <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
                      r.is_active ? "translate-x-4.5" : "translate-x-0.5"
                    }`} />
                  </button>
                  <button
                    onClick={() => openEdit(r)}
                    className="rounded-xl bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-700 transition-colors" /* đã đồng bộ design system */
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="rounded-xl bg-red-500/10 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors" /* đã đồng bộ design system */
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-10">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-200 dark:border-gray-800 px-6 py-4">
              <h2 className="font-bold text-gray-900 dark:text-white">{editRule ? "Sửa automation rule" : "Tạo automation rule mới"}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input type="hidden" name="action_type" value="send_email" />

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Tên rule *</label>
                <input
                  name="name" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Chào mừng khách mới mua hàng"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Sự kiện kích hoạt *</label>
                  <select
                    name="trigger_event" value={trigger} onChange={(e) => setTrigger(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                  >
                    {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-600">{TRIGGER_LABELS[trigger]?.desc}</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Gửi đến</label>
                  <select
                    name="target_segment" value={segment} onChange={(e) => setSegment(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                  >
                    <option value="buyer">Người vừa trigger sự kiện</option>
                    <option value="all">Tất cả khách hàng</option>
                    {groups.map((g) => (
                      <option key={g.id} value={`group:${g.id}`}>Nhóm: {g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Thời gian delay</label>
                <select
                  name="delay_minutes" value={delay} onChange={(e) => setDelay(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                >
                  {DELAY_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Tiêu đề email</label>
                <input
                  name="email_subject" value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder="VD: Cảm ơn bạn đã mua {{product_name}}!"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-400">Nội dung email (HTML)</label>
                  <button
                    type="button" onClick={() => setShowVars(!showVars)}
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    {showVars ? "Ẩn biến" : "Xem biến {{...}}"}
                  </button>
                </div>
                {showVars && (
                  <div className="mb-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-3">
                    <p className="mb-2 text-xs font-medium text-gray-400">Biến template có thể dùng:</p>
                    <div className="grid grid-cols-2 gap-1">
                      {TEMPLATE_VARS.map((v) => (
                        <div key={v.var} className="flex items-center gap-2">
                          <code className="rounded-lg bg-gray-700 px-1.5 py-0.5 text-xs text-emerald-400">{v.var}</code> {/* đã đồng bộ design system */}
                          <span className="text-xs text-gray-500">{v.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <textarea
                  name="email_html" value={html} onChange={(e) => setHtml(e.target.value)}
                  rows={8}
                  placeholder="<p>Xin chào,</p><p>Cảm ơn bạn đã mua <strong>{{product_name}}</strong>...</p>"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit" disabled={isPending}
                  className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Đang lưu..." : editRule ? "Cập nhật" : "Tạo rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
