
2. Tôi muốn tạo 1 vai trò nữa là "Cộng tác viên" thực sự, họ không phải nhân viên, chỉ là đối tác hợp tác đề tạo ra template, họ là người có template muốn bán trên nền tảng của tôi. Quyền hạn của người này như sau:
- Cộng tác viên chỉ được xem các mục Tổng quan, Sản phẩm, Đơn hàng, Thư viện ảnh. 
- Trong mục sản phẩm, họ chỉ được phép xem các sản phẩm do chính họ tạo ra (tức là sản phẩm cần có thêm 1 trường là người tạo, mỗi người sẽ có 1 id riêng chẳng hạn), họ có toàn quyền với sản phẩm đó như: Tạo ra, xóa, sửa. Các sản phẩm không phải do họ tạo ra thì hoàn toàn bị ẩn đi, họ không xem được 
- Trong mục Đơn hàng, họ cũng chỉ được xem đơn hàng liên quan đến sản phẩm của họ. Những đơn khác bị ẩn đi.
- Trong mục thư viện ảnh, họ cũng chỉ xem và thao tác được với ảnh do họ upload lên. Ảnh của người khác upload lên họ không xem được. 

- Mục Nhân viên đổi tên thành Người dùng, Cộng tác viên không thể xem mục này (bị ẩn đi), nhưng trong mục này sẽ xuất hiện thêm phần Thống kê để theo dõi hành vi của Người dùng. Mục thống kê này chỉ xuất hiện cho Admin xem, tất cả đối tượng khác không thấy được, kể cả quản lý. Ví dụ như thống kê xem cộng tác viên, nhân viên đã đăng nhập bao nhiêu lần trong ngày, tuần, tháng, thời điểm gần nhất, đã tạo, xóa... hay làm gì.. chỉ giữ.
- Tóm lại là Cộng tác viên không được xóa bất kỳ thông tin gì mà không phải là do họ tạo ra. 

4. Gộp 2 file todolist và HANDOVER_CHECKLIST lại, cả 2 file đều đang nói về các công việc phải thực hiện thủ công. Hãy kiểm tra lại toàn bộ hệ thống xem có những cấu hình nào cần thực hiện thủ công và ghi vào file.

5. Trong phần Cấu hình/Link bảo vệ tải template thì 2 trường để nhập số giờ và số lượt truy cập đang bị giãn quá to, không có margin trái phải, nó chỉ cần nhỏ thôi, ví dụ bằng kích cỡ của ô nhập mật khẩu admin 

6. Sử dụng thuộc tính loading="lazy" trong thẻ <img> để ảnh chỉ được tải khi người dùng cuộn đến đó.

7. Supabase Storage thực tế có tích hợp sẵn CDN (qua Cloudflare). Khi một file được yêu cầu nhiều lần, nó sẽ được trả về từ bộ nhớ đệm (Cache) của Cloudflare. Mặc dù Supabase vẫn tính băng thông Egress cho gói Free kể cả khi có Cache, nhưng Cache giúp tốc độ tải web của bạn cực nhanh.

8. Bình thường link ảnh của bạn là:
https://[id].supabase.co/storage/v1/object/public/templates/anh1.jpg

Bạn chỉ cần sửa nó thành (dùng dịch vụ miễn phí của wsrv.nl):
https://wsrv.nl/?url=https://[id].supabase.co/storage/v1/object/public/templates/anh1.jpg&w=600&output=webp

Lợi ích:

Gánh băng thông: Toàn bộ dữ liệu ảnh sẽ chạy qua server của wsrv.nl (hệ thống này chạy trên CDN của Cloudflare), Supabase sẽ tốn cực ít Egress.

Tự động nén: Nó sẽ tự chuyển ảnh của bạn sang định dạng WebP và resize về chiều rộng 600px ngay trên đường truyền.

9. Bảng thống kê người dùng trong phần Người dùng
- Cột Thao tác  có nghĩa là gì 

10. Có vẻ như dù gắn API key nào trong phần chỉ định AI Provider thì khi bấm nút Generate AI để tạo landing page cũng sẽ báo lỗi . Tôi đang không rõ khi sự kiện Generate AI button được click thì sẽ làm gì?

11. Web có đang dùng Supabase Auth hay là tự viết code đăng ký/đăng nhập và quản lý mật khẩu người dùng (rất rủi ro về bảo mật)
12. Khi các thư mục trong thư viện ảnh được xem dưới dạng list thì lại không thấy hiển thị dữ liệu ở cột Cập nhật và Dung lượng