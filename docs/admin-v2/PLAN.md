# Admin V2 Architecture and Implementation Plan

## 1. Executive Summary

### Kết luận

- Admin V2 được xây dựng song song với Admin V1, không thay thế, redirect, rename, refactor hoặc sửa presentation/behavior của V1.
- Source boundary đề xuất: `fe/src/features/admin-v2/`.
- URL namespace đề xuất: `/admin-v2/*`, với `/admin-v2` redirect nội bộ sang `/admin-v2/dashboard`.
- Admin V2 tiếp tục chạy trong frontend React/Vite hiện tại và reuse Backend, auth/session, API client, domain API, Zustand store, i18next, Ant Design, icon library, QR helpers, map assets và Business Rules hiện hữu.
- V2 có shell, route tree, page/component/style/localization riêng. Chỉ shared router được sửa ở Phase 1 để lazy-mount V2.
- Kế hoạch gồm 16 phase độc lập, mỗi phase phải chạy V1 non-regression checks. Cutover, redirect từ V1, feature flag mặc định sang V2, deploy và deprecate V1 đều ngoài scope.

### Phân loại task

`New Feature` ở mức architecture/documentation planning. Task này không thay đổi Business Rule và không triển khai Source Code.

### Các quyết định kiến trúc đã chốt cho kế hoạch

1. Không tạo frontend application/package thứ hai; dùng cùng `fe/`, `MovementProviders`, `BrowserRouter`, session lifecycle và API origin.
2. Không đặt V2 dưới `fe/src/features/movement/pages`; tạo sibling feature `fe/src/features/admin-v2` để boundary rõ ràng.
3. Main router chỉ khai báo một lazy route `/admin-v2/*`; toàn bộ child route nằm trong V2 feature.
4. Dùng `ProtectedRoute allow={["admin"]} fullscreen` để reuse authorization nhưng không render V1 `AppFrame`.
5. V2 không import V1 page, V1 layout, V1 stylesheet hoặc V1 form component. V2 chỉ import các module đã được phân loại là shared/trusted infrastructure.
6. Dữ liệu Dashboard là composition của API thật; không có mock metric hoặc placeholder operational value.
7. Route-backed editor dùng panel rộng `480–560px` trên desktop và full-screen sheet trên mobile; URL vẫn deep-linkable và browser Back đóng panel đúng ngữ cảnh.
8. Map V2 giữ percent coordinates `0..100` và API `PATCH /api/admin/stations/:stationId`; không thay đổi coordinate semantics, schema hoặc seed.

## 2. V1 Architecture

### Frontend stack có bằng chứng trong repository

| Area | Current implementation |
| --- | --- |
| Framework | React `19.2.7`, TypeScript `~6.0.2`, Vite `8.1.1` |
| Router | `react-router-dom 7.18.1`, một `BrowserRouter`, flat `Routes` trong `movement/routes.tsx`, lazy route helper riêng |
| State | Zustand `5.0.14`, store tập trung trong `movement/store.ts` |
| API | Typed wrapper functions trong `movement/api.ts`; shared fetch/retry/error/session client trong `movement/apiClient.ts`; same-origin `/api` mặc định |
| Authentication | Access token/session trong Zustand/local storage; `getMe` validation; Backend-authoritative `expiresAt`; `ProtectedRoute` role guard |
| Admin authorization | Frontend `allow={["admin"]}` hỗ trợ UX; Backend `JwtAuthGuard` + `RolesGuard` + `UserRole.ADMIN` là authority |
| Localization | `i18next` + `react-i18next`; VI mặc định, EN; persisted language; Ant Design locale đồng bộ |
| UI/design system | Ant Design `6.5.0`, `@ant-design/icons 6.3.2`, global movement CSS tokens và page-local CSS/SCSS |
| Map | Konva `10.3.0`, `react-konva 19.2.5`, shared WebP map variants, persisted percent coordinates |
| QR | `qrcode` để render Admin QR; secure Backend token lifecycle; `jsqr`/camera logic dành Player scanner |
| Unit/component tests | Vitest `4.1.10`, jsdom, Testing Library |
| Backend tests | Jest `29` |
| E2E | Không có tracked Playwright/Cypress config hoặc npm E2E script |
| BrowserStack | Không có tracked BrowserStack config/command; chỉ có historical/ad-hoc evidence trong analysis và `.tester-logs` |
| Responsive evidence | Existing CSS chủ yếu dùng `720`, `560`, `480`, `360px`; một số feature dùng `768px`; V2 sẽ chuẩn hóa breakpoints route-local |

### Runtime/data flow hiện tại

```text
MovementProviders
  -> BrowserRouter + global i18n/Ant Design/session expiry
  -> App
     -> getMe/session synchronization/useMovementBootstrap
     -> MovementRoutes
        -> ProtectedRoute
           -> AppFrame (trừ fullscreen route)
              -> V1 pages

Admin API -> fetchAdminDatabase -> Zustand store -> V1 Team/Station pages
Operations APIs -> AdminOperationsPage local state
Leaderboard API -> LeaderboardPage local polling state
```

### V1 shell limitation liên quan V2

`AppFrame` giới hạn content ở `760px` và dùng fixed bottom navigation cho Admin cả desktop. V2 không thể đạt desktop sidebar/workspace bằng cách style lại `AppFrame`; vì vậy V2 phải bypass V1 frame và render `AdminV2Shell` riêng.

## 3. V1 Route Inventory

Các route dưới đây là inventory để bảo vệ và reuse infrastructure; không route nào được sửa behavior hoặc redirect sang V2.

| URL | Page / child components | Data/hooks/APIs | Mutations và Business Rules liên quan |
| --- | --- | --- | --- |
| `/login` | `LoginPage` | auth API, Zustand session, i18n | Admin username/password; Team password/Legacy QR entry; Backend session authority |
| `/qr-login` | `QrLoginPage` | `loginWithQrToken`, URL cleanup, auth store | Public Automatic URL Team QR Login; opaque reusable token; one active Team session |
| `/teams` | `TeamListPage` | Zustand Teams từ `fetchAdminDatabase`; Team theme helper | Admin-only; chọn Team rồi đi tới Team Station progress; không mutation |
| `/teams/:teamId/stations` | `StationListPage` ở Admin mode | store, `compareTeamStations`; V1 shared Team/Player page | Admin xem progress theo Team; `View & Edit` mở detail; không Player QR action ở Admin mode |
| `/teams/:teamId/stations/:stationId` | `StationDetailPage` ở Admin mode | store, `fetchAdminDatabase`, score/status APIs | Score correction chỉ khi `COMPLETED`, integer `0..effectiveMax`, bắt buộc reason; reopen/reset có audit |
| `/leaderboard` | `LeaderboardPage` | Admin dùng `GET /api/leaderboard`; visible/online polling | Shared route cho cả role; Backend rank order là authority; stale data được giữ khi refresh fail |
| `/admin/operations` | `AdminOperationsPage` + `Tabs` + generic `OperationList` | dashboard, score queue, event config, activity logs, final config/submissions, export APIs | Update Event Config/Final; export Team Results; Score Queue hiện read-only; raw record fields được render generic |
| `/system-config` | `SystemConfigPage` + `StationsMapPanel editable` | progress matrix/store, QR status/tokens, qrcode, localization helpers | Team/Station list, delete/deactivate, tracking mode edit, QR preview, map position edit nằm chung trong Settings |
| `/system-config/stations/new` | `StationEditorPage` Drawer | create Station, store refresh | VI/EN required name, tracking mode, game type, max score, media, ordered HTTPS gallery; Backend tự provision QR pair atomically |
| `/system-config/stations/:stationId` | `StationEditorPage` Drawer | update Station, QR token list/cache | Update bilingual fields/game/media/map/QR replacement; Backend validation authoritative |
| `/system-config/teams/new` | `TeamEditorPage` Drawer | create Team, store refresh | name/username/password/color/captain; Backend tự provision Team QR |
| `/system-config/teams/:teamId` | `TeamEditorPage` Drawer | update Team, QR token list/cache | update identity/auth/color; optional replacement QR; Team context theme |

