# Team Gameplay V2 Analysis

## Status

| Area | Status |
| --- | --- |
| Implementation | Completed for V2 QR badge and persistent scanner; prior V2 route, unified QR endpoint, HUD, overlays, i18n, and navigation remain completed |
| Runtime/Production Verification | Local runtime verification completed; Production verification not performed |
| Browser/Manual Verification | Headless Chrome HUD/responsive and fake-camera lifecycle smoke completed; physical iOS/Android verification pending |

## Objective and Scope

Add a parallel Team-only gameplay screen at `/team/v2` while preserving the
current `/stations/map` flow, database schema, seed data, scoring authority, and
confirmed Business Rules.

This feature covers:

- fullscreen Team Gameplay V2 HUD and responsive layout;
- shared map canvas reuse with the existing Suoi Tien WebP map, station
  coordinates, pan/zoom, and marker state;
- Team-only settings, opacity, language, Zalo, legacy UI return, and logout;
- unified Team Station QR action endpoint for camera and manual QR input;
- V2 leaderboard overlay and Station preview overlay;
- Station Detail return behavior through `?from=team-v2`;
- VI/EN copy and a fixed V2 palette isolated from Team Color.

## Boundaries

- No database schema change.
- No seed or canonical Station data change.
- No default post-login redirect change.
- No Admin API behavior change.
- No push, deploy, or Production mutation in this rollout.
- Existing V1 endpoints stay available for compatibility.

## Target Interfaces

### Frontend

- Route: `/team/v2`.
- Station Detail return marker: `?from=team-v2`.
- Opacity storage key: `movement-team-v2-panel-opacity`.
- Language storage key remains `movement-language`.
- Zalo support URL: `https://zalo.me/0909384697`.

### Backend

```http
POST /api/player/qr-action
```

```ts
{ qrToken: string }
```

```ts
{
  action: "CHECK_IN" | "CHECK_OUT";
  stationId: string;
  requiresScore: boolean;
  progress: PlayerProgress;
}
```

The endpoint must resolve Station and `QrPurpose` from the database token record,
not from Frontend input or visible QR purpose code.

## Visual Design Specification

### Visual Direction

- The screen uses a black sci-fi HUD direction over the real Suoi Tien map.
- The background is `#010406` with a subtle cyan 40px grid, edge vignette, and
  dark top/bottom gradients so outdoor-facing text remains readable.
- The exact invariant brand copy at the top center is `MOVEment 2026`. CSS must
  preserve this casing and must not transform it to `MOVEMENT 2026`.
- The existing Aptos/Segoe UI stack remains authoritative. The HUD look comes
  from weight, uppercase gameplay labels, letter spacing, outlines, and glow;
  no runtime web-font dependency is allowed.

### Color Tokens

| Token / role | Value | Usage |
| --- | --- | --- |
| HUD accent | `#1677FF` | Team identity, HUD frames, default markers, QR focus, and V2 primary controls |
| QR halo | `#7DF9FF` | QR badge outer rings, glyph highlights, and focus glow |
| QR lower arc | `#FF4D4F` | Decorative lower badge arc only; never an error-state signal |
| Page background | `#010406` | Fullscreen canvas and empty map space |
| Strong panel | `rgba(2, 7, 13, 0.97)` | Settings, scanner, leaderboard, score, and preview panels |
| Main text | `#F6FBFF` | Headings, values, controls, and readable foreground |
| Muted text | `#9FB2C5` | Kicker, help, metadata, and secondary copy |
| Score neon | `#00FF72` | Total points, Station maximum points, completed-count accent |
| Active semantic | `#00F5FF` | Active/playing Station marker and focus glow |
| Selected semantic | `#FF20DF` | Selected Station marker and connector |
| Completed semantic | `#00F574` | Completed Station marker |

V2 owns this fixed palette and does not derive HUD, marker, overlay, or control
colors from authenticated `Team.color`, inherited `--team-*` variables, body
Team theme, or global Ant Design theme. Team Color remains available in V1 and
other Team-facing routes. Score and Station-state semantic colors must not be
replaced by the fixed HUD accent. The saved panel-opacity setting applies only
to modal/preview overlay layers and must not attenuate the header, score,
progress, QR, or Leaderboard HUD controls.

### HUD Layout and Copy

| Position | Visible copy/data | Visual treatment |
| --- | --- | --- |
| Top left | Localized Team name, `#Team.id`, localized captain label/name | Fixed V2 accent, bold, glow, black readability plate |
| Top center | `MOVEment 2026`, Team total, `PTS` | Clipped brand tab plus green neon score |
| Top right | Settings gear | 44px target, fixed V2 accent border and glow |
| Bottom left | Localized progress, `<completed>/17`, completed label | Accent HUD chip with score-green completed count |
| Bottom center | QR action, localized scan title/help | Responsive inline-SVG badge with cyan rings, decorative red lower arc, QR glyph/text, and HUD pedestal |
| Bottom right | Localized leaderboard label | Trophy icon and fixed accent HUD chip |

