# MOVEment 2026 - Open Questions And Decisions

Tài liệu này ghi các điểm cần chốt trước hoặc trong khi triển khai. Các default recommendation giúp team vẫn có hướng đi nếu chưa kịp quyết định.

## Decision Summary

| Topic | Default recommendation | Status |
| --- | --- | --- |
| `Note` có phải requirement cố định không? | Không. Xem là input đang cân nhắc. | Decided |
| Timer client hay server? | Hybrid: client hiển thị, server lưu timestamp chính thức. | Recommended |
| Admin login bằng gì? | Username/password + JWT + bcrypt. | Recommended |
| Có cần Station Manager MVP không? | Chưa cần nếu team tự scan QR và admin điều hành tập trung. | Recommended |
| Score do ai nhập? | MVP cho team nhập sau check-out; audit đầy đủ; admin sửa được. | Needs confirmation |
| Difficulty stars có cần không? | Có, đưa vào game metadata P1 hoặc P0 nếu UI cần ngay. | Recommended |
| Settings gồm gì? | MVP chỉ team info, logout, camera help. | Recommended |
| Reopen tạo attempt mới hay sửa attempt cũ? | Tạo attempt mới tốt hơn cho audit; MVP có thể set status `REOPENED` nếu cần nhanh. | Needs confirmation |
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

Default:

- Không bắt buộc MVP.
- Giữ schema/API mở rộng được cho `STATION_MANAGER`.

Reason:

- README nhắc role này.
- Source hiện tại chưa có UI station manager.
- QR self-service + admin dashboard đủ cho MVP nếu quy trình sự kiện cho phép.

Impact:

- Nếu cần station manager, score/check-out có thể phải do manager xác nhận, backlog tăng đáng kể.

### 3. Score do team nhập hay staff nhập?

Default:

- MVP: team nhập điểm sau QR check-out.
- Admin có quyền sửa điểm.
- Mọi điểm ghi `score_events`.

Alternative:

- Station Manager/Admin nhập điểm để giảm gian lận.

Decision needed:

- Sự kiện có cần chống gian lận cao không?
- Điểm do thử thách tự chấm hay người phụ trách chấm?

### 4. Có tổng điểm tối đa toàn event không?

Default:

- Có thể tính từ tổng `games.max_points` của các station active.

Reason:

- `Note` nhắc "số điểm / tổng điểm".

Impact:

- Player dashboard cần hiển thị `totalPoints / maxPossiblePoints`.
- Leaderboard vẫn sort theo điểm đạt được.

## Flow Questions

### 5. Check-in và check-out dùng cùng QR hay hai QR khác nhau?

Default:

- Dùng hai QR purpose khác nhau: `CHECK_IN` và `CHECK_OUT`.

Reason:

- Giảm nhầm lẫn trạng thái.
- API validate rõ purpose.

Impact:

- Database `qr_tokens` cần field `purpose`.
- UI cần label rõ "Quét mã bắt đầu" và "Quét mã kết thúc".

### 6. Team có được chơi nhiều trạm cùng lúc không?

Default:

- Không. Một team chỉ có một progress ở trạng thái `CHECKED_IN`/`PLAYING`.

Reason:

- Đơn giản hóa vận hành và leaderboard.
- Tránh scan lung tung nhiều trạm.

Impact:

- Check-in API phải chặn nếu team đang chơi trạm khác.

### 7. Cancel xong trạm quay về trạng thái nào?

Default:

- Progress attempt chuyển `CANCELLED`.
- Team muốn chơi lại cần admin reopen hoặc policy cho phép tạo attempt mới từ `AVAILABLE`.

Reason:

- Giữ audit rõ.

Decision needed:

- Sự kiện có cho team tự cancel và chơi lại ngay không?

### 8. Reopen nên tạo attempt mới hay sửa attempt cũ?

Default:

- Tạo attempt mới nếu có thời gian triển khai.
- Nếu cần MVP nhanh, set existing progress `REOPENED` và ghi reason.

Reason:

- Attempt mới giữ lịch sử tốt hơn.
- Existing progress nhanh hơn nhưng audit kém rõ hơn.

## UI Questions

### 9. Có cần bám sát ảnh neon HUD ngay MVP không?

Default:

- P0 tập trung functional UI.
- P1/P2 refactor visual sang neon HUD.

Reason:

- Current UI đang là card layout, đổi sang HUD là effort lớn.
- QR/scoring/backend là lõi sự kiện.

Impact:

- Nếu bắt buộc demo visual sớm, cần ưu tiên Player UI/HUD trước backend đầy đủ.

### 10. Leaderboard hiển thị bao nhiêu cột trên mobile?

Default:

- Mobile compact: rank, team, score, time.
- Detail row hoặc landscape/admin view hiển thị captain, last station, completed count.

Reason:

- Ảnh reference có bảng dày, nhưng mobile web thật dễ overflow với tiếng Việt.

### 11. Settings có cần trong MVP không?

Default:

- P2.
- MVP chỉ cần logout, team info, camera permission help.

Reason:

- `Note` ghi settings còn chưa rõ.
- Không phải core gameplay.

## Technical Questions

### 12. Dùng Prisma hay TypeORM?

Default:

- Prisma.

Reason:

- README nhắc Prisma trước.
- TypeScript type generation tốt cho MVP.

Impact:

- Backend build theo NestJS + PrismaService.

### 13. Token lưu ở đâu?

Default:

- MVP: localStorage đơn giản.
- Production/hardening: httpOnly cookie nếu frontend/backend cùng domain.

Reason:

- README đã nhắc localStorage.
- Dễ triển khai nhanh.

Risk:

- localStorage dễ bị XSS lấy token, cần tránh render HTML không tin cậy.

### 14. Có cần realtime leaderboard không?

Default:

- P1 polling mỗi 10-30 giây.
- Không dùng WebSocket trong MVP trừ khi bắt buộc.

Reason:

- Giảm complexity.
- Event quy mô nhỏ có thể chấp nhận refresh/polling.

### 15. Có cần offline support không?

Default:

- Không offline-first trong MVP.
- UI cần thông báo mất mạng và retry.

Reason:

- QR/check-in/score cần server authoritative.

## Pre-code Checklist

Trước khi bắt đầu code production, nên chốt:

- Team login bằng passcode có đúng không.
- Score do team hay staff nhập.
- Có Station Manager trong MVP không.
- Check-in/check-out dùng một hay hai QR.
- Reopen tạo attempt mới hay dùng trạng thái `REOPENED`.
- Ranking tie-breaker cuối cùng.
- UI neon HUD có phải bắt buộc trong bản demo đầu tiên không.

