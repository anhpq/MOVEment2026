# MOVEment 2026 - Project Analysis Spec

Tài liệu này phân tích sâu dự án MOVEment 2026 dựa trên 3 nguồn:

- `README.md`: vision kỹ thuật full-stack.
- Source hiện tại trong `frontend/`: prototype player UI.
- `Note`: các ý đang cân nhắc, không xem là requirement cuối cùng.

Mục tiêu là tạo spec đủ rõ để triển khai React/TypeScript + backend API + PostgreSQL mà không phải tự đoán luồng chính.

## 1. Current State

### README expects

README mô tả hệ thống full-stack:

- Frontend: React, TypeScript, Vite, React Bootstrap, Axios, `html5-qrcode`.
- Backend: Node.js, NestJS, JWT, Passport, bcrypt, Prisma hoặc TypeORM.
- Database: PostgreSQL.
- Vai trò: Admin, Station Manager, Player/team.
- Module dự kiến: auth, stations, teams, progress/check-in.
- API sẽ được bảo vệ bằng JWT và role guard.
- Database ban đầu gồm `users`, `stations`, `teams`, `team_station_progress`.

### Current repo has

Repo hiện tại là prototype frontend player UI:

- Có `frontend/src/pages/player/PlayerPage.tsx`.
- Có component `TeamHeader`, `StationMap`, `RankingTable`, `StationDetailModal`.
- Có `dummyData.ts` với 20 team, 10 trạm, progress giả lập.
- Có static HTML demo tại `frontend/public/index.html`.
- Có ảnh map trong `frontend/public/images/map/`.
- Có bộ prompt workflow trong `docs/prompts/`.

### Current repo missing

So với README, repo hiện tại chưa có:

- `frontend/package.json`, `App.tsx`, `main.tsx`, `vite.config.ts`.
- Backend NestJS.
- Prisma schema/migration.
- PostgreSQL integration.
- Auth/JWT.
- API service layer.
- QR scanner thật.
- Admin UI.
- Station manager UI.
- Persistent logs/audit trail.

### Interpretation

Source hiện tại nên được xem là UI prototype, không phải app hoàn chỉnh. Mock data giúp hiểu domain ban đầu nhưng không nên xem là production schema hoặc business rule cuối cùng.

## 2. Product Scope

### Product summary

MOVEment 2026 là hệ thống trò chơi theo trạm tại Suối Tiên. Mỗi team dùng mobile web app để xem map, chọn trạm, check-in bằng QR, chơi nhiệm vụ, check-out bằng QR, nhận điểm và theo dõi bảng xếp hạng. Admin dùng dashboard để theo dõi tiến độ, sửa điểm, mở lại trạm về trạng thái `AVAILABLE`, xuất report Excel và xem log hoạt động.

### Roles

| Role | Mục tiêu | Quyền chính |
| --- | --- | --- |
| Player/Team | Chơi game, xem tiến độ, scan QR, xem điểm | Xem map, xem trạm, check-in/check-out, cancel trạm, xem leaderboard/log của team |
| Admin | Điều hành sự kiện | Quản lý team/trạm, nhập/sửa điểm, mở lại trạm về `AVAILABLE`, xuất Excel report, xem log, can thiệp trạng thái |
| Staff/Station Manager | Nhập điểm tại trạm hoặc hỗ trợ vận hành | Xem trạm được gán, nhập điểm sau check-out, xem log/trạng thái liên quan trạm |

Station Manager được README nhắc tới nhưng source hiện tại chưa có. Vì điểm sẽ do admin/staff nhập, MVP nên có Staff/Station Manager tối giản: đăng nhập, xem các lượt chờ nhập điểm của trạm được gán, nhập điểm, và ghi log. Admin có toàn quyền nhập/sửa điểm cho mọi trạm.

### Core concepts

| Concept | Definition |
| --- | --- |
| Team | Đội chơi, có tên đội, đội trưởng, passcode/login, điểm, thời gian bắt đầu |
| Station | Trạm/chặng trên map, có vị trí, trạng thái, game được gắn |
| Game | Nhiệm vụ tại trạm, có loại, điểm tối đa, độ khó, hướng dẫn |
| Check-in | Scan QR bắt đầu tại trạm, ghi nhận team đã vào trạm |
| Check-out | Scan QR kết thúc tại trạm, chuyển sang nhập/xác nhận điểm |
| Cancel | Hủy lượt đang chơi trước khi hoàn thành; sau khi hủy, trạm của team trở về `AVAILABLE` |
| Reopen | Admin mở lại trạm/lượt chơi bằng cách đưa progress của team tại trạm đó về `AVAILABLE` |
| Score event | Mỗi lần cộng/sửa điểm đều tạo sự kiện điểm để audit |
| Activity log | Nhật ký hành động: login, scan QR, check-in, check-out, submit score, edit score |
| Timer | Thời gian hiển thị cho người chơi; server lưu timestamp chính thức và quản lý giờ kết thúc tổng |

