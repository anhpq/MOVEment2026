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

MOVEment 2026 là hệ thống trò chơi theo trạm tại Suối Tiên. Mỗi team dùng mobile web app để xem map, chọn trạm, check-in bằng QR, chơi nhiệm vụ, check-out bằng QR, nhận điểm và theo dõi bảng xếp hạng. Admin dùng dashboard để theo dõi tiến độ, sửa điểm, reopen trạm và xem log hoạt động.

### Roles

| Role | Mục tiêu | Quyền chính |
| --- | --- | --- |
| Player/Team | Chơi game, xem tiến độ, scan QR, xem điểm | Xem map, xem trạm, check-in/check-out, xem leaderboard/log của team |
| Admin | Điều hành sự kiện | Quản lý team/trạm, sửa điểm, reopen trạm, xem log, can thiệp trạng thái |
| Station Manager | Xác nhận tại trạm nếu sự kiện cần người phụ trách | Xem trạm được gán, xác nhận check-in/check-out hoặc hỗ trợ QR |

Station Manager được README nhắc tới nhưng source hiện tại chưa có. MVP có thể bỏ qua role này nếu tất cả QR do team tự scan và admin xử lý tập trung.

### Core concepts

| Concept | Definition |
| --- | --- |
| Team | Đội chơi, có tên đội, đội trưởng, passcode/login, điểm, thời gian bắt đầu |
| Station | Trạm/chặng trên map, có vị trí, trạng thái, game được gắn |
| Game | Nhiệm vụ tại trạm, có loại, điểm tối đa, độ khó, hướng dẫn |
| Check-in | Scan QR bắt đầu tại trạm, ghi nhận team đã vào trạm |
| Check-out | Scan QR kết thúc tại trạm, chuyển sang nhập/xác nhận điểm |
| Cancel | Hủy lượt đang chơi trước khi hoàn thành |
| Reopen | Admin mở lại trạm/lượt chơi để team tham gia lại |
| Score event | Mỗi lần cộng/sửa điểm đều tạo sự kiện điểm để audit |
| Activity log | Nhật ký hành động: login, scan QR, check-in, check-out, submit score, edit score |
| Timer | Thời gian hiển thị cho người chơi; server lưu timestamp chính thức |

## 3. Player Screen Spec

### 3.1 Player Home / Current Game Dashboard

Purpose:

- Là màn hình chính khi team mở app.
- Cho biết team nào đang chơi, điểm hiện tại, tổng điểm/tối đa, tiến độ và trạng thái game.

Data:

- Team name, captain name, current score, max possible score.
- Current rank.
- Completed stations count / total stations.
- Current station nếu đang chơi.
- Elapsed time hoặc remaining event time.

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
- `WAITING_SCORE`: đã check-out, chờ nhập/xác nhận điểm.
- `COMPLETED`: đã hoàn thành.
- `CANCELLED`: đã hủy.
- `REOPENED`: admin mở lại.

API dependencies:

- `GET /api/stations`
- `GET /api/player/progress`

Current implementation:

- Đã có `StationMap` dùng ảnh `/images/map/suoitien-map1.png`.
- Đã có marker theo status `LOCKED`, `UNLOCKED`, `PLAYING`, `COMPLETED`.
- Chưa có touch pinch thật trong React component dù frontend README có nhắc.

Recommended changes:

- Đổi `UNLOCKED` thành `AVAILABLE` hoặc map rõ giữa 2 tên.
- Thêm trạng thái `CHECKED_IN`, `WAITING_SCORE`, `CANCELLED`, `REOPENED`.
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
- Reopen reason nếu có.

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
- Waiting score: hiện popup nhập điểm.
- Completed: hiển thị điểm đã đạt và log.
- Reopened: cho chơi lại.

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

### 3.5 QR Scan End

Purpose:

- Scan QR kết thúc sau khi hoàn thành nhiệm vụ tại trạm.

Main flow:

1. Team đang ở trạng thái `PLAYING`.
2. Team bấm scan QR kết thúc.
3. Server validate QR và trạng thái.
4. Server ghi `checked_out_at`, status `WAITING_SCORE`.
5. Client mở score popup.

API dependencies:

- `POST /api/player/stations/:stationId/check-out`

Edge cases:

- Chưa check-in nhưng scan end QR.
- Scan end QR trạm khác.
- Đã completed nhưng scan lại.
- Offline giữa lúc scan.

### 3.6 Score Input Popup

Purpose:

- Nhập điểm đạt được sau khi check-out.

Data:

- Station/game max points.
- Current attempts.
- Suggested score nếu có.
- Score entered.

Actions:

- Submit score.
- Cancel nếu admin/team policy cho phép.

Validation:

- Score là số nguyên.
- Score từ 0 đến `max_points`.
- Chỉ submit khi progress status là `WAITING_SCORE`.

API dependencies:

- `POST /api/player/stations/:stationId/score`

Recommended policy:

- MVP cho team nhập điểm nếu sự kiện tự quản.
- Nếu cần chống gian lận, score do Station Manager/Admin nhập hoặc xác nhận.
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
- Total elapsed time.

Actions:

