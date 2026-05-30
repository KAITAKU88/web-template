# Trạng thái làm việc — 2026-05-30

## Production URL
https://web-template-cloudflare.thankful-to-all-88.workers.dev

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
- ✅ Nhân viên thực: tranthiluong300489@gmail.com (manager), duykhanh2012@gmail.com (collaborator)

### Tính năng sản phẩm & danh mục
- ✅ Danh mục sản phẩm (bảng `categories` trong Supabase)
- ✅ sort_order tính theo MAX(sort_order) + 1 — không trùng, không ngắt quãng
- ✅ Chặn xóa danh mục đang có sản phẩm — hiển thị lỗi inline "Đang chứa X sản phẩm"
- ✅ Bỏ CHECK constraint `type IN ('notion','google_sheet')` → danh mục tùy chỉnh lưu được
- ✅ Migration `20260530000001_relax_product_type_constraint.sql` — cần chạy trên Supabase nếu chưa
- ✅ Lọc đơn hàng theo thời gian: Hôm nay / 7 ngày / Tháng này / Năm này

### Landing Page Editor (hoàn thành phiên 2026-05-30)
- ✅ **Sidebar logo/brand → link trang chủ** tab mới (`href="/" target="_blank"`)
- ✅ **LandingEditor component** (`src/components/LandingEditor.tsx`) — editor đầy đủ 7 section:
  - Hero (headline + subheadline)
  - Nỗi đau (array, thêm/xóa từng item)
  - Giải pháp (title, desc, công thức A+B=Result)
  - Tính năng (array, thêm/xóa)
  - Đánh giá khách hàng (array, thêm/xóa)
  - Bao gồm trong gói (array, thêm/xóa)
  - FAQ (array, thêm/xóa)
- ✅ Accordion UI — section expand/collapse, badge số lượng item
- ✅ Nút **Preview** (chỉ khi edit SP đã tồn tại) → mở `/products/{id}` tab mới
- ✅ Nút **"✕ Xóa toàn bộ landing page"** → reset về `null` (dùng nội dung mặc định)
- ✅ Header/footer/nút thanh toán cố định trong template — không edit được
- ✅ **AI prompt chi tiết hardcode** — yêu cầu tone, chất lượng, hướng dẫn từng field cụ thể
- ✅ Validation: bắt buộc nhập tên SP trước khi dùng Template mặc định hoặc Generate AI
- ✅ Verified bằng Puppeteer + Chrome 149 headless

### UX & Responsive
- ✅ Mobile: search bar dùng `flex-1` tự co lại (bỏ `w-64` cứng)
- ✅ Mobile: 3 dropdown lọc (danh mục / giá / sắp xếp) trên cùng 1 hàng
- ✅ Search bar tự clear khi chuyển từ homepage sang trang sản phẩm
- ✅ GA4 script load trong layout nếu cấu hình `ga_measurement_id` trong Settings

### Backend & Webhook (code xong, chờ cấu hình ngoài)
- ✅ SePay Webhook handler: `/api/webhook/sepay`
- ✅ Supabase DB Webhook handler: `/api/webhook/order-success`
- ✅ Cron endpoint: `/api/cron/expire-orders`

## Việc cần làm tiếp

### Cấu hình ngoài (không phải code — cần làm thủ công)
- ❌ Dán SePay Webhook URL vào SePay Dashboard → Dịch vụ → Webhook
- ❌ Tạo Supabase Database Webhook trỏ tới `/api/webhook/order-success`
- ❌ Tạo cron job trên cron-job.org: POST `/api/cron/expire-orders` mỗi 5 phút
- ❌ Chạy migration `20260530000001_relax_product_type_constraint.sql` trên Supabase (nếu chưa)
- ❌ Custom domain (đang dùng workers.dev — bị chặn một số ISP VN)

### Tính năng chưa implement trong code
- ❌ **Abandoned Cart Email** — chưa có dòng code nào; gửi email sau 15 phút nếu đơn vẫn pending
- ❌ **GTM event tracking** — GA4 script có nhưng chưa fire sự kiện: `Click_Mua_Ngay`, `Generate_QR`, `Purchase`

## Lưu ý kỹ thuật quan trọng
- **Next.js 15.5.18** (không dùng 16.x — bug prefetch RSC với OpenNext)
- **`createAdminClient()`** phải dùng ES import, KHÔNG dùng `require()`
- **`NEXT_PUBLIC_*`** vars bake vào bundle lúc build — phải đúng trước khi build
- **Role** đọc từ cookie trực tiếp trong `get-role.ts` (không qua middleware header vì bị mất khi rewrite)
- **Cloudflare**: NODE_VERSION=22 trong Build Variables (không phải Environment Variables)
- **Supabase project**: cdqhcxubloteojfiipsd
- **Mật khẩu admin**: lưu riêng trong password manager, không ghi vào đây
- **Test browser**: Playwright không support Ubuntu 26.04; dùng `@puppeteer/browsers` tải Chrome + extract libs từ Ubuntu debs vào `/tmp/chromelibs` (mất sau reboot WSL, cần tải lại)