### Icon Inventory

| Action/meaning | Icon |
| --- | --- |
| Settings | `SettingOutlined` |
| QR gameplay | V2-only inline SVG `TeamV2QrBadge` |
| Progress | `CompassOutlined` |
| Leaderboard | `TrophyFilled` |
| Close overlay | `CloseOutlined` |
| Zalo support | `CustomerServiceOutlined` |
| Return to V1 | `ArrowLeftOutlined` |
| Logout | `LogoutOutlined` |
| Execute/manual QR action | `CameraOutlined` |
| Station score | `StarFilled` |
| Teams playing | `TeamOutlined` |

All primary gameplay targets remain at least 44px. Icons inherit the fixed V2
accent or semantic color from their container; danger/logout retains Ant Design
danger semantics.

### Overlay Layout Policy

- Settings, Leaderboard, QR scanner, and score entry open inside a real modal
  layer that blocks interaction with the map and HUD beneath it.
- Portrait uses a safe-area-aware near-fullscreen panel with 8px minimum inset.
- Landscape centers a near-fullscreen panel with 12px vertical and 18px
  horizontal minimum inset; width may grow to 820px and height fills the safe
  viewport rather than becoming a small corner/side panel.
- Station preview is a centered dialog capped at 560px width and 82dvh height.
- Clicking the backdrop or Close icon dismisses the active overlay. Only one
  primary overlay is visible at a time; Station preview is suppressed while a
  primary overlay is open.
- The saved opacity value applies to the whole modal layer, including backdrop,
  panel, text, icons, buttons, and controls.
- Rotating/resizing the viewport must not remount the page or close the active
  overlay.

## Decision Log

### Seven Main Review Rounds

1. Entry and routing: V2 runs at `/team/v2` beside `/stations/map`; login still
   redirects to the existing UI, with explicit links between V1 and V2.
2. Visual scope: reuse the real Suoi Tien WebP map and 17 Station coordinates;
   apply the mobile HUD direction but remove fake device status UI.
3. Responsive model: portrait uses header, map, and bottom HUD; landscape keeps
   the map expanded and moves overlays to the right without remounting state.
4. Marker density: show all `01`...`17` marker codes plus localized names and
   maximum points for every Station currently inside the viewport; use a
   collision-free layout rather than hiding labels by selection or zoom level.
5. Station information: preview cards stay compact; media, long description,
   time, and detail content remain in Station Detail.
6. Backend contract: add a Team-only unified QR action endpoint using existing
   check-in/check-out domain logic and keep old endpoints for V1.
7. Navigation safety: Station Detail returns to `/team/v2` through a fixed query
   value only; arbitrary return URLs are not accepted.

### Additional Review Rounds

1. Header identity: display localized Team name, `#Team.id`, `captainName` when
   present, total points, and Settings.
2. Team ID: do not infer code from username; use the Team ID returned by the
   authenticated Team contract.
3. V2 palette: use fixed route-local V2 tokens; do not inherit Team Color,
   mutate `:root`, or depend on the global Ant Design theme.
4. Overlay shape: portrait uses a near-fullscreen modal and landscape uses a
   centered near-fullscreen modal; overlays must not remain in a screen corner.
5. Opacity scope: opacity applies to the whole overlay including background,
   text, icons, buttons, and controls.
6. Opacity persistence: range 50-100, default 85, step 5, saved per browser and
   not cleared by Team switch or logout.
7. Language: use existing `movement-language`; switching language updates UI
   immediately and refreshes Player Station data.
8. QR fallback: camera is primary, with retry plus manual token/payload input.
9. Scanner duplicate guard: lock after the first decoded frame until the action
   errors or the user starts the next scan.
10. Score flow: `TIME` completes immediately; `SCORE` and `BOTH` open Team score
    entry after checkout using the existing Team session.
11. Polling: dashboard, Stations, progress, and playing counts poll every 5s
    only while visible and avoid overlapping requests.
12. Release hygiene: keep logout for this task and record a backlog review to
    revisit hiding login/logout before 2026-08-20.

### Reference HUD Refinement Review Rounds

1. Marker visibility: render all 17 Station names and maximum-point labels when
   their markers are inside the viewport; do not use selected/zoom thresholds.
2. Portrait framing: keep the map large enough to read and use pan/pinch instead
   of shrinking the complete wide map into the portrait viewport.
3. V2 colors: apply fixed accent `#1677FF` to Team identity, HUD outlines, QR
   focus, default markers, and primary controls; retain neon green points and
   semantic active/selected/completed colors.
