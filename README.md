# SportHub - Chèn tính năng vào giao diện GỐC V1 / V2

**Đây là bộ tính năng bổ sung, KHÔNG PHẢI website/trang chủ mới.** Không có `index.html`, không có ảnh demo hay dữ liệu CRM mẫu. Không tải bản ZIP V3 cũ có `index.html` lên để thay website của bạn.

## Mô hình đúng

- `shopthethao` (V1): vẫn hiển thị cửa hàng, sản phẩm, giỏ hàng, các nút đặt hàng như trước. Khi nhấn **Đặt hàng/Thanh toán**, nếu chưa đăng nhập thì **cửa sổ tài khoản mở NGAY TẠI TRANG GỐC**.
- `shop-the-thao-v2` (V2): vẫn hiển thị kế hoạch cá nhân. Khi nhấn **Kế hoạch cá nhân**, nếu chưa đăng nhập thì **cửa sổ tài khoản mở NGAY TẠI TRANG GỐC**.
- `shop-the-thao-v3` (V3): repository để **lưu chung tệp CSS/JavaScript và hỗ trợ backend**, KHÔNG dùng V3 làm trang landing page thay thế.
- Sau 60 giây khách chưa đăng nhập, một khung nhỏ nhắc tạo tài khoản sẽ hiện ngay trên trang hiện tại (một lần mỗi phiên).
- Đăng nhập/đăng ký (chỉ **Khách hàng**), xem Điều khoản sử dụng/Quyền riêng tư, font tiếng Việt, màu đỏ-trắng, nút hiện/ẩn mật khẩu. Sau khi kết nối Supabase thật: CRM và chỉnh sửa chữ/ảnh ở các phần được đánh dấu chỉ hiện khi đăng nhập tài khoản quản trị Google được cấp quyền trong database.

## Bước 1 - Tải nội dung gói này lên repository V3

Giải nén. Chỉ tải **thư mục `addon/`** và các file bên trong lên gốc repository `shop-the-thao-v3`, cùng thư mục `backend/` để lưu file thiết lập (hoặc có thể giữ `backend/` ở máy cá nhân). **Đừng thay thế `index.html` của bất cứ website nào.** V3 ở thời điểm kiểm tra từ ảnh chỉ có README; như vậy bạn có thể bổ sung `addon/` vào V3 mà không tạo trang chủ mới.

Sau khi deploy GitHub Pages, kiểm tra URL:

`https://tranthiquynhnhu0901-hue.github.io/shop-the-thao-v3/addon/loader.js`

Nếu trình duyệt hiển thị mã JavaScript, nghĩa là tệp đã được tải lên đúng. Đảm bảo GitHub Pages của V3 đã bật ở Settings > Pages.

## Bước 2 - Chèn 1 dòng vào website gốc V1

Mở **repository `shopthethao`**, tìm `index.html` gốc và thêm dòng này **ngay trước `</body>`**:

```html
<script defer src="https://tranthiquynhnhu0901-hue.github.io/shop-the-thao-v3/addon/loader.js"></script>
```

Nếu giỏ hàng/đặt hàng nằm trong file HTML khác (như `cart.html`), hãy chèn dòng này vào **trang đó** nữa. Không đổi logo, CSS, hình sản phẩm, nội dung trang chủ.

## Bước 3 - Chèn 1 dòng vào website gốc V2

Mở **repository `shop-the-thao-v2`**, tìm file HTML chứa nút Kế hoạch cá nhân; trước `</body>` chèn **chính dòng script trên**. Không đổi giao diện hiện tại.

Đây là **hai repository riêng**, nên chỉ tải addon lên V3 sẽ **không** làm cửa sổ tự xuất hiện ở V1/V2. Bắt buộc thêm dòng liên kết vào các trang nơi người dùng sử dụng tính năng.

## Bước 4 - Gắn đúng vào các nút thực tế

JavaScript tự nhận diện một số tên nút như “Đặt hàng”, “Thanh toán”, “Kế hoạch cá nhân”. Nếu nút trên website gốc dùng tên khác, có thể gắn thuộc tính sau vào chính nút/đường dẫn hiện có:

```html
<!-- Ví dụ: GIỮ nguyên class/style, chỉ thêm data-sh-auth vào nút đang có -->
<button class="nut-dat-hang-cu" data-sh-auth="order">Đặt hàng</button>
<a href="#ke-hoach" class="link-cu" data-sh-auth="plan">Kế hoạch cá nhân</a>
```

**Đừng chép nguyên các nút ví dụ để thay nút hiện có.** Chỉ thêm `data-sh-auth` lên nút thật. Khi người dùng đã đăng nhập, tương tác gốc được thực hiện như trước. Những nút do JS tạo động có thể cũng được nhận diện bằng `data-sh-auth`.

Để admin chỉnh sửa chữ hoặc ảnh, thêm mã định danh cho phần tử **đã tồn tại**:

```html
<h2 data-sh-edit="home.banner.title" class="tieu-de-cu">Tên khuyến mãi</h2>
<img data-sh-edit="products.shoe.1.image" class="hinh-cu" src="assets/shoe.jpg" alt="Giày thể thao">
```

Chú ý: đây là **chỉnh nội dung chữ/ảnh**, không tự thay giá ở logic giỏ hàng hay tự cập nhật tồn kho. Muốn sửa giá sản phẩm thật phải ghép đúng vào nguồn dữ liệu sản phẩm (cần mã nguồn V1).

Nếu muốn bấm nút có sẵn để mở form mà không đổi nút, dùng:

```html
<button onclick="window.SportHubAuth?.openLogin()">Đăng nhập</button>
<button onclick="window.SportHubAuth?.openSignup()">Đăng ký</button>
```

Hoặc nếu không sửa header, tiện ích đã có nút Tài khoản nhỏ màu đỏ ở góc dưới.

## Bước 5 - Kích hoạt đăng nhập/CRM/Google thật (không tự hoạt động sau khi tải tệp)

GitHub Pages chỉ lưu trang tĩnh, không phải cơ sở dữ liệu. Tới lúc kích hoạt tính năng thật:

1. Tạo dự án Supabase, bật Email và Google Auth. Cho phép Redirect URLs của **CẢ V1 và V2** (và V3 nếu dùng), dùng cùng một Supabase project để đăng nhập nhất quán.
2. Chạy `backend/schema.sql` trong Supabase SQL Editor; cập nhật **Supabase Project URL** và khóa **publishable/anon** ở `addon/config.js`. Tuyệt đối không đưa secret key/service role hay mật khẩu Gmail lên GitHub.
3. Đăng nhập Google email quản trị `tranthiquynhnhu0901@gmail.com`, rồi chạy `backend/admin-grant.sql` trong SQL Editor để cấp quyền ở máy chủ. Chỉ nhập email giống quản trị không đủ quyền.
4. Triển khai Edge Function `backend/notify-registration/index.ts` với biến môi trường bí mật, Resend domain được xác thực, Database Webhook cho việc đăng ký mới; thử nhận thông báo thực tế. **Không gửi mật khẩu** về Gmail.
5. CRM xuất `.xlsx` thật chỉ xuất hiện với tài khoản quản trị được phân quyền, và dữ liệu thật chỉ có sau khi backend hoạt động.

**LƯU Ý:** Nếu chưa cấu hình Supabase, cửa sổ đăng nhập/đăng ký **hiển thị được** nhưng không thể tạo tài khoản thật. Tiện ích không giả vờ đăng ký thành công, không lưu mật khẩu khách hàng dưới dạng dữ liệu demo. Trước khi vận hành thương mại thật, cần hoàn thiện và duyệt nội dung pháp lý với thông tin liên hệ/quy trình kinh doanh và thời hạn lưu dữ liệu chính xác.

## Bộ gói bao gồm

- `addon/loader.js` - dòng tích hợp chung, chạy ngay trong website gốc.
- `addon/config.js` - URL/khóa công khai của Supabase, 60 giây.
- `addon/sporthub-account.css` - chỉ tạo kiểu phần form/modal của addon, không thay CSS gốc.
- `addon/sporthub-account.js` - tài khoản, popup, chính sách, CRM, chỉnh sửa được đánh dấu, xuất Excel.
- `backend/schema.sql`, `backend/admin-grant.sql`, `backend/notify-registration/index.ts` - thiết lập cơ sở dữ liệu và email máy chủ.

**Không có `index.html` thay thế. Không ảnh hưởng giao diện cũ nếu làm theo hướng dẫn.**
