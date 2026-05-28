# Kế hoạch phát triển — Web bán Template tự động

> **Đọc file này trước khi bắt đầu làm việc.**
> Xóa mục nào ngay sau khi hoàn thành. Thêm mục mới khi phát sinh công việc.

---

## Bối cảnh hệ thống

Hệ thống bán template Notion / Google Sheets tự động hoàn toàn.
**Stack:** Next.js 16 + Supabase + SePay + Resend + Netlify

**Luồng hoạt động:**
1. Khách nhập email → tạo `orders` (status=pending) → hiển thị VietQR
2. SePay webhook → xác thực → `status=success`
3. Supabase DB webhook → n8n → gửi email kèm template link cho khách

**Tài khoản liên quan:** matdaytamden00@gmail.com

---

## Cấu trúc Admin Dashboard (4 Phase)

### ✅ Phase 1 — Stats & Monitoring
- Tổng quan: doanh thu hôm nay, tổng doanh thu, đơn thành công/chờ
- `/admin/orders` — danh sách, filter theo status/email, pagination
- Login bảo vệ toàn bộ `/admin/*`

### ✅ Phase 2 — Cấu hình hệ thống
- `/admin/settings` — lưu vào bảng `settings` (key-value trong Supabase)
  - Giao diện: tên site (tab + footer), tên brand (header), logo (URL ảnh hoặc text ngắn), màu chủ đạo
  - Liên hệ: Zalo link, Facebook link
  - Thanh toán: SePay API key, STK ngân hàng, tên ngân hàng, chủ TK
  - Email: Resend API key, from email, from name
  - AI: chọn provider (Claude mặc định / Gemini miễn phí), API key tương ứng
- Nút "Lưu cấu hình" mờ mặc định, sáng khi có thay đổi
- Brand color inject vào CSS variable `--brand` → áp dụng toàn site

### ✅ Phase 2 (bổ sung) — Quản lý sản phẩm
- `/admin/products` — list, xóa
- `/admin/products/new` — tạo sản phẩm với AI landing page generator
- `/admin/products/[id]/edit` — chỉnh sửa, regenerate AI
- Lượt tải: random khi tạo mới, cho phép sửa tay

### ✅ Phase 3 — AI Landing Page Generator
- Nút "✨ Generate với AI" trong form sản phẩm
- Hỗ trợ 2 provider: Claude Sonnet 4.6 (trả phí) và Gemini 2.0 Flash (miễn phí)
- Sinh toàn bộ `ProductCopy` JSON: headline, nỗi đau, tính năng, testimonial, FAQ
- Lưu vào `landing_content JSONB` trong bảng `products`
- Trang `/products/[id]` dùng AI content nếu có, fallback về content tĩnh

### ❓ Phase 4 — Chưa xác định
- User chưa nhớ ra nội dung Phase 4
- Mục tiêu chung: hoàn thiện quản lý mọi thứ từ dashboard (không cần vào Supabase/code)

---

## Việc cần làm ngay (theo thứ tự ưu tiên)

### 🔴 Bắt buộc trước khi test thật
- [ ] Chạy migration SQL trên Supabase Dashboard:
  - `supabase/migrations/20260528000001_add_settings_table.sql` — tạo bảng `settings`
  - `supabase/migrations/20260528000002_add_landing_content.sql` — thêm cột `landing_content` vào `products`
- [ ] Vào `/admin/settings` → chọn Gemini → dán API key từ `aistudio.google.com` → Lưu
- [ ] Test generate landing page: `/admin/products/new` → nhập tên → bấm Generate

### 🟡 Khi deploy lên Netlify
- [ ] Thêm `CRON_SECRET` vào Netlify Environment Variables (cùng giá trị trong `.env.local`)
- [ ] Netlify Scheduled Function `expire-orders.mts` sẽ tự chạy mỗi 5 phút — hủy đơn pending quá 15 phút

### 🟢 Tính năng còn thiếu / chưa xác nhận
- [ ] Phase 4 — xác định nội dung với user rồi implement
- [ ] Điều chỉnh thứ 2 của Settings form (user đề cập "có 2 điều chỉnh" nhưng chỉ nói 1 — cần hỏi lại)
- [ ] Kiểm tra checkout flow end-to-end với SePay thật
- [ ] Kiểm tra email delivery qua Resend

---

## Ghi chú kỹ thuật quan trọng

### Settings
- Bảng `settings`: key TEXT PRIMARY KEY, value JSONB — không có public RLS policy (chỉ service_role)
- Đọc settings server-side trong `layout.tsx` → inject vào `<html style="--brand: #hex">`
- `brand_name` → header logo text; `site_name` → tab title + footer

### Đơn hàng & Hủy
- Countdown trên checkout: 3 phút 30 giây (COUNTDOWN_SEC trong CheckoutClient.tsx)
- Auto-expire threshold: 15 phút (EXPIRE_MINUTES trong `src/lib/expireOrders.ts`)
- `expireStaleOrders()` chạy mỗi khi admin mở `/admin/orders` (lazy) + Netlify cron mỗi 5 phút

### AI Provider
- Claude: `claude-sonnet-4-6`, ~$0.003/lần generate
- Gemini: `gemini-2.0-flash`, miễn phí 1.500 req/ngày
- Logic chọn provider: đọc `settings.ai_provider` từ DB (`"claude"` | `"gemini"`)

### Brand Color
- CSS variable: `--brand` set trên `<html>` từ server layout
- Dùng class Tailwind: `bg-brand`, `text-brand`, `border-brand`, `bg-brand-subtle`
- Admin dashboard (dark theme) vẫn dùng `emerald` hardcode — chỉ frontend public dùng `--brand`

### Logo
- Field "Logo (ảnh hoặc text)" trong settings
- Nếu value là URL (http/https//) → hiển thị `<img>`
- Nếu là text ngắn (TL, 🚀...) → hiển thị trong ô vuông màu brand
- Nếu để trống → tự lấy chữ hoa từ brand name (TemplateLab → TL)
