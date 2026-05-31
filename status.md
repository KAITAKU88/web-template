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

**Trạng thái (2026-05-31):** Hoàn thành 6 tasks lớn:
- ✅ URL slug thay UUID trong checkout
- ✅ Draft/Publish sản phẩm  
- ✅ Trang Khách hàng + nhóm khách hàng
- ✅ Link bảo vệ tải template có thời hạn
- ✅ Automation rules + Marketing lên lịch theo sự kiện
- ✅ Automation triggers kết nối thực: order_success, order_cancelled, product_published

---

## Việc cần làm tiếp

### ✅ Đã hoàn thành trong phiên 2026-05-31 (2 đợt)
- ✅ URL slug thay UUID trong checkout — `/products/{slug}` và `/checkout/{slug}`
- ✅ Draft/Publish sản phẩm — mặc định draft khi tạo mới, nút toggle trong admin
- ✅ Trang Khách hàng (`/admin/customers`) — aggregate từ orders, tạo nhóm, lọc, sắp xếp
- ✅ Link bảo vệ tải template — token có thời hạn + giới hạn lượt truy cập
- ✅ Automation rules — tự động gửi email theo sự kiện (4 loại sự kiện, delay, nhóm)
- ✅ Marketing lên lịch — gửi ngay hoặc đặt giờ, nhắm theo nhóm KH
- ✅ Automation triggers thực — kết nối 3 sự kiện với queue + cron xử lý mỗi 5 phút
  - `order_success` webhook → queue automation ngay sau xác nhận đơn
  - `expireOrders` → queue `order_cancelled` cho từng đơn hết hạn
  - `toggleProductStatus(published)` → queue `product_published`
  - Cron `/api/cron/process-automations` thay biến `{{product_name}}` v.v. rồi gửi email

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


2. Hiện tại làm cách nào để tùy chỉnh nội dung email, gửi nhiều kịch bản email khác nhau:
- Khi khách mua thành công => Gửi email xác nhận đơn hàng và thanh toán thành công, gửi link tải, gửi link zalo nhóm (cần hỏi gì vào nhóm hỏi)
- Khi khách bấm mua nhưng không thanh toán thành công => Gửi email thông báo, nhắc nhở
...

5. Trường hợp khách mua mà gửi email bị lỗi (hệ thống không gửi được email) thì xử lý như thế nào . Resend sẽ tự kích hoạt 1 email gửi lại 3 lần, rồi nếu vẫn không được thì sẽ gửi 1 email báo cáo đến email cá nhân hay là thế nào. Trường hợp này có cách nào để Quản trị viên vào trong dashboard chọn 1 hoặc nhiều sản phẩm (lúc này sẽ xuất hiện nút Send to Email) và gửi đến email, cho phép chọn trong danh sách email của khách hàng và gửi, sẽ gửi dưới danh nghĩa là email tùy chỉnh theo tên miền như support@templatestores.com

====Nội dung tiếp theo cần làm (đã hoàn thành 2026-05-31):
- ✅ 0. URL slug thay UUID
- ✅ 1. Khách hàng dashboard  
- ✅ 2. Automation rules
- ✅ 3. Marketing lên lịch/sự kiện
- ✅ 4. Draft/Publish sản phẩm
- ✅ 5. Link bảo vệ tải template có thời hạn

Trang sản phẩm chưa có nút lọc, tìm kiếm, sắp xếp
Hiện tại khi 1 sản phẩm mới được tạo ra chưa có phần khởi tạo số sao, số lượt đánh giá. Tạo 2 phần này, cho phép nhập thủ công. Hoặc tự động tạo ra số sao random trong khoảng 4.4 đến 4.9 và số lượt đánh giá random trong khoảng từ 1/10 đến 1/3 số lượt tải 
