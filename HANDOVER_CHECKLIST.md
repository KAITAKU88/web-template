# Checklist bàn giao hệ thống cho khách hàng

> Thực hiện lần lượt từ trên xuống. Mỗi bước có thể tick vào ô [ ] khi hoàn thành.
> Thời gian ước tính hoàn chỉnh: **2–3 giờ** cho người làm lần đầu.

---

## PHẦN 1 — Chuẩn bị tài khoản (15 phút)

Khách hàng cần đăng ký sẵn các tài khoản sau trước khi bắt đầu:

- [ ] **GitHub** — github.com (miễn phí)
- [ ] **Supabase** — supabase.com (miễn phí)
- [ ] **Cloudflare** — cloudflare.com (miễn phí)
- [ ] **Resend** — resend.com (miễn phí, 3.000 email/tháng)
- [ ] **SePay** — my.sepay.vn (miễn phí)

---

## PHẦN 2 — Source code (10 phút)

- [ ] **Fork repo** về GitHub của khách hàng
  - Vào repo gốc → **Fork** → chọn tài khoản GitHub của khách
  - Đặt tên repo tùy ý (VD: `my-template-store`)
  - Giữ **Private** nếu muốn bảo mật source code

---

## PHẦN 3 — Supabase Database (20 phút)

- [ ] **Tạo Supabase project mới**
  - supabase.com → New project
  - Đặt tên, chọn region **Singapore (ap-southeast-1)**
  - Đặt mật khẩu database (lưu lại)
  - Chờ ~2 phút để project khởi tạo

- [ ] **Chạy SQL migration**
  - Trong project → **SQL Editor** → New query
  - Copy toàn bộ nội dung file `supabase/deploy-via-dashboard.sql` từ repo
  - Paste vào editor → nhấn **Run** (Ctrl+Enter)
  - Kiểm tra Tables: phải thấy `products`, `orders`, `categories`, `settings`, `click_events`, `staff`, `email_campaigns`

- [ ] **Tạo Storage Buckets** (nếu file SQL chưa tạo)
  - Storage → Create bucket: `avatars` (Public, 512KB)
  - Storage → Create bucket: `site-assets` (Public, 5MB)

- [ ] **Copy 3 API keys** (Settings → API)
  - `Project URL` → dùng cho `NEXT_PUBLIC_SUPABASE_URL`
  - `anon/public key` → dùng cho `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role key` → dùng cho `SUPABASE_SERVICE_ROLE_KEY`
  - ⚠️ Lưu 3 giá trị này, dùng ở Bước 4

---

## PHẦN 4 — Cloudflare Workers Deploy (30 phút)

- [ ] **Tạo Cloudflare Workers project**
  - Cloudflare Dashboard → **Workers & Pages** → Create application → **Workers** → Deploy a Worker
  - Đặt tên (VD: `my-template-store`)

- [ ] **Kết nối GitHub repo**
  - Trong project → Settings → Build & Deployments → Connect Git repository
  - Chọn repo vừa fork ở Phần 2
  - **Build command:** `npx @opennextjs/cloudflare build`
  - **Build output directory:** *(để trống)*
  - Node.js version: **22**

- [ ] **Set 6 Environment Variables bắt buộc**
  - Settings → Environment Variables → Add → chọn **Production**
  - Thêm lần lượt (nhấn Encrypt cho các biến nhạy cảm):

  | Variable | Giá trị | Encrypt? |
  |----------|---------|----------|
  | `NEXT_PUBLIC_SUPABASE_URL` | Project URL từ Bước 3 | Không |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key từ Bước 3 | Không |
  | `SUPABASE_SERVICE_ROLE_KEY` | service_role key từ Bước 3 | ✅ Có |
  | `ADMIN_PASSWORD` | Mật khẩu đăng nhập Admin (tự đặt) | ✅ Có |
  | `ADMIN_SECRET` | Chuỗi ngẫu nhiên 40 ký tự | ✅ Có |
  | `CRON_SECRET` | Chuỗi ngẫu nhiên 40 ký tự | ✅ Có |

  > Tạo chuỗi ngẫu nhiên tại: https://generate-secret.vercel.app/40

