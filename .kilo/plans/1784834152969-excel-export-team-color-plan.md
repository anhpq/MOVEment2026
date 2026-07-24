# Plan — Excel Export and Team Color UI

## 1. Current workspace state

- Plan file: `.kilo/plans/1784834152969-excel-export-team-color-plan.md`.
- Current Git status checked during planning:
  - only untracked `docs/analysis/MOVEment2026_Excel_Export_TeamColor_Requirements_FULL.md` is present.
  - no source/docs implementation changes are currently tracked in workspace.
- In Plan Mode, do not edit source files or non-plan docs. The implementation-capable agent must make the changes below.

## 2. Status, scope, and hard limits

- Classification: **Business Rule Change + New Feature + Implementation Fix**.
- Scope:
  1. Admin Team Results Excel export.
  2. Scoped Team Color UI for Team-facing UI and Admin Team-context UI, including shell/header/nav when the current context is Team-specific.
  3. Centralized ranking comparator reused by Leaderboard and Excel.
- Current untracked requirement file must be included in the implementation change set:
  - `docs/analysis/MOVEment2026_Excel_Export_TeamColor_Requirements_FULL.md`
- Do not create a local commit unless the user explicitly requests it in the implementation turn.
- Do not push, deploy, mutate Production, rewrite history, or run destructive Git commands.

## 3. Confirmed decisions

1. `SCORE` Station duration:
   - `SCORE` Station is evaluated by score only.
   - On Check-out, `checkedInAt` and `checkedOutAt` remain the same/effective same timestamp.
   - Export duration is always `00:00:00`.
   - `SCORE` duration never contributes to `Total Play Time`.
2. Ranking comparator is ordered comparison:
   1. `Total Score` descending.
   2. `Total Play Time` ascending.
   3. `Total Completed Stations` descending.
   4. `Final Submitted At` ascending, nulls last.
   5. `Team Code` ascending.
3. Ranking `Total Score` source is `team.totalPoints`.
   - Excel also includes a separate computed score column for reconciliation.
   - Do not repair/update `team.totalPoints` as part of export.
4. Computed score column:
   - calculated as active completed Station scores + correct Final bonus.
   - used for audit/reconciliation only, not for ranking unless a future Business Rule changes this.
5. `Team Code` = existing `Team.id`.
   - Excel does not include a separate `Team ID` column because it would duplicate `Team Code`.
   - Excel keeps a separate `Username` column.
   - Ranking final tie-break uses `Team.id` numeric ascending.
   - Do not add a new DB field.
6. Excel export includes **all non-deleted Teams**:
   - `ACTIVE`, `LOCKED`, and `FINISHED` if present in DB.
   - Deleted Teams are hard-deleted by current code and cannot be exported.
7. Leaderboard should also rank all non-deleted Teams so Excel Rank and UI Leaderboard Rank can match.
8. Station columns in Excel include **all active Stations**.
   - User states Admin will not turn off Stations during the event.
   - If inactive Stations exist, exclude them from the new Team Results export and from computed Station totals.
   - Each Station group is reduced to only `Check-in`, `Check-out`, and `Score`.
   - Do not include per-Station `Status` or per-Station `Duration` columns.
9. Keep Excel base column `Total Play Time`.
   - This explains and validates the rank tie-break after equal score.
   - Its source is `team.totalPlaySeconds`, matching Leaderboard cache behavior.
   - Do not add a separate computed play-time column in this task.
10. Remove the Excel base column `Total Stations`.
   - Keep only `Total Stations Completed`.
   - `Total Stations Completed` counts completed active Stations only.
11. Incomplete current Station attempt in export:
   - If progress is `PLAYING`, `CHECKED_IN`, or checked out but waiting for score, ignore that incomplete attempt.
   - Export that Station with blank `Check-in`, blank `Check-out`, `Score` = `0`, and do not count it in computed totals/completed count.
   - Do not invent `IN_PROGRESS` or pending-score export values.
12. Final Challenge export:
    - Do **not** include a `Final Challenge Status` column.
    - Only a correct Final submission is treated as submitted Final result.
    - No correct submission, including wrong-only attempts, exports blank submitted/rank and bonus `0`.
    - Correct submissions export authoritative `Final Submitted At`, `Final Rank`, and `Final Bonus Score`; rank 11+ may legitimately have bonus `0`.
13. Team Color storage/UI:
   - Reuse existing DB column `Team.color`.
   - Team Color is for UI theming only; do **not** include Team Color in Excel Team Results.
   - Public API should expose `teamColor` and keep `color` as temporary backward-compatible alias.
   - `teamColor` is the canonical API field; `color` is only a temporary compatibility alias.
   - If create/update receives both `teamColor` and `color` with different normalized values, reject `400`.
   - If both are present with the same normalized value, accept.
   - No migration expected.
14. Team Color validation:
   - Backend accepts only `#RRGGBB` or `null` for Admin create/update.
   - Invalid Admin input returns `400`.
   - `null` clears stored color and UI uses fallback.
   - Missing `teamColor` on update means unchanged.
   - Implementation must distinguish missing property from explicit `null` clear.
   - Frontend converts empty Team Color form value to `null`.
   - Frontend falls back to default only for null/missing/legacy invalid loaded values.
15. Default Team Color fallback: `#FF765C`.
16. Admin Team-context shell theming:
   - User confirmed after initial plan: when Admin is in a Team-specific context, change shell/header/nav to match that Team Color for a consistent UI.
   - This intentionally overrides the older requirement text that global Admin navigation should always keep the default theme.
   - Current code already has Admin Team-scoped Station routes: `/teams/:teamId/stations` and `/teams/:teamId/stations/:stationId`.
   - Team-specific Admin shell contexts include `/system-config/teams/:teamId`, `/teams/:teamId/stations`, and `/teams/:teamId/stations/:stationId`.
   - `/teams` is a multi-Team list: shell/header/nav must stay default; only individual Team cards use their own Team Color.
   - Admin map route/action is explicitly out of scope after user review; do not add `/teams/:teamId/stations/map`, do not change Team-only `/stations/map`, and do not change `StationsMapPanel` Admin action behavior in this task.
   - Non-Team Admin pages such as `/teams`, `/admin/operations`, `/system-config`, Station editor routes, map routes, and global config pages must remain default unless a Team context is explicitly active and user-visible.
