# Hướng dẫn Deploy lên Cloudflare Pages

Dự án: **Web bán template Notion / Google Sheets tự động**  
Adapter: `@opennextjs/cloudflare` (hỗ trợ Next.js 16)

---

## Bước 1 — Tạo tài khoản Cloudflare

1. Truy cập **cloudflare.com** → nhấn **Sign Up**
2. Nhập email + mật khẩu → **Create Account**
3. Xác nhận email (check hộp thư)
4. Bỏ qua màn hình "Add a site" nếu hỏi — không cần add domain ngay

---

## Bước 2 — Push code lên GitHub (nếu chưa có)

Kiểm tra remote đã tồn tại chưa:

```bash
git remote -v
```

Nếu chưa có, tạo repo mới trên github.com rồi chạy:

```bash
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

---

## Bước 3 — Tạo Pages project trên Cloudflare

1. Đăng nhập **dash.cloudflare.com**
2. Menu trái → **Workers & Pages**
3. Nhấn **Create application**
4. Chọn tab **Pages**
5. Nhấn **Connect to Git**

---

## Bước 4 — Kết nối GitHub

1. Nhấn **Connect GitHub** → cửa sổ GitHub mở ra
2. Nhấn **Authorize Cloudflare Pages**
3. Chọn **Only select repositories** → tìm repo của bạn → **Install & Authorize**
4. Quay lại Cloudflare, chọn repo từ danh sách → nhấn **Begin setup**

---

## Bước 5 — Cấu hình build

Màn hình **Set up builds and deployments**, điền chính xác:

| Field | Giá trị |
|-------|---------|
| Project name | `web-template` (hoặc tên bạn muốn) |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `npx @opennextjs/cloudflare build` |
| Build output directory | `.open-next/assets` |

Nhấn **Environment variables (advanced)** để mở phần env vars ngay tại bước này.

---

## Bước 6 — Set 6 environment variables

Nhấn **Add variable**, thêm lần lượt từng biến.  
Với các biến nhạy cảm, tick **Encrypt**.

| Variable | Lấy ở đâu | Encrypt? |
|----------|-----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | Không |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public key | Không |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key | **Có** |
| `ADMIN_PASSWORD` | Tự đặt — mật khẩu đăng nhập /admin | **Có** |
| `ADMIN_SECRET` | Chuỗi random 32+ ký tự | **Có** |
| `CRON_SECRET` | Chuỗi random 32+ ký tự | **Có** |

Tạo chuỗi random tại: **generate-secret.vercel.app/40**

> **Lưu ý:** `ADMIN_SECRET` và `CRON_SECRET` phải là chuỗi ngẫu nhiên phức tạp,
> không dùng mật khẩu đơn giản. Copy và lưu lại ở nơi an toàn.

---

## Bước 7 — Deploy lần đầu

Nhấn **Save and Deploy** → Cloudflare bắt đầu build.

- Thời gian build lần đầu: **3–6 phút**
- Bạn thấy log build realtime — chờ đến khi hiện **"Success"**
- Nếu build lỗi, xem log → thường là thiếu env var hoặc sai build command

---

## Bước 8 — Truy cập và kiểm tra site

Sau khi deploy xong, Cloudflare cấp domain dạng:

```
https://web-template-xxx.pages.dev
```

Kiểm tra lần lượt:
- Trang chủ hiển thị danh sách sản phẩm
- Truy cập `/admin/login` → đăng nhập bằng `ADMIN_PASSWORD` đã set
- Vào `/admin/setup` → xem hướng dẫn triển khai tiếp theo

---

## Bước 9 — Cấu hình Cron tự động hủy đơn hết hạn

Cloudflare Pages không có cron built-in. Dùng **cron-job.org** (miễn phí):

1. Đăng ký tại **cron-job.org**
2. Nhấn **Create cronjob**
3. Điền thông tin:

| Field | Giá trị |
|-------|---------|
| URL | `https://your-domain.pages.dev/api/cron/expire-orders` |
| Execution schedule | Every **5 minutes** |
| Request method | `POST` |

4. Tab **Headers** → Add header:
   - Name: `x-cron-secret`
   - Value: `<CRON_SECRET bạn đã set ở Bước 6>`
5. Nhấn **Create**

---

## Bước 10 — Custom domain (tùy chọn)

Nếu bạn có domain riêng (mua trên Namecheap, GoDaddy, v.v.):

1. Cloudflare Dashboard → project → tab **Custom domains**
2. Nhấn **Set up a custom domain** → nhập domain của bạn
3. Cloudflare hướng dẫn thêm DNS record tại nơi mua domain
4. Chờ 5–30 phút DNS propagate → HTTPS tự động kích hoạt

---

## Sau này — Mỗi khi update code

Chỉ cần push lên GitHub, Cloudflare tự động deploy:

```bash
git add .
git commit -m "your message"
git push origin main
```

Cloudflare detect push → build lại → deploy. Không cần thao tác thêm.

---

## Checklist debug nếu gặp lỗi

| Triệu chứng | Kiểm tra |
|-------------|----------|
| Build thất bại | Build command đúng chưa: `npx @opennextjs/cloudflare build` |
| Build output không tìm thấy | Build output directory đúng chưa: `.open-next/assets` |
| Site trả về lỗi 500 | Cloudflare → Deployments → **Functions logs** xem lỗi cụ thể |
| Không đăng nhập được /admin | Kiểm tra `ADMIN_PASSWORD` và `ADMIN_SECRET` đã set chưa |
| Supabase lỗi kết nối | `NEXT_PUBLIC_SUPABASE_URL` phải đúng format `https://xxx.supabase.co` |
| Email không gửi được | Kiểm tra Resend API key trong Admin → Cấu hình → Email |
| SePay webhook không nhận | Webhook URL phải là HTTPS, đúng domain Cloudflare |

---

## Thông tin kỹ thuật

- **Adapter:** `@opennextjs/cloudflare` v1.x
- **Next.js:** 16.x
- **Compatibility flags:** `nodejs_compat`
- **Config file:** `wrangler.toml`
- **Build script:** `npm run pages:build`
