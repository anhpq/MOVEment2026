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
| Cancel | Trở về `AVAILABLE` và áp dụng cooldown 5 phút mặc định |
| Status | Không dùng `WAITING_SCORE`, `CANCELLED`, `REOPENED` |
| Leaderboard | Điểm giảm dần, thời gian chơi tăng dần, số trạm hoàn thành giảm dần |
| Event | Trạm thường khóa lúc 11:30; Final mở lúc 11:45 |
| Final | Server tự chấm; 10 team đúng đầu tiên nhận điểm theo thứ hạng |
| QR login | Frontend hỗ trợ QR login bằng credential payload (`team01:team01`, `team01/team01`, hoặc JSON `{"username":"team01","password":"team01"}`); đây là login shortcut, không phải model QR token riêng trong backend |
| Test team data | Local seed tạo 25 team `team01/team01` đến `team25/team25` để test frontend login và smoke flow |
| Git commits | User cho phép Codex tự tạo local git commit sau khi hoàn tất và verify task, với title rõ ràng và detail dạng bullet. Không tự push/deploy/rewrite history/reset nếu chưa được yêu cầu rõ. |

Các prompt cũ có đề cập passcode hoặc Station Manager chỉ là đầu vào phân tích ban đầu và không được ưu tiên hơn tài liệu này.
