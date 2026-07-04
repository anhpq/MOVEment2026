# MOVEment 2026 - Open Questions And Decisions

Tài liệu này ghi các điểm cần chốt trước hoặc trong khi triển khai. Các default recommendation giúp team vẫn có hướng đi nếu chưa kịp quyết định.

## Decision Summary

| Topic | Default recommendation | Status |
| --- | --- | --- |
| `Note` có phải requirement cố định không? | Không. Xem là input đang cân nhắc. | Decided |
| Timer client hay server? | Hybrid: client hiển thị, server lưu timestamp chính thức. | Decided |
| Admin login bằng gì? | Username/password + JWT + bcrypt. | Recommended |
| Có cần Station Manager MVP không? | Có Staff/Station Manager tối giản để nhập điểm theo trạm; Admin có toàn quyền. | Decided |
| Score do ai nhập? | Admin hoặc Staff/Station Manager nhập; team không tự nhập. | Decided |
| Difficulty stars có cần không? | Có, lưu metadata và hiển thị trong station detail/game list; không ảnh hưởng logic. | Decided |
| Settings gồm gì? | MVP chỉ team info, logout, camera help. | Recommended |
| Một team login trên mấy thiết bị? | Chỉ 1 thiết bị; login mới revoke session cũ và thiết bị cũ nhận `SESSION_REPLACED`. | Decided |
| Một team check-in mấy trạm cùng lúc? | Chỉ 1 trạm tại 1 thời điểm. | Decided |
| Cancel trạm xử lý thế nào? | Ghi log/timestamp, đưa về `AVAILABLE`, chờ cooldown 5 phút do admin config. | Decided |
| Reopen xử lý thế nào? | Admin đưa progress về `AVAILABLE`; không dùng status `REOPENED`. | Decided |
| Có dùng status `WAITING_SCORE`, `CANCELLED`, `REOPENED` không? | Không. Các case liên quan dùng `AVAILABLE` hoặc log/timestamp. | Decided |
| Giờ kết thúc tổng? | Mặc định 11:30 theo `Asia/Ho_Chi_Minh`, admin chỉnh được, thông báo trước 15 phút. | Decided |
| Leaderboard sort thế nào? | Score desc, sau đó tổng thời gian check-in/check-out các trạm asc. | Decided |
| Admin có xuất report không? | Có, xuất Excel `.xlsx` với Leaderboard, Team Progress, Score Events, Activity Logs. | Decided |
| Admin reopen sau giờ kết thúc? | Không được reopen sau giờ kết thúc tổng. | Decided |
| Notification trước 15 phút? | In-app sticky banner + modal; âm thanh/rung nếu trình duyệt cho phép. | Decided |
| Có hiển thị tổng điểm tối đa không? | Có, player home hiển thị `totalPoints / maxPossiblePoints`. | Decided |
| Có trạm final sau 11:30 không? | Có, Final Station mở 11:45, giải mật thư, server auto-score top 10. | Decided |
| UI ưu tiên functional hay neon HUD? | Functional MVP trước, neon HUD polish sau. | Recommended |

## Product Questions

### 1. Team đăng nhập bằng passcode hay admin cấp sẵn session?

Default:

- Team login bằng passcode.
- Backend trả token team.
- Passcode không lưu plaintext trong database.

Reason:

- README đã nhắc `teams.passcode`.
- App cần biết team hiện tại để trả progress riêng.

Impact:

- Nếu không login, phải hardcode team hoặc dùng QR/session link, rủi ro lẫn team.

### 2. Có cần role Station Manager trong MVP không?

Decision:

- Có Staff/Station Manager MVP tối giản vì điểm do staff/admin nhập.
- Staff/Station Manager đăng nhập tài khoản riêng.
- Staff chỉ thấy queue các lượt đã check-out tại trạm được gán và nhập điểm cho trạm đó.
- Admin có quyền nhập/sửa điểm mọi trạm.

Reason:

- README nhắc role này.
- Source hiện tại chưa có UI station manager.
- Nếu admin là người duy nhất nhập điểm, vận hành thực địa dễ bị nghẽn.
- Staff score queue là phạm vi nhỏ hơn nhiều so với một app station manager đầy đủ.

Impact:

- Cần thêm role `STATION_MANAGER`.
- Cần API staff score queue.
- Chưa cần staff quản lý QR hoặc reopen trong MVP.

### 3. Score do team nhập hay staff nhập?

Decision:

- Admin hoặc Staff/Station Manager nhập điểm sau khi team check-out.
- Team không tự nhập điểm.
- Mọi điểm ghi `score_events`.

