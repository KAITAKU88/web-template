# Thuyết minh hệ thống bán sản phẩm số tự động

---

## Hệ thống này là gì?

**Nền tảng bán sản phẩm số tự động** — cho phép cá nhân và doanh nghiệp nhỏ bán các sản phẩm kỹ thuật số (template Notion, Google Sheets, tài liệu, khóa học...) với luồng mua hàng hoàn toàn tự động: khách **tự đặt hàng, tự thanh toán, tự nhận sản phẩm** mà không cần người bán can thiệp.

---

## Vấn đề hệ thống giải quyết

### 1. Giao hàng thủ công — mất thời gian, dễ sót đơn

Cách làm thông thường của người bán sản phẩm số tại Việt Nam:
> Khách nhắn tin → người bán xác nhận chuyển khoản → copy link → gửi lại cho khách.

**Hệ quả:** Phải trực điện thoại 24/7. Đơn đặt lúc 2 giờ sáng, khách chờ đến sáng mới nhận được. Dễ quên, dễ nhầm khi nhiều đơn cùng lúc.

**Giải pháp:** Toàn bộ quá trình diễn ra tự động trong vòng **dưới 60 giây** sau khi khách chuyển khoản — không cần người bán online.

---

### 2. Chi phí cổng thanh toán cao

Các cổng thanh toán truyền thống (Momo, VNPay, Stripe...) thu phí **1.5–3.5% mỗi giao dịch**. Bán sản phẩm 100.000đ mất 3.500đ phí.

**Giải pháp:** Dùng **QR VietQR** — khách chuyển khoản thẳng vào tài khoản ngân hàng của người bán. Phí giao dịch = **0đ**. SePay chỉ đóng vai trò xác nhận tự động, không giữ tiền.

---

### 3. Không có hệ thống quản lý — vận hành mù

Khi bán qua Zalo/Facebook, không biết:
- Hôm nay bán được bao nhiêu?
- Sản phẩm nào bán chạy nhất?
- Khách nào chưa nhận được hàng?
- Có bao nhiêu đơn bỏ dở?

**Giải pháp:** Dashboard Admin đầy đủ — thống kê realtime, quản lý đơn hàng, lịch sử khách hàng, tất cả trong một nơi.

---

### 4. Khó mở rộng và bàn giao

Bán qua chat cá nhân = không thể thuê thêm nhân viên quản lý, không thể bàn giao cho người khác vận hành.

**Giải pháp:** Hệ thống có phân quyền 3 cấp (Owner / Quản lý / Cộng tác viên), giao diện web đầy đủ — nhân viên chỉ cần đăng nhập, không cần biết kỹ thuật.

---

### 5. Bỏ lỡ cơ hội marketing & bám đuổi khách hàng

Khách vào xem sản phẩm rồi rời đi — không có cách nào nhắc nhở họ quay lại.

**Giải pháp:** Hệ thống tích hợp đầy đủ công cụ marketing:
- **Abandoned Cart Email** — tự động gửi email nhắc khách sau 15 phút nếu chưa thanh toán
- **GTM Container** — quản lý tất cả tracking tags (Facebook Pixel, Google Ads, TikTok Pixel) từ một nơi
- **Meta CAPI** — gửi dữ liệu conversion từ server, vượt qua AdBlock, tăng chất lượng quảng cáo Facebook
- **Email Campaigns** — gửi chiến dịch email đến khách hàng cũ ngay trong Dashboard

---

## Tính năng chi tiết

### Luồng mua hàng tự động

```
Khách vào trang sản phẩm
    ↓
Bấm "Mua ngay" → nhập email
    ↓
Hệ thống tạo mã QR VietQR tức thì
    ↓
Khách quét QR → chuyển khoản
    ↓  (trong vòng 5–30 giây)
SePay phát hiện giao dịch → gửi tín hiệu
    ↓
Hệ thống xác nhận đơn → gửi email tự động
    ↓
Khách nhận email có link sản phẩm
    ↓
Màn hình hiển thị "Thanh toán thành công!"
```

**Toàn bộ quá trình dưới 60 giây. Không cần người bán làm gì.**

---

### Quản lý sản phẩm

- Thêm/sửa/xóa sản phẩm không giới hạn
- Hỗ trợ giá gốc + giá khuyến mãi (hiển thị % giảm tự động)
- Ảnh thumbnail sản phẩm
- Phân loại theo danh mục tùy chỉnh
- **Landing page riêng** cho mỗi sản phẩm: headline, nỗi đau khách hàng, giải pháp, tính năng, đánh giá, FAQ
- **AI tự động tạo nội dung landing page** dựa trên tên sản phẩm (hỗ trợ Claude và Gemini)
- **Order Bump** — đề xuất thêm sản phẩm ngay tại trang checkout
- **Bundle Upsell** — hiển thị combo ưu đãi sau khi mua thành công

---

### Dashboard Admin

**Tổng quan:**
- Doanh thu hôm nay và tổng doanh thu
- Số đơn thành công / đang chờ
- Đơn hàng gần đây realtime

**Analytics nội bộ (không cần GA4/GTM API):**
- Phễu chuyển đổi: Xem trang → Bấm mua → Tạo QR → Thanh toán thành công
- Biểu đồ doanh thu 7 ngày
- Top sản phẩm được quan tâm nhiều nhất

