# AGENTS.md — webTemplate

Hệ thống bán template Notion & Google Sheets tự động. Khách mua → quét QR VietQR → SePay xác nhận → email giao template tự động.

---

## Tech stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend + API | Next.js 15.5.18 (App Router) |
| Deploy | Cloudflare Workers via `@opennextjs/cloudflare` |
| Database + Realtime | Supabase (PostgreSQL + Supabase Realtime) |
| Auth (admin) | Cookie-based, bcrypt password, không dùng Supabase Auth |
| Email | Resend |
| Thanh toán | SePay (QR VietQR + Webhook) |
| Storage | Supabase Storage (bucket `avatars`, `site-assets`) |
| Analytics | GA4 via `gtag()` |

---

## Lệnh thường dùng

```bash
npm run dev          # Chạy dev server tại localhost:3000
npx tsc --noEmit     # Kiểm tra TypeScript
supabase db push     # Apply migration lên Supabase remote (tự confirm bằng printf 'y\n' |)
git push origin main # Push lên GitHub (Cloudflare tự deploy)
```

> **Không dùng `npm run build` để test local** — build target là Cloudflare Workers (Edge runtime), chạy local bằng `npm run dev`.

---

## Kiến trúc thư mục

```
src/
├── app/
│   ├── (public)
│   │   ├── page.tsx                    # Trang chủ — danh sách sản phẩm
│   │   ├── products/[productId]/       # Landing page sản phẩm + inline checkout
│   │   ├── checkout/[productId]/       # Checkout page riêng (advanced flow)
│   │   └── orders/                     # Lịch sử mua hàng theo email
│   ├── admin/                          # Dashboard admin (Owner)
│   │   ├── layout.tsx                  # AdminShell — sidebar + mobile top bar
│   │   ├── AdminShell.tsx              # Client wrapper quản lý mobile sidebar state
│   │   ├── Sidebar.tsx                 # Slide-in trên mobile, static w-56 trên desktop
│   │   ├── page.tsx                    # Dashboard tổng quan
│   │   ├── products/                   # CRUD sản phẩm + LandingEditor
│   │   ├── orders/                     # Danh sách + filter đơn hàng
│   │   ├── categories/                 # Quản lý danh mục
│   │   ├── staff/                      # Quản lý nhân viên (Manager/Collaborator)
│   │   ├── settings/                   # Cấu hình hệ thống (Resend, SePay, GA4...)
│   │   └── setup/                      # Hướng dẫn setup từng bước
│   ├── manager/                        # Alias /admin cho role manager
│   ├── collaborator/                   # Alias /admin cho role collaborator
│   └── api/
│       ├── orders/route.ts             # POST tạo đơn hàng → trả QR URL
│       ├── orders/bundle/route.ts      # POST tạo đơn bundle (nhiều sản phẩm)
│       ├── orders/[orderId]/route.ts   # PATCH hủy đơn
│       ├── orders/history/route.ts     # GET lịch sử theo email
│       ├── webhook/sepay/route.ts      # POST từ SePay khi thanh toán thành công
│       ├── webhook/order-success/      # POST từ Supabase DB Webhook khi đơn = success
│       ├── cron/expire-orders/         # POST — Cloudflare Cron Triggers gọi mỗi 5 phút
│       └── cron/abandoned-cart/        # POST — Cloudflare Cron Triggers gọi mỗi 5 phút
├── components/
│   ├── Header.tsx                      # Header public: Logo, Search, Settings menu
│   ├── ProductGrid.tsx                 # Grid sản phẩm + filter mobile/desktop
│   ├── LandingEditor.tsx               # Editor 7 section landing page (client component)
│   └── SocialProofToast.tsx            # Toast "X người vừa mua"
└── lib/
    ├── supabase/client.ts              # Browser Supabase client
    ├── supabase/server.ts              # Server Supabase client (createAdminClient)
    ├── settings.ts                     # getSettings() + updateSettings()
    ├── admin-auth.ts                   # Xác thực + hash password admin
    ├── get-role.ts                     # Đọc role từ cookie (owner/manager/collaborator)
    ├── expireOrders.ts                 # Logic hủy đơn quá hạn
    ├── gtag.ts                         # fireEvent() wrapper cho GA4
    └── utils.ts                        # formatCurrency, calcDiscountPercent...
```

---

## Database (Supabase)

### Bảng chính
| Bảng | Mục đích |
|------|----------|
| `products` | Sản phẩm: name, price, original_price, template_link, landing_content (JSONB) |
| `orders` | Đơn hàng: customer_email, amount, status, paid_at, cart_email_sent_at |
| `categories` | Danh mục sản phẩm |
| `settings` | Key-value cấu hình hệ thống (Resend, SePay, GA4, brand...) |
| `click_events` | Analytics nội bộ: event_type, product_id, session_id |
| `staff` | Tài khoản nhân viên (manager/collaborator) |

### Supabase Storage buckets
| Bucket | Dùng cho | Max size |
|--------|----------|----------|
| `avatars` | Avatar testimonials landing page | 512 KB |
| `site-assets` | Logo, favicon, og-image | 5 MB |