### Confirmed business rules

- Một team chỉ được check-in tại một trạm duy nhất ở một thời điểm.
- Một team chỉ được login trên một thiết bị tại một thời điểm; hướng triển khai tốt nhất cho MVP là login mới tự động revoke session cũ và thiết bị cũ nhận `SESSION_REPLACED`.
- Team có thể cancel trạm đang check-in/playing; sau cancel, progress của trạm đó chuyển về `AVAILABLE`, nhưng chỉ được check-in lại sau cooldown mặc định 5 phút do admin cấu hình.
- Điểm sau check-out do Admin hoặc Staff/Station Manager nhập, không để team tự nhập trong MVP.
- Không dùng status riêng cho `WAITING_SCORE`, `CANCELLED`, `REOPENED`; các trạng thái vận hành liên quan đổi về `AVAILABLE`.
- Giờ kết thúc tổng mặc định là 11:30 theo timezone `Asia/Ho_Chi_Minh` và admin có thể chỉnh.
- Trước giờ kết thúc 15 phút, hệ thống thông báo cho các team bằng in-app banner + modal; âm thanh/rung chỉ dùng nếu trình duyệt cho phép.
- Đến giờ kết thúc, các trạm chưa bắt đầu chuyển sang `LOCKED`; team đang check-in/playing được tiếp tục cho đến khi hoàn thành trạm hiện tại.
- Leaderboard sắp xếp theo điểm cao nhất, sau đó thời gian chơi ngắn nhất.
- Thời gian chơi dùng để xếp hạng là tổng thời gian check-in đến check-out của các trạm đã hoàn thành.
- Admin không được reopen trạm sau giờ kết thúc tổng.
- Sau rule lock 11:30, hệ thống vẫn có một Final Station đặc biệt mở lúc 11:45 theo `Asia/Ho_Chi_Minh`.
- Final Station là phase riêng, không dùng check-in/check-out/staff scoring như trạm thường.
- Final Station là mật thư auto-score bởi server; 10 team đầu tiên submit đúng nhận điểm giảm dần theo thứ tự đúng.
- Player home hiển thị `totalPoints / maxPossiblePoints`; `maxPossiblePoints` lấy từ tổng điểm tối đa của các game/trạm active.
- Difficulty stars được lưu ở game metadata và hiển thị trong station detail/game list; không ảnh hưởng điểm hoặc logic unlock trong MVP.

## 3. Player Screen Spec

### 3.1 Player Home / Current Game Dashboard

Purpose:

- Là màn hình chính khi team mở app.
- Cho biết team nào đang chơi, điểm hiện tại, tổng điểm/tối đa, tiến độ và trạng thái game.

Data:

- Team name, captain name, current score, max possible score.
- Score display format: `totalPoints / maxPossiblePoints`.
- Current rank.
- Completed stations count / total stations.
- Current station nếu đang chơi.
- Elapsed time hoặc remaining event time.
- Event end time, mặc định 11:30, lấy từ server.
- Notification state nếu còn 15 phút trước giờ kết thúc.
- Active device/session id để enforce single-device login.

Actions:

- Mở map.
- Scan QR nhanh bằng bottom dock.
- Xem leaderboard.
- Xem activity log.
- Mở settings.

States:

- Loading team session.
- Not authenticated.
- No active game.
- Active playing.
- Event ended.
- Session replaced by another device.
- 15-minute end-time warning.
- Network error.

API dependencies:

- `GET /api/player/me`
- `GET /api/player/progress`
- `GET /api/leaderboard`
- `GET /api/player/activity-log`

Edge cases:

- Team chưa có `start_time`.
- Team bị khóa hoặc passcode sai.
- Server trả progress thiếu trạm.
- Client timer lệch giờ thiết bị.
- Team login trên thiết bị khác trong lúc đang chơi.
- Đến 11:30 khi team đang ở trạng thái `CHECKED_IN`/`PLAYING`.

### 3.2 Map Overview

Purpose:

- Hiển thị bản đồ Suối Tiên và trạng thái từng trạm.
- Là điểm điều hướng tới station detail.

Data:

- Station id, name, position x/y hoặc lat/lng.
- Game type, difficulty, points.
- Team progress status per station.
- Current active station.

Actions:

- Tap station marker để mở detail.
- Zoom/pan map.
- Reset map.
- Filter theo trạng thái nếu cần.

States:

- `LOCKED`: chưa mở.
- `AVAILABLE`: có thể vào.
- `CHECKED_IN` / `PLAYING`: đang chơi.
- `COMPLETED`: đã hoàn thành.