Reason:

- Giảm gian lận và sai lệch điểm.
- Phù hợp mô hình staff tại trạm.

Impact:

- Player sau check-out sẽ thấy trạng thái/chờ staff nhập điểm hoặc thông báo đã gửi kết quả.
- Staff/admin UI cần score queue và validation điểm.

### 4. Có tổng điểm tối đa toàn event không?

Decision:

- Có. Tổng điểm tối đa là tổng `games.max_points` của các game/trạm active.

Reason:

- `Note` nhắc "số điểm / tổng điểm".

Impact:

- Player dashboard cần hiển thị `totalPoints / maxPossiblePoints`.
- Leaderboard vẫn sort theo điểm đạt được.

## Flow Questions

### 5. Check-in và check-out dùng cùng QR hay hai QR khác nhau?

Decision:

- Dùng hai QR purpose khác nhau: `CHECK_IN` và `CHECK_OUT`.

Reason:

- Giảm nhầm lẫn trạng thái.
- API validate rõ purpose.

Impact:

- Database `qr_tokens` cần field `purpose`.
- UI cần label rõ "Quét mã bắt đầu" và "Quét mã kết thúc".

### 6. Team có được chơi nhiều trạm cùng lúc không?

Decision:

- Không. Một team chỉ có một progress ở trạng thái `CHECKED_IN`/`PLAYING`.

Reason:

- Đơn giản hóa vận hành và leaderboard.
- Tránh scan lung tung nhiều trạm.

Impact:

- Check-in API phải chặn nếu team đang chơi trạm khác.

### 7. Cancel xong trạm quay về trạng thái nào?

Decision:

- Không dùng status `CANCELLED`.
- Khi team cancel trong trạng thái `CHECKED_IN` hoặc `PLAYING`, hệ thống ghi `cancelled_at` và activity log.
- Progress của team tại trạm đó trở về `AVAILABLE` nếu chưa quá giờ kết thúc.
- Team chỉ được check-in lại sau cancel cooldown mặc định 5 phút; admin config được.

Reason:

- Trạng thái vận hành đơn giản hơn.
- Audit vẫn rõ nhờ timestamp/log.

Impact:

- UI map không cần màu riêng cho cancelled.
- Backlog/test cần kiểm tra cancel completed station bị chặn.
- Check-in API cần chặn khi chưa hết cooldown.

### 8. Reopen xử lý thế nào?

Decision:

- Không dùng status `REOPENED`.
- Admin reopen bằng cách đưa progress về `AVAILABLE`, ghi `reopened_at`, reason và activity log.
- Admin không được reopen sau giờ kết thúc tổng.

Reason:

- Đúng rule mới: các trạng thái liên quan chuyển thành `AVAILABLE`.
- Giảm số trạng thái UI/API cần xử lý.

Impact:

- Report cần thể hiện reopen qua activity log hoặc timestamp, không qua status.
- Nếu sau này cần multi-attempt chi tiết, có thể thêm bảng attempt riêng.

### 9. Score waiting có cần status riêng không?

Decision:

- Không dùng `WAITING_SCORE`.
- Sau check-out hợp lệ, server ghi `checked_out_at` và đưa lượt chơi vào staff/admin score queue.
- Submit score thành công chuyển progress sang `COMPLETED`.

Impact:

- Nếu user đóng popup giữa chừng, UI có thể mở lại popup dựa trên progress có `checked_out_at` nhưng chưa `completed_at`.
- API validation dựa vào timestamp/score state thay vì status riêng.

### 10. Thời gian chơi ngắn nhất trong leaderboard tính thế nào?

Decision:

- Tính bằng tổng thời gian check-in đến check-out của các trạm completed.
- Công thức: `SUM(checked_out_at - checked_in_at)` trên progress đã completed.
- Chỉ dùng server timestamps.

Impact:

- Team đứng hạng cao hơn khi cùng điểm nhưng tổng thời gian thực chơi trạm ngắn hơn.
- Thời gian ở ngoài trạm hoặc thời gian chờ staff nhập điểm không tính vào ranking duration.

### 11. Final Station sau 11:30 xử lý thế nào?

Decision:

- Có một Final Station đặc biệt sau khi các trạm thường lock lúc 11:30.
- Final mở lúc 11:45 theo `Asia/Ho_Chi_Minh`.
- Final là mật thư, không dùng check-in/check-out/staff scoring như trạm thường.
- Server chấm đáp án tự động.
- 10 team đầu tiên submit đúng nhận điểm giảm dần theo cấu hình.