17. Export generation library:
   - Add backend dependency `exceljs`.
   - Use ExcelJS for Team Results workbook generation.
   - Existing custom `xlsx-report.ts` may remain for old summary export compatibility.
18. Excel cell formats:
   - Use numeric Excel cells/formats for datetime and duration.
   - Duration numFmt: `[h]:mm:ss`.
   - Datetime numFmt: `dd/mm/yyyy hh:mm:ss`.
   - Datetime values must be converted for `Asia/Ho_Chi_Minh` display, independent of server/browser timezone.
19. Export UI:
   - Existing Admin Operations `Export Excel` button should download new Team Results export.
   - Frontend should read filename from backend `Content-Disposition` so the timestamped backend filename is preserved.
   - Use `movement-2026-team-results.xlsx` only as fallback when header parsing fails.
   - Keep old `/api/admin/reports/summary.xlsx` endpoint for compatibility. If a real blocker requires removing or changing it, stop and report before doing so.
20. Workbook shape:
   - New Team Results file has one worksheet only.
21. Station column group label:
   - Use `Station.name`.
   - If duplicate Station names exist, disambiguate with deterministic order suffix, e.g. `Station Name (#02)`.
22. Station order:
   - Use current `sortOrder` as `displayOrder` equivalent.
   - Fallback: `name` ascending, then `id` ascending, then `createdAt` ascending.

## 4. Current code findings to preserve

- `Team` has `color String?`, not `teamColor`: `be/prisma/schema.prisma:60`.
- Team create/update DTO lacks color: `be/src/modules/admin/dto/team.dto.ts:3`.
- Player dashboard exposes `color`: `be/src/modules/player/player.service.ts:36`.
- Admin public Team mapper exposes `color`: `be/src/modules/admin/admin.service.ts:1107`.
- Auth `toTeamResponse()` returns `color`, not `teamColor`: `be/src/modules/auth/auth.service.ts:382`.
- Leaderboard ranking is duplicated:
  - `be/src/modules/player/player.service.ts:126`.
  - `be/src/modules/admin/admin.service.ts:1124`.
- Current Leaderboard filters `status: ACTIVE`; this must change to all non-deleted Teams.
- Current Leaderboard uses `team.totalPoints`; keep that score source for ranking.
- Current summary export is multi-sheet and not one-row-per-Team: `be/src/modules/admin/admin.service.ts:822`.
- Existing XLSX writer is custom/minimal: `be/src/modules/admin/xlsx-report.ts:23`.
- Backend currently has no ExcelJS dependency in `be/package.json`.
- Admin export endpoint already uses Admin guards and `requireAdminId`: `be/src/modules/admin/admin.controller.ts:306`.
- `AdminModule` currently imports `AuthModule` and `EventConfigModule` only: `be/src/modules/admin/admin.module.ts:8`.
- `PlayerModule` currently provides/exports `PlayerService`: `be/src/modules/player/player.module.ts:9`.
- `PrismaModule` is global: `be/src/modules/prisma/prisma.module.ts:1`.
- `TeamStationProgress` is one mutable current/latest row; no attempt history table: `be/prisma/schema.prisma:145`.
- Cancel clears active attempt timestamps and returns to `AVAILABLE`: `be/src/modules/player/player.service.ts:283`.
- Replay/check-in overwrites the current row start timestamp and clears old completion/cancel fields: `be/src/modules/player/player.service.ts:189`.
- `FinalSubmission` stores wrong and correct submissions; export should use correct submission only: `be/prisma/schema.prisma:268`.
- Frontend local `Team` type lacks color: `fe/src/features/movement/types.ts:20`.
- Frontend auth response types for Team login and `/auth/me` lack `teamColor`: `fe/src/features/movement/api.ts:22` and `fe/src/features/movement/api.ts:31`.
- `PlayerDashboardResponse.team` already has legacy `color` but not `teamColor`: `fe/src/features/movement/api.ts:104`.
- `fetchPlayerDatabase()` and `fetchAdminDatabase()` do not map color/teamColor into local `Team`: `fe/src/features/movement/playerData.ts:25`, `fe/src/features/movement/adminData.ts:12`.
- `playerData.ts` maps not-played Station display score to `station.game.maxPoints` when progress is missing; this is a UI legacy behavior and must not be copied into Excel export, where not-played/incomplete score is `0`.
- Team list has no scoped per-team color: `fe/src/features/movement/pages/TeamListPage.tsx:35`.
- Team editor has no Team Color input: `fe/src/features/movement/pages/TeamEditorPage.tsx:94`.
- Admin Operations export button currently calls `downloadAdminSummary()`: `fe/src/features/movement/pages/AdminOperationsPage.tsx:169`.
- Team data bootstrap loads player data before rendering Team pages: `fe/src/features/movement/layout/ProtectedRoute.tsx:20`.
- Global Ant Design default primary color lives in `fe/src/main.tsx`; do not mutate the global Ant Design theme for Team Color. Team-specific Admin shell/header/nav theming must be scoped to the active Team context only.
- Backend CORS currently does not expose `Content-Disposition`: `be/src/main.ts:16`; frontend cannot reliably read the backend filename cross-origin unless `Access-Control-Expose-Headers` includes `Content-Disposition`.
- `apiDownloadBlob()` currently returns only `Blob`, not response headers: `fe/src/features/movement/apiClient.ts:227`; filename preservation requires changing it to return blob + headers or adding a new download helper.
- Existing old summary export includes sensitive Final submitted answers in the legacy `Final Submissions` sheet: `be/src/modules/admin/admin.service.ts:944`; keep old endpoint for compatibility but new Team Results export must not include answer text or secrets.
- Current Team editor QR token field says one-time token while current Business Rule is reusable/rotatable Team QR Login; avoid widening QR wording changes unless needed for Team Color work.
- Current Admin Station flow is already team-scoped: `/teams/:teamId/stations` and `/teams/:teamId/stations/:stationId`: `fe/src/features/movement/routes.tsx:65`.
- `/stations/map` route currently allows only `user`: `fe/src/features/movement/routes.tsx:30`; user reviewed Admin UI and confirmed map route/action should be skipped for this task.
- `StationsMapPanel` already supports Admin edit mode via `editable` and is used inside `SystemConfigPage`: `fe/src/features/movement/pages/SystemConfigPage.tsx:400`; do not change it for Team Color scope unless unavoidable for existing Team/user theme styling.
- `StationsMapPanel` still shows `Play` and blocks Admin at submit with `Admin cannot simulate team QR check-in`: `fe/src/features/movement/components/StationsMapPanel.tsx:579`; this UX is out of scope for this task.
- `TeamStatus` only has `ACTIVE`, `LOCKED`, `FINISHED`; there is no soft-delete flag/status. “All non-deleted Teams” means no `status` filter for Team queries; deleted Teams are hard-deleted by `AdminService.deleteTeam()`.
- `PlayerService.checkOut()` already sets `checkedOutAt = checkedInAt` for `SCORE` Stations in the normal flow, so new export logic must preserve duration `0`; do not add repair for historical inconsistent rows.
- `PlayerService.submitScore()` and `AdminService.applyScore()` compute play seconds from timestamps for non-edit score completion; because normal `SCORE` Check-out makes timestamps equal, this is currently safe for normal flow, but tests should lock this rule.
- `apiDownloadBlob()` is currently only used by `downloadAdminSummary()`, so implementation may safely replace it with a richer file download helper if all call sites are updated.
- `TeamEditorPage` currently uses Ant Design Drawer rendered within the app tree; scoped Team Color vars should be applied to an ancestor/container or Drawer props/className so the editor preview inherits the viewed Team theme without leaking to global Admin pages.