### Route không thuộc Admin V1 nhưng phải regression-test

- `/stations`, `/stations/map`, `/stations/:stationId`: Team V1 gameplay fallback.
- `/team/v2`: Team Gameplay V2.
- `/final`: Team Final Challenge V1 route.
- Wildcard fallback: Admin về `/teams`, Team về `/team/v2`, anonymous về `/login`.

## 4. V1 Feature Inventory

### Teams

- List lấy từ Admin progress matrix và hiển thị scoped Team Color theo từng card.
- Create/update/delete dùng Admin API; create tự provision Team QR Login.
- Fields đang hỗ trợ: id, name, username, captainName, password update, teamColor, total score, completed count, total play time.
- Team QR lifecycle có list/status/generate/rotate/revoke APIs; V1 chủ yếu preview active raw URL/token và cache browser fallback.
- Team QR là opaque, reusable khi active, non-expiring by time; rotate/revoke mới vô hiệu hóa credential. Không chứa username/password.

### Stations

- List/config lấy từ active Stations trong progress matrix.
- Create/update/deactivate, VI/EN fields, `SCORE|TIME|BOTH`, `ST|STANDARD`, max score, YouTube URL, ordered image URLs, mapX/mapY.
- Create Station provision atomically một `CHECK_IN` và một `CHECK_OUT` token.
- QR visible purpose code không phải authority; Backend database record quyết định Station và purpose.
- Gallery tối đa 10 unique HTTPS URLs, order-preserving; Backend không fetch external image.

### Station operations và scoring

- Backend states: `LOCKED`, `AVAILABLE`, `CHECKED_IN`, `PLAYING`, `COMPLETED`.
- Một Team chỉ có một active Station; switch có transaction rules; pending score chặn switch.
- `TIME` auto-complete theo rule hiện hành; `SCORE`/`BOTH` cần Team-device score submit sau Check-out.
- Admin correction chỉ cho completed progress, bắt buộc reason và preserve timestamps/status.
- Reopen/force status là audited exceptional operations.

### Event operations

- Dashboard API thật trả `teamCount`, active `stationCount`, total `completedCount`, `activePlayingCount`, `eventConfig`, `latestLogs`.
- Score Queue trả progress đã Check-out nhưng chưa completed, kèm Team/Station/Game.
- Event Config trả `eventEndTime`, `finalStartsAt`, `notifyBeforeMinutes`, `cancelCooldownMinutes`, `timezone`, `serverNow`, phase flags/countdown.
- `eventEndTime` đóng Station starts; `finalStartsAt` mở Final. UI chỉ advisory khi close time không bằng Final minus 5 minutes.

### Final Challenge

- Admin config fields hiện có: title, clueText, active state và keyword rotation qua `answer`; không expose raw configured answer.
- Không cho update sau khi Final đã mở.
- Submission list trả correctness, rank, points, timestamp, Team và challenge projection.
- Backend authoritative cho normalization, cooldown, unique rank và bonus.

### Leaderboard

Backend order:

1. `team.totalPoints` descending.
2. `team.totalPlaySeconds` ascending.
3. completed Station count descending.
4. correct Final submitted time ascending, null last.
5. numeric Team id ascending.

V2 chỉ trình bày response theo thứ tự Backend; không sort/re-rank phía client.

### Activity Logs

Backend fields: `id`, `actorType`, `actorId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`, optional `userId`.

Known action families gồm auth/session, Team CRUD/QR, Station CRUD/QR, Check-in/Check-out/cancel/switch, score submit/edit/reopen/status, Event Config, Final submit/config/start, report export. V2 sẽ map known actions sang câu VI/EN, resolve Team/Station names khi payload/store cho phép, và luôn có fallback an toàn cho unknown action.

## 5. V1 Boundary / Protected Files

### A. V1-only presentation: read-only cho toàn bộ V2 rollout

- `fe/src/features/movement/pages/*.tsx` và page CSS, bao gồm `TeamListPage`, `StationListPage`, `StationDetailPage`, `StationEditorPage`, `TeamEditorPage`, `SystemConfigPage`, `AdminOperationsPage`, `LeaderboardPage`.
- `fe/src/features/movement/layout/AppFrame.tsx`, `AppFrame.scss`, `FixedBottomNavigation.tsx`.
- Current `StationsMapPanel.tsx/.css` presentation và interaction.
- `fe/src/App.css` selectors phục vụ V1 shell/pages.

Không rename, move, import rồi extend UI, thay class hoặc thêm V2 override vào các file trên.

### B. Potentially reusable shared code

- `movement/adminData.ts`: useful normalization nhưng mang shape/store assumptions của V1; reuse qua wrapper.
- `movement/types.ts`: shared domain/view types; reuse các type phù hợp, không ép mọi V2 view model vào V1 types.
- `movement/utils.ts`, `eventTimeRecommendation.ts`, Team/Station QR caches, Team theme helpers.
- `movement/playerData.ts` map image loader/variant selector; chỉ reuse các pure asset helpers cần cho V2 map.

### C. Shared infrastructure đã dùng nhiều area

- `movement/apiClient.ts`, `movement/api.ts`.
- `movement/store.ts`, `useMovementBootstrap`, session identity/runtime session lifecycle.
- i18next instance và persisted language.
- `ProtectedRoute`, `lazyRoute`, `LazyRouteBoundary`.
- `MovementProviders`, `BrowserRouter`, Ant Design provider.
- Bundled fonts và map WebP assets.

### D. Backend/domain logic: reuse, không duplicate ở V2

- `be/src/modules/admin`, `auth`, `player`, `event-config`, `final`, `team-results`.
- Prisma schema/constraints, score transactions, session/token lifecycle, Event/Final timing, rank comparator, report generation, activity logging.

