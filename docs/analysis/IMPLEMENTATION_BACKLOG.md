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
- [ ] Unit/e2e tests cho auth, QR, scoring và Final concurrency.
- [ ] ESLint flat config cho backend.
- [ ] Production config phải fail-fast nếu secret còn mặc định.

## P0 - Frontend integration

- [ ] Thay dữ liệu dummy bằng API client thật.
- [ ] Login và lưu/thu hồi JWT.
- [ ] QR scanner thật cho check-in/check-out.
- [ ] Form nhập điểm yêu cầu mã xác nhận sau check-out.
- [ ] Sửa production build trên Windows.

## P1 - Event readiness

- [ ] Migration + seed trên database trống.
- [ ] Smoke test toàn bộ flow bằng hai team session.
- [ ] Thêm `prisma migrate deploy` vào deployment.
- [ ] Cấu hình CORS và secret production.
- [ ] Rehearsal export report và recovery database.
