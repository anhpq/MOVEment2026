# MOVEment 2026 — Excel Export and Team Color UI Requirements

## Purpose

This document records the confirmed requirements for:

1. Admin Team Results Excel export.
2. Team Color UI theming for Team-facing UI and Admin Team-context UI.

`docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md` remains the Business Rule Source of Truth when documents conflict.

---

# Feature 1 — Admin Team Results Excel Export

## Goal

Admin can download one `.xlsx` file containing Team results.

Rules:

- one worksheet only;
- one row per non-deleted Team;
- include `ACTIVE`, `LOCKED`, and `FINISHED` Teams when present;
- deleted Teams are hard-deleted by current implementation and cannot be exported;
- backend is authoritative for ranking, totals, Station progress, Final result, datetime conversion, and workbook generation.

## Row Structure

Base columns:

1. `Team Code` — current `Team.id`.
2. `Team Name`.
3. `Captain Name`.
4. `Username`.
5. `Total Stations Completed`.
6. `Total Play Time` — source `team.totalPlaySeconds`.
7. `Total Score` — source `team.totalPoints`.
8. `Computed Score` — active completed Station scores + correct Final bonus.
9. `Rank`.
10. `Final Submitted At`.
11. `Final Rank`.
12. `Final Bonus Score`.

Do not include:

- duplicate `Team ID` column;
- `Team Color`;
- `Team Status`;
- `Total Stations`;
- `Final Challenge Status`;
- raw QR tokens, token hashes/fingerprints, passwords, password hashes, session tokens, scoring codes, Final submitted answer text, or secrets.

## Station Columns

Include active Stations only.

Each active Station has exactly three columns:

```text
<Station Header> - Check-in
<Station Header> - Check-out
<Station Header> - Score
```

Do not include per-Station `Status` or per-Station `Duration`.

Station Header rules:

- use `Station.name`;
- duplicate names receive deterministic suffixes in Station order, e.g. `Station`, `Station (#02)`, `Station (#03)`.

Station order:

1. `sortOrder` ascending.
2. `name` ascending.
3. `id` ascending.
4. `createdAt` ascending.

## Station Result Rules

- Missing progress, not-started Station, `PLAYING`, `CHECKED_IN`, or checked-out waiting-score attempt exports blank Check-in, blank Check-out, Score `0`.
- Incomplete attempts do not count toward `Total Stations Completed` or `Computed Score`.
- `COMPLETED` progress for active Stations counts as completed and exports current DB timestamps plus `scoreAchieved`.
- `SCORE` Station is score-only: duration is always `00:00:00` when represented and never contributes to `Total Play Time`.
- Export does not repair or update `team.totalPoints` or `team.totalPlaySeconds`.
- Cancel/replay behavior uses the current mutable `TeamStationProgress` row; cancelled data must not replace the current valid row.

## Final Challenge Export

Only correct Final submissions are treated as submitted Final result.

- No correct submission exports blank `Final Submitted At`, blank `Final Rank`, and `Final Bonus Score = 0`.
- Wrong-only attempts behave the same as no correct submission.
- Correct submission exports authoritative `submittedAt`, `winnerRank`, and `pointsAwarded`.
- Rank 11+ may legitimately have Final bonus `0`.
- Do not export `answerSubmitted` or configured Final answer text.

## Ranking Rules

Excel Rank and UI Leaderboard Rank must match and reuse the same comparator.

Comparator order:

1. `Total Score` descending from `team.totalPoints`.
2. `Total Play Time` ascending from `team.totalPlaySeconds`.
3. `Total Stations Completed` descending.
4. `Final Submitted At` ascending, nulls last.
5. `Team Code` ascending, current numeric `Team.id`.

`Computed Score` is reconciliation only and must not affect rank.

## Excel Format

- Library: ExcelJS.
- Filename: `movement-2026-team-results-YYYYMMDD-HHmmss.xlsx` using `Asia/Ho_Chi_Minh`.
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- Content-Disposition must include the timestamped filename.
- Backend CORS must expose `Content-Disposition`.
- Freeze header row.
- Enable AutoFilter.
- Use readable column widths.
- Use numeric cells for rank, scores, completed count, duration, and datetimes.
- Datetime numFmt: `dd/mm/yyyy hh:mm:ss`.
- Duration numFmt: `[h]:mm:ss`.
- Datetime display must be converted to `Asia/Ho_Chi_Minh`, independent of server/browser timezone.