Không dùng status riêng cho waiting score, cancelled hoặc reopened. Check-out hợp lệ đưa lượt chơi vào staff/admin score queue; player thấy thông báo chờ nhập điểm. Cancel và admin reopen đưa trạm về `AVAILABLE` và ghi activity log.

API dependencies:

- `GET /api/stations`
- `GET /api/player/progress`

Current implementation:

- Đã có `StationMap` dùng ảnh `/images/map/suoitien-map1.png`.
- Đã có marker theo status `LOCKED`, `UNLOCKED`, `PLAYING`, `COMPLETED`.
- Chưa có touch pinch thật trong React component dù frontend README có nhắc.

Recommended changes:

- Đổi `UNLOCKED` thành `AVAILABLE`.
- Thêm trạng thái `CHECKED_IN`.
- Không thêm `WAITING_SCORE`, `CANCELLED`, `REOPENED`; các case đó được thể hiện bằng log/timestamp và status vận hành `AVAILABLE` hoặc `COMPLETED`.
- Giữ map image MVP, nhưng thiết kế overlay theo mobile HUD.

### 3.3 Station Detail

Purpose:

- Cho team biết trạm này là gì, game gì, điểm tối đa, độ khó và hành động tiếp theo.

Data:

- Station name/code.
- Game title, description, game type.
- Difficulty stars.
- Points max.
- Current progress status.
- Attempts.
- Last played.
- Check-in/check-out timestamps.
- Cancel/reopen reason nếu có trong activity log.

Actions:

- Scan QR check-in.
- Scan QR check-out.
- Cancel lượt chơi.
- Continue game.
- View guide/video/clue nếu mở.

States:

- Locked: chỉ xem lý do khóa.
- Available: cho scan QR check-in.
- Checked in/playing: cho scan QR check-out hoặc cancel.
- Completed: hiển thị điểm đã đạt và log.

Sau check-out thành công, lượt chơi xuất hiện trong staff/admin score queue; player không tự nhập điểm và không chuyển qua status `WAITING_SCORE`.

API dependencies:

- `GET /api/player/stations/:stationId`
- `POST /api/player/stations/:stationId/check-in`
- `POST /api/player/stations/:stationId/check-out`
- `POST /api/player/stations/:stationId/cancel`

Current implementation:

- Đã có `StationDetailModal`.
- Có clue, video, cipher input, QR button giả lập, cooldown.
- Chưa có QR thật, check-in/check-out riêng, score popup, audit log.

### 3.4 QR Scan Start

Purpose:

- Scan QR tại trạm để bắt đầu lượt chơi.

Data:

- Camera permission state.
- Station id trong QR.
- Team id/session từ token.
- QR token payload.

Actions:

- Open camera.
- Scan QR.
- Retry.
- Cancel scanner.

Main flow:

1. Team mở station detail.
2. Bấm scan QR check-in.
3. Client đọc QR token.
4. Client gọi API check-in.
5. Server validate team, station, token, trạng thái.
6. Server ghi `checked_in_at`, status `CHECKED_IN` hoặc `PLAYING`.
7. UI về map/detail với trạng thái đang chơi.

API dependencies:

- `POST /api/player/stations/:stationId/check-in`

Edge cases:

- QR sai trạm.
- QR hết hạn.
- Team đang chơi trạm khác.
- Trạm đang locked.
- Camera permission denied.
- Team session không còn hợp lệ vì đã login trên thiết bị khác.

### 3.5 QR Scan End

Purpose:

- Scan QR kết thúc sau khi hoàn thành nhiệm vụ tại trạm.

Main flow:

1. Team đang ở trạng thái `PLAYING`.
2. Team bấm scan QR kết thúc.
3. Server validate QR và trạng thái.
4. Server ghi `checked_out_at` và đưa progress vào score queue cho Staff/Admin.
5. Player UI hiển thị thông báo đã hoàn thành lượt chơi và chờ staff/admin nhập điểm.

API dependencies:

- `POST /api/player/stations/:stationId/check-out`

Edge cases:

- Chưa check-in nhưng scan end QR.
- Scan end QR trạm khác.
- Đã completed nhưng scan lại.
- Offline giữa lúc scan.

### 3.6 Staff/Admin Score Input

Purpose:

- Admin hoặc Staff/Station Manager nhập điểm đạt được sau khi team check-out.

Data:

- Station/game max points.
- Current attempts.
- Team name và station/game name.
- Check-in/check-out timestamps.
- Suggested score nếu có.
- Score entered.

Actions:

- Submit score.
- Cancel scoring modal để nhập sau.

Validation:

- Score là số nguyên.
- Score từ 0 đến `max_points`.
- Chỉ submit khi progress có `checked_out_at` và chưa `completed_at`.
- Chỉ role `ADMIN` hoặc `STATION_MANAGER` có quyền submit.

