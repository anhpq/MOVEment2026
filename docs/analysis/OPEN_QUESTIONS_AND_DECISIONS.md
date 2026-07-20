# MOVEment 2026 - Decisions

## Quyết định đã chốt

| Chủ đề | Quyết định |
| --- | --- |
| Tài khoản | Admin và team đều đăng nhập bằng `username/password` |
| Role | Chỉ có `ADMIN`; team dùng model/session riêng, không phải `UserRole` |
| Staff | Không có tài khoản hoặc role staff |
| Nhập điểm | Sau check-out, staff nhập điểm trên thiết bị đang đăng nhập account team |
| Xác nhận điểm | Staff phải nhập mã chấm điểm; backend chỉ lưu hash |
| QR | Hai QR purpose `CHECK_IN` và `CHECK_OUT`, token luôn bắt buộc |
| Session | Một thiết bị cho mỗi team; login mới sẽ revoke session cũ và chỉ một session team được hoạt động cùng lúc |
| Trạm đang chơi | Một team chỉ chơi một trạm tại một thời điểm |
| Trạng thái trạm ban đầu | Mọi station active khởi tạo `AVAILABLE` cho mỗi team; không có cơ chế khóa/mở tuần tự. `LOCKED` dành cho admin hoặc giới hạn event time. |
| Cancel | Trở về `AVAILABLE` và áp dụng cooldown 5 phút mặc định |
| Status | Không dùng `WAITING_SCORE`, `CANCELLED`, `REOPENED` |
| Leaderboard | Điểm giảm dần, thời gian chơi tăng dần, số trạm hoàn thành giảm dần |
| Event | Trạm thường khóa lúc 11:30; Final mở lúc 11:45 |
| Final | Server tự chấm; 10 team đúng đầu tiên nhận điểm theo thứ hạng |
| QR login | Mỗi team có 1 token QR login riêng dạng `MV26-TEAM-01-LOGIN`; backend lưu bcrypt hash và SHA-256 fingerprint unique, endpoint `/api/auth/team-qr-login` dùng chung rule một active session/team. Frontend chỉ chấp nhận QR token, không chấp nhận QR chứa username/password. |
| Test team data | Local seed tạo 25 team tên `Team 01` đến `Team 25`, username/password `team01/team01` đến `team25/team25`, kèm 25 team QR login token unique. |
| Station QR | Mỗi station có 2 QR riêng biệt: `MV26-STATION-<stationId>-CHECK_IN` và `MV26-STATION-<stationId>-CHECK_OUT`; seed lưu bcrypt hash và SHA-256 fingerprint unique cho từng token. |
| Station tracking mode | Mỗi station có `tracking_mode` lưu DB với 3 giá trị `SCORE`, `TIME`, `BOTH`. `BOTH` ghi thời gian thật rồi nhập điểm; `TIME` ghi thời gian thật, tự complete score 0 và không nhập điểm; `SCORE` đặt check-out time bằng check-in time để không cộng duration rồi nhập điểm. |
| Git commits | User cho phép Codex tự tạo local git commit sau khi hoàn tất và verify task, với title rõ ràng và detail dạng bullet. Không tự push/deploy/rewrite history/reset nếu chưa được yêu cầu rõ. |

Các prompt cũ có đề cập passcode hoặc Station Manager chỉ là đầu vào phân tích ban đầu và không được ưu tiên hơn tài liệu này.
