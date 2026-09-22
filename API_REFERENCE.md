# API Reference

Base: `http://localhost:3000`  
Auth: header `Authorization: Bearer <token>` (trừ health / register / login)

## Auth

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| POST | `/api/auth/register` | — | Tạo user (role=user) |
| POST | `/api/auth/login` | — | Đăng nhập → `{ user, token }` |
| GET | `/api/auth/me` | JWT | User hiện tại |

### Register body
```json
{ "email": "...", "password": "...", "fullName": "..." }
```

### Login body
```json
{ "email": "...", "password": "..." }
```

## Admin (role=admin)

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/admin/users` | Danh sách user |
| PATCH | `/api/admin/users/:id/status` | `{ "status": "active" \| "disabled" }` |
| PATCH | `/api/admin/users/:id/role` | `{ "role": "admin" \| "user" }` |

## Projects (JWT, scoped theo user)

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/projects` | Project của user (`?all=true` admin xem tất cả) |
| GET | `/api/projects/:name` | Load |
| GET | `/api/load-project/:name` | Alias |
| GET | `/api/get-default-project` | Load `mosh_mode_project` của user |
| POST | `/api/save-project` | Lưu full project |
| DELETE | `/api/projects/:name` | Soft-delete (`?hard=true`) |

## Khác

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| GET | `/api/health` | — | Health |
| GET | `/api/db-test` | — | Test DB |
| POST | `/api/ai-bep-advisor` | JWT | AI BEP |

## Frontend

- `src/api/authApi.ts` — login/register/me/admin
- `src/api/projectApi.ts` — project (tự gắn Bearer token)
- `src/auth/AuthContext.tsx` — session
- `src/pages/LoginPage.tsx`, `RegisterPage.tsx`, `AdminPage.tsx`
