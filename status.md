# Trạng thái làm việc — 2026-05-30

## Production URL
https://web-template-cloudflare.thankful-to-all-88.workers.dev

---

## Đã hoàn thành (tích lũy)

### Deploy & Infrastructure
- ✅ Migrate thành công từ Netlify → Cloudflare Workers
- ✅ Fix toàn bộ build errors (Node version, open-next config, wrangler entry point, ESM imports, TypeScript)
- ✅ Admin URL: `/admin` | Manager: `/manager` | Cộng tác viên: `/collaborator`

### Hệ thống mật khẩu Admin
- ✅ 3 fields trong DB: `admin_default_password`, `admin_password`, `admin_temp_password`
- ✅ Tại 1 thời điểm chỉ 1 field có giá trị
- ✅ Forgot password gửi email qua Resend (cần domain để dùng)

### Phân quyền (RBAC)
- ✅ 3 roles: Owner / Quản lý / Cộng tác viên
- ✅ Login pages: `/admin/login`, `/manager/login`, `/collaborator/login` (3 tabs)
- ✅ Sidebar lọc menu theo role (đọc từ cookie, không qua header)
- ✅ Middleware chặn truy cập sai path, redirect về path tương đương
- ✅ Collaborator: chỉ xem, không thêm/sửa/xóa (`canEdit = role !== "collaborator"`)
- ✅ Manager tạo/sửa sản phẩm redirect đúng path (dùng `adminPath()`)

### Tính năng sản phẩm & danh mục
- ✅ Danh mục sản phẩm (bảng `categories` trong Supabase)
- ✅ sort_order tính theo MAX(sort_order) + 1 — không trùng, không ngắt quãng
- ✅ Chặn xóa danh mục đang có sản phẩm — hiển thị lỗi inline "Đang chứa X sản phẩm"
- ✅ Bỏ CHECK constraint `type IN ('notion','google_sheet')` → danh mục tùy chỉnh lưu được
- ✅ Lọc đơn hàng theo thời gian: Hôm nay / 7 ngày / Tháng này / Năm này

### Supabase Storage & Upload ảnh
- ✅ Bucket `avatars` (512 KB) — lưu avatar testimonials
- ✅ Bucket `site-assets` (5 MB, svg/ico) — lưu logo, favicon, og-image
- ✅ LandingEditor: AvatarInput — upload ảnh hoặc paste link, preview, max 4 testimonials
- ✅ SettingsForm: ImageUploadField — logo/favicon/og-image có nút Upload + URL + preview
- ✅ Product page: render `<img>` nếu avatar là URL, emoji nếu không phải

### Landing Page Editor
- ✅ LandingEditor component — 7 section đầy đủ: Hero, Nỗi đau, Giải pháp, Tính năng, Đánh giá, Bao gồm, FAQ
- ✅ Accordion UI — expand/collapse, badge số lượng
- ✅ Nút Preview → mở `/products/{id}` tab mới
- ✅ Nút Xóa toàn bộ landing page → reset về `null`
- ✅ AI generate landing page (Claude / Gemini)

### UX & Responsive (cập nhật 2026-05-30)
- ✅ **Admin sidebar mobile**: slide-in drawer từ trái, hamburger button, backdrop overlay
- ✅ **Mobile top bar** trong admin: hiển thị hamburger + brand name, ẩn trên desktop
- ✅ Admin pages: padding responsive `p-4 md:p-6`
- ✅ Admin products table: `overflow-x-auto`
- ✅ Homepage hero: `text-2xl sm:text-4xl` (đúng tỉ lệ mobile)
- ✅ Homepage trust signals: `grid-cols-1 sm:grid-cols-3` (không dùng flex min-w-64)
- ✅ Search bar tự co theo màn hình
- ✅ Filter mobile: 3 dropdown trên 1 hàng

### Backend & Webhook (code xong, chờ cấu hình ngoài)
- ✅ SePay Webhook handler: `/api/webhook/sepay`
- ✅ Supabase DB Webhook handler: `/api/webhook/order-success`
- ✅ Cron endpoint: `/api/cron/expire-orders`

---

## Ngữ cảnh phiên làm việc hiện tại
> Cập nhật tự động — dùng để tiếp tục nếu phiên bị ngắt

