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

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production |
| `npm run test:db` | Test schema |
| `npm run migrate` | Áp dụng schema |

Chi tiết API: [API_REFERENCE.md](./API_REFERENCE.md)