Default config:

- `startsAt = 11:45`
- `maxWinners = 10`
- `pointsByRank = [10,9,8,7,6,5,4,3,2,1]`

Scoring:

- Team đúng thứ 1 nhận 10 điểm.
- Team đúng thứ 2 nhận 9 điểm.
- Tiếp tục giảm đến team đúng thứ 10 nhận 1 điểm.
- Team đúng sau top 10 được ghi nhận đúng nhưng không nhận điểm.

Implementation notes:

- Dùng server timestamp và database transaction để xếp hạng.
- Mỗi team chỉ nhận điểm final một lần.
- Final points vẫn ghi vào `score_events`.
- Report Excel thêm sheet `Final Submissions`.

## UI Questions

### 12. Có cần bám sát ảnh neon HUD ngay MVP không?

Default:

- P0 tập trung functional UI.
- P1/P2 refactor visual sang neon HUD.

Reason:

- Current UI đang là card layout, đổi sang HUD là effort lớn.
- QR/scoring/backend là lõi sự kiện.

Impact:

- Nếu bắt buộc demo visual sớm, cần ưu tiên Player UI/HUD trước backend đầy đủ.

### 13. Leaderboard hiển thị bao nhiêu cột trên mobile?

Default:

- Mobile compact: rank, team, score, total play duration.
- Detail row hoặc landscape/admin view hiển thị captain, last station, completed count.

Reason:

- Ảnh reference có bảng dày, nhưng mobile web thật dễ overflow với tiếng Việt.

### 14. Settings có cần trong MVP không?

Default:

- P2.
- MVP chỉ cần logout, team info, camera permission help.

Reason:

- `Note` ghi settings còn chưa rõ.
- Không phải core gameplay.

## Technical Questions

### 15. Dùng Prisma hay TypeORM?

Default:

- Prisma.

Reason:

- README nhắc Prisma trước.
- TypeScript type generation tốt cho MVP.

Impact:

- Backend build theo NestJS + PrismaService.

### 16. Token lưu ở đâu?

Default:

- MVP: localStorage đơn giản.
- Production/hardening: httpOnly cookie nếu frontend/backend cùng domain.

Reason:

- README đã nhắc localStorage.
- Dễ triển khai nhanh.

Risk:

- localStorage dễ bị XSS lấy token, cần tránh render HTML không tin cậy.

### 17. Có cần realtime leaderboard không?

Default:

- P1 polling mỗi 10-30 giây.
- Không dùng WebSocket trong MVP trừ khi bắt buộc.

Reason:

- Giảm complexity.
- Event quy mô nhỏ có thể chấp nhận refresh/polling.

### 18. Có cần export Excel report không?

Decision:

- Có.
- Admin cần tải `.xlsx` gồm summary leaderboard, team progress, score events, final submissions và activity logs.

Default format:

- Sheet `Leaderboard`: rank, team, captain, total score, total play duration, completed stations.
- Sheet `Team Progress`: team x station status/score/time.
- Sheet `Score Events`: score changes and reasons.
- Sheet `Final Submissions`: final answer submissions, correctness, winner rank and awarded points.
- Sheet `Activity Logs`: scan, cancel, score, config, report export events.

Impact:

- Backend cần thư viện xuất Excel.
- Export action cần ghi activity log.

### 19. Notification trước giờ kết thúc nên làm kiểu gì?

Decision:

- MVP dùng in-app sticky banner + modal khi còn 15 phút.
- Có thể thêm âm thanh/rung nếu trình duyệt và thiết bị cho phép.
- Không dùng browser push notification trong MVP vì cần permission/service worker và dễ phát sinh rủi ro setup.

Impact:

- Player phải đang mở app mới chắc chắn thấy thông báo.
- UI cần tránh che QR/map quá nhiều.

### 20. Difficulty stars có cần trong MVP không?

Decision:

- Có, lưu `games.difficulty` từ 1 đến 5.
- Hiển thị stars trong station detail và game list.
- Không dùng difficulty để tính điểm, unlock hoặc ranking trong MVP.

Impact:

- UI có thêm metadata giúp team chọn trạm.
- Admin seed/config game cần nhập difficulty.

### 21. Có cần offline support không?

Default:

- Không offline-first trong MVP.
- UI cần thông báo mất mạng và retry.

Reason:

- QR/check-in/score cần server authoritative.

## Pre-code Checklist

Trước khi bắt đầu code production, nên chốt:

- Team login bằng passcode có đúng không.
- UI neon HUD có phải bắt buộc trong bản demo đầu tiên không.