### Shared file được phép sửa có kiểm soát

Trong Phase 1 chỉ `fe/src/features/movement/routes.tsx` được sửa để lazy-mount `/admin-v2/*`. Đây là shared route registry, không phải V1 presentation. Mỗi phase sau phải ưu tiên tạo file trong `admin-v2`; bất kỳ đề xuất sửa shared module nào phải được review như một V1 regression risk trước khi thực hiện.

## 6. Reusable Infrastructure

| Dependency | Policy | Cách dùng trong V2 |
| --- | --- | --- |
| `apiClient.ts` | REUSE AS-IS | auth header, timeout, GET retry, safe errors, API base URL, download filename |
| Existing API functions/endpoints | REUSE AS-IS | Không tạo V2 Backend endpoints trùng chức năng |
| `ProtectedRoute` | REUSE AS-IS | `allow={["admin"]} fullscreen` để giữ guard và bỏ V1 shell |
| Session/store lifecycle | REUSE AS-IS | Login, logout, `getMe`, `expiresAt`, cross-tab sync |
| Zustand Admin data | REUSE AS-IS | Teams/Stations/progress baseline và post-mutation refresh |
| i18next instance | REUSE AS-IS | V2 đăng ký namespace/resource bundle riêng; không fork language state |
| Ant Design + icons | REUSE AS-IS | Component primitives, accessibility behavior; presentation qua V2 tokens |
| `qrcode` + QR token caches | REUSE AS-IS | QR preview/download và raw-token fallback; không log/analytics raw token |
| Running brand icon | REUSE AS-IS | `RunningPersonIcon`; không copy SVG |
| Dashboard/Operations API `Record<string, unknown>` | WRAP | V2 adapters tạo typed DTO/view models từ verified Backend shapes |
| `fetchAdminDatabase` | WRAP | V2 query/refresh hooks gọi shared function/store nhưng expose loading/error/refetch riêng |
| V1 QR editor assumptions | WRAP | V2 QR panels dùng same API lifecycle nhưng state/confirm/error UI riêng |
| Existing map image loader/variant selection | REUSE AS-IS | Preserve WebP/DPR/high-zoom behavior |
| Konva map transform/presentation | DUPLICATE TEMPORARILY | Tạo V2 map workspace riêng vì current component gắn chặt V1 drawer/click-confirm UX; chỉ duplicate pure UI transform, không duplicate domain/API rules |
| Neutral map engine | EXTRACT LATER | Chỉ sau V2 parity + V1 regression; extraction là task riêng, không nằm trong initial V2 phases |
| Operation/activity response types | EXTRACT LATER | Có thể chuyển thành shared DTO khi cả V1/V2 cần; ban đầu giữ typed V2 adapter để không sửa V1 |

Temporary duplication không được bao gồm score calculation, auth, QR validation, Event/Final rules hoặc leaderboard ranking.

## 7. Admin V2 Architecture

### Proposed source tree

```text
fe/src/features/admin-v2/
  AdminV2Entry.tsx
  routes/
    AdminV2Routes.tsx
    adminV2RouteConfig.tsx
  layout/
    AdminV2Shell.tsx
    AdminV2Sidebar.tsx
    AdminV2Header.tsx
    AdminV2MobileNav.tsx
  components/
    feedback/
    data-display/
    forms/
    navigation/
  pages/
    dashboard/
    teams/
    stations/
    leaderboard/
    operations/
    settings/
  data/
    adminV2Api.ts
    adminV2Queries.ts
    adminV2Adapters.ts
  hooks/
  map/
  i18n/
    resources.ts
  styles/
    fonts.css
    tokens.css
    admin-v2.css
  types/
    adminV2.ts
  test/
```

Folder chỉ được tạo dần theo phase; không scaffold file rỗng không dùng.

### Data flow

```text
AdminV2 page
  -> V2 query/mutation hook
     -> V2 adapter (presentation shaping only)
        -> existing movement/api.ts function
           -> shared apiClient.ts
              -> existing Backend API/domain transactions

Successful mutation
  -> invalidate/refetch local query
  -> refresh shared Admin database only when V1-compatible store consumers need it
```

### State policy

- Session, language và shared Admin baseline data tiếp tục dùng existing Zustand/i18next.
- Page fetch state, filters, pagination, selected rows, editor dirty state và map placement draft ở local/V2 hooks; không thêm global store khi không cần.
- Không cache raw QR token vào new global state. Dùng existing protected browser cache helper khi Backend không trả raw value; clear/replace theo lifecycle hiện hành.
- Không optimistic-update score, Event Config, Final config, QR rotation/revoke hoặc destructive CRUD. Chờ Backend success rồi refetch.

### Error/loading policy

- Mọi page có loading skeleton/spinner, actionable empty state, localized safe error và Retry.
- Auth failure dùng shared client/session cleanup.
- Refresh failure giữ last-known data và đánh dấu stale khi an toàn.
- Mutation error không đóng editor, không clear user input; raw Backend stack/HTML/token không được render.

## 8. Admin V2 Information Architecture

### Top-level navigation

1. Dashboard
2. Teams
3. Stations
4. Leaderboard
5. Operations
6. Settings

### Secondary navigation

- Teams: List -> Detail -> Edit / QR.
- Stations: List / Map -> Detail -> Edit / QR.
- Operations: Overview / Score Queue / Event Control / Final Challenge / Activity Logs.
- Settings chỉ chứa V2 UI/preferences/diagnostic information được support. Không chứa Team List, Station List hoặc Station Map.

### Shell behavior

- Desktop `>=1200px`: fixed/collapsible left sidebar, top header, fluid main content; no bottom nav.
- Tablet `768–1199px`: navigation rail/collapsible drawer, top header, full workspace.
- Mobile `<768px`: compact header + bottom/overflow navigation; secondary Operations navigation dùng horizontal scroll-safe segmented list hoặc drawer, không dùng overflowing V1 Tabs.
- Main content target max width theo page: management table có thể rộng toàn workspace; forms/read pages dùng readable content width.
- Header hiển thị page title/breadcrumb, Event phase summary khi có, language control và Admin logout.

## 9. Proposed V2 Routes