### Order status flow
```
pending → success (SePay webhook xác nhận)
pending → cancelled (user hủy tay)
pending → expired (cron expire sau 15 phút không thanh toán)
```

---

## Luồng mua hàng

```
1. Khách vào trang sản phẩm /products/[id]
   → Click "Mua ngay" → fireEvent("Click_Mua_Ngay")
   → Nhập email + phone → Submit form
   
2. POST /api/orders → tạo order (status=pending)
   → Trả về QR URL (VietQR) + order_id
   → fireEvent("Generate_QR")
   → Supabase Realtime lắng nghe order đó
   
3. Khách quét QR → chuyển khoản đúng nội dung (order_id)
   → SePay nhận tiền → POST /api/webhook/sepay
   → Update order status = success
   
4. Supabase DB Webhook → POST /api/webhook/order-success
   → Gửi email template qua Resend
   → fireEvent("Purchase")
   → Realtime client nhận update → hiển thị "Thanh toán thành công"
```

---

## Admin authentication

- **3 roles**: `owner` (full access) / `manager` (CRUD sản phẩm, xem đơn) / `collaborator` (chỉ xem)
- **Login**: Cookie `admin_token` (bcrypt hash), đọc từ `get-role.ts`
- **Middleware** (`middleware.ts`): chặn sai path, redirect về đúng login
- **Password lưu trong DB** (`settings` table): `admin_password` (bcrypt), `admin_temp_password` (forgot password)
- **Không dùng Supabase Auth** — tự implement để đơn giản hóa

---

## Cấu hình quan trọng (Settings table)

Toàn bộ cấu hình lưu trong bảng `settings`, quản lý qua Admin → Cấu hình:

| Key | Mô tả |
|-----|-------|
| `site_name`, `brand_name`, `brand_color` | Giao diện |
| `logo_url`, `favicon_url`, `og_image_url` | Assets (URL hoặc upload Supabase Storage) |
| `bank_code`, `bank_account_number`, `bank_account_holder` | QR VietQR |
| `sepay_webhook_secret` | Xác thực webhook từ SePay |
| `resend_api_key`, `resend_from_email`, `resend_from_name` | Gửi email |
| `supabase_webhook_secret` | Xác thực DB Webhook |
| `ga_id` | GA4 Measurement ID |
| `ai_provider`, `claude_api_key`, `gemini_api_key` | AI generate landing page |

---

## Cron jobs (Cloudflare Cron Triggers — tự động, không cần dịch vụ ngoài)

Cấu hình trong `wrangler.toml` (`[triggers] crons = ["*/5 * * * *"]`).
Entry point: `src/cf-worker.ts` — wraps OpenNext handler, thêm `scheduled()` handler.

Cả hai endpoint dùng header `x-cron-secret: <CRON_SECRET>` (env var).

| URL | Method | Interval | Mục đích |
|-----|--------|----------|----------|
| `/api/cron/expire-orders` | POST | 5 phút | Hủy đơn pending quá 15 phút |
| `/api/cron/abandoned-cart` | POST | 5 phút | Email nhắc đơn bỏ rơi 15–120 phút |

> Các URL trên có thể gọi thủ công để test (copy từ Admin → Cấu hình → Webhook & API URLs).

---

## Webhooks (cấu hình trên dịch vụ ngoài)

| Endpoint | Cấu hình ở đâu | Header bảo vệ |
|----------|---------------|---------------|
| `/api/webhook/sepay` | SePay Dashboard → Dịch vụ → Webhook | `Authorization: Apikey <sepay_webhook_secret>` |
| `/api/webhook/order-success` | Supabase → Database → Webhooks | `x-webhook-secret: <supabase_webhook_secret>` |

---

## GA4 Event Tracking

Tất cả events fire qua `fireEvent()` từ `src/lib/gtag.ts` — chỉ hoạt động khi GA4 đã cấu hình (`ga_id` trong Settings).

| Event | Khi nào | File |
|-------|---------|------|
| `Click_Mua_Ngay` | Click nút Mua ngay (kể cả floating CTA) | ProductDetail.tsx, CheckoutClient.tsx |
| `Generate_QR` | Sau khi tạo QR thành công | ProductDetail.tsx, CheckoutClient.tsx |
| `Purchase` | Khi Supabase Realtime xác nhận thanh toán | ProductDetail.tsx, CheckoutClient.tsx |

---

## Gotchas & conventions

- **Next.js 15.5.18** — không nâng lên 16.x (bug prefetch RSC với OpenNext)
- **`createAdminClient()`** — dùng ES import, không `require()`
- **`NEXT_PUBLIC_*` vars** — bake vào bundle lúc build, phải đúng trước khi build Cloudflare
- **Role đọc từ cookie** trong `get-role.ts`, không qua middleware header (bị mất khi rewrite)
- **Cloudflare**: NODE_VERSION=22 trong Build Variables
- **Migration**: luôn chạy `printf 'y\n' | supabase db push` ngay sau khi tạo file migration
- **Commit không push**: chỉ push khi có yêu cầu rõ ràng
- **Mobile**: Admin sidebar là fixed overlay trên mobile (AdminShell + Sidebar.tsx)
