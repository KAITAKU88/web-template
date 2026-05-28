"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { saveSettings } from "./actions";
import type { SettingsMap } from "@/lib/settings";

export default function SettingsForm({ settings }: { settings: SettingsMap }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-focus field khi navigate đến /admin/settings#field_name (từ Hướng dẫn)
  useEffect(() => {
    const focusFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;
      const el = document.getElementById(hash);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLInputElement).focus?.();
      el.style.transition = "box-shadow 0.2s ease";
      el.style.boxShadow = "0 0 0 3px #10b981, 0 0 0 5px rgba(16,185,129,0.25)";
      setTimeout(() => { el.style.boxShadow = ""; }, 2500);
    };
    const t = setTimeout(focusFromHash, 150);
    window.addEventListener("hashchange", focusFromHash);
    return () => { clearTimeout(t); window.removeEventListener("hashchange", focusFromHash); };
  }, []);

  // Cảnh báo khi đóng/refresh tab mà chưa lưu
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    if (isDirty) window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Expose dirty state để Sidebar có thể chặn navigation
  useEffect(() => {
    (window as Window & { __adminSettingsDirty?: boolean }).__adminSettingsDirty = isDirty;
    return () => {
      (window as Window & { __adminSettingsDirty?: boolean }).__adminSettingsDirty = false;
    };
  }, [isDirty]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await saveSettings(formData);
      setIsDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} onChange={() => setIsDirty(true)} className="space-y-8">

      {/* ── Giao diện ─────────────────────────────────────────── */}
      <Section
        title="Giao diện"
        description="Tên site, logo và màu chủ đạo hiển thị cho khách hàng"
      >
        <Field
          label="Tên site"
          name="site_name"
          defaultValue={settings.site_name ?? ""}
          placeholder="TemplateLab"
          hint="Hiển thị trên tab trình duyệt và footer"
        />
        <Field
          label="Mô tả site"
          name="site_description"
          defaultValue={settings.site_description ?? ""}
          placeholder="Mua template chất lượng cao, nhận link qua email tức thì"
          hint="Dùng cho SEO (meta description) và chia sẻ mạng xã hội"
        />
        <Field
          label="Tên brand"
          name="brand_name"
          defaultValue={settings.brand_name ?? ""}
          placeholder="TemplateLab"
          hint="Hiển thị ở logo trên header"
        />
        <Field
          label="Logo (ảnh hoặc text)"
          name="logo_url"
          defaultValue={settings.logo_url ?? ""}
          placeholder="https://... hoặc TL hoặc 🚀"
          hint="URL ảnh → hiển thị ảnh · Text ngắn → hiển thị như icon"
        />
        <ColorField
          label="Màu chủ đạo"
          name="brand_color"
          defaultValue={settings.brand_color ?? "#10b981"}
        />
        <Field
          label="Favicon URL"
          name="favicon_url"
          defaultValue={settings.favicon_url ?? ""}
          placeholder="https://yourdomain.com/favicon.ico"
          hint="Icon nhỏ hiển thị trên tab trình duyệt"
        />
        <Field
          label="Ảnh chia sẻ mạng xã hội"
          name="og_image_url"
          defaultValue={settings.og_image_url ?? ""}
          placeholder="https://yourdomain.com/og.png"
          hint="Hiển thị khi chia sẻ link lên Facebook, Zalo, Telegram… — khuyến nghị 1200×630px"
        />
      </Section>

      {/* ── Liên hệ ───────────────────────────────────────────── */}
      <Section
        title="Liên hệ"
        description="Kênh liên lạc hiển thị với khách hàng"
      >
        <Field
          label="Link Zalo"
          name="zalo_link"
          defaultValue={settings.zalo_link ?? ""}
          placeholder="https://zalo.me/0xxxxxxxxx"
        />
        <Field
          label="Link Facebook"
          name="facebook_link"
          defaultValue={settings.facebook_link ?? ""}
          placeholder="https://facebook.com/yourpage"
        />
      </Section>

      {/* ── Thanh toán ────────────────────────────────────────── */}
      <Section
        title="Thanh toán (SePay)"
        description="Thông tin tài khoản ngân hàng để tạo QR và xác thực webhook SePay"
      >
        <BankCodeField defaultValue={settings.bank_code ?? ""} />
        <Field
          label="Số tài khoản ngân hàng"
          name="bank_account_number"
          defaultValue={settings.bank_account_number ?? ""}
          placeholder="0123456789"
        />
        <Field
          label="Tên chủ tài khoản"
          name="bank_account_holder"
          defaultValue={settings.bank_account_holder ?? ""}
          placeholder="NGUYEN VAN A"
        />
        <SecretField
          label="SePay Webhook Secret"
          name="sepay_webhook_secret"
          hasValue={!!settings.sepay_webhook_secret}
          hint="Secret để xác thực request từ SePay — phải khớp với cấu hình trong SePay Dashboard → Webhook → API Key"
        />
        <SecretField
          label="SePay API Key"
          name="sepay_api_key"
          hasValue={!!settings.sepay_api_key}
          hint="API Key để gọi SePay API (dùng cho tính năng nâng cao — để trống nếu chưa cần)"
        />
      </Section>

      {/* ── Email ─────────────────────────────────────────────── */}
      <Section
        title="Email (Resend)"
        description="Cấu hình gửi email xác nhận đơn hàng tự động"
      >
        <SecretField
          label="Resend API Key"
          name="resend_api_key"
          hasValue={!!settings.resend_api_key}
          hint="Để trống = giữ nguyên key cũ"
        />
        <Field
          label="From Email"
          name="resend_from_email"
          defaultValue={settings.resend_from_email ?? ""}
          placeholder="no-reply@yourdomain.com"
          hint="Phải verify domain trên Resend"
        />
        <Field
          label="From Name"
          name="resend_from_name"
          defaultValue={settings.resend_from_name ?? ""}
          placeholder="TemplateLab"
        />
      </Section>

      {/* ── Analytics & Webhook nội bộ ────────────────────────── */}
      <Section
        title="Analytics & Cấu hình nâng cao"
        description="Google Analytics và webhook secret nội bộ — cần thiết khi triển khai"
      >
        <Field
          label="Google Analytics ID"
          name="ga_id"
          defaultValue={settings.ga_id ?? ""}
          placeholder="G-XXXXXXXXXX"
          hint="Mã GA4 để theo dõi lượt truy cập — lấy tại Google Analytics → Admin → Data Streams"
        />
        <SecretField
          label="Supabase Webhook Secret"
          name="supabase_webhook_secret"
          hasValue={!!settings.supabase_webhook_secret}
          hint="Secret để xác thực webhook từ Supabase Database — phải khớp khi cấu hình Database Webhooks trong Supabase Dashboard"
        />
      </Section>

      {/* ── AI Provider ───────────────────────────────────────── */}
      <Section
        title="AI — Sinh Landing Page"
        description="Tự động tạo nội dung marketing khi thêm sản phẩm mới"
      >
        <ProviderField
          currentProvider={settings.ai_provider ?? "claude"}
          hasClaudeKey={!!settings.claude_api_key}
          hasGeminiKey={!!settings.gemini_api_key}
        />
      </Section>

      {/* ── Submit ────────────────────────────────────────────── */}
      <div className={`sticky bottom-0 -mx-0 rounded-2xl transition-all duration-300 ${
        isDirty ? "bg-gray-950/95 backdrop-blur border border-emerald-500/30 px-6 py-4 shadow-xl shadow-emerald-900/20" : "px-0 py-2"
      }`}>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={!isDirty || pending}
            className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 ${
              isDirty && !pending
                ? "bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 animate-pulse-once"
                : "bg-emerald-500/30 cursor-not-allowed"
            }`}
          >
            {pending ? "Đang lưu…" : "Lưu cấu hình"}
          </button>
          {isDirty && !pending && (
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
    </form>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
      <div className="divide-y divide-gray-800/60">{children}</div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 px-6 py-4 sm:grid-cols-3 sm:gap-4">
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      </div>
      <div className="sm:col-span-2">
        <input
          id={name}
          name={name}
          type="text"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
        />
      </div>
    </div>
  );
}

function ColorField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  const [hex, setHex] = useState(defaultValue);

  return (
    <div className="grid grid-cols-1 gap-2 px-6 py-4 sm:grid-cols-3 sm:gap-4">
      <div>
        <label htmlFor={`${name}_text`} className="block text-sm font-medium text-gray-300">
          {label}
        </label>
        <p className="mt-0.5 text-xs text-gray-500">Mã màu HEX</p>
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border border-gray-700 bg-gray-800 p-1"
        />
        <input
          id={`${name}_text`}
          name={name}
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          placeholder="#10b981"
          className="w-36 rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors font-mono"
        />
        <div
          className="h-8 w-8 rounded-lg border border-gray-700"
          style={{ backgroundColor: hex }}
        />
      </div>
    </div>
  );
}

function SecretField({
  label,
  name,
  hasValue,
  hint,
}: {
  label: string;
  name: string;
  hasValue: boolean;
  hint?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-2 px-6 py-4 sm:grid-cols-3 sm:gap-4">
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300">
          {label}
        </label>
        {hint && <div className="mt-0.5 text-xs text-gray-500">{hint}</div>}
      </div>
      <div className="sm:col-span-2">
        {!editing && hasValue ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-gray-400 font-mono tracking-widest">••••••••••••</span>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
            >
              Thay đổi
            </button>
            <input type="hidden" name={name} value="" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              id={name}
              name={name}
              type="text"
              autoFocus={editing}
              placeholder={hasValue ? "Nhập key mới để thay đổi" : "Nhập API key…"}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors font-mono"
            />
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="shrink-0 text-xs text-gray-500 hover:text-gray-300"
              >
                Hủy
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const BANKS = [
  { code: "MB",   name: "MB Bank" },
  { code: "VCB",  name: "Vietcombank" },
  { code: "TCB",  name: "Techcombank" },
  { code: "ACB",  name: "ACB" },
  { code: "BIDV", name: "BIDV" },
  { code: "VTB",  name: "Vietinbank" },
  { code: "AGR",  name: "Agribank" },
  { code: "TPB",  name: "TPBank" },
  { code: "VPB",  name: "VPBank" },
  { code: "STB",  name: "Sacombank" },
  { code: "HDB",  name: "HDBank" },
  { code: "OCB",  name: "OCB" },
  { code: "SHB",  name: "SHB" },
  { code: "MSB",  name: "MSB" },
  { code: "EIB",  name: "Eximbank" },
];

function BankCodeField({ defaultValue }: { defaultValue: string }) {
  return (
    <div className="grid grid-cols-1 gap-2 px-6 py-4 sm:grid-cols-3 sm:gap-4">
      <div>
        <label htmlFor="bank_code" className="block text-sm font-medium text-gray-300">Ngân hàng</label>
        <p className="mt-0.5 text-xs text-gray-500">Dùng để tạo mã QR VietQR</p>
      </div>
      <div className="sm:col-span-2">
        <select
          id="bank_code"
          name="bank_code"
          defaultValue={defaultValue}
          className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
        >
          <option value="">-- Chọn ngân hàng --</option>
          {BANKS.map((b) => (
            <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ProviderField({
  currentProvider,
  hasClaudeKey,
  hasGeminiKey,
}: {
  currentProvider: string;
  hasClaudeKey: boolean;
  hasGeminiKey: boolean;
}) {
  const [provider, setProvider] = useState(currentProvider);

  return (
    <>
      {/* Provider selector */}
      <div className="grid grid-cols-1 gap-2 px-6 py-4 sm:grid-cols-3 sm:gap-4">
        <div>
          <p className="block text-sm font-medium text-gray-300">AI Provider</p>
          <p className="mt-0.5 text-xs text-gray-500">Mặc định dùng Claude</p>
        </div>
        <div className="sm:col-span-2 flex gap-3">
          {[
            { value: "claude", label: "Claude (Anthropic)", badge: "Trả phí", badgeCls: "bg-violet-500/20 text-violet-300" },
            { value: "gemini", label: "Gemini (Google)", badge: "Miễn phí", badgeCls: "bg-emerald-500/20 text-emerald-300" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                provider === opt.value
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-gray-700 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="ai_provider"
                value={opt.value}
                checked={provider === opt.value}
                onChange={() => setProvider(opt.value)}
                className="accent-emerald-500"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{opt.label}</p>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${opt.badgeCls}`}>
                  {opt.badge}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Claude API Key */}
      <div className={provider !== "claude" ? "opacity-40 pointer-events-none" : ""}>
        <SecretField
          label="Claude API Key"
          name="claude_api_key"
          hasValue={hasClaudeKey}
          hint={
            <span>
              ~$0.003/lần generate ·{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
              >
                Lấy API key tại đây →
              </a>
            </span>
          }
        />
      </div>

      {/* Gemini API Key */}
      <div className={provider !== "gemini" ? "opacity-40 pointer-events-none" : ""}>
        <SecretField
          label="Gemini API Key"
          name="gemini_api_key"
          hasValue={hasGeminiKey}
          hint={
            <span>
              Miễn phí 1.500 req/ngày ·{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
              >
                Lấy API key tại đây →
              </a>
            </span>
          }
        />
      </div>
    </>
  );
}
