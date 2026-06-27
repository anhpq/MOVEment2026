# MOVEment 2026 - Implementation Backlog

Priority:

- P0: cần cho MVP chạy được trong sự kiện.
- P1: quan trọng nhưng có thể làm sau P0.
- P2: polish hoặc tiện ích sau MVP.

## Epic 1 - Project Scaffold

### P0 - Hoàn thiện frontend scaffold

User story:

- Là developer, tôi cần app React/Vite chạy được từ source hiện tại để tiếp tục build tính năng.

Acceptance criteria:

- Có `package.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts`.
- `npm install`, `npm run dev`, `npm run build` chạy được.
- `PlayerPage` render được với dữ liệu mock.

Data/API dependency:

- Chưa cần API thật.

Test notes:

- Build production không lỗi TypeScript.
- Browser mở được player page.

### P0 - Chuẩn hóa domain types

User story:

- Là developer, tôi cần bộ TypeScript type thống nhất cho team, station, game, progress, score và log.

Acceptance criteria:

- Có type cho `Team`, `Station`, `Game`, `TeamStationProgress`, `ScoreEvent`, `ActivityLog`, `LeaderboardEntry`.
- Status dùng enum/string union cuối cùng.
- UI không tự định nghĩa status riêng lẻ.

Data/API dependency:

- Đồng bộ với API spec.

Test notes:

- TypeScript build phát hiện mismatch status.

## Epic 2 - Auth And RBAC

### P0 - Team login bằng passcode

User story:

- Là team, tôi muốn đăng nhập bằng mã đội để app biết tôi là team nào.

Acceptance criteria:

- Team nhập passcode.
- Passcode đúng trả token/session team.
- Passcode sai hiển thị lỗi rõ.
- Player API chỉ trả dữ liệu của team hiện tại.

API:

- `POST /api/auth/team-login`
- `GET /api/auth/me`

Test notes:

- Login success/failure.
- Token hết hạn.

### P0 - Admin login bằng username/password

User story:

- Là admin, tôi muốn đăng nhập an toàn để quản lý sự kiện.

Acceptance criteria:

- Admin login bằng username/password.
- Password hash bằng bcrypt.
- JWT chứa role `ADMIN`.
- Admin route bị chặn nếu không có token admin.

API:

- `POST /api/auth/login`
- `GET /api/auth/me`

Test notes:

- Wrong password.
- Player token không vào được admin API.

## Epic 3 - PostgreSQL And Backend API

### P0 - Tạo schema database MVP

User story:

- Là backend developer, tôi cần PostgreSQL schema phản ánh team, station, game, progress, score và log.

Acceptance criteria:

- Có bảng `users`, `teams`, `stations`, `games`, `team_station_progress`, `score_events`, `qr_tokens`, `activity_logs`.
- Có constraints cho unique team name, station id, progress theo team/station/attempt.
- Có seed data tối thiểu cho 10 trạm và vài team.

API dependency:

- Prisma hoặc ORM được chọn.

Test notes:

- Migration chạy được từ database trống.
- Seed idempotent hoặc có reset command rõ.

### P0 - Player read APIs

User story:

- Là player UI, tôi cần lấy team hiện tại, map stations, progress và leaderboard từ backend.

Acceptance criteria:

- API trả dashboard data của team hiện tại.
- API map trả station + game + progress status.
- API leaderboard trả rank ổn định.

API:

- `GET /api/player/me`
- `GET /api/player/stations`
- `GET /api/player/progress`
- `GET /api/leaderboard`

Test notes:

- Team A không đọc progress private của Team B qua player endpoint.

## Epic 4 - Player UI

### P0 - Player dashboard

User story:

- Là team, tôi muốn thấy tên đội, đội trưởng, điểm, rank, tiến độ và timer.

Acceptance criteria:

- Hiển thị team name, captain, total points, rank.
- Hiển thị completed/total stations.
- Timer hiển thị từ timestamp server.
- Loading/error state rõ.

API:

- `GET /api/player/me`
- `GET /api/player/progress`

Test notes:

- Team chưa bắt đầu.
- Server time offset.

### P0 - Map với trạng thái trạm

User story:

- Là team, tôi muốn xem trạm nào khóa, trạm nào có thể chơi, trạm nào đang chơi và đã hoàn thành.

Acceptance criteria:

- Map hiển thị tất cả station.
- Marker màu/icon theo status.
- Tap marker mở station detail.
- Không làm biến dạng map trên mobile.

API:

- `GET /api/player/stations`

Test notes:

- Progress thiếu status.
- Long station name.

### P1 - Mobile HUD layout

User story:

- Là player, tôi muốn UI giống trải nghiệm game mobile theo ảnh tham chiếu.

Acceptance criteria:

- Header, map, timer, QR dock nằm trong một viewport mobile-first.
- QR button nổi bật ở bottom center.
- Leaderboard/log mở từ bottom dock.
- Text tiếng Việt không overflow.

API:

- Dùng các API player đã có.

Test notes:

- Mobile 360px, 390px, 430px.
- Desktop preview không vỡ layout.

## Epic 5 - QR Flow

### P0 - QR check-in

User story:

- Là team, tôi muốn scan QR tại trạm để bắt đầu lượt chơi.

Acceptance criteria:

- Scanner mở camera.
- QR hợp lệ chuyển progress sang `CHECKED_IN` hoặc `PLAYING`.
- QR sai/hết hạn hiển thị lỗi.
- Scan trùng không tạo nhiều lượt không mong muốn.

API:

- `POST /api/player/stations/:stationId/check-in`

Test notes:

- Camera denied.
- Wrong station QR.
- Already playing another station.

### P0 - QR check-out

User story:

- Là team, tôi muốn scan QR kết thúc khi hoàn thành trạm.

Acceptance criteria:

- Chỉ check-out khi đang `PLAYING`.
- QR end hợp lệ chuyển status sang `WAITING_SCORE`.
- UI mở score popup.

API:

- `POST /api/player/stations/:stationId/check-out`

Test notes:

- Check-out without check-in.
- Scan duplicate check-out.

### P0 - Cancel current station

User story:

- Là team, tôi muốn hủy lượt chơi nếu vào nhầm hoặc không tiếp tục.

Acceptance criteria:

- Cancel chỉ hiện khi `CHECKED_IN` hoặc `PLAYING`.
- Confirm trước khi cancel.
- Sau cancel, status cập nhật theo policy MVP: `CANCELLED`.
- Ghi activity log.

API:

- `POST /api/player/stations/:stationId/cancel`

Test notes:

- Cancel completed station bị chặn.

## Epic 6 - Scoring

### P0 - Submit score after check-out

User story:

- Là team hoặc người vận hành, tôi muốn nhập điểm sau khi scan QR kết thúc.

Acceptance criteria:

- Popup hiện khi status `WAITING_SCORE`.
- Score bắt buộc là số nguyên từ 0 đến max points.
- Submit tạo `score_events`.
- Progress chuyển `COMPLETED`.
- Team total points cập nhật.

API:

- `POST /api/player/stations/:stationId/score`

Test notes:

- Score âm.
- Score vượt max.
- Submit hai lần.

### P0 - Admin edit score

User story:

- Là admin, tôi muốn sửa điểm khi có sai sót.

Acceptance criteria:

- Admin nhập điểm mới và reason.
- Hệ thống tạo score adjustment event.
- Leaderboard cập nhật.
- Activity log ghi actor admin.

API:

- `PATCH /api/admin/progress/:progressId/score`

Test notes:

- Missing reason.
- Player token bị chặn.

## Epic 7 - Leaderboard

### P0 - Leaderboard API and UI

User story:

- Là player, tôi muốn xem bảng xếp hạng hiện tại.

Acceptance criteria:

- Hiển thị rank, team name, captain, total score, completed stations, last station, elapsed time.
- Current team được highlight.
- Sort theo score desc, completed desc, elapsed asc.

API:

- `GET /api/leaderboard`

Test notes:

- Tie score.
- Team chưa có điểm.

## Epic 8 - Admin

### P0 - Admin dashboard

User story:

- Là admin, tôi muốn xem tổng quan sự kiện và các team đang gặp vấn đề.

Acceptance criteria:

- Hiển thị số team, số trạm, completed count, active playing count.
- Hiển thị log mới nhất.
- Có link sang team detail và logs.

API:

- `GET /api/admin/dashboard`

Test notes:

- Empty event.

### P0 - Reopen station attempt

User story:

- Là admin, tôi muốn reopen trạm để team chơi lại khi có lỗi vận hành.

Acceptance criteria:

- Admin chọn progress và nhập reason.
- System tạo trạng thái `REOPENED` hoặc attempt mới theo policy.
- Team thấy trạm có thể chơi lại.
- Audit log bắt buộc.

API:

- `POST /api/admin/progress/:progressId/reopen`

Test notes:

- Reopen locked station.
- Reopen nhiều lần.

### P1 - Station progress matrix

User story:

- Là admin, tôi muốn xem bảng team x station để kiểm soát toàn sự kiện.

Acceptance criteria:

- Rows là team, columns là station.
- Cell hiển thị status và score.
- Filter theo team/status.

API:

- `GET /api/admin/progress-matrix`

Test notes:

- 20+ teams, 10+ stations.

## Epic 9 - Activity Logs

### P0 - Mutation audit log

User story:

- Là người vận hành, tôi cần truy vết mọi thay đổi điểm/trạng thái.

Acceptance criteria:

- Log cho login, check-in, check-out, cancel, submit score, edit score, reopen.
- Log có actor, action, entity, metadata, timestamp.
- Admin xem được log.

API:

- `GET /api/admin/activity-logs`
- `GET /api/player/activity-log`

Test notes:

- Metadata không chứa password/token.

## Epic 10 - Testing And Event Readiness

### P0 - Backend flow tests

User story:

- Là developer, tôi cần test flow chính để tránh lỗi ngày sự kiện.

Acceptance criteria:

- Test team login.
- Test check-in/check-out/score.
- Test cancel.
- Test admin edit score.
- Test reopen.
- Test leaderboard sorting.

Test notes:

- Chạy được bằng command documented.

### P1 - Frontend interaction tests

User story:

- Là developer, tôi cần kiểm tra UI không vỡ ở các màn hình chính.

Acceptance criteria:

- Player dashboard render.
- Map marker click mở detail.
- QR error state hiển thị.
- Score popup validate input.
- Leaderboard current team highlight.

Test notes:

- Mobile viewport screenshots nếu có Playwright.