- Open/close leaderboard.
- Refresh.
- Tap team để xem public progress nếu admin cho phép.

API dependencies:

- `GET /api/leaderboard`

Current implementation:

- Có `RankingTable` hiển thị top 5 + current team.
- Chưa có captain, last game, total time, full ranking table.

Recommended ranking rule:

- Primary: total score desc.
- Tie-breaker: completed stations desc.
- Tie-breaker tiếp theo: total elapsed time asc.

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
  -> CANCELLED
PLAYING
  -> WAITING_SCORE
  -> CANCELLED
WAITING_SCORE
  -> COMPLETED
COMPLETED
  -> REOPENED
REOPENED
  -> AVAILABLE
CANCELLED
  -> AVAILABLE hoặc REOPENED theo policy
```

### Action specifications

| Action | Actor | Precondition | Database update | UI response |
| --- | --- | --- | --- | --- |
| Check-in | Player/team | Station `AVAILABLE`, QR hợp lệ, team không chơi trạm khác | set `checked_in_at`, status `CHECKED_IN`/`PLAYING`, increment attempt if needed | Detail/map chuyển sang đang chơi |
| Check-out | Player/team | Status `PLAYING`, QR end hợp lệ | set `checked_out_at`, status `WAITING_SCORE` | Mở popup nhập điểm |
| Cancel | Player/team | Status `CHECKED_IN` hoặc `PLAYING` | set status `CANCELLED`, `cancelled_at`, reason optional | Quay về map, trạm theo policy |
| Submit score | Player/team hoặc Station Manager | Status `WAITING_SCORE`, score hợp lệ | insert `score_events`, update progress score/status `COMPLETED`, update team total | Hiện completed và cập nhật leaderboard |
| Edit score | Admin | Progress exists | insert adjustment `score_events`, recompute team total | Admin thấy điểm mới và log |
| Reopen station | Admin | Progress `COMPLETED`/`CANCELLED`/error state | set `reopened_at`, status `REOPENED` hoặc create new attempt | Team có thể chơi lại |

### Timer recommendation

Khuyến nghị hybrid:

- Client hiển thị elapsed time/countdown để UI mượt.
- Server là nguồn sự thật cho `started_at`, `checked_in_at`, `checked_out_at`, `completed_at`.
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

### Admin functions

| Function | Data | Action | Audit |
| --- | --- | --- | --- |
| View teams | team, score, rank, status | search/filter/sort | no mutation log needed |
| View progress | progress by team/station | inspect detail | no mutation log needed |
| Edit score | current score, max score, reason | set or adjust score | required |
| Reopen station | progress, reason | reopen attempt | required |
| Force status | progress status | admin override | required |
| View logs | activity log | filter/export | no mutation log needed |

### Operational risks

- Admin sửa điểm nhầm trong ngày sự kiện.
- Team scan sai QR hoặc scan nhiều lần.
- Mạng yếu tại địa điểm.
- Điện thoại từ chối camera permission.
- Timer client lệch giờ.
- Leaderboard cần refresh realtime hoặc gần realtime.

Mitigation:

- Mọi mutation admin phải có confirm modal và reason.
- Mọi score/status change phải ghi audit.
- QR API idempotent ở các case scan trùng.
- UI có retry/offline message rõ.

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
| started_at | event/team start |
| status | active/locked/finished |
| created_at, updated_at | audit timestamps |

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

### API contract summary

#### Auth

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | public | login admin/station manager |
| POST | `/api/auth/team-login` | public | login team by passcode |
| POST | `/api/auth/logout` | authenticated | clear session/token client-side |
| GET | `/api/auth/me` | authenticated | current user/team |

#### Player

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/player/me` | current team dashboard |
| GET | `/api/player/stations` | map stations with team progress |
| GET | `/api/player/progress` | progress summary |
| GET | `/api/player/activity-log` | team log |
| GET | `/api/leaderboard` | leaderboard |

#### QR flow

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/player/stations/:stationId/check-in` | validate QR and start attempt |
| POST | `/api/player/stations/:stationId/check-out` | validate QR and finish gameplay |
| POST | `/api/player/stations/:stationId/cancel` | cancel current attempt |
| POST | `/api/player/stations/:stationId/score` | submit score after checkout |

#### Admin

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/admin/dashboard` | overview |
| GET | `/api/admin/teams` | list teams |
| GET | `/api/admin/teams/:teamId/progress` | team progress |
| PATCH | `/api/admin/progress/:progressId/score` | edit score |
| POST | `/api/admin/progress/:progressId/reopen` | reopen station attempt |
| PATCH | `/api/admin/progress/:progressId/status` | force status |
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
  | 'WAITING_SCORE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REOPENED';

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
  startedAt: string | null;
  status: TeamStatus;
  rank?: number;
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
  totalElapsedSeconds?: number;
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
4. Add PostgreSQL schema and seed data.
5. Implement player dashboard/map/progress API integration.
6. Implement QR check-in/check-out/cancel/score flow.
7. Implement leaderboard and logs.
8. Implement admin dashboard, score edit, reopen.
9. Refactor UI toward mobile HUD reference.
10. Add tests and event-day operational checks.

