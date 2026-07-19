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
- [ ] Smoke test toàn bộ flow bằng hai team session (script `be/scripts/smoke-two-team.ps1` đã sẵn sàng, cần chạy trên API + DB rehearsal).
- [x] Thêm `prisma migrate deploy` vào deployment.
- [ ] Cấu hình CORS và secret production trên môi trường deploy.
- [ ] Rehearsal export report và recovery database.
