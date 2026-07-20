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
4. Backend ghi thời gian theo cấu hình station:
   - `BOTH`: `checked_in_at` là thời điểm quét start, `checked_out_at` là thời điểm quét end, sau đó cần nhập điểm.
   - `TIME`: `checked_in_at` là thời điểm quét start, `checked_out_at` là thời điểm quét end, backend tự complete với score 0 và cộng duration.
   - `SCORE`: vẫn yêu cầu QR start/end, nhưng `checked_out_at = checked_in_at` để station không cộng thời lượng.
5. Progress chưa completed sau check-out.
6. Staff nhập điểm trên thiết bị của team và nhập mã xác nhận chấm điểm.
7. Backend kiểm tra mã, giới hạn điểm và hoàn tất progress trong transaction.

QR token là bắt buộc. Không truyền token phải trả validation error.

Mỗi station có `tracking_mode`: `SCORE`, `TIME`, hoặc `BOTH`. Admin chỉnh được mode này trong System Config và backend lưu vào DB. `TIME` không nhận submit score; `SCORE` và `BOTH` nhận score theo flow xác nhận mã.

## Scoring

- Endpoint team: `POST /api/player/stations/:stationId/score`.
- Body gồm `score`, `confirmationCode` và `reason` tùy chọn.
- Chỉ cho chấm khi đã check-out và chưa completed.
- Điểm phải là số nguyên từ 0 đến `game.maxPoints`.
- Admin vẫn có quyền nhập/sửa điểm và xử lý ngoại lệ vận hành.
- Mỗi thay đổi điểm tạo `score_events` và activity log.

## Trạng thái

`LOCKED`, `AVAILABLE`, `CHECKED_IN`, `PLAYING`, `COMPLETED`.

Mọi trạm thường đang active được khởi tạo ở trạng thái `AVAILABLE` cho mỗi team. Hệ thống không khóa theo thứ tự trạm; rule một active station cho mỗi team vẫn ngăn team chơi đồng thời nhiều trạm. `LOCKED` chỉ dùng khi admin khóa thủ công hoặc khi backend áp dụng giới hạn thời gian sự kiện.

Không tạo status riêng cho waiting score, cancel hoặc reopen. Waiting score được xác định bằng `checked_out_at != null` và `completed_at == null`.

## Event và Final

- Event end mặc định: 11:30, `Asia/Ho_Chi_Minh`.
- Final mở mặc định: 11:45.
- Final tách khỏi check-in/check-out trạm thường và được server tự chấm.
- Không trả `answerHash` qua API public hoặc API danh sách.
