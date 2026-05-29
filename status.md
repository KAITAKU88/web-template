# Trạng thái làm việc — 2026-05-29

## Production URL
https://web-template-cloudflare.thankful-to-all-88.workers.dev

## Đã hoàn thành hôm nay

### Deploy & Infrastructure
- ✅ Migrate thành công từ Netlify → Cloudflare Workers
- ✅ Fix toàn bộ build errors (Node version, open-next config, wrangler entry point, ESM imports, TypeScript)
- ✅ Admin URL: `/admin` | Manager: `/manager` | Cộng tác viên: `/collaborator`

### Hệ thống mật khẩu Admin
- ✅ 3 fields trong DB: `admin_default_password`, `admin_password`, `admin_temp_password`
- ✅ Tại 1 thời điểm chỉ 1 field có giá trị
- ✅ Mật khẩu hiện tại: `Luongyeu88@` (lưu trong `admin_password`)
- ✅ Forgot password gửi email qua Resend (cần domain để dùng)

### Phân quyền (RBAC)
- ✅ 3 roles: Owner / Quản lý / Cộng tác viên
- ✅ Login pages: `/admin/login`, `/manager/login`, `/collaborator/login` (3 tabs)
- ✅ Sidebar lọc menu theo role (đọc từ cookie, không qua header)
- ✅ Middleware chặn truy cập sai path, redirect về path tương đương
- ✅ Collaborator: chỉ xem, không thêm/sửa/xóa
- ✅ Nhân viên test đã xóa; nhân viên thực: tranthiluong300489@gmail.com (manager), duykhanh2012@gmail.com (collaborator)

### Tính năng mới
- ✅ Danh mục sản phẩm (bảng `categories` trong Supabase)
- ✅ Lọc đơn hàng theo thời gian: Hôm nay / 7 ngày / Tháng này / Năm này
- ✅ Landing page: 2 nút — "Dùng template mặc định" (không cần AI) + "Generate với AI" (cần API key)
- ✅ Header: icon to hơn, chữ "Lab" màu xanh brand

## Việc cần làm tiếp

### Cấp thiết (chưa hoạt động trên production)
- ❌ Cấu hình SePay Webhook URL → `/api/webhook/sepay`
- ❌ Cấu hình Supabase DB Webhook → `/api/webhook/order-success`
- ❌ Tạo cron job trên cron-job.org (POST `/api/cron/expire-orders` mỗi 5 phút)
- ❌ Custom domain (đang dùng workers.dev — bị chặn một số ISP VN)

### Tính năng còn thiếu (từ todolist)
- ❌ Abandoned Cart Email (gửi email 15 phút sau khi chưa thanh toán)
- ❌ Google Tag Manager / tracking events
- ❌ Menu "Template" và "Khóa học" trên header

### Debug cần kiểm tra sau deploy
- Tạo/sửa sản phẩm từ tài khoản Manager (đã fix redirect, cần verify)
- Phân quyền Collaborator ẩn đúng nút thêm/sửa/xóa

## Lưu ý kỹ thuật quan trọng
- **Next.js 15.5.18** (không dùng 16.x — bug prefetch RSC với OpenNext)
- **`createAdminClient()`** phải dùng ES import, KHÔNG dùng `require()`
- **`NEXT_PUBLIC_*`** vars bake vào bundle lúc build — phải đúng trước khi build
- **Role** đọc từ cookie trực tiếp trong `get-role.ts` (không qua middleware header vì bị mất khi rewrite)
- **Cloudflare**: NODE_VERSION=22 trong Build Variables (không phải Environment Variables)
- **Supabase project**: cdqhcxubloteojfiipsd
- **Mật khẩu admin hiện tại**: `Luongyeu88@`