- [ ] **Deploy lần đầu**
  - Deployments → **Retry deployment** hoặc push 1 commit nhỏ lên GitHub
  - Chờ 3–5 phút
  - Truy cập domain `*.workers.dev` → phải thấy trang chủ hiện ra
  - Thử đăng nhập `/admin/login` với mật khẩu `ADMIN_PASSWORD` vừa đặt

---

## PHẦN 5 — Cấu hình ban đầu trong Dashboard (20 phút)

Đăng nhập Admin → **Cấu hình** và điền lần lượt:

### Giao diện
- [ ] **Tên site** (hiển thị trên tab trình duyệt)
- [ ] **Tên brand** (hiển thị trên header)
- [ ] **Mô tả site** (dùng cho SEO)
- [ ] **Màu chủ đạo** (màu nút, highlight)
- [ ] **Logo** (upload ảnh hoặc nhập URL)
- [ ] **Favicon** (upload .ico hoặc .png 32×32)
- [ ] **OG Image** (upload ảnh 1200×630px cho chia sẻ mạng xã hội)

### Liên hệ
- [ ] **Email Admin** (nhận mật khẩu tạm khi quên mật khẩu)
- [ ] **Link Zalo** (hiển thị ở footer)

### Thanh toán SePay
- [ ] **Ngân hàng** (chọn từ danh sách)
- [ ] **Số tài khoản ngân hàng**
- [ ] **Tên chủ tài khoản** (VIẾT HOA KHÔNG DẤU, phải khớp với ngân hàng)

### Email Resend
- [ ] **Resend API Key** (lấy tại resend.com → API Keys)
- [ ] **From Email** (dùng `onboarding@resend.dev` để test, sau đó verify domain riêng)
- [ ] **From Name** (tên hiển thị người gửi)

---

## PHẦN 6 — SePay (15 phút)

- [ ] **Tạo tài khoản SePay** tại my.sepay.vn
- [ ] **Kết nối ngân hàng**: Cài đặt → Liên kết ngân hàng → kết nối đúng tài khoản đã điền ở Bước 5
- [ ] **Điền SePay Webhook Secret** vào Dashboard
  - Admin → Cấu hình → SePay Webhook Secret → nhập chuỗi bí mật tự chọn (VD: `sepay-secret-2024`)
- [ ] **Tạo Webhook trên SePay**
  - my.sepay.vn → Dịch vụ → Webhook → Tạo webhook mới
  - URL: copy từ **Admin → Cấu hình → Webhook & API URLs → SePay Webhook URL**
  - Dán vào SePay, nhấn lưu → copy API Key
- [ ] **Điền API Key của SePay Webhook** vào Dashboard (nếu cần)

---

## PHẦN 7 — Supabase Database Webhook (10 phút)

*(Webhook này kích hoạt gửi email template khi đơn thành công)*

- [ ] **Đặt Supabase Webhook Secret**
  - Admin → Cấu hình → Supabase Webhook Secret → nhập chuỗi bí mật (VD: `supa-secret-2024`)
- [ ] **Tạo Webhook trên Supabase**
  - supabase.com → project → **Database → Webhooks → Create a new hook**
  - Name: `order-success`
  - Table: `orders` | Events: chỉ chọn **UPDATE**
  - URL: copy từ **Admin → Cấu hình → Webhook & API URLs → Supabase DB Webhook URL**
  - HTTP Headers: thêm `x-webhook-secret` = chuỗi bí mật vừa nhập
  - Nhấn **Confirm**

---

## PHẦN 8 — Thêm sản phẩm đầu tiên (10 phút)

- [ ] Admin → **Sản phẩm** → Thêm sản phẩm mới
  - Tên sản phẩm
  - Giá (VND)
  - Mô tả ngắn
  - Template Link (link Notion/Google Sheets public để khách Duplicate)
  - Ảnh thumbnail (tùy chọn)
  - Danh mục

- [ ] Mở trang chủ → kiểm tra sản phẩm hiển thị đúng

---

## PHẦN 9 — Test toàn bộ luồng mua hàng (15 phút)