## Frontend Export UI

- Admin Operations `Export Excel` downloads the new Team Results export.
- Frontend reads filename from `Content-Disposition`.
- Fallback filename: `movement-2026-team-results.xlsx`.
- Legacy `/api/admin/reports/summary.xlsx` remains for compatibility but is no longer the Admin Operations button target.

---

# Feature 2 — Team Color UI Theme

## Source and API

- Storage reuses existing DB column `Team.color`.
- No migration or new DB field is expected.
- Canonical public API field is `teamColor`.
- Temporary backward-compatible alias `color` remains in responses.
- Team Color is for UI theming only and is not included in Team Results Excel.

## Backend Validation

Admin create/update accepts:

- strict `#RRGGBB` string;
- `null` to clear stored color.

Rules:

- invalid input returns `400`;
- lowercase HEX is normalized to uppercase;
- missing `teamColor` on update leaves color unchanged;
- explicit `null` clears color;
- if both `teamColor` and `color` are present with different normalized values, reject `400`;
- if both aliases normalize to the same value, accept.

## Default and Accessibility

- Fallback Team Color: `#FF765C`.
- UI uses fallback for null, missing, or legacy invalid values.
- Enabled primary buttons dùng Team gradient luôn sử dụng chữ và icon trắng `#FFFFFF`; palette và gradient phải tránh tone quá sáng làm giảm độ đọc.
- Avoid strong full-page Team color backgrounds that reduce readability.
- Focus, disabled, mobile, and desktop states must remain readable.

## Team-facing UI

After Team login, apply Team Color using scoped CSS variables on the Team app context.

Do not mutate global `:root` or global Ant Design theme.

Preferred themed elements:

- shell/header/footer/nav accents;
- active nav/buttons where locally styled;
- selected Station and progress accents;
- badges/tags/highlights;
- links/accent icons;
- focus rings;
- soft background tint.

Logout/store clear must restore default/no Team theme.

## Admin Team List

`/teams` is a multi-Team list.

- Shell/header/nav remain default.
- Each Team card/row uses its own scoped Team Color.
- Color usage is limited to that card/row: left border, swatch/accent, Team name, selected/hover soft background.
- Color must not leak between cards after sorting or rerender.

## Admin Team Detail and Team Context

Single-Team Admin contexts use the viewed Team Color for shell/header/nav/content context:

- `/system-config/teams/:teamId` when `teamId !== new`;
- `/teams/:teamId/stations`;
- `/teams/:teamId/stations/:stationId`.

Non-Team Admin pages remain default unless explicitly displaying one Team context:

- `/teams` list;
- `/admin/operations`;
- `/system-config` global screens;
- Station editor routes;
- map routes.

Create Team route `/system-config/teams/new` uses fallback shell theme; typed color may preview locally in the Drawer only.

## Explicitly Out of Scope

- Do not add Admin map routes.
- Do not change Team/user `/stations/map`.
- Do not change `StationsMapPanel` Admin action behavior.

---

# Acceptance Criteria

## Excel

- Every non-deleted Team appears once.
- Active Stations appear as three-column groups only.
- Inactive Stations do not create columns or affect computed totals.
- Not-played/incomplete Stations export blank Check-in/Check-out and score `0`.
- `Total Play Time` equals `team.totalPlaySeconds`.
- `Total Score` equals `team.totalPoints`.
- `Computed Score` equals active completed Station scores + correct Final bonus.
- Rank matches Leaderboard.
- Wrong-only Final attempts export blank submitted/rank and bonus `0`.
- Workbook has one worksheet, frozen header, AutoFilter, numeric date/duration formats, and no secrets.

## Team Color

- Valid HEX is accepted and normalized.
- Invalid HEX returns backend-driven error.
- `null` clears Team Color.
- Missing update field leaves existing Team Color unchanged.
- Conflicting aliases reject `400`.
- Team-facing UI uses scoped Team Color.
- `/teams` keeps default shell while cards use scoped colors.
- Admin single-Team routes use viewed Team Color in shell/header/nav.
- Leaving Team context restores default Admin theme.
