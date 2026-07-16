# MOVEment 2026

Hệ thống trò chơi theo trạm gồm:

- `fe/`: React + TypeScript + Vite.
- `be/`: NestJS + Prisma + PostgreSQL.
- `docs/analysis/`: đặc tả và backlog đã chốt.
- `docs/prompts/`: prompt phân tích ban đầu, chỉ dùng làm tài liệu tham khảo.

## Quyền và đăng nhập

- `ADMIN`: quản trị sự kiện, sửa điểm, reopen, cấu hình và xuất báo cáo.
- `TEAM`: đăng nhập bằng `username/password`, mỗi team chỉ có một session thiết bị đang hoạt động.
- Không có role hoặc tài khoản Staff/Station Manager.
- Sau khi team quét QR check-out, staff nhập điểm trên chính thiết bị của team và xác nhận bằng mã chấm điểm.

Xem hướng dẫn backend tại [`be/README.md`](be/README.md).