API dependencies:

- `POST /api/staff/progress/:progressId/score`
- `POST /api/admin/progress/:progressId/score`

Recommended policy:

- MVP không cho team tự nhập điểm.
- Staff/Station Manager chỉ nhập điểm cho trạm được gán.
- Admin nhập/sửa điểm cho mọi trạm.
- Mọi điểm đều ghi vào `score_events`.

### 3.7 Leaderboard

Purpose:

- Hiển thị xếp hạng team theo điểm và thời gian.

Data:

- Rank.
- Team name.
- Captain name.
- Total score.
- Completed stations.
- Last station/game.
- Total play duration.

Actions:

- Open/close leaderboard.
- Refresh.
- Tap team để xem public progress nếu admin cho phép.

API dependencies:

- `GET /api/leaderboard`

Current implementation:

- Có `RankingTable` hiển thị top 5 + current team.
- Chưa có captain, last game, total time, full ranking table.

Ranking rule:

- Primary: total score desc.
- Tie-breaker: total play duration asc, trong đó `total_play_seconds` là tổng của `checked_out_at - checked_in_at` trên các trạm đã hoàn thành.
- Tie-breaker tiếp theo: completed stations desc.

### 3.8 Activity Log

Purpose:

- Cho team/admin xem lịch sử hành động.

Data:

- Timestamp.
- Actor.
- Action.
- Station/game.
- Old/new status.
- Score delta.
- Message.

Actions:

- Refresh.
- Filter by station/action.

API dependencies:

- Player: `GET /api/player/activity-log`
- Admin: `GET /api/admin/activity-logs`

### 3.10 End Time Notification

Purpose:

- Thông báo cho team trước khi sự kiện kết thúc và khóa trạm đúng policy.

Data:

- Event end time, mặc định 11:30.
- Server current time hoặc client-server offset.
- Notification threshold, mặc định 15 phút.
- Team current progress status.

Behavior:

- Trước giờ kết thúc 15 phút, player UI hiển thị sticky banner và modal trong app; có thể dùng âm thanh/rung nếu thiết bị cho phép.
- Đến giờ kết thúc, server chuyển các trạm chưa check-in của team sang `LOCKED`.
- Nếu team đang `CHECKED_IN` hoặc `PLAYING`, team được tiếp tục cho đến khi check-out/submit score hoàn thành trạm hiện tại.
- Sau khi hoàn thành trạm đang chơi, team không được check-in thêm trạm mới vì các trạm còn lại đã `LOCKED`.
- Admin không được reopen trạm sau giờ kết thúc; chỉ có thể sửa điểm/report/log.

API dependencies:

- `GET /api/player/me` hoặc `GET /api/event-config`
- `PATCH /api/admin/event-config`
- Backend scheduled job hoặc request-time enforcement cho end-time lock.

### 3.11 Final Station / Final Cipher

Purpose:

- Tạo một phase đặc biệt sau khi các trạm thường đã khóa.
- Team giải mật thư final, server tự chấm đúng/sai và tự cộng điểm cho 10 team đầu tiên submit đúng.

Timing:

- Trạm thường kết thúc/lock lúc 11:30.
- Final Station mở lúc 11:45 theo timezone `Asia/Ho_Chi_Minh`.
- Trước 11:45, player UI hiển thị countdown và không cho submit.

Data:

- Final title, clue/cipher content, starts_at.
- Correct answer hash ở server, không gửi đáp án đúng xuống client.
- `max_winners`, mặc định 10.
- `points_by_rank`, ví dụ `[10,9,8,7,6,5,4,3,2,1]`.
- Submission status của team hiện tại.

Actions:

- Team xem mật thư final khi đến giờ mở.
- Team submit answer.
- Team retry nếu sai, theo policy không giới hạn số lần trong MVP trừ khi admin cấu hình rate limit.

Scoring:

- Server chấm đáp án tự động.
- Chỉ submission đúng đầu tiên của mỗi team được tính rank/điểm.
- 10 team đầu tiên submit đúng nhận điểm theo `points_by_rank`.
- Team submit đúng sau top 10 được ghi nhận đúng nhưng `points_awarded = 0`.
- Điểm final ghi vào `score_events` để leaderboard/report thống nhất.

Concurrency:

- API submit final phải dùng database transaction.
- Thứ tự rank dựa trên `submitted_at` server và thứ tự commit/insert trong transaction.
- Không dùng giờ client để xếp hạng.

API dependencies:

- `GET /api/player/final`
- `POST /api/player/final/submit`
- `GET /api/admin/final/submissions`
- `PATCH /api/admin/final-config`

Edge cases:

- Submit trước 11:45 bị chặn.
- Submit sai nhiều lần.
- Team đã đúng submit lại.
- Nhiều team submit đúng gần như đồng thời.
- Admin muốn chỉnh đáp án/điểm sau khi final đã mở: chỉ cho phép trước `starts_at`; sau đó cần audit override riêng nếu thật sự cần.

### 3.9 Settings

Purpose:

- Chưa rõ trong `Note`, nên đưa vào P2.

Recommended MVP settings:

- View team info.
- Logout.
- Camera permission help.
- Sound/vibration toggle nếu UI có hiệu ứng.

Out of MVP:

- Đổi thông tin team.
- Đổi captain.
- Theme customization.

## 4. Station Flow Spec

### Proposed state machine

```text
LOCKED
  -> AVAILABLE
AVAILABLE
  -> CHECKED_IN
CHECKED_IN
  -> PLAYING
  -> AVAILABLE        # cancel
PLAYING
  -> AVAILABLE        # cancel
  -> COMPLETED
COMPLETED
  -> AVAILABLE        # admin reopen
```

Allowed operational statuses are only `LOCKED`, `AVAILABLE`, `CHECKED_IN`, `PLAYING`, `COMPLETED`. Cancel, score waiting and reopen are represented by timestamps/log events, not by separate progress statuses.

### Action specifications

| Action | Actor | Precondition | Database update | UI response |
| --- | --- | --- | --- | --- |
| Check-in | Player/team | Station `AVAILABLE`, QR hợp lệ, team không chơi trạm khác, session còn hiệu lực | set `checked_in_at`, status `CHECKED_IN`/`PLAYING`, increment attempt if needed | Detail/map chuyển sang đang chơi |
| Check-out | Player/team | Status `PLAYING`, QR end hợp lệ | set `checked_out_at`, add item to staff/admin score queue | Player thấy thông báo chờ nhập điểm |
| Cancel | Player/team | Status `CHECKED_IN` hoặc `PLAYING` | set `cancelled_at`, status `AVAILABLE`, set next check-in allowed after configured cooldown, write activity log | Quay về map, trạm có thể check-in lại sau cooldown nếu chưa hết giờ |
| Submit score | Admin hoặc Staff/Station Manager | Progress có `checked_out_at`, chưa `completed_at`, score hợp lệ, staff đúng trạm nếu không phải admin | insert `score_events`, update progress score/status `COMPLETED`, update team total and total play duration | Hiện completed và cập nhật leaderboard |
| Edit score | Admin | Progress exists | insert adjustment `score_events`, recompute team total | Admin thấy điểm mới và log |
| Reopen station | Admin | Progress `COMPLETED` hoặc error state, current time before event end time | set `reopened_at`, status `AVAILABLE`, write activity log | Team có thể check-in lại nếu chưa hết giờ |

### Timer recommendation

Khuyến nghị hybrid:

- Client hiển thị elapsed time/countdown để UI mượt.
- Server là nguồn sự thật cho `started_at`, `checked_in_at`, `checked_out_at`, `completed_at`.
- Server lưu event end time, mặc định 11:30, và cho admin chỉnh.
- Server enforce lock rule tại giờ kết thúc: trạm chưa bắt đầu thành `LOCKED`, trạm đang `CHECKED_IN`/`PLAYING` được hoàn thành.
- Khi client load app, lấy server time hoặc timestamp từ API để tính offset.
- Không tin hoàn toàn vào giờ thiết bị khi tính xếp hạng hoặc audit.

## 5. Admin Spec

### Admin auth

Recommendation:

- Admin đăng nhập bằng username/password.
- Backend hash password bằng bcrypt.
- API trả JWT access token.
- Role trong JWT: `ADMIN`.
- Frontend lưu token ở memory hoặc localStorage cho MVP; production nên cân nhắc httpOnly cookie nếu deploy cùng domain.

### Admin screens

| Screen | Purpose | MVP priority |
| --- | --- | --- |
| Login | Đăng nhập admin | P0 |
| Dashboard | Tổng quan team/trạm/điểm/log mới nhất | P0 |
| Team Detail | Xem tiến độ từng team | P0 |
| Station Progress Matrix | Bảng team x station | P1 |
| Score Management | Sửa điểm, xem lịch sử điểm | P0 |
| Reopen Station | Mở lại trạm/lượt chơi | P0 |
| Activity Logs | Audit mọi hành động | P0 |
| QR Management | Xem/tạo QR token | P1 |
| Event Config | Chỉnh giờ kết thúc, ngưỡng thông báo | P0 |
| Staff Score Queue | Nhập điểm sau check-out theo trạm được gán | P0 |
| Excel Report | Xuất báo cáo team, điểm, thời gian, log | P0 |

### Admin functions

