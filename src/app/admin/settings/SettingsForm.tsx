"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { saveSettings } from "./actions";
import type { SettingsMap } from "@/lib/settings";
import SharedImageUploadField from "@/components/ImageUploadField";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

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

  useUnsavedChanges(isDirty);

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
          label="Tagline"
          name="site_tagline"
          defaultValue={settings.site_tagline ?? ""}
          placeholder="Template Notion & Google Sheets"
          hint="Phần phụ đề sau tên site trên tab trình duyệt — ví dụ: Bộ công cụ quản lý cá nhân"
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
        <ImageUploadField
          label="Logo"
          name="logo_url"
          defaultValue={settings.logo_url ?? ""}
          placeholder="https://... hoặc TL hoặc 🚀"
          hint="URL ảnh → hiển thị ảnh · Text ngắn → hiển thị như icon chữ"
          assetKey="logo"
          onDirty={() => setIsDirty(true)}
        />
        <ColorField
          label="Màu chủ đạo"
          name="brand_color"
          defaultValue={settings.brand_color ?? "#10b981"}
        />
        <ImageUploadField
          label="Favicon"
          name="favicon_url"
          defaultValue={settings.favicon_url ?? ""}
          placeholder="https://yourdomain.com/favicon.ico"
          hint="Icon nhỏ trên tab trình duyệt — khuyến nghị .ico hoặc .png 32×32px"
          assetKey="favicon"
          accept="image/jpeg,image/png,image/webp,image/x-icon,image/vnd.microsoft.icon"
          onDirty={() => setIsDirty(true)}
        />
        <ImageUploadField
          label="Ảnh chia sẻ mạng xã hội"
          name="og_image_url"
          defaultValue={settings.og_image_url ?? ""}
          placeholder="https://yourdomain.com/og.png"
          hint="Hiển thị khi chia sẻ link lên Facebook, Zalo, Telegram… — khuyến nghị 1200×630px"
          assetKey="og_image"
          wide
          onDirty={() => setIsDirty(true)}
        />
      </Section>

      {/* ── Liên hệ ───────────────────────────────────────────── */}
      <Section
        title="Liên hệ"
        description="Kênh liên lạc hiển thị với khách hàng trong email và trang web"
      >
        <Field
          label="Email hỗ trợ"
          name="admin_email"
          type="email"
          defaultValue={settings.admin_email ?? ""}
          placeholder="admin@yourdomain.com"
          hint="Hiển thị trong email gửi khách & dùng làm Reply-To. Khuyến nghị: admin@domain.com rồi dùng Cloudflare Email Routing chuyển tiếp về Gmail cá nhân."
          tooltip="Email này hiển thị công khai trong email giao hàng cho khách — họ có thể reply vào đây để liên hệ bạn. Nên dùng email nghiêm túc (không phải Gmail cá nhân). Dùng Cloudflare Email Routing để chuyển tiếp về Gmail."
        />
        <Field
          label="Email cá nhân (ẩn)"
          name="personal_email"
          type="email"
          defaultValue={settings.personal_email ?? ""}
          placeholder="gmail@gmail.com"
          hint="Gmail nhận thư khi khách reply vào Email hỗ trợ (qua Cloudflare Email Routing). Chỉ lưu để bạn tham khảo — không hiển thị với khách hàng."
          tooltip="Email thật của bạn — không bao giờ hiển thị với khách. Dùng để ghi nhớ email Gmail cá nhân đang nhận thư qua Cloudflare Email Routing."
        />
        <Field
          label="Link Zalo"
          name="zalo_link"
          defaultValue={settings.zalo_link ?? ""}
          placeholder="https://zalo.me/g/xxxxxx"
          hint="Link Zalo cá nhân hoặc Zalo Group — hiển thị trong email gửi khách để họ liên hệ nhanh"
          tooltip="Mở Zalo → Profile → Share → copy link dạng zalo.me/0xxxxxxxxx (cá nhân) hoặc zalo.me/g/xxxxxx (nhóm). Link này xuất hiện dưới dạng nút 'Nhắn Zalo' trong email xác nhận đơn hàng."
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
          tooltip="Vào my.sepay.vn → Dịch vụ → Webhook → copy API Key. Dán vào đây. Bắt buộc phải có — nếu thiếu hệ thống sẽ từ chối tất cả webhook từ SePay và đơn hàng sẽ không tự xác nhận."
        />
        <SecretField
          label="SePay API Key"
          name="sepay_api_key"
          hasValue={!!settings.sepay_api_key}
          hint="API Key để gọi SePay API (dùng cho tính năng nâng cao — để trống nếu chưa cần)"
          tooltip="API Key để truy vấn lịch sử giao dịch từ SePay (tính năng nâng cao). Không cần thiết cho luồng mua hàng cơ bản — chỉ điền khi muốn dùng SePay API trực tiếp."
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
          tooltip="Lấy tại resend.com/api-keys → Create API Key → Full Access. Key dạng re_xxxxxxx. Cần set cả trên Cloudflare env vars (RESEND_API_KEY) để production hoạt động."
        />
        <Field
          label="From Email"
          name="resend_from_email"
          defaultValue={settings.resend_from_email ?? ""}
          placeholder="no-reply@yourdomain.com"
          hint="Phải verify domain trên Resend"
          tooltip="Địa chỉ email người gửi hiển thị với khách. Phải là domain đã verify trên Resend. Tạm thời dùng onboarding@resend.dev để test (chỉ gửi được đến email đăng ký Resend)."
        />
        <Field
          label="From Name"
          name="resend_from_name"
          defaultValue={settings.resend_from_name ?? ""}
          placeholder="TemplateLab"
          tooltip="Tên người gửi hiển thị trong hộp thư đến của khách — ví dụ: 'TemplateLab'. Nên dùng tên thương hiệu của bạn để khách nhận ra."
        />
      </Section>

      {/* ── Analytics & Tracking ──────────────────────────────── */}
      <Section
        title="Analytics & Tracking"
        description="GTM, GA4 và các Pixel quảng cáo — lưu ID tại đây, cấu hình tag trong GTM Dashboard"
      >
        <Field
          label="GTM Container ID"
          name="gtm_id"
          defaultValue={settings.gtm_id ?? ""}
          placeholder="GTM-XXXXXXX"
          hint="Google Tag Manager — sau khi nhập ID này, cấu hình GA4, Facebook Pixel, TikTok Pixel bên trong GTM Dashboard"
          tooltip="Lấy tại tagmanager.google.com → tạo Container → copy ID dạng GTM-XXXXXXX. GTM là trung tâm quản lý tất cả tracking — chỉ cần nhập 1 ID này, sau đó thêm GA4/Pixel trong GTM mà không cần sửa code."
        />
        <Field
          label="Google Analytics ID"
          name="ga_id"
          defaultValue={settings.ga_id ?? ""}
          placeholder="G-XXXXXXXXXX"
          hint="Chỉ dùng khi không có GTM. Khi đã có GTM Container ID thì cấu hình GA4 bên trong GTM."
          tooltip="Lấy tại analytics.google.com → Admin → Data Streams → Web → Measurement ID dạng G-XXXXXXXXXX. Chỉ điền vào đây nếu bạn không dùng GTM — nếu đã có GTM thì thêm GA4 tag bên trong GTM Dashboard."
        />
        <Field
          label="Facebook Pixel ID"
          name="meta_pixel_id"
          defaultValue={settings.meta_pixel_id ?? ""}
          placeholder="123456789012345"
          hint="Lấy tại Meta Business → Events Manager → Pixel ID. Thêm vào GTM tag. Dùng kèm Meta Access Token bên dưới để bật CAPI (server-side)."
          tooltip="Lấy tại business.facebook.com → Events Manager → chọn Pixel → copy ID (dãy số). Khi điền kèm Meta Access Token, hệ thống tự gửi sự kiện 'Purchase' server-side khi có đơn thành công — giúp theo dõi chính xác hơn dù khách dùng adblocker."
        />
        <SecretField
          label="Meta Access Token (CAPI)"
          name="meta_access_token"
          hasValue={!!settings.meta_access_token}
          hint="Lấy tại Meta Business → Events Manager → Pixel → Settings → Generate Access Token. Khi có token này, hệ thống tự gửi Purchase event server-side khi đơn thành công."
          tooltip="Vào business.facebook.com → Events Manager → Pixel → Settings → Generate Access Token. Token này cho phép server gửi trực tiếp sự kiện mua hàng đến Meta, vượt qua adblocker, tăng tỷ lệ tracking chính xác khi chạy quảng cáo Facebook/Instagram."
        />
        <Field
          label="TikTok Pixel ID"
          name="tiktok_pixel_id"
          defaultValue={settings.tiktok_pixel_id ?? ""}
          placeholder="CXXXXXXXXXXXXXXX"
          hint="Lấy tại TikTok Ads Manager → Assets → Events → Web Events → Pixel ID. Thêm vào GTM tag."
          tooltip="Lấy tại ads.tiktok.com → Assets → Events → Web Events → chọn Pixel → copy Pixel ID dạng CXXXXXXXXXXXXXXX. Thêm TikTok Pixel tag vào GTM để theo dõi conversion khi chạy quảng cáo TikTok."
        />
        <Field
          label="Google Ads Conversion ID"
          name="google_ads_id"
          defaultValue={settings.google_ads_id ?? ""}
          placeholder="AW-XXXXXXXXXX"
          hint="Lấy tại Google Ads → Tools → Conversions. Thêm vào GTM tag để theo dõi conversion."
          tooltip="Lấy tại ads.google.com → Tools & Settings → Conversions → chọn conversion → Tag setup → copy ID dạng AW-XXXXXXXXXX. Thêm Google Ads Conversion tag vào GTM để Google Ads biết ai đã mua sau khi click quảng cáo."
        />
      </Section>

      {/* ── Webhook nội bộ ────────────────────────────────────── */}
      <Section
        title="Cấu hình nâng cao"
        description="Webhook secret nội bộ"
      >
        <SecretField
          label="Supabase Webhook Secret"
          name="supabase_webhook_secret"
          hasValue={!!settings.supabase_webhook_secret}
          hint="Secret để xác thực webhook từ Supabase Database — phải khớp khi cấu hình Database Webhooks trong Supabase Dashboard"
          tooltip="Khi tạo Database Webhook trong Supabase, thêm HTTP Header 'x-webhook-secret' với giá trị bằng secret này. Bắt buộc để email giao hàng tự động gửi khi đơn chuyển sang 'Thành công'."
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

      {/* ── Link bảo vệ tải template ─────────────────────────── */}
      <Section
        title="Link bảo vệ tải template"
        description="Bọc link gốc trong link riêng có thời hạn — chống share link tràn lan"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Thời hạn link (giờ)
          </label>
          <select
            name="download_link_expiry_hours"
            defaultValue={settings.download_link_expiry_hours ?? "0"}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500"
          >
            <option value="0">Không giới hạn (link vĩnh cửu)</option>
            <option value="24">24 giờ</option>
            <option value="48">48 giờ</option>
            <option value="72">72 giờ (3 ngày)</option>
            <option value="168">168 giờ (7 ngày)</option>
            <option value="720">720 giờ (30 ngày)</option>
          </select>
          <p className="mt-1.5 text-xs text-gray-500">
            Khi đặt &gt; 0: email giao hàng sẽ có link /api/download/... thay vì link Notion/GSheet gốc.
            Khách mở link sau thời hạn sẽ thấy thông báo hết hạn.
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Giới hạn lượt truy cập
          </label>
          <select
            name="download_link_max_accesses"
            defaultValue={settings.download_link_max_accesses ?? "0"}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500"
          >
            <option value="0">Không giới hạn</option>
            <option value="1">1 lần</option>
            <option value="3">3 lần</option>
            <option value="5">5 lần</option>
            <option value="10">10 lần</option>
          </select>
          <p className="mt-1.5 text-xs text-gray-500">
            Sau khi vượt giới hạn, link hiện thông báo hết lượt truy cập.
          </p>
        </div>
      </Section>

      {/* ── Webhook & API URLs (read-only) ────────────────────── */}
      <Section
        title="Webhook & API URLs"
        description="Copy từng URL và dán vào dịch vụ tương ứng — không thể chỉnh sửa"
      >
        <WebhookUrlField
          label="SePay Webhook URL"
          path="/api/webhook/sepay"
          hint="Dán vào SePay Dashboard → Dịch vụ → Webhook → URL"
        />
        <WebhookUrlField
          label="Supabase DB Webhook URL"
          path="/api/webhook/order-success"
          hint="Dán vào Supabase → Database → Webhooks → URL"
        />
      </Section>

      {/* ── Submit ────────────────────────────────────────────── */}
      <div className={`rounded-2xl px-6 py-4 border transition-colors duration-200 ${
        isDirty ? "bg-gray-950 border-emerald-500/30 shadow-xl shadow-emerald-900/20" : "bg-gray-900/50 border-gray-800"
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

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative ml-1.5 inline-flex items-center align-middle group/tip">
      <span className="flex h-[15px] w-[15px] cursor-help select-none items-center justify-center rounded-full bg-gray-700 text-[9px] font-bold text-gray-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-400">
        i
      </span>
      <span className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-gray-700 bg-gray-950 px-3 py-2.5 text-xs leading-relaxed text-gray-300 opacity-0 shadow-xl transition-all duration-150 group-hover/tip:visible group-hover/tip:opacity-100">
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-950" />
      </span>
    </span>
  );
}

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
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
      <div className="divide-y divide-gray-200/60 dark:divide-gray-800/60">{children}</div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  hint,
  type = "text",
  tooltip,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  hint?: string;
  type?: string;
  tooltip?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 px-6 py-4 sm:grid-cols-3 sm:gap-4">
      <div>
        <label htmlFor={name} className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </label>
        {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      </div>
      <div className="sm:col-span-2">
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
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
        <label htmlFor={`${name}_text`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <p className="mt-0.5 text-xs text-gray-500">Mã màu HEX</p>
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-1"
        />
        <input
          id={`${name}_text`}
          name={name}
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          placeholder="#10b981"
          className="w-36 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors font-mono"
        />
        <div
          className="h-8 w-8 rounded-lg border border-gray-300 dark:border-gray-700"
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
  tooltip,
}: {
  label: string;
  name: string;
  hasValue: boolean;
  hint?: React.ReactNode;
  tooltip?: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-2 px-6 py-4 sm:grid-cols-3 sm:gap-4">
      <div>
        <label htmlFor={name} className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </label>
        {hint && <div className="mt-0.5 text-xs text-gray-500">{hint}</div>}
      </div>
      <div className="sm:col-span-2">
        {!editing && hasValue ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-gray-500 dark:text-gray-400 font-mono tracking-widest">••••••••••••</span>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
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
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors font-mono"
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
        <label htmlFor="bank_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ngân hàng</label>
        <p className="mt-0.5 text-xs text-gray-500">Dùng để tạo mã QR VietQR</p>
      </div>
      <div className="sm:col-span-2">
        <select
          id="bank_code"
          name="bank_code"
          defaultValue={defaultValue}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
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

function WebhookUrlField({
  label,
  path,
  hint,
}: {
  label: string;
  path: string;
  hint: string;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = origin ? `${origin}${path}` : "Đang tải…";

  async function copy() {
    if (!origin) return;
    await navigator.clipboard.writeText(`${origin}${path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 gap-2 px-6 py-4 sm:grid-cols-3 sm:gap-4">
      <div>
        <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{hint}</p>
      </div>
      <div className="sm:col-span-2 flex items-center gap-2">
        <input
          readOnly
          value={url}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-3.5 py-2 text-sm text-gray-500 dark:text-gray-400 font-mono outline-none select-all cursor-text"
        />
        <button
          type="button"
          onClick={copy}
          className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
            copied
              ? "border-emerald-500 text-emerald-400"
              : "border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-emerald-500 hover:text-emerald-400"
          }`}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function ImageUploadField({
  label,
  name,
  defaultValue,
  placeholder,
  hint,
  assetKey,
  accept = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml",
  wide = false,
  onDirty,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  hint?: string;
  assetKey: string;
  accept?: string;
  wide?: boolean;
  onDirty: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 px-6 py-4 sm:grid-cols-3 sm:gap-4">
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      </div>
      <div className="sm:col-span-2">
        <SharedImageUploadField
          name={name}
          bucket="site-assets"
          folder={assetKey}
          defaultValue={defaultValue}
          placeholder={placeholder}
          accept={accept}
          previewSize={wide ? "lg" : "sm"}
          onChange={onDirty}
        />
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
          <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">AI Provider</p>
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
                  : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
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
                <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p>
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