## 5. Documentation updates required during implementation

Update docs before/with code because this includes Business Rule changes.

1. `docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md`
   - Update Leaderboard comparator to the 5 confirmed criteria.
   - State ranking score source is `team.totalPoints`.
   - State computed score is export reconciliation only.
   - State `Team Code = Team.id`, Excel omits duplicate `Team ID`, keeps `Username`, includes `Captain Name`, and final tie-break uses numeric ascending Team ID.
   - State Leaderboard ranks all non-deleted Teams.
   - State Team Results Excel exports all non-deleted Teams and active Station columns only.
   - State each Station group has only `Check-in`, `Check-out`, and `Score`.
   - State Excel does not include Team Color or Team Status.
   - State `teamColor` is canonical API field, `color` is alias only, and conflicting `teamColor`/`color` inputs reject `400`.
   - State Excel keeps `Total Play Time` from `team.totalPlaySeconds` for ranking tie-break visibility.
   - State Excel does not include a `Total Stations` base column; only `Total Stations Completed` is included.
   - Keep `SCORE` Station duration rule: no play duration, `00:00:00` in export.
   - Add Excel behavior for incomplete current attempts: ignored in totals and exported with blank Station check-in/check-out plus score `0`.
   - State Excel does not include `Final Challenge Status`; Final result is represented only by submitted time, rank, and bonus score.
   - Add Final export behavior: wrong-only attempts export blank Final Submitted At/Rank and bonus `0`.
   - Add Team Color backend validation: Admin input must be `#RRGGBB` or `null`; invalid returns `400`; `null` clears color; conflicting `teamColor`/`color` aliases return `400`.
   - Add updated Admin Team-context theming rule: shell/header/nav may use Team Color only when the current Admin view is single-Team-specific; `/teams` list keeps default shell while cards use their own colors.
   - Do not add Admin map access in this task; user confirmed current Admin UI does not need map changes.
2. `docs/analysis/PROJECT_ANALYSIS_SPEC.md`
   - Mirror ranking comparator, `team.totalPoints` rank score source, `team.totalPlaySeconds` time source, `Team Code = Team.id`, omitted duplicate `Team ID`, included `Captain Name`, all non-deleted Team scope, active Station column scope, reduced Station groups (`Check-in`, `Check-out`, `Score`), retained `Total Play Time`, removed Team Color/Team Status Excel columns, and removed `Total Stations` column.
   - Add concise Excel export and Team Color UI summary, including the updated Admin Team-context shell/header/nav theming decision.
3. `docs/analysis/FEATURE_INDEX.md`
   - Add routing entries for Excel Export and Team Color UI.
   - Include the new requirements file in required reading.
4. `docs/analysis/MOVEment2026_Excel_Export_TeamColor_Requirements_FULL.md`
   - Correct `SCORE` duration text to `00:00:00` and no Total Play Time contribution.
   - Clarify rank uses `team.totalPoints`.
   - Add computed score as separate reconciliation column.
   - Clarify `Team Code` maps to `Team.id`, `Team ID` is omitted as duplicate, while `Username` and `Captain Name` remain separate metadata columns.
   - Clarify all non-deleted Teams are exported/ranked.
   - Clarify Station columns include active Stations only.
   - Clarify each Station group includes only `Check-in`, `Check-out`, and `Score`.
   - Clarify `Total Play Time` remains as a base column from `team.totalPlaySeconds` for rank tie-break visibility.
   - Remove Team Color and Team Status from Excel row structure and acceptance criteria.
   - Remove `Total Stations` from row structure and acceptance criteria.
   - Remove per-Station `Status` and per-Station `Duration` from row structure and acceptance criteria.
   - Clarify incomplete current attempts are ignored in totals and exported with blank Station check-in/check-out plus score `0`.
   - Remove `Final Challenge Status` from row structure and acceptance criteria.
   - Clarify wrong-only Final attempts export blank Final Submitted At/Rank and bonus `0`.
   - Clarify Station headers use Station Name with suffix for duplicates.
   - Clarify Admin may clear Team Color by saving `null`/empty form value.
   - Clarify `teamColor` is canonical API field, `color` is compatibility alias, and conflicting alias inputs reject `400`.
   - Replace/override old text that global Admin navigation always keeps default theme: Admin Team-context shell/header/nav should use the active/viewed Team Color for consistency.
   - Clarify implementation uses ExcelJS and numeric Excel date/duration formats.
5. After verification:
   - `docs/analysis/BACKEND_AUDIT.md`: actual changes, validation, skipped/manual checks, no push/deploy.
   - `docs/analysis/IMPLEMENTATION_BACKLOG.md`: completed acceptance criteria and remaining manual verification gaps.