4. Center identity: show the invariant `MOVEment 2026` brand tab above the score.
5. Collision strategy: place labels in screen space with connector lines and a
   deterministic non-overlapping landscape grid when all 17 markers are visible.
6. Map controls: remove floating zoom/reset buttons; keep pan, wheel, pinch, and
   double-click/double-tap reset.
7. Typography: retain the existing Aptos/Segoe UI stack and create the reference
   look with uppercase, spacing, weight, outlines, and neon effects.

### QR Badge and Persistent Scanner Review Rounds

1. Visual scope: replace the complete V2 center QR badge, not the adjacent
   Progress/Leaderboard chips.
2. Badge colors: fixed V2 blue/cyan rings plus a decorative red lower arc; red
   does not carry error semantics.
3. Rendering: inline SVG for rings/glyph/text and CSS for glow/interaction; no
   bitmap asset and no idle animation.
4. Responsive size: 112px landscape/desktop, 96px portrait, and 88px at widths
   up to 360px; keep CTA below and hide the secondary hint on portrait.
5. Scanner boundary: create a V2-only scanner component using `qrDetect`
   helpers; do not modify V1, Login, or shared `QrTokenInput` behavior.
6. Camera start: opening the V2 scanner auto-requests the camera; camera failure
   exposes localized error, manual input, and retry.
7. API rejection: keep the stream/preview open, show safe localized error, and
   expose manual token input while decode is re-armed.
8. Duplicate guard: suppress the rejected token until a different token is
   detected or no QR has been visible continuously for at least 600ms.
9. Error safety: map only whitelisted backend messages/status groups to VI/EN;
   never render raw backend bodies, stack traces, or raw tokens in logs.

## Acceptance Criteria

- Team users can open `/team/v2`; Admin users cannot access it.
- V1 map has a visible path to V2, and V2 can return to the existing UI.
- V2 renders fullscreen in portrait and landscape, with safe-area support.
- All 17 markers remain tappable with roughly 44px hit targets.
- Settings, Leaderboard, and Station preview share the configured opacity.
- Main HUD fixed V2 accent remains full-strength when panel opacity is below 100%.
- Switching between Teams with different `Team.color` values does not change
  V2 HUD, default marker, QR, overlay, or primary-control colors.
- Settings, Leaderboard, QR scanner, and score entry block the underlying HUD
  and are centered/near-fullscreen in both orientations; Station preview is a
  centered dialog.
- Camera and manual QR input call the same backend action.
- Duplicate camera frames do not send duplicate requests from the frontend.
- The V2 badge matches the approved multi-ring cyan/red reference without
  changing the fixed palette of other HUD elements.
- Opening the V2 scanner auto-starts camera permission/startup.
- Rejected camera/manual tokens keep the scanner open; camera continues when it
  is healthy and manual input becomes visible.
- A rejected token is not resubmitted until it leaves the frame for at least
  600ms or a different token is detected.
- Success, close, and unmount stop every camera track, detector, timer, and
  animation-frame callback.
- Station Detail opened from V2 returns to `/team/v2` after back/action success.
- VI/EN copy covers HUD, Settings, QR, preview, Leaderboard, loading/error, and
  ARIA labels.
- Existing `/stations/map`, Station Detail, Leaderboard route, and Admin UI do
  not regress.

## Verification Plan

- Backend targeted tests for Team authorization, token lifecycle, Station
  inactive, event/cooldown/active-station checks, duplicate scan behavior,
  `CHECK_IN`, `TIME` checkout, `SCORE`/`BOTH` checkout, score submission, and V1
  endpoint regression.
- Frontend `npm run i18n:check`, lint, and production build.
- Responsive smoke at 320, 375, 430 portrait and 667x375, 844x390, tablet
  landscape.
- Browser smoke for camera permission denied, retry, manual input, opacity
  persistence, Zalo, logout, language persistence, stale polling, and V2 Station
  Detail return.
- V2 scanner smoke for auto-start, accepted token cleanup, rejected-token
  persistent preview, manual fallback, 600ms frame re-arm, different-token
  immediate retry, safe error mapping, and single-request duplicate protection.
- Regression diff/browser check that V1/Login/shared `QrTokenInput` markup and
  lifecycle remain unchanged.

## Implementation Notes

- Backend added Team-only `POST /api/player/qr-action`, returning the resolved
  `CHECK_IN` or `CHECK_OUT` action, Station ID, `requiresScore`, and progress.
- Existing V1 check-in/check-out endpoints remain available.
- Duplicate active Check-in now returns the existing progress without
  incrementing `attemptNo`; duplicate completed Check-out returns existing
  progress without a second update or score award.