**Trạng thái:** Marketing system hoàn thành. Các tác vụ 🟡 cần bạn thao tác thủ công (SePay webhook, Supabase webhook, custom domain).

---

## Việc cần làm tiếp

### 🔴 Ưu tiên cao
- ✅ **Abandoned Cart Email** — hoàn chỉnh
  - Migration: cột `cart_email_sent_at` vào bảng `orders`
  - Endpoint: `POST /api/cron/abandoned-cart` (bảo vệ bởi CRON_SECRET)
  - Logic: đơn pending 15–120 phút, có email, chưa gửi → gửi 1 lần, đánh dấu ngay
  - Email: link quay lại trang sản phẩm, thông tin đơn hàng, branded HTML
  - ⚠️ **Cần bạn làm**: Thêm cron job thứ 2 trên cron-job.org — POST `/api/cron/abandoned-cart` mỗi 5 phút (cùng CRON_SECRET với cron hiện tại)
- ✅ **GTM + Analytics** — GTM Container ID trong Settings, analytics dashboard nội bộ (phễu, doanh thu 7 ngày, top sản phẩm)
- ✅ **Marketing System** — Meta CAPI server-side, Email Campaigns (`/admin/marketing`), tracking pixel IDs trong Settings (Facebook, TikTok, Google Ads)
  - `Click_Mua_Ngay` → nút Mua ngay + floating CTA (ProductDetail) + form submit (CheckoutClient)
  - `Generate_QR` → sau khi tạo đơn thành công, QR hiển thị
  - `Purchase` → khi Supabase realtime báo status = success
  - Tất cả fire qua `window.gtag()` — chỉ hoạt động khi GA4 đã cấu hình

### 🟡 Cấu hình ngoài (thủ công, không phải code)
- ❌ Dán SePay Webhook URL vào SePay Dashboard → Dịch vụ → Webhook
  - URL: `https://yourdomain.com/api/webhook/sepay`
  - **Không cấu hình trong Dashboard app** — cấu hình trực tiếp trên SePay
- ❌ Tạo Supabase Database Webhook trỏ tới `/api/webhook/order-success`
- ✅ Cron jobs — tích hợp Cloudflare Cron Triggers (mỗi 5 phút, không cần dịch vụ ngoài)
  - `src/cf-worker.ts` — worker wrapper thêm `scheduled()` handler
  - `wrangler.toml` — `[triggers] crons = ["*/5 * * * *"]`
  - Gọi nội bộ: `expire-orders` + `abandoned-cart`
- ❌ Custom domain (workers.dev bị chặn một số ISP Việt Nam)

### 🟢 Sau khi hệ thống ổn định
- ❌ **White-label / Bán hệ thống cho khách**
  - Fork repo → source code của họ
  - Clone Supabase schema (không có data)
  - Tạo Cloudflare Pages + cấu hình SePay + Resend
  - Mục tiêu: chỉ cần vào Dashboard điền thông tin là chạy được
- ❌ **Tối ưu**: code sạch, performance, tốc độ
- ✅ **File AGENTS**: `AGENTS.md` — kiến trúc đầy đủ, tech stack, luồng mua hàng, DB, cron, webhook, gotchas

---

## Lưu ý kỹ thuật quan trọng
- **Next.js 15.5.18** (không dùng 16.x — bug prefetch RSC với OpenNext)
- **`createAdminClient()`** phải dùng ES import, KHÔNG dùng `require()`
- **`NEXT_PUBLIC_*`** vars bake vào bundle lúc build — phải đúng trước khi build
- **Role** đọc từ cookie trong `get-role.ts` (không qua middleware header vì bị mất khi rewrite)
- **Cloudflare**: NODE_VERSION=22 trong Build Variables (không phải Environment Variables)
- **Supabase project**: cdqhcxubloteojfiipsd
- **Mật khẩu admin**: lưu riêng trong password manager, không ghi vào đây
- **Test browser**: Playwright không support Ubuntu 26.04; dùng `@puppeteer/browsers` tải Chrome + extract libs từ Ubuntu debs vào `/tmp/chromelibs` (mất sau reboot WSL, cần tải lại)
- **SePay Webhook URL** cấu hình trực tiếp trên SePay Dashboard — không phải trong Admin app