| Route | Purpose |
| --- | --- |
| `/admin-v2` | Redirect nội bộ sang `/admin-v2/dashboard` |
| `/admin-v2/dashboard` | Event operations dashboard |
| `/admin-v2/teams` | Dense Team list |
| `/admin-v2/teams/new` | Route-backed create editor |
| `/admin-v2/teams/:teamId` | Team detail, progress summary, actions |
| `/admin-v2/teams/:teamId/edit` | Route-backed edit panel |
| `/admin-v2/teams/:teamId/qr` | Team QR lifecycle/preview workspace |
| `/admin-v2/stations` | Station list |
| `/admin-v2/stations/new` | Route-backed create editor |
| `/admin-v2/stations/map` | Station selector + large map workspace |
| `/admin-v2/stations/:stationId` | Station detail and cross-Team operational summary supported by current data |
| `/admin-v2/stations/:stationId/edit` | Route-backed edit panel |
| `/admin-v2/stations/:stationId/qr` | Check-in/Check-out QR lifecycle workspace |
| `/admin-v2/leaderboard` | Admin leaderboard |
| `/admin-v2/operations` | Redirect sang Overview |
| `/admin-v2/operations/overview` | Operations summary |
| `/admin-v2/operations/score-queue` | Pending score queue and supported completion/correction actions |
| `/admin-v2/operations/event-control` | Event timing/control form |
| `/admin-v2/operations/final` | Final config + submissions |
| `/admin-v2/operations/activity` | Human-readable activity log |
| `/admin-v2/settings` | V2 preferences/diagnostics only |

Unknown `/admin-v2/*` route phải render V2-owned 404 với action về Dashboard. Không fall through sang V1 `RoleAwareFallback`.

## 10. V2 Component Strategy

### Shared V2 primitives

- `PageHeader`: title, breadcrumb, primary action, status/last-updated slot.
- `DataTable`: dense desktop table, responsive row/card fallback, sorting/filter state; không client-rank leaderboard.
- `MetricCard`: compact metric, semantic status, optional link; no decorative giant card.
- `AttentionList`: priority, entity link, reason, next action.
- `AsyncState`: loading/error/empty/stale patterns.
- `RoutePanel`: `480–560px` desktop editor, mobile full-screen, sticky Cancel/Save, dirty-close confirmation.
- `DestructiveAction`: typed confirmation, loading lock, safe error.
- `QrCredentialPanel`: status, timestamps, usage, Preview/Download/Rotate/Revoke; raw token never logged.
- `OperationSubnav`: responsive secondary nav based on routes.
- `TechnicalDetails`: expandable raw metadata/IDs for Activity Logs.

### Team UX

- List dùng columns: Team, captain, username, score, completed Stations, total time, QR status, actions.
- Team color chỉ là swatch/left accent/focus accent; không tint cả row/page.
- Detail dùng overview + Station progress table + auth/QR status; không giả lập login action.
- Edit sections: Basic Information, Authentication, Appearance, Advanced. Score/progress computed fields read-only.

### Station UX

- List dùng columns: Station, bilingual display indicator, tracking mode, game type, max score, QR pair status, map placement, actions.
- Detail tách configuration, gameplay/media, map coordinates, QR status và Team progress summary có trong progress matrix.
- Edit sections: Basic Information, Gameplay, Media, Map, QR / Advanced.

### Activity Log humanization

- Formatter registry keyed by `action` tạo localized title/description cho known actions.
- Entity resolver dùng `entityType/entityId`, Team/Station data và metadata; thiếu name thì fallback ID.
- Actor display: `Admin`, Team name/id, hoặc `System`; không suy đoán username nếu API không trả.
- Unknown action vẫn hiển thị sanitized action label + entity + time; raw metadata chỉ trong expandable Technical Details.

### Map workflow

1. Chọn Station từ searchable list/selector.
2. Chọn `Place/Edit position` để vào explicit placement mode.
3. Click/tap map tạo draft marker; draft không gọi API.
4. Hiển thị preview `X/Y` percent đã clamp/validate `0..100`.
5. Save gọi existing Station update API; Cancel bỏ draft.
6. Success refetch; failure giữ draft để retry.

Pan/zoom bị tách khỏi placement mode để click kéo map không vô tình lưu coordinate.

## 11. Shared Code Strategy

### Rules

- Import từ `movement` chỉ qua danh sách allowlisted shared modules trong section 6.
- Không import từ `movement/pages`, V1 `layout/AppFrame`, V1 CSS, hoặc `StationsMapPanel` vào V2.
- V2 adapter chỉ format/compose data; Backend vẫn sở hữu validation, authorization, lifecycle, score/rank/time.
- Khi API hiện typed là `Record<string, unknown>`, V2 tạo exact types theo Backend source đã audit và runtime guards tối thiểu cho array/object fields.
- Không sửa shared function chỉ để đổi naming/presentation cho V2.

### API composition cho Dashboard

| UI value | Existing source |
| --- | --- |
| Teams | `GET /api/admin/dashboard.teamCount` |
| Stations | `stationCount` |
| Active Teams | `activePlayingCount` (một active Station/Team invariant) |
| Completed Station attempts | `completedCount` |
| Pending Scores | `GET /api/admin/score-queue`, array length |
| Final Submissions | `GET /api/admin/final/submissions`, array length |
| Event Status | `dashboard.eventConfig` |
| Recent Activity | `dashboard.latestLogs` hoặc activity log endpoint |

`Completed Station attempts` phải được ghi đúng nghĩa; không label thành số unique Stations.

### API gaps không được che bằng client logic

- Backend không có pagination/filter query cho Activity Logs hoặc lists; V2 initial phase dùng current bounded response và client filters nhỏ. Nếu dữ liệu thực tế vượt ngưỡng usability, tạo future Backend pagination task thay vì tải vô hạn.
- Dashboard không có single endpoint cho pending/final count; V2 compose read-only requests. Có thể đề xuất aggregated endpoint sau khi đo latency, không thuộc initial plan.
- Activity Logs không join display names; V2 resolve từ available data, fallback ID.
- Không có dedicated standalone Station details endpoint trong current frontend contract; V2 dùng progress matrix + QR APIs. Không invent fields.

## 12. Design System

### Direction và tokens

- Professional event operations dashboard.
- Navigation: dark navy `#14213D` family.
- Brand accent: MOVEMENT coral/orange, dùng cho primary brand/action emphasis.
- Surfaces: white/off-white; borders rõ; shadow chỉ khi cần phân lớp.
- Semantic: blue info/action, green success, amber warning, red destructive/error.
- Spacing base: `8px`; common gaps `8/16/24/32`.
- Radius: `8–12px` standard; tránh pill/card bo tròn quá mức.
- Touch target minimum `44x44px`; keyboard focus visible.
- Dense tables desktop; card transformation mobile chỉ khi table không còn đọc được.

### Typography

- Admin V2 localized/dynamic UI dùng bundled `Space Grotesk` Vietnamese + Latin với fallback `"Space Grotesk", Aptos, "Segoe UI", sans-serif`.
- Reuse `fe/src/assets/fonts/space-grotesk-vietnamese.woff2` và `space-grotesk-latin.woff2` bằng route-local `@font-face`.
- Không dùng runtime Google Fonts.
- Không dùng Oxanium cho localized/dynamic Admin copy. Nếu dùng brand-only ASCII treatment thì phải scope rõ, nhưng default là không cần Oxanium.

### Responsive breakpoints