## 6. Backend implementation tasks

### 6.1 Add ExcelJS dependency

1. Add `exceljs` to backend dependencies:
   - `be/package.json`
   - `be/package-lock.json`
2. Do not add frontend Excel dependency.
3. Keep existing custom `xlsx-report.ts` for legacy summary export unless replacing summary safely becomes necessary.

### 6.2 Create shared Team Results module/service

Prefer a neutral shared module instead of coupling Admin directly to Player internals:

- `be/src/modules/team-results/team-results.module.ts`
- `be/src/modules/team-results/team-results.service.ts`

Then import `TeamResultsModule` into:

- `PlayerModule`
- `AdminModule`

Test constructors/mocks must be updated because `PlayerService` and likely `AdminService` will receive `TeamResultsService` in addition to existing dependencies.

Responsibilities:

1. Public service shape should expose at least:
   - `getRankedTeamResults()` returning ranked rows plus active Station column metadata;
   - `toLeaderboardRows()` or equivalent mapper preserving current Leaderboard response shape;
   - pure comparator/helper exported or testable without HTTP.
2. Query all non-deleted Teams with:
   - current `TeamStationProgress` rows;
   - active Station metadata ordered by `sortOrder`, `name`, `id`, `createdAt`;
   - active Game max points;
   - correct Final submission for each Team.
3. Active Game handling:
   - when multiple active Games exist for one Station, use the same current rule as Team progress initialization/API (`distinct: ['stationId']` ordered by Station/order then Game id), and record a backlog risk if data contains multiple active games per Station;
   - if an active Station has no active Game, still include the Station column group, count completed progress rows for that active Station when present, use `scoreAchieved` for computed score, export missing/incomplete rows as `0`, and record an audit/backlog data-quality risk instead of crashing.
4. Compute per-Team export details from current DB rows, not frontend state.
5. Preserve ranking score source as `team.totalPoints`.
6. Compute separate reconciliation score:
   - active completed Station scores + correct Final bonus.
7. Use current progress row as source of current/latest valid attempt.
8. Station result rules:
   - Missing progress/non-started/incomplete current attempt: internal station result status `NOT_PLAYED`, blank Station check-in/check-out, Station score `0`, no contribution to totals.
   - `COMPLETED` + `SCORE`: actual start/end if present, duration `0`, score `scoreAchieved`.
   - `COMPLETED` + `TIME/BOTH`: duration = valid `checkedOutAt - checkedInAt`, score `scoreAchieved`.
   - Invalid completed timestamps: include row safely, duration `0`, record audit/backlog risk; do not crash export unless data cannot be represented.
9. Totals:
   - `completedStations`: count only valid current `COMPLETED` rows for active Stations.
   - `rankTotalPlaySeconds`: `team.totalPlaySeconds`.
   - `rankTotalScore`: `team.totalPoints`.
   - `computedScore`: active Station score sum + correct Final bonus.
   - `finalBonusScore`: correct Final submission `pointsAwarded`, default `0`.
   - Do not repair/update `team.totalPlaySeconds` as part of export.
10. Final fields:
    - Do not expose/export a `Final Challenge Status` column.
    - Use correct submissions for the current active Final Challenge when one exists.
    - If no active Final Challenge exists, do not crash the Team Results export; export blank submitted/rank and bonus `0`, and record an audit/backlog configuration risk.
    - No correct submission: blank submitted/rank, bonus `0`.
    - Wrong-only submissions: same as no correct submission.
    - Correct submission: use authoritative `isCorrect`, `submittedAt`, `winnerRank`, `pointsAwarded`; rank 11+ may have `pointsAwarded = 0`.
11. Comparator:
    - `rankTotalScore` desc;
    - `rankTotalPlaySeconds` asc;
    - completed stations desc;
    - final submitted at asc, nulls last;
    - team id numeric asc.
12. Data-shape guidance:
    - Do not include `Team Status` in the Excel workbook.
    - Use `findMany()` without Team `status` filter for ranked/export Team list; `ACTIVE`, `LOCKED`, and `FINISHED` are all ranked/exported if present.
    - Treat missing progress for an active Station as not played, because current schema has one mutable `@@unique([teamId, stationId])` progress row but older/partial data may be missing rows.
    - For duplicate active Station names, suffix only the 2nd and later occurrences in the deterministic Station order, e.g. `Station`, `Station (#02)`, `Station (#03)`.
    - For `lastStationName` in Leaderboard, use latest completed active Station by `completedAt desc`, falling back to empty string/null to preserve current response conventions.
13. Return ranked result rows reusable by:
    - `PlayerService.getLeaderboard()`;
    - Admin Team Results export.

### 6.3 Replace duplicate Leaderboard logic

1. Update `PlayerService.getLeaderboard()` to call `TeamResultsService`.
2. Stop using/remove `AdminService.getLeaderboardRows()` duplicate comparator for new export.
3. Preserve existing public Leaderboard fields:
   - `rank`, `teamId`, `teamName`, `captainName`, `totalPoints`, `completedStations`, `lastStationName`, `totalPlaySeconds`.
4. `totalPoints` in Leaderboard remains `team.totalPoints`.
5. Change Leaderboard Team scope from `status: ACTIVE` to all non-deleted Teams.
6. Add `teamCode` as `team.id` only if backward-compatible and useful.

### 6.4 Team Color API

1. Update `be/src/modules/admin/dto/team.dto.ts`:
   - add optional `teamColor` and optional compatibility `color`.
   - validate strict `#RRGGBB` when non-null.
   - allow `null` to clear.
   - invalid request returns DTO validation `400`.
   - because global `ValidationPipe` uses `whitelist` + `forbidNonWhitelisted`, DTO properties must be explicitly decorated.
   - class-validator may require `@ValidateIf((_, value) => value !== null && value !== undefined)` plus `@Matches(/^#[0-9A-Fa-f]{6}$/)` or a custom validator; plain `@IsOptional()` behavior with `null` must be verified, not assumed.
   - service-level normalization should reject `teamColor` and `color` when both are present and differ after normalization.