**Dùng tab ẩn danh (Incognito), chuyển khoản số tiền thật:**

- [ ] Vào trang chủ → chọn sản phẩm → bấm **Mua ngay**
- [ ] Nhập email thật của bạn → bấm **Tạo mã QR thanh toán**
- [ ] Quét QR → chuyển khoản đúng nội dung (mã đơn) và đúng số tiền
- [ ] Xác nhận trên màn hình chuyển sang **"Thanh toán thành công!"**
- [ ] Kiểm tra trong Admin → Đơn hàng: đơn đổi sang **Thành công**
- [ ] Kiểm tra hộp thư email: nhận được **email xác nhận** có link template
- [ ] Bấm link template → truy cập được Notion/Google Sheets

> ❗ Nếu không nhận được email: kiểm tra Resend Dashboard → Logs xem lỗi gì

---

## PHẦN 10 — Custom Domain (tùy chọn nhưng nên làm)

> Domain riêng giúp tránh bị chặn bởi một số ISP Việt Nam khi dùng `*.workers.dev`

- [ ] Mua domain (NameSilo, Namecheap, hoặc nhà cung cấp Việt Nam)
- [ ] Cloudflare → Workers & Pages → project → **Custom Domains** → Add
- [ ] Nhập domain → làm theo hướng dẫn thêm DNS record
- [ ] Chờ DNS propagate (~5–30 phút)
- [ ] Truy cập lại qua domain mới → kiểm tra hoạt động

---

## PHẦN 11 — Marketing & Tracking (tùy chọn)

Sau khi hệ thống chạy ổn, thiết lập marketing:

- [ ] **GTM Container ID** — Admin → Cấu hình → Analytics & Tracking
  - Tạo GTM container tại tagmanager.google.com → copy `GTM-XXXXXXX`
  - Cấu hình các tag trong GTM: GA4, Facebook Pixel, Google Ads

- [ ] **Meta CAPI** (server-side, tăng chất lượng quảng cáo Facebook)
  - Meta Business → Events Manager → chọn Pixel → Settings → Generate Access Token
  - Admin → Cấu hình → Facebook Pixel ID + Meta Access Token

- [ ] **TikTok Pixel** (nếu chạy ads TikTok)
  - TikTok Ads Manager → Assets → Events → Web Events → Pixel ID
  - Lưu vào Admin → Cấu hình → TikTok Pixel ID → thêm tag vào GTM

- [ ] **Google Ads** (nếu chạy Google Ads)
  - Google Ads → Tools → Conversions → Conversion ID
  - Lưu vào Admin → Cấu hình → Google Ads Conversion ID → thêm tag vào GTM

- [ ] **Đổi mật khẩu Admin** (sau khi bàn giao)
  - Admin → Cấu hình → Đổi mật khẩu

---

## Kiểm tra nhanh cuối cùng

Trước khi bàn giao chính thức, xác nhận tất cả các điểm sau:

- [ ] Trang chủ hiển thị đúng brand (tên, logo, màu)
- [ ] Sản phẩm hiển thị với ảnh, giá, nút Mua ngay
- [ ] Luồng mua hàng end-to-end hoạt động (QR → thanh toán → email)
- [ ] Admin Dashboard đăng nhập được, xem đơn hàng được
- [ ] Domain riêng hoạt động (nếu đã setup)
- [ ] Email giao hàng trông chuyên nghiệp (đúng brand color, tên công ty)

---

## Thông tin cần bàn giao cho khách

Sau khi hoàn thành, cung cấp cho khách:

| Thông tin | Ghi chú |
|-----------|---------|
| URL trang web | Domain riêng hoặc `*.workers.dev` |
| URL Admin Dashboard | `<domain>/admin/login` |
| Mật khẩu Admin | Lưu trong password manager |
| Tài khoản GitHub | Để họ tự push code nếu cần |
| Tài khoản Supabase | Để họ xem dữ liệu |
| Tài khoản Cloudflare | Để họ quản lý deploy |

---

*Tài liệu kỹ thuật chi tiết: xem file `AGENTS.md` trong repo.*