- Mobile: `<768px`.
- Tablet/rail: `768–1199px`.
- Desktop/sidebar: `>=1200px`.
- Small-mobile safety checks: `360px` và `390px`.
- Required visual matrices: `390x844`, `844x390`, `1024x768`, `1440x900`.

### Accessibility/i18n

- VI/EN parity cho visible copy, validation, toast, empty/error/loading, tooltip, `aria-label`.
- Dynamic IDs, username, token, enum, URL không dịch.
- Station EN field fallback per field về canonical VI.
- Color không là tín hiệu duy nhất; status có text/icon.
- Reduced motion cho map/animated status; logical tab/focus order; Escape/Back behavior cho route panel.

## 13. Implementation Phases

### Phase 1 — Route namespace, shell và V2 foundation

- Objective: mount isolated `/admin-v2/*`, render responsive shell, route-local tokens/fonts/i18n và V2 404/placeholder without operational fake data.
- Scope/files: tạo `admin-v2` entry/routes/layout/styles/i18n/foundation tests; sửa duy nhất shared `movement/routes.tsx`.
- APIs reused: auth/session only (`ProtectedRoute`, logout through shared API/store); không fetch operational metrics.
- V1 dependencies: shared router/guard/session/provider/brand icon only.
- Risks: accidentally nesting V1 `AppFrame`, wildcard swallowing V1 routes, CSS leakage, language/session divergence.
- Tests: route authorization, redirect, active nav, deep-link/refresh, mobile/desktop shell, CSS namespace, V1 route snapshot/smoke.
- Acceptance: V1 URLs unchanged; `/admin-v2/dashboard` admin-only; Team/anonymous behavior safe; desktop sidebar and mobile nav work; no mock metric.

### Phase 2 — Dashboard

- Objective: answer “what is happening, what needs attention, what next” from existing APIs.
- Scope/files: dashboard page, dashboard adapter/query, metric/event status/attention/activity components and tests.
- APIs reused: dashboard, score queue, final submissions; entity/progress data for links when needed.
- V1 dependencies: `api.ts`, `apiClient`, store read-only selectors.
- Risks: labeling `completedCount` incorrectly; partial API failure; stale operational view.
- Tests: full/partial/error/empty responses, Event phases, pending/final counts, retry/stale state, metric links.
- Acceptance: Event Status, Needs Attention, Quick Actions, Event Progress, Recent Activity, Active Stations only show supported values; each action routes to owning module.

### Phase 3 — Teams List

- Objective: dense, searchable Team management list.
- Scope/files: Team list page/table/filter/query/row action tests.
- APIs reused: progress matrix/store, QR status summary.
- V1 dependencies: `fetchAdminDatabase`, Team localization/color helpers via wrappers.
- Risks: client sort conflicting with Backend ranking; Team color leakage; stale QR status.
- Tests: VI/EN names, long names, empty list, search, QR status, color accent isolation, keyboard row actions.
- Acceptance: list shows supported Team operational fields; no giant color cards; Add/View/Edit/QR actions route correctly.

### Phase 4 — Team Detail, Edit và QR

- Objective: complete Team management without V1 drawer UX.
- Scope/files: detail page, route panels, forms, QR credential workspace, mutation hooks/tests.
- APIs reused: create/update/delete Team, QR list/generate/rotate/revoke, progress matrix refresh.
- V1 dependencies: domain validation types, QR URL/cache helpers, API safe errors.
- Risks: raw token exposure, accidental rotate on ordinary edit, destructive delete, password semantics.
- Tests: create auto-provision QR, update omit password/token, color normalize/clear, rotate/revoke lifecycle, no raw token logs, dirty close, backend error retention.
- Acceptance: 480–560px sticky-action editor desktop/full-screen mobile; Team QR status/usage/timestamps/actions; computed score/progress read-only.

### Phase 5 — Stations List

- Objective: move Station management out of Settings into first-class module.
- Scope/files: Station list/table/filter/status/QR summary components and tests.
- APIs reused: progress matrix, QR status summary.
- V1 dependencies: Station localization/order/display helpers via V2 adapter.
- Risks: showing inactive/deleted Stations not present in current API; language fallback; QR pair status ambiguity.
- Tests: VI/EN per-field fallback, natural ID order, modes/types, missing/partial QR pair, empty/error/loading.
- Acceptance: list shows config, gameplay type, score, QR pair and map placement; Add/View/Edit/QR/Map routes work.

### Phase 6 — Station Detail, Edit và QR

- Objective: full Station CRUD/config/QR lifecycle in structured V2 workspace.
- Scope/files: detail, route editor, media list editor, QR pair panels, mutation tests.
- APIs reused: create/update/deactivate Station, QR list/generate/rotate/revoke, progress matrix.
- V1 dependencies: constants and API types; QR cache helper; no V1 editor component.
- Risks: create transaction QR provisioning, `TIME` max rule display, duplicate/invalid gallery URLs, replacing one QR purpose unintentionally.
- Tests: required VI/EN names, optional descriptions, tracking/game/media validation, max 10 unique HTTPS images/order, omit/preserve/clear, QR pair independent lifecycle, deactivate confirmation.
- Acceptance: sections Basic/Gameplay/Media/Map/QR; sticky Save/Cancel; Backend errors preserved; create displays both newly provisioned QR artifacts securely.

### Phase 7 — Leaderboard

- Objective: dense Admin leaderboard preserving Backend order.
- Scope/files: leaderboard page/table, polling/stale state, tests.
- APIs reused: `GET /api/leaderboard`.
- V1 dependencies: shared visible/online polling may be reused as-is; localized Team name helper.
- Risks: client re-ranking, unstable refresh, incorrect tie-break explanation.
- Tests: order/rank preserved, stale-data warning, retry, zero/large rows, responsive table.
- Acceptance: score/completed/time/rank display matches response; no client comparator changes; link Team rows to V2 detail.

### Phase 8 — Operations shell và Overview

- Objective: replace overflowing tabs with route-based Operations navigation and overview.
- Scope/files: operations layout/subnav/overview/query components and tests.
- APIs reused: dashboard, score queue, event config, final submissions, activity logs.
- V1 dependencies: V2 adapters over existing API functions.
- Risks: duplicate Dashboard content, secondary-nav overflow, too many simultaneous requests.
- Tests: route active state, mobile subnav, partial failures, refresh coordination.
- Acceptance: Overview summarizes module state and routes to specialized pages; no edit form duplicated here.

### Phase 9 — Score Queue

- Objective: actionable pending-score management using existing progress APIs.
- Scope/files: queue table/detail action, score form, refresh/mutation tests.
- APIs reused: score queue, submit Admin progress score and completed-score correction where applicable.
- V1 dependencies: effective max score/data types; Backend authority.
- Risks: current V1 queue is read-only; wrong mutation selection; duplicate submit; missing reason policy difference between initial submit and correction.
- Tests: oldest-first order, `0..max` integer, duplicate click lock, submit success/refetch, correction requires reason, stale progress error.
- Acceptance: pending row exposes Team/Station/check-out/mode/max; supported score action completes exactly once; no invented workflow.

