# MOVEment 2026 - Current Specification

## Phạm vi

MOVEment 2026 là web app trò chơi theo trạm. Team xem bản đồ, quét QR check-in/check-out, theo dõi tiến độ, điểm và leaderboard. Admin điều hành sự kiện, can thiệp trạng thái, sửa điểm và xuất báo cáo.

## Auth

- Admin dùng `POST /api/auth/login` với `username/password`.
- Team dùng `POST /api/auth/team-login` với `username/password`.
- Team session mới thu hồi session cũ.
- API player chỉ chấp nhận team token; API admin chỉ chấp nhận role `ADMIN`.

## Luồng trạm

1. Team quét QR `CHECK_IN` của đúng trạm.
2. Backend kiểm tra event time, QR, cooldown và active station.
3. Team chơi và quét QR `CHECK_OUT`.
4. Backend ghi `checked_out_at`; progress chưa completed.
5. Staff nhập điểm trên thiết bị của team và nhập mã xác nhận chấm điểm.
6. Backend kiểm tra mã, giới hạn điểm và hoàn tất progress trong transaction.

QR token là bắt buộc. Không truyền token phải trả validation error.

## Scoring

- Endpoint team: `POST /api/player/stations/:stationId/score`.
- Body gồm `score`, `confirmationCode` và `reason` tùy chọn.
- Chỉ cho chấm khi đã check-out và chưa completed.
- Điểm phải là số nguyên từ 0 đến `game.maxPoints`.
- Admin vẫn có quyền nhập/sửa điểm và xử lý ngoại lệ vận hành.
- Mỗi thay đổi điểm tạo `score_events` và activity log.

## Trạng thái

`LOCKED`, `AVAILABLE`, `CHECKED_IN`, `PLAYING`, `COMPLETED`.

Không tạo status riêng cho waiting score, cancel hoặc reopen. Waiting score được xác định bằng `checked_out_at != null` và `completed_at == null`.

## Event và Final

- Event end mặc định: 11:30, `Asia/Ho_Chi_Minh`.
- Final mở mặc định: 11:45.
- Final tách khỏi check-in/check-out trạm thường và được server tự chấm.
- Không trả `answerHash` qua API public hoặc API danh sách.
