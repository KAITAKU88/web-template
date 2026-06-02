# Hướng dẫn cài đặt & vận hành thủ công

> Tài liệu này gộp từ `todolist.md` và `HANDOVER_CHECKLIST.md`.  
> Mọi cấu hình tại đây phải thực hiện **bên ngoài code** (dashboard các dịch vụ hoặc Admin Dashboard).  
> 🌐 = dịch vụ bên thứ 3 | 🖥️ = Admin Dashboard của hệ thống

---

## PHẦN A — Cài đặt lần đầu (cho instance mới)

### A1. Tài khoản cần đăng ký trước (15 phút)

- [ ] **GitHub** — github.com (miễn phí)
- [ ] **Supabase** — supabase.com (miễn phí, gói Free đủ dùng)
- [ ] **Cloudflare** — cloudflare.com (miễn phí)
- [ ] **Resend** — resend.com (miễn phí 3.000 email/tháng)
- [ ] **SePay** — my.sepay.vn (miễn phí)

---

### A2. Source code (10 phút)

🌐 GitHub:
- [ ] Fork repo về tài khoản GitHub của bạn
- [ ] Giữ **Private** nếu muốn bảo mật source code

---

### A3. Supabase Database (20 phút)

🌐 supabase.com → New project:
- [ ] Đặt tên, chọn region **Singapore (ap-southeast-1)**
- [ ] Đặt mật khẩu database → lưu lại
- [ ] Chờ ~2 phút để project khởi tạo

🌐 Trong project → SQL Editor → New query:
- [ ] Copy toàn bộ nội dung `supabase/deploy-via-dashboard.sql` → Paste → Run
- [ ] Kiểm tra Tables: phải thấy `products`, `orders`, `categories`, `settings`, `click_events`, `staff`, `activity_logs`, `storage_files`

🌐 Storage → Tạo các buckets:
- [ ] `product-images` — Public, 5MB
- [ ] `avatars` — Public, 512KB
- [ ] `site-assets` — Public, 5MB

🌐 Settings → API → Copy 3 keys:
- [ ] `Project URL` → dùng cho `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `anon/public key` → dùng cho `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `service_role key` → dùng cho `SUPABASE_SERVICE_ROLE_KEY`

---

### A4. Cloudflare Workers Deploy (30 phút)

🌐 Cloudflare Dashboard → Workers & Pages → Create application:
- [ ] Đặt tên project (VD: `my-template-store`)
- [ ] Kết nối GitHub repo vừa fork
- [ ] **Build command:** `npx @opennextjs/cloudflare build`
- [ ] **Build output directory:** *(để trống)*
- [ ] Node.js version: **22**

🌐 Settings → Environment Variables → Production → thêm lần lượt:

| Variable | Giá trị | Encrypt? |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL từ A3 | Không |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key từ A3 | Không |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key từ A3 | ✅ |
| `ADMIN_PASSWORD` | Mật khẩu admin tự đặt | ✅ |
| `ADMIN_SECRET` | Chuỗi ngẫu nhiên ≥32 ký tự | ✅ |
| `CRON_SECRET` | Chuỗi ngẫu nhiên ≥32 ký tự | ✅ |
| `RESEND_API_KEY` | Lấy tại resend.com/api-keys | ✅ |
| `RESEND_FROM` | `TenBrand <onboarding@resend.dev>` (tạm) | Không |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` | Không |

> Tạo chuỗi ngẫu nhiên: `openssl rand -hex 32`

- [ ] Save → Redeploy
- [ ] Truy cập `*.workers.dev` → trang chủ hiện ra
- [ ] Đăng nhập `/admin/login` với `ADMIN_PASSWORD` vừa đặt

---

### A5. Cấu hình ban đầu trong Dashboard (20 phút)

🖥️ Admin → **Cấu hình**:

**Giao diện:**
- [ ] Tên site, Tên brand, Mô tả site
- [ ] Màu chủ đạo, Logo, Favicon
- [ ] OG Image (ảnh 1200×630px cho share mạng xã hội)

**Liên hệ:**
- [ ] Email Admin (nhận mật khẩu tạm khi quên)
- [ ] Link Zalo (hiển thị ở footer)

**Thanh toán SePay:**
- [ ] Ngân hàng, Số tài khoản, Tên chủ tài khoản (VIẾT HOA KHÔNG DẤU)

**Email Resend:**
- [ ] Resend API Key, From Email, From Name

**AI Provider (để Generate Landing Page):**
- [ ] Chọn provider: Gemini hoặc Claude
- [ ] Nhập API key tương ứng
- [ ] Gemini miễn phí: lấy key tại aistudio.google.com/apikey
- [ ] Claude trả phí: lấy key tại console.anthropic.com/settings/keys

---

### A6. SePay (15 phút)

🌐 my.sepay.vn:
- [ ] Đăng ký tài khoản → Kết nối ngân hàng
- [ ] Dịch vụ → Webhook → Tạo webhook mới:
  - URL: copy từ **Admin → Cấu hình → Webhook & API URLs → SePay Webhook URL**
  - Copy **API Key** sau khi tạo
- [ ] Dán API Key vào 🖥️ Admin → Cấu hình → SePay Webhook Secret → Lưu

---

### A7. Supabase Database Webhook (10 phút)

🖥️ Admin → Cấu hình → Supabase Webhook Secret → nhập chuỗi bí mật → Lưu

🌐 supabase.com → project → Database → Webhooks → Create a new hook:
- [ ] Name: `order-success`
- [ ] Table: `orders` | Events: chỉ chọn **UPDATE**
- [ ] URL: copy từ Admin → Cấu hình → Webhook & API URLs → Supabase DB Webhook URL
- [ ] HTTP Headers: `x-webhook-secret` = chuỗi bí mật vừa nhập ở trên
- [ ] Confirm

---

### A8. Verify domain email Resend (tùy chọn nhưng nên làm)

🌐 resend.com/domains:
- [ ] Add domain → nhập domain của bạn
- [ ] Thêm các DNS records Resend yêu cầu vào Cloudflare DNS
- [ ] Chờ Verify (~5–30 phút)
- [ ] Sau verify: cập nhật `RESEND_FROM` → `TenBrand <noreply@yourdomain.com>` → Redeploy

---

### A9. Custom Domain (tùy chọn)

🌐 Cloudflare → Workers & Pages → project → Custom Domains:
- [ ] Add domain → làm theo hướng dẫn DNS
- [ ] Chờ propagate (~5–30 phút)
- [ ] Cập nhật `NEXT_PUBLIC_SITE_URL` → domain mới → Save → Redeploy

---

### A10. Test toàn bộ luồng mua hàng

Dùng tab ẩn danh, chuyển khoản tiền thật:
- [ ] Vào trang chủ → chọn sản phẩm → Mua ngay
- [ ] Nhập email thật → Tạo mã QR → Quét → Chuyển khoản đúng nội dung
- [ ] Màn hình chuyển sang "Thanh toán thành công!"
- [ ] Admin → Đơn hàng → đơn chuyển sang **Thành công**
- [ ] Email về đúng hòm thư, có link template
- [ ] Click link → truy cập được template, Duplicate được

---

## PHẦN B — Cấu hình bổ sung (sau khi hệ thống chạy)

### B1. Bảo vệ link tải template

🖥️ Admin → Cấu hình → Link bảo vệ tải template:
- [ ] Thời hạn link: `48 giờ` (khuyến nghị)
- [ ] Giới hạn lượt truy cập: `3 lần` (khuyến nghị)
- [ ] Lưu cấu hình

---

### B2. Thêm sản phẩm đầu tiên

🖥️ Admin → Sản phẩm → Thêm sản phẩm mới:
- [ ] Điền: Tên, Giá, Mô tả, Template Link, Ảnh thumbnail, Danh mục
- [ ] Tạo Landing Page bằng AI (nút Generate AI) hoặc Template mặc định
- [ ] Publish → kiểm tra hiển thị trên trang chủ

---

### B3. Cấu hình Automation email

🖥️ Admin → Automation:
- [ ] Rule "Chào mừng sau mua hàng" → điền nội dung → bật ON
- [ ] Rule "Nhắc nhở giỏ hàng bỏ quên" → bật ON
- [ ] Rule "Thông báo sản phẩm mới" → bật ON

---

### B4. Analytics & Tracking (khi chạy quảng cáo)

🌐 tagmanager.google.com → tạo GTM Container:
- [ ] 🖥️ Admin → Cấu hình → GTM Container ID → nhập `GTM-XXXXXXX` → Lưu
- [ ] Trong GTM: thêm tag GA4, Facebook Pixel, TikTok Pixel tùy nhu cầu → Publish

---

## PHẦN C — Bảo mật (bắt buộc trước khi ra mắt)

### C1. Đổi ADMIN_SECRET

> Token admin được ký bằng `ADMIN_SECRET`. Nếu dùng giá trị mặc định/đơn giản, kẻ tấn công tạo được token hợp lệ.

🌐 Cloudflare → Environment variables:
- [ ] Tạo chuỗi mới (≥32 ký tự): `openssl rand -hex 32`
- [ ] Cập nhật `ADMIN_SECRET` → Encrypt → Save → Redeploy
- [ ] ⚠️ Toàn bộ admin đang đăng nhập sẽ bị logout

---

### C2. Hash mật khẩu nhân viên

> ⚠️ Mật khẩu nhân viên (staff) hiện lưu dạng plaintext trong DB — rủi ro nếu DB bị truy cập trái phép.

🌐 Supabase → SQL Editor:
- [ ] Chạy: `SELECT email, password FROM staff LIMIT 5;`
- [ ] Nếu thấy mật khẩu dạng thường (không phải `$2b$...`) → đặt lại mật khẩu qua Admin → Người dùng

> 📌 Cần implement bcrypt hashing trong `src/app/admin/staff/actions.ts` và `src/app/api/admin/auth/route.ts`.

---

### C3. Đổi mật khẩu Admin sau bàn giao

🖥️ Admin → Cấu hình → Đổi mật khẩu:
- [ ] Đổi ngay sau khi bàn giao cho khách hàng

---

## PHẦN D — Thông tin bàn giao cho khách

| Thông tin | Ghi chú |
|-----------|---------|
| URL trang web | Domain riêng hoặc `*.workers.dev` |
| URL Admin | `<domain>/admin/login` |
| Mật khẩu Admin | Lưu trong password manager |
| URL đăng nhập nhân viên | `<domain>/manager/login` (Quản lý) · `<domain>/collaborator/login` (Nhân viên) · `<domain>/partner/login` (Cộng tác viên) |
| Tài khoản GitHub | Để họ tự push code nếu cần |
| Tài khoản Supabase | Để họ xem dữ liệu |
| Tài khoản Cloudflare | Để họ quản lý deploy |

---

## Checklist nhanh — trạng thái cần kiểm tra

```
Hệ thống cốt lõi:
[ ] RESEND_API_KEY + RESEND_FROM + NEXT_PUBLIC_SITE_URL đã set trên Cloudflare
[ ] Supabase Database Webhook đã tạo và active
[ ] SePay Webhook URL đúng domain + đang Active
[ ] Test luồng mua hàng end-to-end thành công

Bảo mật:
[ ] ADMIN_SECRET đủ mạnh (≥32 ký tự ngẫu nhiên)
[ ] Mật khẩu nhân viên đã hash (hoặc chưa có nhân viên nào)
[ ] Đã đổi mật khẩu Admin sau bàn giao

AI Provider:
[ ] Đã cấu hình provider và API key trong Admin → Cấu hình → AI
[ ] Đã test Generate AI cho ít nhất 1 sản phẩm
```