### Phase 10 — Event Control

- Objective: safe Event timing/config workspace.
- Scope/files: typed Event Config adapter/form, phase preview, advisory recommendation and tests.
- APIs reused: get/update Event Config; `eventTimeRecommendation` pure helper.
- V1 dependencies: current Business Rules and shared safe error handling.
- Risks: confusing `eventEndTime` with Final open, timezone validation, client clock drift.
- Tests: HH:mm, notify/cooldown bounds, timezone reject, serverNow/countdown, Final-minus-5 advisory, save alternative allowed.
- Acceptance: labels state exact semantics; recommendation is copy-ready/advisory; Backend response refreshes phase; no hard-coded event time.

### Phase 11 — Final Challenge

- Objective: manage Final config and inspect submissions.
- Scope/files: Final config form, secret rotation input, submissions table, tests.
- APIs reused: final config get/update, final submissions.
- V1 dependencies: shared API; no Player Final component reuse.
- Risks: exposing/storing keyword, update after Final open, client re-rank.
- Tests: omit blank answer preserves current keyword, nonblank rotates, currentKeyword read-only, post-open error, submissions order/correctness/bonus.
- Acceptance: title/clue/active/keyword rotation supported; raw answer never redisplayed/logged; submissions use Backend rank/order.

### Phase 12 — Activity Logs

- Objective: human-readable operational history with optional technical details.
- Scope/files: formatter registry, entity resolver, filters/timeline/table, tests.
- APIs reused: activity logs plus existing Team/Station baseline data.
- V1 dependencies: i18n/store only.
- Risks: unknown action/metadata shapes, sensitive values in metadata, large result set.
- Tests: each known action family, unknown fallback, TEAM/USER/SYSTEM actor, missing entity, metadata sanitization, VI/EN, expandable raw details.
- Acceptance: primary line is human-readable; raw DB-style key/value is not primary UI; secrets are redacted/omitted.

### Phase 13 — Station Map

- Objective: V2 Stations > Map workspace with explicit draft/save/cancel placement.
- Scope/files: V2 Konva map engine/workspace, selector, placement state, map tests.
- APIs reused: progress matrix/store, update Station, map image loaders/WebP assets.
- V1 dependencies: coordinate semantics/assets only; `StationsMapPanel` remains untouched.
- Risks: transform drift, click vs pan ambiguity, accidental coordinate mutation, large canvas performance.
- Tests: percent/world/screen conversion, clamp `0..100`, pan/zoom focal behavior, draft cancel, save/refetch/failure, reduced motion, viewports.
- Acceptance: selector + large map; explicit edit mode; preview coordinate; Save/Cancel; persisted coordinate matches current V1 map semantics.

### Phase 14 — Settings

- Objective: limited Admin V2 settings/preferences page.
- Scope/files: Settings page with language/navigation density preferences and build/API diagnostics already available; tests.
- APIs reused: no Team/Station management API.
- V1 dependencies: i18next and build timestamp.
- Risks: turning Settings back into a miscellaneous management page; inventing unsupported server config.
- Tests: language persistence, preference persistence/reset, no management links masquerading as settings.
- Acceptance: no Team List, Station List hoặc Map; operational settings stay in Operations/Event Control.

### Phase 15 — Responsive, accessibility và i18n hardening

- Objective: cross-module quality pass after functional pages exist.
- Scope/files: route-local styles/resources/tests only; targeted fixes by module.
- APIs reused: none new.
- V1 dependencies: shared language state and bundled fonts.
- Risks: CSS leakage, untranslated copy, focus traps, table overflow, Vietnamese font fallback.
- Tests: i18n parity, keyboard/focus, screen-reader labels, contrast, reduced motion, `390x844`, `844x390`, `1024x768`, `1440x900`, bundled font load.
- Acceptance: all actions >=44px where touch applies; VI diacritics render Space Grotesk; no runtime font request; no horizontal page overflow.

### Phase 16 — Full regression and release-readiness review

- Objective: prove V2 independently and V1 fallback integrity; no cutover.
- Scope/files: tests/docs only as required; resolve in-scope regressions; produce comparison report.
- APIs reused: full existing surface.
- V1 dependencies: all protected paths are verification targets, not edit targets.
- Risks: cross-route auth/store/CSS regression, Backend mutation side effects, missing real-device coverage.
- Tests: full Frontend/Backend gates, tester smoke, Admin V1/V2 manual matrix, Team V1/V2, QR/scoring/Event/Final/map/language.
- Acceptance: V1 remains operational; V2 route namespace is independently usable; outstanding BrowserStack/physical/Production checks are explicitly recorded; no redirect/cutover/deploy.

## 14. V1 Non-Regression Checklist

Mỗi phase phải kiểm tra targeted items; Phase 16 chạy toàn bộ.

- [ ] `/login`: Admin login, Team login, safe auth error, logout.
- [ ] `/qr-login`: valid/invalid/revoked Team QR, redirect, session replacement.
- [ ] V1 `/teams`, Team selection và Team-context theme.
- [ ] V1 `/teams/:teamId/stations` và detail score correction/reset.
- [ ] V1 `/system-config`: Team/Station lists, QR preview, tracking edit, map.
- [ ] V1 editors create/update/delete/deactivate paths.
- [ ] V1 `/admin/operations`: Dashboard, Queue, Event, Final, Logs, export.
- [ ] Shared `/leaderboard` Admin/Team behavior.
- [ ] Team V1 `/stations`, `/stations/map`, detail, QR, scoring, cancel.
- [ ] Team `/team/v2` load/navigation.
- [ ] Event timing, `eventEndTime`, `finalStartsAt`, notification/timezone.
- [ ] Final config/submission/rank/bonus remains Backend-authoritative.
- [ ] Map coordinate persistence and asset loading.
- [ ] VI/EN switch, Station field fallback, accessible labels.
- [ ] No V2 stylesheet selector affects elements outside `.admin-v2-root`.
- [ ] Unknown V1 routes still use current role-aware fallback.
- [ ] No V1 route redirects to `/admin-v2`.

## 15. Testing Strategy

### Commands discovered from tracked manifests

Frontend, từ `fe/`:

```powershell
npm run test
npm run lint
npm run i18n:check
npm run font:check
npm run build
```

`npm run build` là typecheck command thực tế vì chạy `tsc -b` trước Vite build và bundle budget. Repository không có script `typecheck` riêng.

Targeted Vitest:

```powershell
npm run test -- src/features/admin-v2/<target>.test.tsx
```

Backend, từ `be/` khi phase có mutation/business-flow exposure:

```powershell
npm run test
npm run lint
npm run build
```

Repository integration smoke, từ root:

```powershell
npm.cmd run tester:smoke
```