2. Add a small backend helper, e.g. `normalizeTeamColorInput(dto)`, that:
   - uses `Object.prototype.hasOwnProperty.call(dto, 'teamColor')` and `...('color')` to distinguish missing from explicit `null`;
   - normalizes valid strings to uppercase `#RRGGBB`;
   - returns a sentinel/`undefined` for missing so update leaves color unchanged;
   - returns `null` for explicit clear;
   - throws `BadRequestException` for conflicting aliases or invalid values not caught by DTO validation.
3. Update Admin create/update:
   - create writes `Team.color` when supplied;
   - create omits `color` when neither alias is supplied;
   - update writes `Team.color` only when helper returns string or `null`;
   - `null` clears `Team.color`;
   - missing means unchanged for update.
4. Update public Team mappers/responses:
   - return `teamColor: team.color`;
   - keep `color: team.color` during transition.
5. Update `AuthService.toTeamResponse()` so team login and `/auth/me` include `teamColor` and compatibility `color`.
6. Update activity log metadata only with safe color info, e.g. normalized color or null; do not log passwords/QR tokens.

### 6.5 Team Results Excel endpoint

1. Add endpoint:
   - `GET /api/admin/reports/team-results.xlsx`
2. Keep existing:
   - `GET /api/admin/reports/summary.xlsx`
3. Reuse current Admin guards and `requireAdminId(auth)`.
4. Activity log action:
   - `EXPORT_TEAM_RESULTS_REPORT`
5. Filename:
   - `movement-2026-team-results-YYYYMMDD-HHmmss.xlsx`
   - timestamp in `Asia/Ho_Chi_Minh`.
6. Response headers:
   - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - `Content-Disposition: attachment; filename="<filename>"`
   - expose `Content-Disposition` to browsers by configuring CORS `exposedHeaders: ['Content-Disposition']` or equivalent in `be/src/main.ts`.
7. Do not include `answerSubmitted`, QR tokens, token hashes/fingerprints, passwords, session tokens, or scoring code strings in the new workbook.
8. Legacy summary export may remain unchanged for compatibility; do not use it as the Admin Operations export target after this task.

### 6.6 Excel worksheet design

One worksheet, one row per non-deleted Team.

Base columns:

1. Team Code (`team.id`)
2. Team Name
3. Captain Name
4. Username
5. Total Stations Completed
6. Total Play Time (`team.totalPlaySeconds`, rank time source)
7. Total Score (`team.totalPoints`, rank score source)
8. Computed Score (active completed Station scores + Final bonus)
9. Rank
10. Final Submitted At
11. Final Rank
12. Final Bonus Score

Do **not** include `Team Color`.
Do **not** include `Team Status`.
Do **not** include `Total Stations`.
Do **not** include `Final Challenge Status`.

For each active Station in deterministic order append:

- `<Station Header> - Check-in`
- `<Station Header> - Check-out`
- `<Station Header> - Score`

Station Header:

- normally `Station.name`;
- if duplicate names, suffix by deterministic ordered index, e.g. `Station Name (#02)`.

### 6.7 ExcelJS generation details

1. Add a new Team Results workbook builder, e.g.:
   - `be/src/modules/admin/team-results-report.ts`, or
   - `be/src/modules/team-results/team-results-excel.ts` if kept shared.
2. Use ExcelJS workbook with one worksheet.
3. Generate buffer with ExcelJS APIs, likely `await workbook.xlsx.writeBuffer()`, then convert to Node `Buffer` if needed before `res.send()`.
4. Worksheet features:
   - frozen header row;
   - AutoFilter over the used range;
   - readable column widths;
   - bold header styling;
   - numeric cells for rank, scores, completed count, total duration, and datetimes.
5. Duration format:
   - value = seconds / 86400.
   - numFmt = `[h]:mm:ss`.
   - blank duration cells are not needed for per-Station groups because duration columns are out of scope; only `Total Play Time` uses duration format.
6. Datetime format:
    - value should display as `Asia/Ho_Chi_Minh` wall-clock time in Excel.
    - numFmt = `dd/mm/yyyy hh:mm:ss`.
    - Use a deterministic conversion utility; do not depend on server local timezone.
    - Recommended approach: convert UTC instant to HCMC wall-clock components with `Intl.DateTimeFormat(..., { timeZone: 'Asia/Ho_Chi_Minh' })`, then create an Excel serial number or Date object that ExcelJS writes without shifting away from that wall-clock value.
    - Prefer one tested helper reused for worksheet datetime cells and filename timestamp string.
    - Add tests around UTC dates that would differ from local/server timezone.
    - Verify both cell value and `numFmt`; do not only assert formatted strings.
7. Header assertions in tests should inspect worksheet values, not raw XML only; secret exclusion can inspect generated workbook text/XML as an additional guard.
8. Do not export raw QR tokens, token hashes/fingerprints, passwords, password hashes, scoring codes, session tokens, Final submitted answer text, or secrets.

## 7. Frontend implementation tasks

### 7.1 API/types/data mapping

Update:

- `fe/src/features/movement/api.ts`
- `fe/src/features/movement/types.ts`
- `fe/src/features/movement/adminData.ts`
- `fe/src/features/movement/playerData.ts`
- `fe/src/features/movement/utils.ts`
- `fe/src/features/movement/store.ts` if needed

Changes:

1. Add `teamColor?: string | null` to Team response/local types:
   - `TeamLoginResponse.team`;
   - `AuthMeResponse` Team branch;
   - `PlayerDashboardResponse.team`;
   - `AdminTeamResponse`;
   - local `Team` and `TeamFormValues`.
2. Map backend `teamColor ?? color` into local Team state in both:
   - `fetchPlayerDatabase()`;
   - `fetchAdminDatabase()`.
3. Preserve `teamColor` through local normalization:
   - update `Team` type;
   - ensure `normalizeDatabaseSeed()` and `syncTeamsWithStations()` do not drop `teamColor` when recomputing score/finish/time;
   - legacy SQL seed paths may leave `teamColor` undefined and should fall back safely.
4. Keep persisted `Session` free of theming state unless implementation needs it; the canonical theme source should be loaded Team data, not stale localStorage.
5. Include `teamColor` in Admin Team create/update payloads.
6. Convert empty Team Color form value to `null` before submit.
7. Add `downloadAdminTeamResults()` for `/api/admin/reports/team-results.xlsx`.
8. Update blob download helper/API layer to expose response headers:
   - because `apiDownloadBlob()` currently only feeds `downloadAdminSummary()`, preferred implementation is a new `apiDownloadFile(path, fallbackFileName)` returning `{ blob, fileName }` or directly triggering download;
   - update `downloadAdminSummary()` to use the new helper or keep a compatibility wrapper so it still downloads `movement-summary.xlsx` if used manually later.
