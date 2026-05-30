"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StepLink {
  label: string;
  href: string;
  variant?: "primary" | "secondary"; // primary = link den Settings field
}

interface Step {
  id: string;
  title: string;
  desc: string;
  links?: StepLink[];
  tips?: string;
}

interface Phase {
  id: string;
  label: string;
  color: string;
  steps: Step[];
}

const PHASES: Phase[] = [
  {
    id: "supabase",
    label: "Supabase — Database",
    color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    steps: [
      {
        id: "sb-project",
        title: "Tạo Supabase Project",
        desc: "Đăng nhập supabase.com, chọn New project, đặt tên, chọn region Singapore (ap-southeast-1), đặt mật khẩu DB. Chờ ~2 phút để project khởi tạo xong.",
        links: [{ label: "Supabase Dashboard", href: "https://supabase.com/dashboard/projects" }],
      },
      {
        id: "sb-migration",
        title: "Chạy SQL Migration",
        desc: "Trong project: SQL Editor → New query. Copy toàn bộ nội dung file supabase/deploy-via-dashboard.sql, paste vào editor, nhấn Run (Ctrl+Enter). Kiểm tra Tables: phải thấy products, orders, customers, settings, click_events.",
        links: [{ label: "Supabase SQL Editor", href: "https://supabase.com/dashboard/projects" }],
        tips: "Nếu chạy lần 2 bị lỗi \"already exists\" là bình thường — ON CONFLICT DO NOTHING giữ nguyên dữ liệu cũ.",
      },
      {
        id: "sb-keys",
        title: "Copy API Keys vào Cloudflare",
        desc: "Supabase → Settings → API → Project API keys. Copy 3 giá trị:\n  NEXT_PUBLIC_SUPABASE_URL = Project URL\n  NEXT_PUBLIC_SUPABASE_ANON_KEY = anon/public key\n  SUPABASE_SERVICE_ROLE_KEY = service_role key\nDán vào Cloudflare env vars (bước tiếp theo).",
        links: [{ label: "Supabase API Settings", href: "https://supabase.com/dashboard/projects" }],
        tips: "service_role key có quyền bypass RLS. Không commit vào git hay để lộ ra client-side.",
      },
    ],
  },
  {
    id: "cloudflare",
    label: "Cloudflare Pages — Deploy",
    color: "bg-orange-500/15 text-orange-300 border-orange-500/20",
    steps: [
      {
        id: "cf-connect",
        title: "Kết nối GitHub repo",
        desc: "Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git. Chọn GitHub repo này.\n  Build command: npx @opennextjs/cloudflare build\n  Node.js version: 22\nNhấn Save and Deploy.",
        links: [{ label: "Cloudflare Dashboard", href: "https://dash.cloudflare.com/" }],
        tips: "Lần deploy đầu tiên sẽ thất bại vì chưa có env vars — bình thường, set xong ở bước tiếp theo rồi redeploy.",
      },
      {
        id: "cf-env",
        title: "Set 6 Environment Variables",
        desc: "Cloudflare Pages → chọn project → Settings → Environment variables → Add variable. Thêm 6 biến (cho cả Production và Preview):\n  NEXT_PUBLIC_SUPABASE_URL\n  NEXT_PUBLIC_SUPABASE_ANON_KEY\n  SUPABASE_SERVICE_ROLE_KEY\n  ADMIN_PASSWORD\n  ADMIN_SECRET\n  CRON_SECRET",
        links: [
          { label: "Cloudflare Dashboard", href: "https://dash.cloudflare.com/" },
          { label: "Tạo chuỗi random", href: "https://generate-secret.vercel.app/40" },
        ],
        tips: "ADMIN_SECRET phải là chuỗi ngẫu nhiên phức tạp 32+ ký tự. Nhớ chọn Encrypt cho các biến nhạy cảm.",
      },
      {
        id: "cf-deploy",
        title: "Trigger Redeploy",
        desc: "Cloudflare Dashboard → Workers & Pages → chọn project → Deployments → Retry deployment hoặc push commit mới lên GitHub. Chờ ~3-5 phút. Truy cập domain *.workers.dev xác nhận site chạy. Thử đăng nhập /admin/login.",
        links: [{ label: "Cloudflare Dashboard", href: "https://dash.cloudflare.com/" }],
        tips: "Nếu site báo lỗi 500, kiểm tra lại Supabase keys trong Cloudflare env vars. Xem Deployment logs để thấy lỗi cụ thể.",
      },
      {
        id: "cf-cron",
        title: "Cron tự động (đã tích hợp sẵn)",
        desc: "Cloudflare Cron Triggers đã được cấu hình trong mã nguồn — không cần dịch vụ cron ngoài.\n\nHai tác vụ chạy tự động mỗi 5 phút:\n  • Hủy đơn pending quá hạn\n  • Gửi email nhắc đơn bỏ rơi (sau 15 phút)\n\nKiểm tra: Cloudflare Dashboard → Workers → chọn project → Triggers → Cron Triggers.",
        links: [{ label: "Cloudflare Workers Dashboard", href: "https://dash.cloudflare.com/" }],
        tips: "Cron Triggers chỉ hoạt động sau khi deploy lên Cloudflare, không chạy khi dev local.",
      },
    ],
  },
  {
    id: "appearance",
    label: "Giao diện site",
    color: "bg-violet-500/15 text-violet-300 border-violet-500/20",
    steps: [
      {
        id: "cfg-sitename",
        title: "Tên site và Brand",
        desc: "Nhập Tên site hiển thị trên tab trình duyệt, Tên brand hiển thị trên header, và Mô tả site dùng cho SEO.",
        links: [{ label: "Điền Tên site ngay", href: "/admin/settings#site_name", variant: "primary" }],
      },
      {
        id: "cfg-color",
        title: "Màu chủ đạo và Logo",
        desc: "Chọn màu chủ đạo (brand color) cho toàn bộ giao diện: nút bấm, highlight, email giao hàng. Nhập URL logo nếu có.",
        links: [{ label: "Chọn màu chủ đạo", href: "/admin/settings#brand_color", variant: "primary" }],
        tips: "Màu chủ đạo ảnh hưởng đến cả email gửi cho khách. Chọn kỹ một lần là xong.",
      },
      {
        id: "cfg-favicon",
        title: "Favicon và ảnh chia sẻ (tùy chọn)",
        desc: "Favicon là icon nhỏ trên tab trình duyệt. OG Image là ảnh hiển thị khi chia sẻ lên Facebook/Zalo — khuyến nghị 1200×630px.",
        links: [{ label: "Điền Favicon URL", href: "/admin/settings#favicon_url", variant: "primary" }],
      },
      {
        id: "cfg-contact",
        title: "Link liên hệ Zalo",
        desc: "Link Zalo hiển thị ở footer để khách hàng bấm vào liên hệ hỗ trợ trực tiếp.",
        links: [{ label: "Điền Link Zalo", href: "/admin/settings#zalo_link", variant: "primary" }],
      },
    ],
  },
  {
    id: "payment",
    label: "Thanh toán SePay",
    color: "bg-amber-500/15 text-amber-300 border-amber-500/20",
    steps: [
      {
        id: "cfg-bank",
        title: "Thông tin ngân hàng nhận tiền",
        desc: "Chọn ngân hàng, nhập số tài khoản, tên chủ tài khoản (VIẾT HOA KHÔNG DẤU). Đây là thông tin tạo QR VietQR cho khách chuyển khoản.",
        links: [{ label: "Cấu hình ngân hàng", href: "/admin/settings#bank_code", variant: "primary" }],
        tips: "Tên chủ tài khoản phải khớp chính xác với tên đăng ký ngân hàng.",
      },
      {
        id: "sepay-account",
        title: "Tạo tài khoản SePay và kết nối ngân hàng",
        desc: "Đăng ký tại my.sepay.vn, xác minh email. Cài đặt → Liên kết ngân hàng → kết nối tài khoản (phải cùng STK vừa điền). Chờ xác minh từ SePay.",
        links: [{ label: "SePay Dashboard", href: "https://my.sepay.vn/" }],
        tips: "SePay miễn phí cho cá nhân. Xác minh thường mất 1-2 ngày làm việc.",
      },
      {
        id: "sepay-webhook",
        title: "Tạo SePay Webhook và nhập Secret",
        desc: "SePay Dashboard → Dịch vụ → Webhook → Tạo webhook mới.\nURL: lấy từ trang Cấu hình → Thông số khác → SePay Webhook URL.\nSau khi tạo: copy API Key của webhook.",
        links: [
          { label: "SePay Dashboard", href: "https://my.sepay.vn/" },
          { label: "Nhập SePay Webhook Secret", href: "/admin/settings#sepay_webhook_secret", variant: "primary" },
        ],
        tips: "Webhook URL phải HTTPS. Cloudflare tự động có HTTPS. Test thử bằng nút Test trong SePay.",
      },
    ],
  },
  {
    id: "sb-webhook",
    label: "Supabase Database Webhook",
    color: "bg-sky-500/15 text-sky-300 border-sky-500/20",
    steps: [
      {
        id: "sb-webhook-secret",
        title: "Đặt Supabase Webhook Secret",
        desc: "Trước tiên: tự chọn 1 chuỗi bí mật bất kỳ (VD: my-secret-2024). Nhập vào Dashboard trước, sau đó dùng chính chuỗi này khi cấu hình trên Supabase.",
        links: [{ label: "Nhập Supabase Webhook Secret", href: "/admin/settings#supabase_webhook_secret", variant: "primary" }],
      },
      {
        id: "sb-webhook-create",
        title: "Tạo Supabase Database Webhook",
        desc: "Supabase → Database → Webhooks → Create a new hook.\n  Name: order-success\n  Table: orders   Events: UPDATE (chỉ chọn UPDATE)\n  URL: lấy từ Cấu hình → Thông số khác → Supabase DB Webhook URL\n  HTTP Headers: x-webhook-secret = [chuỗi bí mật đã nhập ở bước trên]\nNhấn Confirm.",
        links: [{ label: "Supabase Webhooks", href: "https://supabase.com/dashboard/projects" }],
        tips: "Webhook kích hoạt khi đơn hàng thành công để gửi email template. Phải chọn đúng event UPDATE.",
      },
    ],
  },
  {
    id: "email",
    label: "Email — Resend",
    color: "bg-rose-500/15 text-rose-300 border-rose-500/20",
    steps: [
      {
        id: "resend-key",
        title: "Resend API Key",
        desc: "Đăng ký tại resend.com (miễn phí 3.000 email/tháng). Resend → API Keys → Create API Key → copy key.",
        links: [
          { label: "Resend Dashboard", href: "https://resend.com/api-keys" },
          { label: "Nhập Resend API Key", href: "/admin/settings#resend_api_key", variant: "primary" },
        ],
      },
      {
        id: "resend-from",
        title: "Email gửi đi (From Email)",
        desc: "Nhập địa chỉ email gửi đi và tên hiển thị. Để test dùng onboarding@resend.dev. Để gửi cho mọi khách hàng cần verify domain riêng.",
        links: [
          { label: "Verify domain Resend", href: "https://resend.com/domains" },
          { label: "Nhập From Email", href: "/admin/settings#resend_from_email", variant: "primary" },
        ],
        tips: "onboarding@resend.dev chỉ gửi được đến email đã đăng ký Resend. Verify domain riêng để gửi cho tất cả khách.",
      },
    ],
  },
  {
    id: "golive",
    label: "Go Live",
    color: "bg-green-500/15 text-green-300 border-green-500/20",
    steps: [
      {
        id: "add-product",
        title: "Thêm sản phẩm đầu tiên",
        desc: "Nhập: Tên, Giá (VND), Mô tả ngắn, Template Link (link Notion để Duplicate hoặc Google Sheets), Danh mục. Kiểm tra sản phẩm hiển thị trên trang chủ.",
        links: [{ label: "Thêm sản phẩm mới", href: "/admin/products/new", variant: "primary" }],
        tips: "Template Link phải là link public để khách hàng Duplicate về workspace của họ.",
      },
      {
        id: "test-flow",
        title: "Test toàn bộ luồng mua hàng",
        desc: "Mở tab ẩn danh, vào trang chủ, chọn sản phẩm → Mua ngay, nhập email thật, tạo QR, chuyển khoản đúng nội dung (mã đơn) và đúng số tiền. Xác nhận:\n  Đơn hàng trong Admin đổi sang Thành công\n  Nhận email có link template\n  Link template hoạt động",
        tips: "Nếu không nhận được email: kiểm tra Resend logs và Supabase Webhook logs trong Supabase Dashboard.",
      },
    ],
  },
];

