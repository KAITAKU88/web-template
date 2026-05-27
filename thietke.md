# **Hệ Thống Bán Template Tự Động (Hybrid Architecture)**

## **1. Thành phần hệ thống**
- Frontend: Next.js (hoặc React) - Hiển thị UI/UX và xử lý Real-time updates.
- Database: Supabase (Bảng products, orders).
- Payment: SePay (Cổng thanh toán QR Code động).
- Automation: n8n (Giao hàng qua Email & Hậu mãi).

## **2. Luồng hoạt động (User Flow & Data Flow)**
### Giai đoạn 1: Khởi tạo (Checkout)

1. **Khách hàng:** Nhập Email → Bấm "Mua/Nhận Template".

2. **Website:**
   - Tạo bản ghi trong bảng `orders` với `status: pending`
   - Dùng `order_id` làm nội dung chuyển khoản
   - Hiển thị mã VietQR qua API SePay
   - Lắng nghe thay đổi của `order_id` bằng Supabase Realtime

---

### Giai đoạn 2: Thanh toán (Payment)

3. **Khách hàng:** Quét mã QR và chuyển khoản thành công.

4. **SePay:**  
   Nhận biến động số dư → Gửi Webhook chứa `order_id` và `amount` về Website.

5. **Website (API Route):**
   - Xác thực Webhook
   - Đối soát `amount` và `order_id`
   - Cập nhật:
     - `status: success`
     - `paid_at: now()`

---

### Giai đoạn 3: Giao hàng (Automation)

6. **Supabase:**  
   Phát hiện `UPDATE` trên bảng `orders` khi `status = success`.

7. **Database Webhook:**  
   Tự động gửi tín hiệu sang n8n.

8. **n8n:**
   - Lấy `template_link` từ bảng `products`
   - Gửi Email chứa link cho `customer_email`
## **3. Cấu trúc Cơ sở dữ liệu (Supabase Schema)**

### Bảng: products
*Quản lý danh mục các mẫu Template Notion và Google Sheets.*

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PK`, `default: uuid_generate_v4()` | ID duy nhất của sản phẩm |
| `name` | `text` | `not null` | Tên Template (VD: Notion Second Brain) |
| `description` | `text` | | Mô tả chi tiết tính năng |
| `price` | `numeric` | `not null` | Giá bán niêm yết |
| `template_link` | `text` | `not null` | Link gốc để Duplicate/Copy |
| `type` | `text` | | Phân loại: `notion` hoặc `google_sheet` |
| `image_url` | `text` | | Link ảnh bìa sản phẩm |
| `created_at` | `timestamptz` | `default: now()` | Thời gian tạo sản phẩm |

---

### Bảng: orders
*Quản lý giao dịch và đối soát thanh toán tự động.*

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `text` | `PK` | Mã đơn hàng (Dùng làm nội dung CK) |
| `customer_email` | `text` | `not null` | Email người mua nhận template |
| `product_id` | `uuid` | `FK (products.id)` | Sản phẩm được chọn mua |
| `amount` | `numeric` | `not null` | Số tiền thực tế khách phải trả |
| `status` | `text` | `default: 'pending'` | Trạng thái: `pending`, `success`, `expired` |
| `created_at` | `timestamptz` | `default: now()` | Thời gian khởi tạo đơn hàng |
| `paid_at` | `timestamptz` | | Thời gian xác nhận tiền về từ SePay |

---

### Bảng: customers (Tùy chọn)
*Lưu trữ tệp khách hàng để Remarketing qua n8n.*

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `email` | `text` | `PK` | Email định danh khách hàng |
| `full_name` | `text` | | Họ tên khách (nếu có) |
| `total_orders` | `int4` | `default: 0` | Tổng số đơn hàng đã mua |
| `last_purchase` | `timestamptz` | | Lần mua gần nhất |

---

### SQL Script (Chạy trong Supabase SQL Editor)

```sql
-- Kích hoạt tiện ích tạo UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tạo bảng products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  template_link TEXT NOT NULL,
  type TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo bảng orders
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer_email TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);