9. Parse filename from `Content-Disposition` supporting at least `filename="..."`; also support RFC 5987 `filename*=` if straightforward and tested.
10. Ensure object URL revocation happens after `link.click()` and fallback filename is `movement-2026-team-results.xlsx` for the new export.
11. Change Admin Operations `Export Excel` button to call Team Results export and download the backend-provided filename, with fallback.
12. Keep `downloadAdminSummary()` exported only if compatibility is desired; do not point Admin Operations at legacy summary after this task.

### 7.2 Team theme utility

Create `fe/src/features/movement/teamTheme.ts`:

1. `normalizeTeamColor(value): string | null`, strict `#RRGGBB`.
2. `getTeamThemeVars(color)` returns scoped CSS variable object:
   - `--team-primary`
   - `--team-primary-hover`
   - `--team-primary-soft`
   - `--team-on-primary`
   - `--team-focus-ring`
3. Derive readable foreground via luminance/contrast.
4. Invalid/missing loaded values return default `#FF765C` theme vars.

### 7.3 Team-facing UI

1. Apply scoped vars when `session.role === "user"` and active Team is loaded.
2. Scope vars to the Team-facing app shell/content wrapper, not global `:root`.
3. Prefer CSS-variable-backed local classes over changing global Ant Design `ConfigProvider` theme per Team, because global theme would leak outside the active app context.
4. Update CSS to consume vars for relevant accents:
   - primary/active buttons where locally styled;
   - selected Station;
   - badges/tags/highlights;
   - progress indicators;
   - focus rings;
   - links/accent icons;
   - soft background tint/header accent.
5. For Ant Design buttons/tags that cannot consume scoped CSS vars cleanly, wrap or style locally via class/style in the scoped container; do not mutate global theme tokens.
6. Do not use a strong full-page Team color background.
7. Logout/store clear must restore default/no Team theme.

### 7.4 Admin Team list

1. `TeamListPage` applies team-specific scoped vars per card/row.
2. Visuals inside card only:
   - left border;
   - swatch;
   - Team name accent;
   - active Team tag/border/soft selected highlight.
3. No color leakage between cards after sorting/rerender.

### 7.5 Admin Team detail/context

1. Route access:
   - keep Team/user `/stations/map` unchanged;
   - do not add Admin Team-scoped map route in this task;
   - do not change `StationsMapPanel` Admin action behavior in this task.
2. `TeamEditorPage` Drawer (`/system-config/teams/:teamId`):
   - use viewed Team's scoped vars;
   - for create route `/system-config/teams/new`, use fallback/default theme until a color is typed, then preview locally inside the Drawer only;
   - add Team Color input with `#RRGGBB` validation and swatch preview;
   - empty input means clear and submit `teamColor: null`;
   - submit `teamColor` on create/update.
3. Admin Team list (`/teams`) is a multi-Team Admin context:
   - each card receives its own scoped vars;
   - shell/header/nav must remain default on `/teams`, even if `activeTeamId` is set or persisted.
4. Admin views driven by route `teamId`, including `/teams/:teamId/stations` and `/teams/:teamId/stations/:stationId`, must apply the viewed Team Color to:
   - content context;
   - shell/header/footer/nav controls inside `AppFrame`.
5. Keep non-Team Admin pages default unless they are displaying an active/viewed Team context:
   - `/admin/operations`;
   - `/system-config` list/config screens;
   - Station editor routes.
6. Theme source priority for Admin:
   - viewed Team from route params when route is `/system-config/teams/:teamId` and `teamId !== 'new'`;
   - otherwise route `teamId` for `/teams/:teamId/stations*`;
   - otherwise fallback/default theme.
   - Do not use persisted `activeTeamId` to theme `/teams`, `/system-config`, `/admin/operations`, `/system-config/teams/new`, or other multi/global Admin pages.
   - Use `useLocation()`/route pattern checks or equivalent explicit path parsing in `AppFrame`; do not infer Team context only from `activeTeamId`.
7. Implement this via scoped CSS vars on the app shell/container, not `:root`; leaving Team context must restore default vars.
8. Be careful with Ant Design Drawer portal behavior. If CSS vars do not inherit through the Drawer DOM location, pass `rootClassName`/`className`/`styles` or use a wrapper so only this Drawer receives Team vars.
9. After successful color update, reload store and reflect updated shell/card/detail color.

### 7.6 Explicitly out of scope

- Do not add or change Admin map routes.
- Do not change `StationsMapPanel` Admin action behavior.
- Do not change Team/user `/stations/map` route or map flow.

## 8. Expected affected files

### 8.1 Backend files expected to change

Required:

- `be/package.json` — add `exceljs` dependency.
- `be/package-lock.json` — lockfile update from `npm --prefix be install`.
- `be/src/main.ts` — expose `Content-Disposition` in CORS headers.
- `be/src/modules/admin/admin.module.ts` — import `TeamResultsModule`.
- `be/src/modules/admin/admin.controller.ts` — add `GET /api/admin/reports/team-results.xlsx`.
- `be/src/modules/admin/admin.service.ts` — Team Color create/update mapping, public Team mapper, Team Results export orchestration/activity log, remove new export dependency on old duplicated leaderboard comparator.
- `be/src/modules/admin/dto/team.dto.ts` — add/validate `teamColor` and compatibility `color`.
- `be/src/modules/auth/auth.service.ts` — include `teamColor` and compatibility `color` in Team auth responses.
- `be/src/modules/player/player.module.ts` — import/provide `TeamResultsModule`.
- `be/src/modules/player/player.service.ts` — delegate leaderboard/rank calculation to `TeamResultsService`, include `teamColor` in dashboard response.
- `be/src/modules/player/player.service.spec.ts` — update constructor mocks and leaderboard/ranking tests.
- `be/src/modules/admin/admin.service.spec.ts` — add/update export, Team Color API, and ranking consistency tests.

New backend files expected:

