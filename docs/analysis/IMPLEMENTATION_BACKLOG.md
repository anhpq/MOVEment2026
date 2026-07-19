# MOVEment 2026 - Implementation Backlog

## P0 - Backend correctness

- [x] Admin/team username-password authentication.
- [x] Một active session cho mỗi team.
- [x] QR check-in/check-out bắt buộc và phân biệt purpose.
- [x] Một active station cho mỗi team.
- [x] Cancel về `AVAILABLE` với cooldown.
- [x] Staff nhập điểm trên team session với mã xác nhận.
- [x] Admin score/edit/reopen/status override.
- [x] Leaderboard và activity log.
- [x] Final auto-scoring và export Excel.
- [x] Unit/e2e tests cho auth, QR, scoring và Final concurrency/retry.
- [x] ESLint flat config cho backend.
- [x] Production config phải fail-fast nếu secret còn mặc định.

## P0 - Frontend integration

- [x] Thay dữ liệu dummy bằng API client thật cho màn player map/detail.
- [x] Login, lưu JWT và duy trì session 1 ngày.
- [x] QR scanner thật cho check-in/check-out qua camera `BarcodeDetector`, có fallback nhập token thủ công.
- [x] Form nhập điểm yêu cầu mã xác nhận sau check-out.
- [x] Sửa production build trên Windows.

## P1 - Event readiness

- [x] Migration + seed trên database trống.
- [x] Smoke test toàn bộ flow bằng hai team session.
- [x] Thêm `prisma migrate deploy` vào deployment.
- [ ] Cấu hình CORS và secret production trên môi trường deploy.
- [x] Rehearsal export report và recovery database.

## Next execution checklist

Chạy lần lượt từ trên xuống. Sau mỗi cụm chạy xong, cập nhật file này, `docs/analysis/BACKEND_AUDIT.md`, chạy verify phù hợp, `python -m graphify update .`, rồi commit riêng.

### 1. Chuẩn bị rehearsal database và API

- [x] Xác nhận PostgreSQL rehearsal/disposable đang chạy và không trỏ nhầm production.
- [x] Trong `be/`, chạy `npm run prisma:deploy`.
- [x] Trong `be/`, chạy `npm run seed`.
- [x] Start backend API với env rehearsal: `NODE_ENV=development`, `DATABASE_URL`, `JWT_SECRET`, `SCORING_CODE=2468`, `CORS_ORIGIN=http://localhost:5173`.
- [x] Kiểm tra `GET http://localhost:3000/api/docs` hoặc login health bằng `POST /api/auth/login`.

Acceptance:

- API phản hồi trên `http://localhost:3000`.
- Seed có `team01/team01`, `team02/team02`, admin `admin/admin123`, QR `ST002-CHECK_IN`, `ST002-CHECK_OUT`, `ST047-CHECK_IN`, `ST047-CHECK_OUT`.

### 2. Chạy two-team station smoke

- [x] Từ repo root chạy:
  `powershell -ExecutionPolicy Bypass -File be/scripts/smoke-two-team.ps1 -ApiBaseUrl http://localhost:3000 -ScoringCode 2468`
- [x] Xác nhận script báo team01/team02 có điểm và completed station.
- [ ] Nếu smoke fail, lưu lỗi vào `docs/analysis/BACKEND_AUDIT.md` trước khi sửa code.
- [x] Nếu smoke pass, mark P1 smoke test là `[x]`.

Acceptance:

- Team 01 hoàn thành `ST002` với điểm smoke.
- Team 02 hoàn thành `ST047` với điểm smoke.
- `GET /api/player/me` của cả hai team phản ánh `totalPoints` và `completedStations`.

### 3. Validate production env trên môi trường deploy

- [ ] Set production secrets thật trên host/deploy target: `DATABASE_URL`, `JWT_SECRET`, `SCORING_CODE`, `CORS_ORIGIN`.
- [ ] Đảm bảo `CORS_ORIGIN` là domain frontend thật hoặc CSV domains, không có `*`.
- [ ] Chạy backend với `NODE_ENV=production` để xác nhận fail-fast không chặn nhầm.
- [ ] Từ frontend deployed origin, gọi login/team-login để xác nhận CORS credentials hoạt động.
- [ ] Mark P1 CORS/secrets là `[x]` chỉ sau khi test trên deploy target.

Acceptance:

- Production API start thành công với secrets thật.
- API từ origin frontend thật không bị CORS block.
- Production startup fail nếu đổi tạm `JWT_SECRET=change-me`, `SCORING_CODE=2468`, hoặc `CORS_ORIGIN=*`.

### 4. Rehearse report export và database recovery

- [x] Trước smoke/rehearsal, backup DB:
  `pg_dump "$DATABASE_URL" --format=custom --file movement-backup.dump`
- [x] Restore backup vào DB disposable:
  `createdb movement_restore`
  `pg_restore --dbname movement_restore --clean --if-exists movement-backup.dump`
- [x] Start temporary API instance trỏ vào restored DB.
- [x] Chạy export:
  `powershell -ExecutionPolicy Bypass -File be/scripts/export-summary-report.ps1 -ApiBaseUrl http://localhost:3000 -Username admin -Password admin123`
- [x] Mở hoặc kiểm tra file `.xlsx` không rỗng.
- [x] Mark P1 export/recovery là `[x]` sau khi restore + export đều pass.

Acceptance:

- Restore tạo DB đọc được bởi API.
- `GET /api/admin/dashboard` thành công trên restored DB.
- Export summary `.xlsx` tạo file non-empty.

### 5. Maintenance sau event-readiness

- [x] Chạy `npm audit` trong `be/`, ghi rõ findings vào `docs/analysis/BACKEND_AUDIT.md`.
- [x] Đánh giá upgrade/fix dependency có phá build/test không; chỉ apply khi test xanh.
- [ ] Lên việc riêng cho Prisma 7: chuyển `package.json#prisma` sang `prisma.config.ts`.