| Function | Data | Action | Audit |
| --- | --- | --- | --- |
| View teams | team, score, rank, status | search/filter/sort | no mutation log needed |
| View progress | progress by team/station | inspect detail | no mutation log needed |
| Edit score | current score, max score, reason | set or adjust score | required |
| Reopen station | progress, reason | reopen attempt | required |
| Force status | progress status | admin override | required |
| View logs | activity log | filter/export | no mutation log needed |
| Configure end time | current end time, notify threshold | update event config | required |
| Export report | team/progress/score/log filters | download `.xlsx` | required if export is generated |

### Operational risks

- Admin sửa điểm nhầm trong ngày sự kiện.
- Team scan sai QR hoặc scan nhiều lần.
- Mạng yếu tại địa điểm.
- Điện thoại từ chối camera permission.
- Timer client lệch giờ.
- Leaderboard cần refresh realtime hoặc gần realtime.
- Xuất Excel cần thống nhất format trước ngày sự kiện.
- Giờ kết thúc tổng cần chỉnh được nhưng phải audit để tránh thay đổi nhầm.

Mitigation:

- Mọi mutation admin phải có confirm modal và reason.
- Mọi score/status change phải ghi audit.
- QR API idempotent ở các case scan trùng.
- UI có retry/offline message rõ.
- End-time lock chạy ở backend để không phụ thuộc thiết bị player.

## 6. Database And API Spec

### Proposed tables

#### users

| Field | Purpose |
| --- | --- |
| id | primary key |
| username | login name |
| password_hash | bcrypt hash |
| role | `ADMIN`, `STATION_MANAGER` |
| station_id | optional station assignment |
| created_at, updated_at | audit timestamps |

#### teams

| Field | Purpose |
| --- | --- |
| id | primary key |
| name | team display name |
| captain_name | leaderboard/detail |
| passcode_hash | team login |
| total_points | denormalized current total |
| max_possible_points | denormalized max possible points from active games |
| total_play_seconds | denormalized sum of completed station check-in/check-out durations |
| started_at | event/team start |
| status | active/locked/finished |
| active_session_id | optional pointer for single-device enforcement |
| created_at, updated_at | audit timestamps |

#### team_sessions

| Field | Purpose |
| --- | --- |
| id | primary key/session id |
| team_id | team relation |
| token_hash | current session token hash |
| device_label | optional browser/device info |
| issued_at | login time |
| last_seen_at | heartbeat/activity |
| revoked_at | set when another device logs in or admin revokes |
| revoke_reason | `NEW_LOGIN`, `ADMIN_REVOKE`, `LOGOUT`, `EXPIRED` |

#### stations

| Field | Purpose |
| --- | --- |
| id | station code |
| name | display name |
| description | detail text |
| map_x, map_y | map marker percent |
| latitude, longitude | optional geo |
| is_active | admin toggle |
| sort_order | display order |

#### games

| Field | Purpose |
| --- | --- |
| id | primary key |
| station_id | station relation |
| title | game name |
| type | `CIPHER`, `PUZZLE`, `QUIZ`, `PHYSICAL`, etc. |
| difficulty | 1-5 stars |
| max_points | max score |
| clue_text | clue/guide |
| media_url | optional video/image |

#### team_station_progress

| Field | Purpose |
| --- | --- |
| id | primary key |
| team_id | team relation |
| station_id | station relation |
| game_id | game relation |
| status | progress enum |
| attempt_no | attempt count |
| checked_in_at | server timestamp |
| checked_out_at | server timestamp |
| completed_at | server timestamp |
| cancelled_at | server timestamp |
| reopened_at | server timestamp |
| score_achieved | final score for attempt |
| score_entered_by_user_id | admin/staff who entered final score |
| notes | optional |

#### score_events

| Field | Purpose |
| --- | --- |
| id | primary key |
| team_id | team relation |
| progress_id | progress relation |
| station_id | station relation |
| score_before | audit |
| score_after | audit |
| delta | audit |
| reason | required for admin edit |
| created_by_user_id | admin/station manager optional |
| created_by_team_id | team optional |
| created_at | timestamp |

#### qr_tokens

| Field | Purpose |
| --- | --- |
| id | primary key |
| station_id | station relation |
| token_hash | never store raw token if possible |
| purpose | `CHECK_IN`, `CHECK_OUT` |
| expires_at | optional |
| is_active | revoke support |

#### event_config

| Field | Purpose |
| --- | --- |
| id | singleton/config row |
| event_end_time | default `11:30` local event time |
| final_starts_at | default `11:45` local event time |
| notify_before_minutes | default `15` |
| cancel_cooldown_minutes | default `5` |
| timezone | default `Asia/Ho_Chi_Minh` |
| updated_by_user_id | admin who changed config |
| updated_at | audit timestamp |