- `be/src/modules/team-results/team-results.module.ts`.
- `be/src/modules/team-results/team-results.service.ts`.
- `be/src/modules/team-results/team-results.service.spec.ts` if tests are clearer outside existing specs.
- `be/src/modules/team-results/team-results-excel.ts` or `be/src/modules/admin/team-results-report.ts` for ExcelJS workbook generation.

Backend files to keep unless explicitly needed:

- `be/prisma/schema.prisma` — no migration expected because `Team.color` already exists.
- `be/src/modules/admin/xlsx-report.ts` — keep for legacy summary export compatibility.

### 8.2 Frontend files expected to change

Required:

- `fe/src/features/movement/apiClient.ts` — download helper must expose `Content-Disposition`/filename.
- `fe/src/features/movement/api.ts` — add `teamColor` types/payloads and `downloadAdminTeamResults()`.
- `fe/src/features/movement/types.ts` — add `teamColor` to local Team/form types.
- `fe/src/features/movement/adminData.ts` — map backend `teamColor ?? color` into local teams.
- `fe/src/features/movement/playerData.ts` — map backend `teamColor ?? color` into local Team seed.
- `fe/src/features/movement/utils.ts` — preserve `teamColor` through `normalizeDatabaseSeed()`/`syncTeamsWithStations()`.
- `fe/src/features/movement/layout/AppFrame.tsx` — compute active/viewed Team theme context and apply scoped vars/classes to shell/header/footer/nav.
- `fe/src/features/movement/layout/AppFrame.scss` — consume Team theme CSS vars in shell/header/footer/nav without mutating `:root`.
- `fe/src/features/movement/pages/AdminOperationsPage.tsx` — call new Team Results export.
- `fe/src/features/movement/pages/TeamListPage.tsx` — per-Team scoped color vars/card visuals.
- `fe/src/features/movement/pages/TeamListPage.css` — card color styling.
- `fe/src/features/movement/pages/TeamEditorPage.tsx` — Team Color input, validation, preview, payload submit.

New frontend files expected:

- `fe/src/features/movement/teamTheme.ts` — normalize Team Color and build scoped CSS variables.

Frontend files likely but conditional:

- `fe/src/features/movement/store.ts` — only if store actions need code changes beyond type-compatible `teamColor` preservation in `utils.ts`.
- `fe/src/features/movement/pages/StationListPage.tsx` / related CSS — only if content-area Team Color requires component class hooks beyond `AppFrame` scoped vars.
- `fe/src/features/movement/pages/StationDetailPage.tsx` / `StationDetailPage.css` — only if Admin Team-context styling needs local hooks.
- `fe/src/features/movement/pages/LeaderboardPage.tsx` / `LeaderboardPage.css` — only if current-Team badge should consume Team Color in user context.

### 8.3 Documentation files expected to change

Required:

- `docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md`.
- `docs/analysis/PROJECT_ANALYSIS_SPEC.md`.
- `docs/analysis/FEATURE_INDEX.md`.
- `docs/analysis/MOVEment2026_Excel_Export_TeamColor_Requirements_FULL.md`.
- `docs/analysis/BACKEND_AUDIT.md`.
- `docs/analysis/IMPLEMENTATION_BACKLOG.md`.

Do not edit Prompt files unless implementation discovers the repeatable workflow itself changed.

## 9. Automated validation plan

### Backend tests

Add/update tests for:

1. Ranking comparator:
   - score desc using `team.totalPoints`;
   - play time asc using `team.totalPlaySeconds`;
   - completed stations desc;
   - final submitted at asc;
   - null Final Submitted At sorts last;
   - team id numeric asc;
   - all non-deleted Teams receive rank;
   - `ACTIVE`, `LOCKED`, and `FINISHED` Teams are ranked/exported because there is no soft-delete status;
   - Leaderboard and export ranks match.
2. Computed score reconciliation:
   - Excel includes both `Total Score` from `team.totalPoints` and `Computed Score` from active completed Stations + Final bonus.
   - Rank uses `Total Score`, not `Computed Score`.
3. Active Station scope:
   - inactive Stations do not create export column groups;
   - inactive Station progress does not affect completed count or computed score.
   - `Total Play Time` remains `team.totalPlaySeconds`; do not recompute or repair it in this task.
4. Station group shape:
   - each Station group includes only `Check-in`, `Check-out`, and `Score`.
   - exported header does not include per-Station `Status` or per-Station `Duration`.
5. Team metadata columns:
   - exported header includes `Captain Name`;
   - exported header does not include `Team Color`;
   - exported header does not include `Team Status`.
6. `Total Stations` removal:
   - exported header does not include `Total Stations`.
7. `SCORE` duration:
   - export/aggregation duration `0` even if timestamps exist;
   - normal Check-out path keeps `checkedOutAt` equal to `checkedInAt` for `SCORE` Stations;
   - no export-side repair/update of historical timestamp anomalies.
8. Incomplete current attempt:
   - `PLAYING/CHECKED_IN` or pending score exports blank station `Check-in`, blank station `Check-out`, score `0`, and is not counted.
9. Final export fields:
   - exported header does not include `Final Challenge Status`.
   - wrong-only attempts export blank submitted/rank and bonus `0`.
   - correct attempt exports authoritative submitted time/rank/bonus, including rank 11+ with bonus `0`.
10. Excel export:
   - Admin authorization;
   - one worksheet;
   - one row per non-deleted Team;
   - all active Stations included;
   - Station duplicate name header suffix;
   - blank Station check-in/check-out and score `0` for not-played/incomplete Station results;
   - `Total Play Time` equals `team.totalPlaySeconds`;
   - cancelled/replayed current-row behavior;
   - Final submitted/rank/bonus columns and default no-correct-Final values;
   - Final bonus included in computed score;
   - HCMC datetime conversion is deterministic for exported Check-in, Check-out, Final Submitted At, and filename timestamp;
   - no secret fields/strings in worksheet XML;
   - `.xlsx` opens and contains freeze pane, autoFilter, column widths, numeric date/duration formats.