- Frontend added fullscreen `/team/v2` under a Team-only protected route.
- `/stations/map` now exposes a Team-only V2 entry button.
- Station Detail opened with `?from=team-v2` returns successful Team gameplay
  actions to `/team/v2`.
- Settings, Leaderboard, and Station preview use the V2 opacity value on the
  entire overlay.
- The main HUD now follows the approved black-grid/neon reference: localized
  Team identity at the upper left, `MOVEment 2026` plus points at center, fixed V2
  accent Settings at the upper right, and progress/QR/Leaderboard at the bottom.
- The map keeps the source WebP aspect ratio, uses fixed-size screen-space
  markers/labels with 44px hit targets, and preserves map/overlay state across
  responsive resize without remounting the page.
- The center QR CTA now uses the V2-only `TeamV2QrBadge` inline SVG with fixed
  cyan/red tokens and responsive 112/96/88px sizing. Its primary-control CSS
  has sufficient route-local specificity to override the general Team Color
  button rule without changing other Team routes.
- `TeamV2QrScanner` owns V2 camera lifecycle, auto-start, safe manual fallback,
  rejected-token suppression/re-arm, and accepted/close/unmount cleanup while
  continuing to reuse only the shared `qrDetect` helpers.

## Verification Result

- Passed: targeted Backend PlayerService Jest (`28/28`).
- Passed: full Backend Jest (`157/157`).
- Passed: Backend lint and build.
- Passed: Frontend `i18n:check` (`356` keys), lint, and production build.
- Passed: authenticated headless Chrome responsive screenshots at 320, 375,
  and 430 portrait; 667x375, 844x390, and 1024x768 landscape/tablet.
- Passed: headless browser interaction smoke for mouse pan, wheel zoom, pinch
  zoom, double-click/double-tap reset, and Settings state retained across an
  orientation-size change.
- Passed: authenticated overlay smoke verified exact `MOVEment 2026` casing,
  one active dialog, a full-viewport blocking layer, centered 808x366 Settings
  at 844x390, and near-fullscreen 359x651 Settings/scanner/Leaderboard at
  375x667.
- Superseded on 2026-07-29: the first visual reconciliation allowed Team Color
  to replace the HUD accent. Cross-Team captures exposed that Team 05 changed
  V2 from the approved blue/green palette to magenta.
- Passed on 2026-07-29: fixed-palette reconciliation changed generic rounded HUD
  controls to angular sci-fi frames, isolated every V2 color token from
  `Team.color`/`--team-*`, and decoupled main-HUD opacity from panel opacity.
- Passed on 2026-07-29: authenticated Team 01 and Team 05 captures at 390x844
  and 844x390 both computed V2 accent `#1677FF`, heading/chip RGB
  `22, 119, 255`, score RGB `0, 255, 114`, no inherited `--team-primary`,
  Settings opacity `0.85`, and main-HUD opacity `1`.
- Passed on 2026-07-29: V2 QR badge computed 88px at 320x568, 96px at
  390x844, and 112px at 844x390, with no viewport crop or Progress/Leaderboard
  overlap. Computed badge strokes remained cyan `rgb(125, 249, 255)` and red
  `rgb(255, 77, 79)` under an authenticated Team 05 session.
- Passed on 2026-07-29: Chrome fake-camera smoke verified auto-start, hidden
  initial manual input, persistent live preview after actual Backend rejection,
  single-request suppression for a held rejected QR, immediate different-token
  handling, 600ms empty-frame re-arm, manual rejection while the camera stayed
  live, safe permission/playback errors with retry/manual fallback, and no raw
  Backend message in the UI.
- Passed on 2026-07-29: synthetic accepted-response frontend smoke verified one
  submit, modal unmount/navigation, stopped media track, and no decode callback
  after close. Shared V1/Login `QrTokenInput` was unchanged by the diff.
- Passed on 2026-07-29: Frontend `i18n:check` (`372` keys), lint, production
  build, and `git diff --check`. Vite retained the known non-blocking large
  chunk warning.
- Windows CRLF conversion warnings from `git diff --check` were non-fatal.
- Not performed: physical HTTPS scan on iPhone Safari/Chrome iOS or Android,
  Production runtime verification, push, or deploy.

## Rollout Notes

- `OPEN_QUESTIONS_AND_DECISIONS.md` records the fixed-palette V2 exception to
  the general Team Color rule.
- Register this document in `FEATURE_INDEX.md`.
- Update `PROJECT_ANALYSIS_SPEC.md`, `BACKEND_AUDIT.md`, and
  `IMPLEMENTATION_BACKLOG.md` after implementation and verification.
- Prompt path review: `docs/prompts/02_PLAYER_SCREENS_PROMPT.md` is the active
  repository-root path; older `docs/prompts/old/...` references are historical.