Optional disposable production-like integration khi scope/risk yêu cầu và môi trường cho phép:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/production-like-smoke.ps1
```

Không chạy smoke mutation này trên Production hoặc non-disposable database.

### E2E và BrowserStack status

- Không phát hiện tracked Playwright/Cypress package/config/npm script; do đó không có exact supported E2E command để ghi nhận.
- Không phát hiện tracked BrowserStack config/command/credential contract; không được claim BrowserStack runnable từ repository.
- Historical `.tester-logs` scripts và analysis evidence là ad-hoc artifacts, không phải supported project command.
- Trước khi Phase 16 cần một task riêng để chuẩn hóa E2E bằng stack đã được project chấp thuận; task này không tự cài framework mới. Nếu chưa được phê duyệt, thực hiện manual browser matrix và ghi rõ unautomated.

### Test layers cho mỗi V2 phase

1. Pure adapter/formatter/unit tests.
2. Component interaction tests với Testing Library.
3. Route/auth/deep-link tests.
4. Frontend lint/typecheck/build/bundle.
5. Targeted Backend tests chỉ khi exposing mutation paths warrants it; không sửa Backend nếu contract đã đủ.
6. Manual responsive/admin flow smoke.
7. V1 targeted non-regression.

### Security-sensitive verification

- QR: active/missing/revoked/rotated purpose, inactive entity, raw-token redaction, duplicate clicks.
- Auth: anonymous, Team forbidden, Admin allowed, expired/revoked session, logout.
- Score: integer/min/max, duplicate/stale progress, reason requirement, safe errors.
- Event/Final: post-open restrictions, timezone/time validation, no client authority.
- Destructive CRUD: confirmation, in-flight lock, refetch, failure keeps context.

## 16. Risks

| Risk | Mitigation |
| --- | --- |
| Shared router change regresses V1 | Một lazy `/admin-v2/*` branch; route tests; no V1 route edits |
| CSS/theme leakage | `.admin-v2-root` scope, route-local tokens/fonts, no global Ant theme mutation |
| V2 duplicates domain logic | Adapters only; existing APIs/store; Backend remains authority |
| Weak `Record<string, unknown>` operations types | Verified V2 DTO adapters and tests; do not alter V1 API typing during initial rollout |
| Store coupling/stale data | Page-owned query status + explicit post-mutation refetch; store refresh only where needed |
| QR raw token exposure | Existing secure APIs/cache; no logs/analytics; sanitize technical details |
| Map transform drift | Golden conversion tests against `0..100` semantics; V1 map comparison; no schema/API change |
| Activity log unknown actions | Formatter fallback and expandable sanitized details |
| Current API lacks pagination | Bound initial UI to current response; create measured Backend follow-up instead of client invention |
| E2E/BrowserStack not reproducible | Record gap; manual matrix; separate approval before adding tooling |
| Existing React Router security advisories in backlog | Re-audit before implementation/release; dependency upgrade is a separate, regression-tested task |
| Production/manual verification gaps | Never equate local build with Production; keep cutover/deploy blocked |

## 17. Unknowns

Các unknown sau không block Phase 1 và không được tự giải quyết bằng invented behavior:

1. Activity Logs volume thực tế tại Event peak; current endpoint fixed at latest 100 and has no pagination/filter API.
2. Có cần Backend aggregated Dashboard endpoint sau khi đo latency của composed requests hay không.
3. Settings V2 có server-backed preferences nào ngoài language/UI density; hiện chưa có API, nên Phase 14 chỉ dùng supported client preferences/diagnostics.
4. Browser E2E runner chính thức và BrowserStack ownership/credentials; repository hiện không cung cấp reproducible config.
5. Physical-device performance target cho large Admin Station Map; cần đo sau Phase 13.
6. Cutover mechanism, default Admin landing route, V1 deprecation date và redirect policy; tất cả chờ explicit future approval.

### Documentation routing note

`FEATURE_INDEX.md` hiện chưa có Admin V2 Feature Analysis. Do direct task giới hạn output chỉ `docs/admin-v2/PLAN.md`, task này không sửa index hoặc tạo analysis file khác. Khi bắt đầu implementation, action đầu tiên phải đăng ký Admin V2 trong `FEATURE_INDEX.md` và reconcile plan path theo repository governance, nhưng chỉ khi user cho phép mở rộng khỏi “create only PLAN.md”.

## 18. Phase 1 Exact Implementation Scope

### Files to create

```text
fe/src/features/admin-v2/AdminV2Entry.tsx
fe/src/features/admin-v2/routes/AdminV2Routes.tsx
fe/src/features/admin-v2/routes/adminV2RouteConfig.tsx
fe/src/features/admin-v2/layout/AdminV2Shell.tsx
fe/src/features/admin-v2/layout/AdminV2Sidebar.tsx
fe/src/features/admin-v2/layout/AdminV2Header.tsx
fe/src/features/admin-v2/layout/AdminV2MobileNav.tsx
fe/src/features/admin-v2/pages/foundation/AdminV2FoundationPage.tsx
fe/src/features/admin-v2/pages/foundation/AdminV2NotFoundPage.tsx
fe/src/features/admin-v2/i18n/resources.ts
fe/src/features/admin-v2/styles/fonts.css
fe/src/features/admin-v2/styles/tokens.css
fe/src/features/admin-v2/styles/admin-v2.css
fe/src/features/admin-v2/AdminV2Entry.test.tsx
fe/src/features/admin-v2/layout/AdminV2Shell.test.tsx
```

`AdminV2FoundationPage` chỉ hiển thị page identity và trạng thái “foundation ready”; không render fake metrics. Nav destinations chưa triển khai dùng cùng explicit “planned module” state hoặc disabled navigation defined by route config; Phase 2–14 thay dần bằng page thật.

### File to modify

```text
fe/src/features/movement/routes.tsx
```

Exact change:

1. Lazy-import `AdminV2Entry` từ sibling feature.
2. Thêm route `/admin-v2/*` trước wildcard fallback.
3. Không đổi bất kỳ existing route path/element/fallback.

`AdminV2Entry` chịu trách nhiệm:

```text
ProtectedRoute allow=[admin] fullscreen
  -> register Admin V2 i18n namespace once
  -> AdminV2Shell
     -> AdminV2Routes content
```

### V1 files that must remain untouched in Phase 1

```text
fe/src/App.tsx
fe/src/App.css
fe/src/MovementProviders.tsx
fe/src/features/movement/layout/**
fe/src/features/movement/pages/**
fe/src/features/movement/components/**
fe/src/features/movement/store.ts
fe/src/features/movement/api.ts
fe/src/features/movement/apiClient.ts
fe/src/features/movement/i18n.ts
fe/src/features/movement/types.ts
fe/src/features/movement/adminData.ts
```

Không sửa Backend, Prisma, migration, seed, deploy config hoặc root redirect.

### Phase 1 route behavior

- Admin `/admin-v2` -> replace redirect `/admin-v2/dashboard`.
- Admin `/admin-v2/dashboard` -> V2 shell + foundation page.
- Admin known planned child routes -> V2 shell + explicit planned module state until owning phase.
- Admin unknown `/admin-v2/...` -> V2 404.
- Anonymous `/admin-v2/...` -> `/login` qua existing guard.
- Team `/admin-v2/...` -> localized forbidden result qua existing guard; không được vào shell.
- V1 URLs và wildcard behavior không đổi.

### Phase 1 acceptance tests

1. Lazy chunk: initial V1 route không eagerly include Admin V2 page modules.
2. Authorization: Admin allowed; Team denied; anonymous redirected.
3. Namespace: direct navigation/refresh dưới `/admin-v2/*` hoạt động với SPA fallback hiện có.
4. Navigation: active item đúng route; Operations secondary state không overflow.
5. Responsive: sidebar desktop, rail/drawer tablet, compact mobile navigation; no desktop bottom-nav primary pattern.
6. Typography: bundled Space Grotesk VI/Latin loads; representative `Quản lý đội, Trạm, Thử thách cuối cùng` render đúng; no Google Fonts request.
7. Accessibility: skip link, landmark labels, visible focus, keyboard navigation, targets >=44px.
8. Isolation: styles require `.admin-v2-root`; V1 computed layout at `/teams`, `/admin/operations`, `/system-config` unchanged.
9. Quality gates: targeted Vitest, full Frontend test/lint/i18n/font/build as applicable, `git diff --check`.
10. No cutover: no redirect from `/teams` or `/admin/operations`; no deploy/commit/push unless separately requested.

### Phase 1 definition of done

- `/admin-v2` exists as an isolated, admin-protected lazy namespace.
- `AdminV2Shell` meets desktop/tablet/mobile navigation requirements.
- No operational data is mocked.
- Only one shared Source Code file is modified and all listed V1 presentation files remain byte-for-byte untouched.
- Targeted V1 regression checks pass and failures/skips are reported.
- Phase 2 can implement Dashboard without changing shell boundary or V1 routes.

### Phase 1 implementation record — 2026-08-18

- Completed the isolated lazy `/admin-v2/*` namespace, admin guard, V2 shell,
  desktop sidebar/tablet rail/mobile navigation, planned-module placeholders,
  V2 404, scoped tokens/styles, and VI/EN resource bundle.
- Responsive navigation is width-based: the full `200px` icon-and-label sidebar
  applies at `>=1024px`, the icon rail at `769–1023px`, and an
  icon-only bottom navigation at `<=768px`. Compact rail and narrow
  bottom-navigation controls expose an Ant Design focus/hover tooltip without
  changing V1 styles or using orientation detection.
- On the narrow layout, inactive bottom-navigation text/icons use the semantic
  `--admin-v2-nav-inactive` token for readable navy-background contrast. No global
  anchor color reset is applied; sidebar link inheritance is scoped to the sidebar
  navigation component. Language controls
  remain visible, while a compact account popover exposes the Admin identity,
  build information, and the existing logout action without increasing header
  height or changing the `>=1024px` approved layout.
- Narrow navigation is one icon-only row with direct Dashboard, Teams, Stations,
  Leaderboard, Operations, and Settings links. Every item has a localized Ant
  Design Tooltip plus `aria-label`; the active route uses the coral treatment.
- The only shared Source Code change is the lazy `AdminV2Entry` route in
  `fe/src/features/movement/routes.tsx`; V1 presentation, Backend, API,
  database, migration, seed, and deployment files remain unchanged.
- Focused V2 tests, full Frontend Vitest, lint, i18n parity, font guard, and
  production build/bundle gate passed. Manual graphical-browser verification
  remains pending because the repository has no tracked E2E/browser runner in
  this execution environment.
- Foundation refactor standardized existing V2 feedback and navigation controls
  on Ant Design: `Tooltip`, `Button`, `Popover`, `Space`, `Typography`, `Alert`,
  and `Result`. Route-aware links and branding/responsive CSS remain custom only
  where React Router or the approved MOVEMENT shell layout requires them.

### Phase 2 implementation record — 2026-08-19

- Replaced only `/admin-v2/dashboard` with a real, read-only operations
  Dashboard. It composes the existing Dashboard, Score Queue, and Final
  Submissions APIs; no Backend, contract, schema, seed, Business Rule, or V1
  presentation source changed.
- Event Overview shows the authoritative Station Check-in close time, Final
  start time, timezone, and a state derived only from existing Event Config
  flags/countdown. Needs Attention contains only pending scores, the existing
  advisory that Station close should be five minutes before Final, and Final
  submissions when present.
- Key metrics preserve the Backend meaning of `completedCount` as completed
  Station attempts. Loading uses skeletons; real zero, empty, per-source error,
  and partial-response states are distinct. Last known successful data is kept
  on refresh failure.
- Recent Activity uses the existing bounded `dashboard.latestLogs` response and
  presents the newest five recognized actions with a safe localized fallback.
  Event Progress and an Active Stations list are intentionally omitted: current
  sources expose counts but not a reliable progress denominator or Station names.
- Added quick actions for Teams, Stations, Score Queue, Station Map, Event
  Control, and Final Challenge. Station Map is an explicit V2 planned-state
  route; no Stations or Map page was implemented.
- Verification PASS: focused Dashboard tests plus full Frontend Vitest
  (`103/103`), lint, i18n parity (`458` keys), font guard, production
  build/bundle gate, and a Vite dev-server `/admin-v2/dashboard` HTTP smoke.
  Authenticated visual checks at `1440x900`, `1024x768`, and `768x1024` remain
  pending because this workspace has no controlled browser/E2E runner.

### Phase 3 implementation record — 2026-08-19

- Replaced only `/admin-v2/teams` with a real, read-only Teams List using `GET /api/admin/progress-matrix` and `GET /api/admin/qr-status-summary`; no Backend, contract, schema, seed, or V1 presentation source changed.
- The list uses authoritative Team identity, captain/username, score, total play time, completed Station cells, and the latest valid progress timestamp. Progress labels are derived only from Backend cell states; QR availability is displayed separately from the authoritative QR summary.
- Client-side search/filter applies only to loaded Team name, captain, username, derived progress, and QR summary fields. No filtering endpoint or mock Team was added.
- Team Detail, Edit, QR management, mutations, and destructive actions remain deferred to Phase 4. The row action explicitly indicates this boundary.
- Verification PASS: focused Teams List tests, full Frontend Vitest (`110/110`), lint, i18n parity, font guard, production build/bundle gate, and a Vite `/admin-v2/teams` HTTP smoke. Authenticated graphical viewport verification remains pending because this workspace has no controlled browser/E2E runner.

## Cutover Boundary

This plan intentionally ends with coexistence. Feature flag, default landing change, route redirect, V1 rename/removal, migration/cutover, Production deploy and deprecation require a separate user-approved plan after V2 comparison and verification.