const TOTAL_STEPS = PHASES.reduce((acc, p) => acc + p.steps.length, 0);
const STORAGE_KEY = "admin-setup-guide-v1";

export default function SetupGuide() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(new Set(JSON.parse(saved) as string[]));
    } catch {}
    setHydrated(true);
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const reset = () => {
    setChecked(new Set());
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const doneCount = checked.size;
  const pct = Math.round((doneCount / TOTAL_STEPS) * 100);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white">Tiến trình triển khai</h2>
              {doneCount === TOTAL_STEPS ? (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">Hoàn thành!</span>
              ) : (
                <span className="text-sm text-gray-400">{doneCount}/{TOTAL_STEPS} bước</span>
              )}
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              {pct === 100 ? "Hệ thống đã sẵn sàng hoạt động!" : `Còn ${TOTAL_STEPS - doneCount} bước nữa`}
            </p>
          </div>
          {doneCount > 0 && (
            <button onClick={reset} className="shrink-0 rounded-xl border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-400 transition hover:border-gray-600 hover:text-white">
              Bắt đầu lại
            </button>
          )}
        </div>
      </div>

      {/* Phases */}
      {PHASES.map((phase) => {
        const phaseDone = phase.steps.filter((s) => checked.has(s.id)).length;
        const phaseComplete = phaseDone === phase.steps.length;
        return (
          <div key={phase.id} className={`rounded-2xl border bg-gray-900 overflow-hidden transition-opacity ${phaseComplete ? "border-gray-800 opacity-60" : "border-gray-700"}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                {phaseComplete ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                    <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 111.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-600 bg-gray-800">
                    <span className="text-xs font-bold text-gray-400">{phaseDone}/{phase.steps.length}</span>
                  </div>
                )}
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${phase.color}`}>{phase.label}</span>
              </div>
              {phaseComplete && <span className="text-xs text-emerald-400">Xong</span>}
            </div>

            <div className="divide-y divide-gray-800/60">
              {phase.steps.map((step, idx) => {
                const isDone = checked.has(step.id);
                return (
                  <div key={step.id} className={`flex gap-4 px-6 py-5 transition-colors ${isDone ? "bg-gray-900/50" : "hover:bg-gray-800/20"}`}>
                    {/* Checkbox */}
                    <button
                      onClick={() => toggle(step.id)}
                      title={isDone ? "Bỏ đánh dấu" : "Đánh dấu xong"}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        isDone ? "border-emerald-500 bg-emerald-500 hover:bg-emerald-600" : "border-gray-600 hover:border-emerald-500"
                      }`}
                    >
                      {isDone && (
                        <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 111.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <span className={`shrink-0 mt-0.5 text-xs font-mono font-bold ${isDone ? "text-gray-600" : "text-gray-500"}`}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <h3 className={`text-sm font-semibold leading-snug ${isDone ? "text-gray-500 line-through decoration-gray-600" : "text-white"}`}>
                          {step.title}
                        </h3>
                      </div>

                      <p className={`mt-2 text-xs leading-relaxed whitespace-pre-line ${isDone ? "text-gray-600" : "text-gray-400"}`}>
                        {step.desc}
                      </p>

                      {step.tips && !isDone && (
                        <div className="mt-2 flex gap-1.5 rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2">
                          <span className="shrink-0 text-xs text-amber-400 mt-0.5">💡</span>
                          <p className="text-xs text-amber-300/80">{step.tips}</p>
                        </div>
                      )}

                      {step.links && step.links.length > 0 && !isDone && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {step.links.map((link) => {
                            const isInternal = link.href.startsWith("/");
                            const cls = link.variant === "primary"
                              ? "inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition"
                              : "inline-flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs text-gray-300 transition hover:border-gray-600 hover:text-white";
                            return isInternal ? (
                              <Link key={link.href} href={link.href} className={cls}>
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                                {link.label}
                              </Link>
                            ) : (
                              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                {link.label}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
