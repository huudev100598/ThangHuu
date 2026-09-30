# Mosh & Mode — CFO Financial Engine

Ứng dụng mô phỏng tài chính D2C / E-commerce với **đăng nhập / phân quyền** (sẵn sàng bán phần mềm).

## Yêu cầu

- Node.js 18+
- MySQL 8+

## Cài đặt

```bash
npm install

# Schema (users + projects multi-tenant + data tables)
mysql -u root -p < database.sql

cp .env.example .env
# Sửa: DB_PASSWORD, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

npm run test:db
npm run dev
```

Mở http://localhost:3000

### Tài khoản admin mặc định (seed lần đầu)

- Email: `admin@moshmode.com` (hoặc `ADMIN_EMAIL` trong `.env`)
- Password: `Admin@123456` (hoặc `ADMIN_PASSWORD`)

**Đổi mật khẩu ngay khi deploy production.**

## Tính năng auth

| Vai trò | Quyền |
|---------|--------|
| **admin** | Full app + trang Quản lý user (role/status) + xem project (API) |
| **user** | Chỉ project của mình; đăng ký / đăng nhập |

- JWT Bearer token (lưu `localStorage`)
- API project bắt buộc đăng nhập
- Mỗi user có project `mosh_mode_project` riêng

## Tính năng nghiệp vụ mới (gộp từ project2)

- **Báo cáo P&L**: thu gọn / mở rộng từng nhóm, xuất CSV.
- **Dòng tiền & Kế hoạch vốn**: 6 khoản chi tiền mặt, tiền sàn về trễ 1 tháng (T-1), cọc kho, giải ngân Capex đúng tháng, xuất CSV.
- **Chi phí dự phòng hàng tháng**: nhập tại Tab 1 > Thuế & Vốn (mặc định 0 đ).
- **Điểm hòa vốn**: thêm Chẩn đoán sức khỏe dự án, Mô hình DuPont, So sánh hiệu quả kênh bán.
- **Danh mục SKU**: cột STT, di chuyển SKU lên/xuống (thứ tự được lưu vào MySQL).
- **Kế hoạch bán hàng**: chọn tháng bắt đầu kinh doanh (MM-YY); sản lượng, chiến dịch creator, định biên nhân sự, Capex/Opex tự dời theo.
- **Capex**: chọn tháng giải ngân theo danh sách tháng kế hoạch.
- Header bảng cố định khi cuộn (Sheet 3, Kế hoạch PO, Tỷ trọng kênh), thanh tab cố định.

Chi tiết file thay đổi: [CHANGELOG_MERGE.md](./CHANGELOG_MERGE.md)

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production |
| `npm run test:db` | Test schema |
| `npm run migrate` | Áp dụng schema |

Chi tiết API: [API_REFERENCE.md](./API_REFERENCE.md)
