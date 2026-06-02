# Hướng dẫn quy trình làm việc với Claude Code

## Quy trình phát triển tính năng (Sandbox Workflow)

Mọi tác vụ sửa code đều theo quy trình sau để đảm bảo code chính thức (main) không bị thay đổi cho đến khi đã kiểm tra xong.

---

### Bước 1 — Tạo bản nháp

Claude tự động tạo một bản sao tách biệt của toàn bộ codebase (gọi là "branch nháp"). Mọi thay đổi được viết vào bản nháp này, codebase gốc không bị ảnh hưởng.

```
sandbox/ten-tac-vu
```

---

### Bước 2 — Làm việc trên bản nháp

Claude thực hiện tất cả thay đổi trên bản nháp. Dev server local chạy trên bản nháp này — bạn xem kết quả tại `http://localhost:3000` (hoặc port tương ứng).

---

### Bước 3 — Bạn kiểm tra local

Mở trình duyệt, kiểm tra kết quả trên localhost.

- **Chưa ổn** → Claude sửa tiếp trên bản nháp, bản gốc vẫn nguyên
- **Ổn** → nói "ok" để chuyển sang bước tiếp theo

---

### Bước 4 — Chuyển sang codebase gốc

Khi bạn xác nhận ok, Claude copy đúng những thay đổi đó sang codebase gốc (main). Dev server tự reload — bạn preview lại lần 2 trên codebase gốc.

---

### Bước 5 — Xác nhận lần 2

Kiểm tra lại trên localhost lần cuối.

- **Ổn** → nói "ok, commit" để lưu chính thức
- **Chưa ổn** → Claude sửa tiếp trên main

---

### Bước 6 — Commit & dọn dẹp

Claude lưu thay đổi vào git (commit), sau đó xóa bản nháp. Codebase gọn gàng, lịch sử git sạch.

---

### Bước 7 — Push & Deploy (khi bạn quyết định)

Claude **không tự push**. Khi bạn sẵn sàng deploy lên production, bạn ra lệnh "push" hoặc "push và deploy". Cloudflare tự động build và deploy từ nhánh main.

---

## Lưu ý quan trọng

| Điều | Giải thích |
|------|-----------|
| Branch nháp | Chỉ tồn tại trên máy local, Cloudflare không nhìn thấy |
| Main branch | Cloudflare theo dõi và deploy khi có push |
| Commit | Chỉ xảy ra sau khi bạn xác nhận 2 lần |
| Push | Chỉ khi bạn ra lệnh rõ ràng |

---

## Ngoại lệ

Khi bạn nói rõ **"commit luôn"** hoặc **"bỏ qua sandbox"** thì Claude làm thẳng trên main không qua bước tạo bản nháp.
