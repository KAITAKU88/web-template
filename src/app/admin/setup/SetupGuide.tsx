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
        desc: "Dang nhap supabase.com, chon New project, dat ten, chon region Singapore (ap-southeast-1), dat mat khau DB. Cho ~2 phut de project khoi tao xong.",
        links: [{ label: "Supabase Dashboard", href: "https://supabase.com/dashboard/projects" }],
      },
      {
        id: "sb-migration",
        title: "Chạy SQL Migration",
        desc: "Trong project: SQL Editor, New query. Copy toan bo noi dung file supabase/deploy-via-dashboard.sql, paste vao editor, nhan Run (Ctrl+Enter). Kiem tra Tables: phai thay products, orders, customers, settings, click_events.",
        links: [{ label: "Supabase SQL Editor", href: "https://supabase.com/dashboard/projects" }],
        tips: "Neu chay lan 2 bi loi already exists la binh thuong, ON CONFLICT DO NOTHING giu nguyen du lieu cu.",
      },
      {
        id: "sb-keys",
        title: "Copy API Keys vào Cloudflare Pages",
        desc: "Supabase, Settings, API, Project API keys. Copy 3 gia tri:\n  NEXT_PUBLIC_SUPABASE_URL = Project URL\n  NEXT_PUBLIC_SUPABASE_ANON_KEY = anon/public key\n  SUPABASE_SERVICE_ROLE_KEY = service_role key\nPaste vao Cloudflare env vars (bước tiep theo).",
        links: [{ label: "Supabase API Settings", href: "https://supabase.com/dashboard/projects" }],
        tips: "service_role key co quyen bypass RLS. Khong commit vao git hay de lo ra client-side.",
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
        desc: "Cloudflare Dashboard, Workers & Pages, Create application, Pages, Connect to Git. Chon GitHub repo nay. Framework preset: Next.js (hoac None).\n  Build command: npx @opennextjs/cloudflare build\n  Build output directory: .open-next/assets\n  Node.js version: 18 (hoac cao hon)\nNhan Save and Deploy.",
        links: [{ label: "Cloudflare Dashboard", href: "https://dash.cloudflare.com/" }],
        tips: "Lan deploy dau tien se that bai vi chua co env vars — binh thuong, set xong o buoc tiep theo roi redeploy.",
      },
      {
        id: "cf-env",
        title: "Set 6 Environment Variables",
        desc: "Cloudflare Pages, chon project, Settings, Environment variables, Add variable. Them 6 bien (cho ca Production va Preview):\n  NEXT_PUBLIC_SUPABASE_URL\n  NEXT_PUBLIC_SUPABASE_ANON_KEY\n  SUPABASE_SERVICE_ROLE_KEY\n  ADMIN_PASSWORD\n  ADMIN_SECRET\n  CRON_SECRET",
        links: [
          { label: "Cloudflare Dashboard", href: "https://dash.cloudflare.com/" },
          { label: "Tạo chuỗi random", href: "https://generate-secret.vercel.app/40" },
        ],
        tips: "ADMIN_SECRET phai la chuoi ngau nhien phuc tap 32+ ky tu. Nho chon Encrypt cho cac bien nhay cam.",
      },
      {
        id: "cf-deploy",
        title: "Trigger Redeploy",
        desc: "Cloudflare Pages, Deployments, Retry deployment hoac push commit moi. Cho ~3-5 phut. Truy cap domain *.pages.dev xac nhan site chay. Thu dang nhap /admin/login.",
        links: [{ label: "Cloudflare Dashboard", href: "https://dash.cloudflare.com/" }],
        tips: "Neu site bao loi 500, kiem tra lai Supabase keys trong Cloudflare env vars. Kiem tra Deployment logs de xem loi cu the.",
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
        desc: "Nhap Ten site hien thi tren tab trinh duyet, Ten brand hien thi tren header, va Mo ta site dung cho SEO.",
        links: [{ label: "Điền Tên site ngay", href: "/admin/settings#site_name", variant: "primary" }],
      },
      {
        id: "cfg-color",
        title: "Màu chủ đạo và Logo",
        desc: "Chọn màu chủ đạo (brand color) cho toan bo giao dien: nut bam, highlight, email giao hang. Nhap URL logo neu co.",
        links: [{ label: "Chọn màu chủ đạo", href: "/admin/settings#brand_color", variant: "primary" }],
        tips: "Mau chu dao anh huong den ca email gui cho khach. Chon ky mot lan la xong.",
      },
      {
        id: "cfg-favicon",
        title: "Favicon và ảnh chia sẻ (tùy chọn)",
        desc: "Favicon la icon nho tren tab trinh duyet. OG Image la anh hien thi khi chia se len Facebook/Zalo — khuyen nghi 1200x630px.",
        links: [{ label: "Điền Favicon URL", href: "/admin/settings#favicon_url", variant: "primary" }],
      },
      {
        id: "cfg-contact",
        title: "Link liên hệ Zalo và Facebook",
        desc: "Link Zalo hien thi o footer de khach hang bam vao lien he ho tro truc tiep. Facebook la tuy chon.",
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
        desc: "Chon ngan hang, nhap so tai khoan, ten chu tai khoan (viet hoa khong dau). Day la thong tin tao QR VietQR cho khach chuyen khoan.",
        links: [{ label: "Cấu hình ngân hàng", href: "/admin/settings#bank_code", variant: "primary" }],
        tips: "Ten chu tai khoan phai khop chinh xac voi ten dang ky ngan hang.",
      },
      {
        id: "sepay-account",
        title: "Tạo tài khoản SePay và kết nối ngân hàng",
        desc: "Dang ky tai my.sepay.vn, xac minh email. Cai dat, Lien ket ngan hang, ket noi tai khoan (phai cung STK vua dien). Cho xac minh tu SePay.",
        links: [{ label: "SePay Dashboard", href: "https://my.sepay.vn/" }],
        tips: "SePay mien phi cho ca nhan. Xac minh thuong mat 1-2 ngay lam viec.",
      },
      {
        id: "sepay-webhook",
        title: "Tạo SePay Webhook và nhập Secret",
        desc: "SePay Dashboard, Dich vu, Webhook, Tao webhook moi.\nURL: lay tu trang Cau hinh, phan Thong so khac.\nSau khi tao: copy API Key cua webhook.",
        links: [
          { label: "SePay Dashboard", href: "https://my.sepay.vn/" },
          { label: "Nhập SePay Webhook Secret", href: "/admin/settings#sepay_webhook_secret", variant: "primary" },
        ],
        tips: "Webhook URL phai HTTPS. Cloudflare Pages tu dong co HTTPS. Test thu bang nut Test trong SePay.",
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
        desc: "Truoc tien: tu chon 1 chuoi bi mat bat ky (VD: my-secret-2024). Nhap vao Dashboard truoc, sau do dung chinh chuoi nay khi cau hinh tren Supabase.",
        links: [{ label: "Nhập Supabase Webhook Secret", href: "/admin/settings#supabase_webhook_secret", variant: "primary" }],
      },
      {
        id: "sb-webhook-create",
        title: "Tạo Supabase Database Webhook",
        desc: "Supabase, Database, Webhooks, Create a new hook.\n  Name: order-success\n  Table: orders   Events: UPDATE (chi chon UPDATE)\n  URL: lay tu Cau hinh, Thong so khac, Supabase DB Webhook URL\n  HTTP Headers: x-webhook-secret = [chuoi bi mat da nhap o bước tren]\nNhan Confirm.",
        links: [{ label: "Supabase Webhooks", href: "https://supabase.com/dashboard/projects" }],
        tips: "Webhook kich hoat khi don hang thanh cong de gui email template. Phai chon dung event UPDATE.",
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
        desc: "Dang ky tai resend.com (mien phi 3.000 email/thang). Resend, API Keys, Create API Key, copy key.",
        links: [
          { label: "Resend Dashboard", href: "https://resend.com/api-keys" },
          { label: "Nhap Resend API Key", href: "/admin/settings#resend_api_key", variant: "primary" },
        ],
      },
      {
        id: "resend-from",
        title: "Email gui di (From Email)",
        desc: "Nhap dia chi email gui di va ten hien thi. De test dung onboarding@resend.dev. De gui cho moi khach hang can verify domain rieng.",
        links: [
          { label: "Verify domain Resend", href: "https://resend.com/domains" },
          { label: "Nhap From Email", href: "/admin/settings#resend_from_email", variant: "primary" },
        ],
        tips: "onboarding@resend.dev chi gui duoc den email da dang ky Resend. Verify domain rieng de gui cho tat ca khach.",
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
        desc: "Nhap: Ten, Gia (VND), Mo ta ngan, Template Link (link Notion de Duplicate hoac Google Sheets), Loai. Kiem tra san pham hien thi tren trang chu.",
        links: [{ label: "Thêm sản phẩm mới", href: "/admin/products/new", variant: "primary" }],
        tips: "Template Link phai la link public de khach hang Duplicate ve workspace cua ho.",
      },
      {
        id: "test-flow",
        title: "Test toàn bộ luồng mua hàng",
        desc: "Mo tab an danh, vao trang chu, chon san pham, Mua ngay, nhap email that, tao QR, chuyen khoan dung noi dung (ma don) va dung so tien. Xac nhan:\n  Don hang trong Admin doi sang Thanh cong\n  Nhan email co link template\n  Link template hoat dong",
        tips: "Neu khong nhan duoc email: kiem tra Resend logs va Supabase Webhook logs trong Supabase Dashboard.",
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
              {pct === 100 ? "Hệ thống đã sẵn sàng hoạt động!" : `Còn ${TOTAL_STEPS - doneCount} bước nua`}
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