**Quản lý đơn hàng:**
- Lọc theo trạng thái, thời gian, email khách
- Phân trang cho kho đơn hàng lớn
- Xem lịch sử từng giao dịch

---

### Hệ thống email tự động

| Loại email | Thời điểm gửi | Mục đích |
|------------|--------------|----------|
| Email xác nhận đơn hàng | Ngay sau thanh toán | Giao link sản phẩm + thông tin đơn |
| Abandoned Cart Email | 15 phút sau khi tạo QR mà chưa thanh toán | Nhắc khách quay lại hoàn tất |
| Email Campaign | Theo lịch người bán đặt | Marketing, ra mắt sản phẩm mới, ưu đãi |

---

### Marketing & Theo dõi khách hàng

**GTM (Google Tag Manager):**
Nhập một Container ID — tất cả tracking tags (GA4, Facebook Pixel, Google Ads, TikTok Pixel) cấu hình trong GTM Dashboard, không cần sửa code.

**3 sự kiện tracking tự động:**
- `Click_Mua_Ngay` — khi khách bấm nút mua (đo lường intent)
- `Generate_QR` — khi khách tạo mã QR (đo lường commitment)
- `Purchase` — khi thanh toán thành công (đo lường conversion)

→ Dùng để tạo **Custom Audiences** cho retargeting: nhắm vào người đã tạo QR nhưng chưa mua, chạy quảng cáo bám đuổi họ 3 ngày.

**Meta CAPI (Conversions API):**
Gửi dữ liệu conversion từ server — **vượt qua AdBlock, vượt qua iOS tracking restriction**. Kết quả: Facebook nhận được dữ liệu chính xác hơn → thuật toán tối ưu tốt hơn → chi phí quảng cáo rẻ hơn.

**Email Campaigns:**
Tạo và gửi chiến dịch email marketing trực tiếp trong Dashboard:
- Chọn phân khúc: tất cả khách hàng / mua trong 30 ngày / người mua sản phẩm X
- Soạn thảo HTML với template mẫu có sẵn
- Gửi hàng loạt qua Resend — không cần mở Resend, không cần biết code

---

### Cấu hình hoàn toàn qua Dashboard

Không cần chạm vào source code để:

| Cài đặt | Ví dụ |
|---------|-------|
| Thương hiệu | Tên, logo, màu chủ đạo, favicon |
| Thanh toán | Ngân hàng, số tài khoản, tên chủ TK |
| Email | API key Resend, địa chỉ gửi, tên hiển thị |
| Analytics | GTM ID, GA4 ID, Facebook Pixel ID |
| Tracking | Meta Access Token (CAPI), TikTok Pixel, Google Ads ID |
| AI | Chọn Claude hoặc Gemini để tạo landing page |

---

### Phân quyền nhân sự

| Role | Quyền |
|------|-------|
| **Owner** | Toàn quyền: cấu hình, sản phẩm, đơn hàng, nhân viên, marketing |
| **Quản lý** | Thêm/sửa sản phẩm, xem đơn hàng, marketing |
| **Cộng tác viên** | Chỉ xem — không thể thay đổi dữ liệu |

---

### Tự động hóa ngầm (không cần thao tác)

Hệ thống chạy **2 tác vụ mỗi 5 phút** thông qua Cloudflare Cron Triggers:

1. **Tự hủy đơn hết hạn** — đơn pending quá 15 phút không thanh toán → tự động hủy, giải phóng hệ thống
2. **Gửi Abandoned Cart Email** — phát hiện đơn bỏ dở → gửi email nhắc nhở tự động

---

## Hạ tầng & Chi phí vận hành

| Dịch vụ | Chi phí | Giới hạn miễn phí |
|---------|---------|-------------------|
| Cloudflare Workers | **Miễn phí** | 100.000 request/ngày |
| Supabase | **Miễn phí** | 500MB database, 1GB storage |
| Resend | **Miễn phí** | 3.000 email/tháng |
| SePay | **Miễn phí** | Không giới hạn giao dịch |
| GitHub | **Miễn phí** | Repository không giới hạn |

**→ Chi phí vận hành hàng tháng: 0đ** cho quy mô vừa và nhỏ.

Khi mở rộng (hàng nghìn đơn/tháng), chi phí Supabase Pro: **~$25/tháng**.

---

## Phù hợp với ai?

- **Người bán template** Notion, Google Sheets, Figma, Canva
- **Người bán tài liệu số** — ebook, tài liệu học tập, bộ câu hỏi
- **Người bán khóa học** dạng link video/Google Drive
- **Creator** muốn monetize nội dung số của mình
- **Agency/Freelancer** muốn bán preset, template thiết kế

---

## Tóm lại

> Trước đây: bán sản phẩm số = ngồi chờ khách nhắn tin, xác nhận chuyển khoản bằng tay, copy link gửi thủ công, mất 5–15 phút mỗi đơn.
>
> Sau khi dùng hệ thống này: thiết lập một lần, hệ thống tự vận hành 24/7. Người bán tập trung tạo sản phẩm, hệ thống lo phần còn lại.

**Một hệ thống duy nhất thay thế cho: cổng thanh toán + tool giao hàng tự động + CRM + email marketing + analytics.**
