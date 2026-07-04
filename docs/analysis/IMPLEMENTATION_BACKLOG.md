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
- Có bảng/session store cho `team_sessions` để enforce một team chỉ login trên một thiết bị.
- Có cấu hình sự kiện cho giờ kết thúc tổng, mặc định 11:30 theo `Asia/Ho_Chi_Minh`, final start 11:45, ngưỡng thông báo 15 phút, và cancel cooldown mặc định 5 phút.
- Có bảng final challenge/submissions để auto-score final cipher top 10.
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
- API trả event end time và server time để client hiển thị timer/notification.
- API trả final challenge state cho team hiện tại.

API:

- `GET /api/player/me`
- `GET /api/player/stations`
- `GET /api/player/progress`
- `GET /api/leaderboard`
- `GET /api/player/final`

Test notes:

- Team A không đọc progress private của Team B qua player endpoint.

## Epic 4 - Session And Event Rules

### P0 - Enforce one device per team

User story:

- Là ban tổ chức, tôi muốn mỗi team chỉ login trên một thiết bị tại một thời điểm để tránh chia người chơi dùng nhiều máy.

Acceptance criteria:

- Login team thành công tạo session mới.
- Session cũ của cùng team bị revoke hoặc bị chặn theo policy MVP.
- Thiết bị cũ nhận lỗi rõ `SESSION_REPLACED` hoặc yêu cầu đăng nhập lại.
- Mọi player API validate session hiện hành.

API:

- `POST /api/auth/team-login`
- `GET /api/auth/me`

Test notes:

- Login cùng team trên 2 browser.
- Old token gọi player API bị từ chối.

### P0 - Event end time and station lock policy

User story:

- Là admin, tôi muốn cài giờ kết thúc tổng và hệ thống tự khóa trạm đúng luật.

Acceptance criteria:

- Giờ kết thúc mặc định là 11:30 và admin có thể chỉnh.
- Timezone mặc định là `Asia/Ho_Chi_Minh`.
- Trước giờ kết thúc 15 phút, player UI hiển thị sticky banner + modal trong app.
- Đến giờ kết thúc, trạm chưa bắt đầu chuyển sang `LOCKED`.
- Team đang `CHECKED_IN` hoặc `PLAYING` được hoàn thành trạm hiện tại.
- Sau khi hoàn thành trạm đang chơi, team không thể check-in trạm mới.
- Admin không thể reopen trạm sau giờ kết thúc.
- Final Station đặc biệt mở lúc 11:45 sau khi trạm thường đã lock.

API:

- `GET /api/event-config`
- `PATCH /api/admin/event-config`

Test notes:

- 15 phút trước end time.
- Đúng thời điểm end time.
- Team đang chơi khi end time xảy ra.
- Admin cố reopen sau end time bị chặn.

### P0 - Final station event config

User story:

- Là admin, tôi muốn cấu hình trạm final đặc biệt mở lúc 11:45 để các đội giải mật thư cuối.

Acceptance criteria:

- Final start mặc định là 11:45 theo `Asia/Ho_Chi_Minh`.
- Admin cấu hình được clue, đáp án đúng, max winners và points by rank trước giờ mở.
- Mặc định `maxWinners = 10`.
- Mặc định `pointsByRank = [10,9,8,7,6,5,4,3,2,1]`.
- Không cho chỉnh đáp án/points sau khi final đã mở nếu không qua admin override/audit riêng.

API:

- `GET /api/admin/final-config`
- `PATCH /api/admin/final-config`

Test notes:

- Update config trước 11:45.
- Update config sau 11:45 bị chặn.
- Invalid points array.

## Epic 5 - Player UI

### P0 - Player dashboard

User story:

- Là team, tôi muốn thấy tên đội, đội trưởng, điểm, rank, tiến độ và timer.

Acceptance criteria:

- Hiển thị team name, captain, total points, rank.
- Hiển thị điểm theo format `totalPoints / maxPossiblePoints`.
- Hiển thị completed/total stations.
- Timer hiển thị từ timestamp server.
- Hiển thị event end time và notification khi còn 15 phút.
- Loading/error state rõ.
- Nếu session bị thay bởi thiết bị khác, UI hiển thị yêu cầu đăng nhập lại.

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

## Epic 6 - QR Flow

### P0 - QR check-in

User story:

- Là team, tôi muốn scan QR tại trạm để bắt đầu lượt chơi.

Acceptance criteria:

- Scanner mở camera.
- QR hợp lệ chuyển progress sang `CHECKED_IN` hoặc `PLAYING`.
- QR sai/hết hạn hiển thị lỗi.
- Check-in QR và check-out QR là hai token riêng với purpose khác nhau.
- Scan trùng không tạo nhiều lượt không mong muốn.
- Nếu team đang check-in/playing trạm khác, API chặn check-in.
- Nếu đã quá giờ kết thúc và team chưa ở trạm này, API chặn check-in vì trạm `LOCKED`.