#### final_challenges

| Field | Purpose |
| --- | --- |
| id | primary key |
| title | final challenge display title |
| clue_text | final cipher/clue shown to teams |
| answer_hash | hashed normalized correct answer |
| starts_at | default 11:45 event-local timestamp |
| max_winners | default 10 |
| points_by_rank | JSON array, default `[10,9,8,7,6,5,4,3,2,1]` |
| is_active | final enabled flag |
| created_at, updated_at | audit timestamps |

#### final_submissions

| Field | Purpose |
| --- | --- |
| id | primary key |
| final_challenge_id | final challenge relation |
| team_id | team relation |
| answer_submitted | normalized submitted answer or redacted value |
| is_correct | server result |
| winner_rank | 1-10 for winning correct submissions, null otherwise |
| points_awarded | final points, 0 if outside top 10 or incorrect |
| submitted_at | server timestamp |
| score_event_id | relation if points were awarded |

#### activity_logs

| Field | Purpose |
| --- | --- |
| id | primary key |
| actor_type | `TEAM`, `USER`, `SYSTEM` |
| actor_id | actor id |
| action | event name |
| entity_type | affected entity |
| entity_id | affected id |
| metadata | JSON payload |
| created_at | timestamp |

#### report_exports

| Field | Purpose |
| --- | --- |
| id | primary key |
| requested_by_user_id | admin relation |
| report_type | `SUMMARY`, `TEAM_PROGRESS`, `SCORE_EVENTS`, `ACTIVITY_LOGS`, `FINAL_SUBMISSIONS` |
| filters | JSON payload |
| file_name | generated `.xlsx` name |
| generated_at | timestamp |

Excel report default sheets:

- `Leaderboard`: rank, team, captain, total score, max possible points, total play duration, completed stations, last station.
- `Team Progress`: team, station, status, score, checked-in time, checked-out time, completed time, staff/admin scorer.
- `Score Events`: team, station, score before, score after, delta, reason, actor, timestamp.
- `Final Submissions`: team, submitted answer summary, is correct, winner rank, points awarded, submitted at.
- `Activity Logs`: actor, action, entity, metadata summary, timestamp.

### API contract summary

#### Auth

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | public | login admin/station manager |
| POST | `/api/auth/team-login` | public | login team by passcode |
| POST | `/api/auth/logout` | authenticated | clear session/token client-side |
| GET | `/api/auth/me` | authenticated | current user/team |

Team login must enforce one active device per team. MVP policy: a new successful login revokes the previous `team_sessions` row and returns a fresh token; the old device receives `401 SESSION_REPLACED` on the next API call.

#### Player

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/player/me` | current team dashboard |
| GET | `/api/player/stations` | map stations with team progress |
| GET | `/api/player/progress` | progress summary |
| GET | `/api/player/activity-log` | team log |
| GET | `/api/event-config` | event end time and notification threshold |
| GET | `/api/leaderboard` | leaderboard |
| GET | `/api/player/final` | final challenge state for current team |
| POST | `/api/player/final/submit` | submit final cipher answer |

#### QR flow

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/player/stations/:stationId/check-in` | validate QR and start attempt |
| POST | `/api/player/stations/:stationId/check-out` | validate QR and finish gameplay |
| POST | `/api/player/stations/:stationId/cancel` | cancel current attempt |

Check-in QR and check-out QR are separate tokens with different `purpose` values. The backend must reject a check-in QR used for check-out and vice versa.

#### Staff

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/staff/score-queue` | list checked-out progress items waiting for score at assigned station |
| POST | `/api/staff/progress/:progressId/score` | enter score for assigned station |

#### Admin

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/admin/dashboard` | overview |
| GET | `/api/admin/teams` | list teams |
| GET | `/api/admin/teams/:teamId/progress` | team progress |
| PATCH | `/api/admin/progress/:progressId/score` | edit score |
| POST | `/api/admin/progress/:progressId/score` | enter score after check-out |
| POST | `/api/admin/progress/:progressId/reopen` | reopen station attempt |
| PATCH | `/api/admin/progress/:progressId/status` | force status |
| GET | `/api/admin/event-config` | view event end time config |
| PATCH | `/api/admin/event-config` | modify event end time / notify threshold |
| PATCH | `/api/admin/final-config` | modify final challenge before it starts |
| GET | `/api/admin/final/submissions` | view final submissions |
| GET | `/api/admin/reports/summary.xlsx` | export Excel report |
| GET | `/api/admin/activity-logs` | audit logs |

### TypeScript models