11. Team Color API:
   - valid HEX accepted and normalized;
   - lowercase HEX normalizes to uppercase;
   - invalid HEX returns `400`;
   - `null` clears color;
   - missing field leaves color unchanged on update;
   - both `teamColor` and `color` with same normalized value are accepted;
   - conflicting `teamColor` and `color` inputs return `400`;
   - public responses include `teamColor` and compatibility `color`.

### Frontend validation

No frontend test script exists. Required checks:

1. `npm --prefix fe run lint`
2. `npm --prefix fe run build`
3. Type compile verifies `teamColor` mapping and payloads.
4. Blob download code preserves backend filename from `Content-Disposition` with fallback filename.
5. Backend CORS exposes `Content-Disposition` so the filename works when frontend/backend are cross-origin.
6. Manual UI checks cover actual rendering, including scoped shell/header/footer/nav theming in single-Team-context routes, default shell on `/teams`, and reset on non-Team Admin pages.
7. Team editor create route `/system-config/teams/new` uses fallback shell theme and only local Drawer preview changes when a color is typed.
8. Route regression check verifies Team/user `/stations/map` still works because map changes are out of scope.

## 10. Manual verification checklist

### Export

1. Login as Admin.
2. Click Admin Operations `Export Excel`.
3. Confirm downloaded file is Team Results workbook and filename matches backend timestamp pattern when `Content-Disposition` is present.
4. Open in Microsoft Excel or Google Sheets.
5. Verify:
   - one worksheet;
   - one row per non-deleted Team;
   - `ACTIVE/LOCKED/FINISHED` Teams included when present;
   - no `Team Color` column;
   - no `Total Stations` base column;
   - `Team Code` equals numeric Team ID and there is no duplicate `Team ID` column;
   - `Captain Name` is present as Team metadata;
   - every active Station column group exists;
   - duplicate Station names are disambiguated;
   - not-played Stations have blank Check-in/Check-out and Score `0`;
   - incomplete attempts have blank Check-in/Check-out, Score `0`, and are ignored in totals;
   - `Total Play Time` equals backend `team.totalPlaySeconds`;
   - `SCORE` Stations are expected to contribute `00:00:00` to that backend total;
   - `TIME/BOTH` completed Stations are expected to contribute `Check-out - Check-in` to that backend total;
   - `Total Score` equals backend `team.totalPoints`;
   - `Computed Score` equals active completed Station scores + Final bonus;
   - Rank uses `Total Score` and matches Leaderboard;
   - wrong-only Final attempts have blank submitted/rank and bonus `0`;
   - correct Final columns match backend data;
   - datetimes display as UTC+7/HCMC;
   - no QR/password/token/secret/final-answer fields.

### Team Color

1. Team login with valid dark color remains readable.
2. Team login with valid light color remains readable.
3. Missing/legacy invalid color uses fallback `#FF765C`.
4. Admin create/update invalid color shows backend-driven error.
5. Admin clears Team Color and UI falls back to default.
6. Admin Team list shows distinct scoped colors per Team card while shell/header/footer/nav remain default.
7. Admin Team editor preview/update refreshes list/detail color.
8. Admin `/teams/:teamId/stations` and `/teams/:teamId/stations/:stationId` single-Team context changes content and shell/header/footer/nav to the viewed Team Color.
9. Leaving Team context/global Admin pages keeps/restores default Admin theme.
10. Logout clears Team theme.
11. Mobile and desktop layouts remain readable.

## 11. Required command sequence

Run targeted checks first, then full quality gates:

```powershell
npm --prefix be install
npm --prefix be run test -- team-results.service.spec.ts admin.service.spec.ts player.service.spec.ts auth.service.spec.ts
npm --prefix be run test
npm --prefix be run lint
npm --prefix be run build
npm --prefix fe run lint
npm --prefix fe run build
git diff --check
```

After meaningful source changes, run Graphify update if available:

```powershell
graphify update .
```

If unavailable or failing, record the skipped Graphify update and reason in `BACKEND_AUDIT.md`/final report; do not block implementation solely on Graphify.

If Prisma types are affected unexpectedly:

```powershell
npm --prefix be run prisma:generate
```

## 12. Git plan

Do not create a local commit unless the user explicitly requests it in the implementation turn.

Before final report, inspect:

```powershell
git status
git diff
git log --oneline -10
```

Ensure only in-scope files changed:

- `docs/analysis/MOVEment2026_Excel_Export_TeamColor_Requirements_FULL.md`
- `be/package.json`
- `be/package-lock.json`
- changed backend files
- changed frontend files
- changed docs/audit/backlog files

If the user explicitly requests a commit after implementation and verification, stage only in-scope files and use:

```text
Add team results export and team color theme

- Add authoritative Team results ranking and Excel export
- Apply scoped Team Color UI for Team and Admin Team contexts
- Synchronize Business Rules, requirements, audit, and backlog
- Verify backend tests/lint/build and frontend lint/build
```

Do not push or deploy.

## 13. Rollback and risks

Rollback:

- No DB migration expected when reusing `Team.color`.
- New endpoint is additive if `summary.xlsx` remains.
- UI export button can be pointed back to old summary endpoint if needed.
- Scoped CSS variable theme can be removed without changing DB data.
- ExcelJS dependency can be removed if Team Results export is rolled back.

Risks:

0. Follow-up noted after implementation: Team Color is still slightly wrong in some other UI areas; user will specify the exact remaining color issues later. Do not expand scope or guess those fixes in this task.
1. `Total Score` intentionally uses `team.totalPoints`; `Computed Score` may differ and should be treated as reconciliation signal, not auto-repaired by export.
2. ExcelJS adds backend dependency and lockfile changes.
3. HCMC numeric datetime conversion must be tested carefully because Excel dates have no timezone.
4. Requirements doc must be reconciled for `SCORE` duration, removed `Total Stations`, removed Excel Team Color/Team Status, removed `Final Challenge Status`, `Team Code = Team.id`, included `Captain Name`, and two score columns before final report or any user-requested commit.
5. Real Excel/Google Sheets open verification is manual.
6. Frontend has no automated test runner; UI theming requires manual verification.
7. Admin shell/header/footer/nav Team Color is a new user-confirmed rule that overrides the older requirements doc; documentation must be updated before claiming synchronization.
8. Filename preservation depends on both backend CORS `exposedHeaders` and frontend header parsing; same-origin manual tests alone may miss cross-origin failure.
