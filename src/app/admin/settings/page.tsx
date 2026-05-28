import { headers } from "next/headers";
import { getSettings } from "@/lib/settings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

/* ── Cấu hình các env vars bắt buộc ────────────────────────────── */
const ENV_GROUPS = [
  {
    group: "Supabase — Database & Auth",
    href: "https://supabase.com/dashboard/projects",
    hrefLabel: "Supabase Dashboard → Settings → API",
    note: "Tạo project mới → Project Settings → API → Project API keys",
    items: [
      {
        key: "NEXT_PUBLIC_SUPABASE_URL" as const,
        label: "Supabase Project URL",
        desc: "Dạng https://xxxxx.supabase.co",
      },
      {
        key: "NEXT_PUBLIC_SUPABASE_ANON_KEY" as const,
        label: "Supabase Anon Key",
        desc: "Publishable key — anon/public",
      },
      {
        key: "SUPABASE_SERVICE_ROLE_KEY" as const,
        label: "Supabase Service Role Key",
        desc: "Secret key — chỉ dùng server-side, không expose ra client",
      },
    ],
  },
  {
    group: "Cloudflare Pages — Bảo mật Admin",
    href: "https://dash.cloudflare.com/",
    hrefLabel: "Cloudflare Dashboard → Pages → Project → Settings → Env vars",
    note: "Chọn project → Settings → Environment variables → Add variable",
    items: [
      {
        key: "ADMIN_PASSWORD" as const,
        label: "Admin Password",
        desc: "Mật khẩu đăng nhập trang /admin — đổi ngay trước khi go-live",
      },
      {
        key: "ADMIN_SECRET" as const,
        label: "Admin Secret",
        desc: "HMAC signing secret cho session token — chuỗi ngẫu nhiên 32+ ký tự",
      },
      {
        key: "CRON_SECRET" as const,
        label: "Cron Secret",
        desc: "Secret cho endpoint tự động hủy đơn hàng hết hạn",
      },
    ],
  },
] as const;

type EnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "ADMIN_PASSWORD"
  | "ADMIN_SECRET"
  | "CRON_SECRET";

/* ── Page ───────────────────────────────────────────────────────── */
export default async function AdminSettingsPage() {
  const settings = await getSettings();

  // Lấy domain hiện tại để hiển thị webhook URLs
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    process.env.CF_PAGES_URL?.replace("https://", "") ||
    "your-domain.pages.dev";
  const siteUrl = `https://${host}`;

  // Kiểm tra trạng thái các env vars bắt buộc
  const envStatus: Record<EnvKey, boolean> = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    ADMIN_SECRET: !!process.env.ADMIN_SECRET,
    CRON_SECRET: !!process.env.CRON_SECRET,
  };

  const missingCount = Object.values(envStatus).filter((v) => !v).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cấu hình hệ thống</h1>
        <p className="mt-1 text-sm text-gray-400">
          Thay đổi giao diện, tích hợp thanh toán và email — không cần sửa code
        </p>
      </div>

      <SettingsForm settings={settings} />

      {/* ── Thông số khác (Env Vars) ──────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Thông số khác</h2>
          {missingCount > 0 ? (
            <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400">
              {missingCount} chưa cấu hình
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              Đầy đủ
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Các thông số này phải cấu hình trực tiếp trên Cloudflare Pages hoặc Supabase Dashboard — không thể
          set qua giao diện vì lý do bảo mật (cần để khởi động ứng dụng).
        </p>

        {/* Webhook URLs — read-only info */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Webhook URLs</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Dán các URL này vào cấu hình SePay và Supabase
            </p>
          </div>
          <div className="divide-y divide-gray-800/60">
            <WebhookUrlRow
              label="SePay Webhook"
              url={`${siteUrl}/api/webhook/sepay`}
              hint="SePay Dashboard → Dịch vụ → Webhook → URL"
              href="https://my.sepay.vn/userapi/transactions/list"
            />
            <WebhookUrlRow
              label="Supabase DB Webhook"
              url={`${siteUrl}/api/webhook/order-success`}
              hint="Supabase Dashboard → Database → Webhooks → Create"
              href="https://supabase.com/dashboard/projects"
            />
          </div>
        </div>

        {/* Env var groups */}
        {ENV_GROUPS.map((group) => (
          <div
            key={group.group}
            className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden"
          >
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-semibold text-white">{group.group}</h3>
                <p className="mt-0.5 text-xs text-gray-500">{group.note}</p>
              </div>
              <a
                href={group.href}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 shrink-0 flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-300 transition hover:border-gray-600 hover:text-white"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {group.hrefLabel}
              </a>
            </div>
            <div className="divide-y divide-gray-800/60">
              {group.items.map((item) => (
                <EnvVarRow
                  key={item.key}
                  envKey={item.key}
                  label={item.label}
                  desc={item.desc}
                  isSet={envStatus[item.key]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function EnvVarRow({
  envKey,
  label,
  desc,
  isSet,
}: {
  envKey: string;
  label: string;
  desc: string;
  isSet: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 px-6 py-4 sm:grid-cols-3 sm:gap-4">
      <div>
        <p className="text-sm font-medium text-gray-300">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <code className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-mono text-gray-300">
          {envKey}
        </code>
        {isSet ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Đã cấu hình
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Chưa có
          </span>
        )}
      </div>
    </div>
  );
}

function WebhookUrlRow({
  label,
  url,
  hint,
  href,
}: {
  label: string;
  url: string;
  hint: string;
  href: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 px-6 py-4 sm:grid-cols-3 sm:gap-4">
      <div>
        <p className="text-sm font-medium text-gray-300">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{hint}</p>
      </div>
      <div className="sm:col-span-2 flex items-center gap-2 flex-wrap">
        <code className="flex-1 min-w-0 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-mono text-emerald-300 truncate">
          {url}
        </code>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-gray-400 transition hover:border-gray-600 hover:text-white"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Mở Dashboard
        </a>
      </div>
    </div>
  );
}