```ts
export type UserRole = 'ADMIN' | 'STATION_MANAGER';
export type TeamStatus = 'ACTIVE' | 'LOCKED' | 'FINISHED';
export type ProgressStatus =
  | 'LOCKED'
  | 'AVAILABLE'
  | 'CHECKED_IN'
  | 'PLAYING'
  | 'COMPLETED';

export interface AuthenticatedUser {
  id: number;
  username: string;
  role: UserRole;
  stationId?: string | null;
}

export interface Team {
  id: number;
  name: string;
  captainName: string;
  totalPoints: number;
  maxPossiblePoints: number;
  startedAt: string | null;
  status: TeamStatus;
  activeSessionId?: string | null;
  rank?: number;
  totalPlaySeconds?: number;
}

export interface Station {
  id: string;
  name: string;
  description?: string;
  mapX: number;
  mapY: number;
  isActive: boolean;
}

export interface Game {
  id: number;
  stationId: string;
  title: string;
  type: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  maxPoints: number;
  clueText?: string;
  mediaUrl?: string;
}

export interface TeamStationProgress {
  id: number;
  teamId: number;
  stationId: string;
  gameId: number;
  status: ProgressStatus;
  attemptNo: number;
  scoreAchieved: number;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  reopenedAt: string | null;
}

export interface EventConfig {
  eventEndTime: string; // HH:mm, default 11:30
  finalStartsAt: string; // HH:mm, default 11:45
  notifyBeforeMinutes: number; // default 15
  cancelCooldownMinutes: number; // default 5
  timezone: string; // default Asia/Ho_Chi_Minh
  serverNow: string;
}

export interface FinalChallenge {
  id: number;
  title: string;
  clueText: string;
  startsAt: string;
  maxWinners: number;
  pointsByRank: number[];
  isOpen: boolean;
  teamSubmission?: FinalSubmission | null;
}

export interface FinalSubmission {
  id: number;
  teamId: number;
  isCorrect: boolean;
  winnerRank: number | null;
  pointsAwarded: number;
  submittedAt: string;
}

export interface ScoreEvent {
  id: number;
  teamId: number;
  progressId: number;
  stationId: string;
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
  reason?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  actorType: 'TEAM' | 'USER' | 'SYSTEM';
  actorId: number | string;
  action: string;
  entityType: string;
  entityId: number | string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  teamId: number;
  teamName: string;
  captainName: string;
  totalPoints: number;
  completedStations: number;
  lastStationName?: string;
  totalPlaySeconds: number;
}
```

## 7. UI Direction

### Current prototype UI

- Card-based layout.
- White/gray background.
- Gradient header.
- Static map section.
- Ranking card below map.
- Bottom-sheet modal for station detail.

### Target reference UI

- Mobile-first full-screen game HUD.
- Dark neon/cyber visual.
- Header integrated into viewport with team, captain, score, status.
- Map is the main visual, not just one card.
- Large center QR action in bottom dock.
- Bottom dock includes leaderboard and log.
- Timer uses digital display style.
- Leaderboard is a dense table with rank, team, captain, score, last game, time.

### Recommendation

Split work into two layers:

1. MVP functional UI:
   - Keep current component structure but add missing screens/flows.
   - Ensure QR, score, leaderboard, admin work.
2. Visual polish:
   - Refactor player page into full-screen mobile HUD.
   - Add fixed bottom dock.
   - Rework map overlays and station task cards.
   - Apply neon design tokens.

### Design tokens draft

| Token | Value |
| --- | --- |
| Background | `#07131f` |
| Panel | `rgba(10, 25, 40, 0.88)` |
| Cyan accent | `#65f6ff` |
| Red accent | `#ff4664` |
| Gold accent | `#ffd166` |
| Success | `#48f2a2` |
| Warning | `#ffb84d` |
| Danger | `#ff4d6d` |
| Text primary | `#f5fbff` |
| Text secondary | `#a7c7d9` |

## 8. Technical Gap And Build Order

### Main gaps

- Project scaffolding incomplete for Vite/NestJS.
- No backend/API/database.
- No auth/session.
- No QR scanner integration.
- No admin app.
- No production state machine.
- No tests.

### Recommended build order

1. Complete frontend app scaffold or recreate clean Vite React app around existing components.
2. Define shared domain types and replace `UNLOCKED` naming with final statuses.
3. Build backend skeleton with auth, teams, stations, progress modules.
4. Add PostgreSQL schema, seed data, single-device team sessions and event config.
5. Implement player dashboard/map/progress API integration.
6. Implement QR check-in/check-out/cancel/score flow with one-active-station enforcement.
7. Implement leaderboard using score desc and total play duration asc.
8. Implement admin dashboard, score edit, reopen-to-AVAILABLE, event config and Excel report.
9. Implement Final Station phase with 11:45 open time, auto-scoring top 10 and final submissions report.
10. Refactor UI toward mobile HUD reference.
11. Add tests and event-day operational checks.