API:

- `POST /api/player/stations/:stationId/check-in`

Test notes:

- Camera denied.
- Wrong station QR.
- Check-out QR dùng nhầm cho check-in bị chặn.
- Already playing another station.
- End time already reached.

### P0 - QR check-out

User story:

- Là team, tôi muốn scan QR kết thúc khi hoàn thành trạm.

Acceptance criteria:

- Chỉ check-out khi đang `PLAYING`.
- QR end hợp lệ ghi `checked_out_at`.
- UI/admin staff score queue nhận lượt cần nhập điểm ngay, không dùng status `WAITING_SCORE`.

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
- Sau cancel, progress trở về `AVAILABLE`.
- Team chỉ được check-in lại sau cancel cooldown mặc định 5 phút, admin config được.
- Ghi activity log.

API:

- `POST /api/player/stations/:stationId/cancel`

Test notes:

- Cancel completed station bị chặn.
- Check-in lại trước khi hết cancel cooldown bị chặn.

## Epic 7 - Scoring

### P0 - Staff/admin submit score after check-out

User story:

- Là staff hoặc admin, tôi muốn nhập điểm sau khi team scan QR kết thúc.

Acceptance criteria:

- Staff/admin score form hiện từ score queue sau khi check-out hợp lệ.
- Score bắt buộc là số nguyên từ 0 đến max points.
- Chỉ `ADMIN` hoặc `STATION_MANAGER` được nhập điểm.
- Staff/Station Manager chỉ nhập điểm cho trạm được gán.
- Team không được tự nhập điểm.
- Submit tạo `score_events`.
- Progress chuyển `COMPLETED`.
- Team total points cập nhật.
- Team total play duration cập nhật bằng tổng thời gian check-in đến check-out của các trạm completed.

API:

- `POST /api/staff/progress/:progressId/score`
- `POST /api/admin/progress/:progressId/score`

Test notes:

- Score âm.
- Score vượt max.
- Submit hai lần.
- Staff nhập điểm cho trạm không được gán bị chặn.

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

## Epic 8 - Leaderboard

### P0 - Leaderboard API and UI

User story:

- Là player, tôi muốn xem bảng xếp hạng hiện tại.

Acceptance criteria:

- Hiển thị rank, team name, captain, total score, completed stations, last station, total play duration.
- Current team được highlight.
- Sort theo score desc, total play duration asc, completed stations desc.
- `total play duration` là tổng các khoảng `checked_out_at - checked_in_at` của trạm completed.

API:

- `GET /api/leaderboard`

Test notes:

- Tie score.
- Team chưa có điểm.
- Same score and same play duration.

## Epic 9 - Final Station

### P0 - Player final cipher screen

User story:

- Là team, tôi muốn thấy trạm final sau 11:45, giải mật thư và submit đáp án.

Acceptance criteria:

- Trước 11:45, UI hiển thị countdown và disable submit.
- Sau 11:45, UI hiển thị clue/mật thư và form submit answer.
- Submit sai hiển thị lỗi và cho thử lại.
- Submit đúng hiển thị winner rank/points nếu trong top 10.
- Submit đúng ngoài top 10 hiển thị đúng nhưng 0 điểm.
- Team đã submit đúng không được nhận điểm lần hai.

API:

- `GET /api/player/final`
- `POST /api/player/final/submit`

Test notes:

- Submit before start.
- Wrong answer.
- Correct answer inside top 10.
- Correct answer after top 10.
- Duplicate correct submission.

### P0 - Final auto-scoring and concurrency

User story:

- Là ban tổ chức, tôi muốn 10 đội đầu tiên giải đúng final được cộng điểm chính xác theo thứ tự submit.

Acceptance criteria:

- Server tự normalize và kiểm tra đáp án.
- Rank dựa trên server `submitted_at` và transaction/insert order.
- Top 10 correct submissions nhận điểm giảm dần.
- Điểm final tạo `score_events`.
- Leaderboard cập nhật sau final score.
- Không dùng client time để xếp hạng.

API:

- `POST /api/player/final/submit`

Test notes:

- Simulate nhiều request đúng gần cùng lúc.
- Transaction không cấp cùng rank cho 2 team.
- Score event chỉ tạo một lần mỗi team.

### P0 - Admin final submissions view

User story:

- Là admin, tôi muốn xem danh sách final submissions để kiểm tra top 10 và xử lý khiếu nại.

Acceptance criteria:

- Hiển thị team, is correct, rank, points, submitted at.
- Filter correct/incorrect.
- Sort by submitted at/rank.
- Không lộ answer hash.

API:

- `GET /api/admin/final/submissions`

Test notes:

- Empty submissions.
- Mixed correct/incorrect submissions.

## Epic 10 - Admin

### P0 - Admin dashboard

User story:

- Là admin, tôi muốn xem tổng quan sự kiện và các team đang gặp vấn đề.

Acceptance criteria:

- Hiển thị số team, số trạm, completed count, active playing count.
- Hiển thị giờ kết thúc hiện tại và số team đang được phép hoàn thành trạm sau giờ khóa.
- Hiển thị log mới nhất.
- Có link sang team detail và logs.

API:

- `GET /api/admin/dashboard`

Test notes:

- Empty event.

### P0 - Reopen station attempt

User story:

- Là admin, tôi muốn mở lại trạm cho team chơi lại khi có lỗi vận hành.

Acceptance criteria:

- Admin chọn progress và nhập reason.
- System đưa progress của team tại trạm đó về `AVAILABLE`.
- Team thấy trạm có thể chơi lại.
- Audit log bắt buộc.
- Reopen bị chặn nếu đã qua giờ kết thúc tổng.

API:

- `POST /api/admin/progress/:progressId/reopen`

Test notes:

- Reopen locked station.
- Reopen nhiều lần.
- Reopen sau 11:30 bị chặn.

### P0 - Export Excel report

User story:

- Là admin, tôi muốn xuất report Excel để nộp/tổng kết điểm, thời gian chơi và log sự kiện.

Acceptance criteria:

- Admin tải được file `.xlsx`.
- Report tối thiểu có sheet `Leaderboard`, `Team Progress`, `Score Events`, `Final Submissions`, `Activity Logs`.
- Ranking trong report khớp rule: score desc, total play duration asc.
- File name có timestamp xuất report.
- Action export được ghi activity log.

API:

- `GET /api/admin/reports/summary.xlsx`

Test notes:

- Export khi chưa có team hoàn thành.
- Export sau khi admin sửa điểm.
- Export sau final submissions.

### P0 - Admin event config

User story:

- Là admin, tôi muốn chỉnh giờ kết thúc tổng và ngưỡng thông báo khi lịch sự kiện thay đổi.

Acceptance criteria:

- Admin xem được end time hiện tại.
- Admin chỉnh được end time, mặc định 11:30.
- Admin chỉnh được final start time, mặc định 11:45.
- Admin chỉnh được notify threshold, mặc định 15 phút.
- Admin chỉnh được cancel cooldown, mặc định 5 phút.
- Mọi thay đổi được ghi audit log.

API:

- `GET /api/admin/event-config`
- `PATCH /api/admin/event-config`

Test notes:

- Set invalid time.
- Change end time while teams are playing.
- Change final start time before final opens.
- Set invalid cancel cooldown.

### P0 - Staff score queue

User story:

- Là staff phụ trách trạm, tôi muốn thấy các team đã check-out tại trạm mình để nhập điểm nhanh.

Acceptance criteria:

- Staff login bằng tài khoản riêng.
- Staff chỉ thấy progress tại station được gán.
- Queue hiển thị team, station/game, checked-in time, checked-out time, max points.
- Submit score dùng chung validation với admin scoring.
- Mọi submit ghi `score_events` và `activity_logs`.

API:

- `GET /api/staff/score-queue`
- `POST /api/staff/progress/:progressId/score`

Test notes:

- Staff không thấy trạm khác.
- Queue trống.
- Submit score success/failure.

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

## Epic 11 - Activity Logs

### P0 - Mutation audit log

User story:

- Là người vận hành, tôi cần truy vết mọi thay đổi điểm/trạng thái.

Acceptance criteria:

- Log cho login, session replaced, check-in, check-out, cancel, submit score, edit score, reopen-to-AVAILABLE, final submit, final config change, event config change, report export.
- Log có actor, action, entity, metadata, timestamp.
- Admin xem được log.

API:

- `GET /api/admin/activity-logs`
- `GET /api/player/activity-log`

Test notes:

- Metadata không chứa password/token.

## Epic 12 - Testing And Event Readiness

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
- Test one-device-per-team session enforcement.
- Test end-time lock and 15-minute notification.
- Test Excel report export.
- Test final open time 11:45.
- Test final top 10 scoring.
- Test final concurrent correct submissions.

Test notes:

- Chạy được bằng command documented.

### P1 - Frontend interaction tests

User story:

- Là developer, tôi cần kiểm tra UI không vỡ ở các màn hình chính.

Acceptance criteria:

- Player dashboard render.
- Map marker click mở detail.
- QR error state hiển thị.
- Staff/admin score form validate input.
- Leaderboard current team highlight.

Test notes:

- Mobile viewport screenshots nếu có Playwright.
