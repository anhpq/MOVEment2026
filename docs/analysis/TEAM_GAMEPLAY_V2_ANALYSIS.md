# Team Gameplay V2 Analysis

## Status

| Area | Status |
| --- | --- |
| Implementation | Completed for supplied reference HTML palette/layout; V2 route, unified QR endpoint, persistent scanner, i18n, and navigation remain completed |
| Runtime/Production Verification | Local build and authenticated browser verification completed; Production verification not performed |
| Browser/Manual Verification | Team 01/05 cross-Team visual smoke completed at 320x568, 390x844, and 844x390; physical iOS/Android verification pending |

## 2026-07-31 Settings sizing and compact Leaderboard

- Settings now uses intrinsic content height and remains centered by the shared
  overlay grid. Its existing `max-height: 100%` and scrolling remain available
  only when the content exceeds the viewport; portrait no longer stretches it
  to full height.
- The V2 Leaderboard projects the authoritative API response to the first five
  rows. If the active Team is absent from those rows but exists later in the
  response, it is appended as the sixth row with display rank `6` and keeps its
  authoritative name, Station count, and score.
- The projection does not mutate the response or change Backend ranking,
  sorting, scoring, API contracts, or other Leaderboard screens.
- Focused Vitest passed (`10/10`) and full Frontend Vitest passed (`37/37`);
  i18n parity, Frontend lint, production build, and bundle gate passed. Chrome
  visual verification at `390x844` confirmed centered intrinsic Settings
  height; authenticated Leaderboard data verification remains pending.

## 2026-07-31 Marker interaction performance

- Root cause: every visible marker redrew its exact 180-`Arc` neon ring on each
  map frame, while unthrottled pointer events could enqueue React transform
  updates faster than the display refresh rate. The marker Layer also retained
  marker groups outside the viewport.
- Each unchanged normal/silver marker artwork is now cached as a local Konva
  bitmap at a resolution sized for the existing `32..64px` output. The exact
  path, 180-segment ring, palette, glow, scale, hit target, anchor, and state
  behavior remain unchanged; cache cleanup runs on palette change/unmount.
- Pan, wheel zoom, and touch transforms now coalesce to the latest value and
  commit at most once per `requestAnimationFrame`. Reset cancels pending work,
  and unmount cancels the scheduled frame.
- The marker Layer now applies the same viewport culling already used for
  labels/connectors, avoiding offscreen marker construction without changing
  coordinates.
- Focused Team V2 Vitest passed (`15/15`) and the full Frontend suite passed
  (`34/34`); i18n parity, Frontend lint, production build, and bundle gate also
  passed. A Chrome stress preview of 17 real cached marker
  components verified cyan/silver artwork and glow without cache clipping.
  Authenticated device-level FPS profiling remains pending.

## 2026-07-31 Detail sizing and footer readability

- Station Detail now uses intrinsic content height and remains centered by the
  overlay grid. Its maximum height is the available viewport; overflow scrolls
  only when content actually exceeds that limit. The mobile rule no longer
  stretches short Detail content to full screen height.
- The main-map Leaderboard control uses compact localized copy: `BXH` in VI and
  `RANK` in EN. The full Leaderboard overlay title remains unchanged.
- The center QR button diameter increases exactly threefold from `74px` to
  `222px`. The footer composition height and QR action geometry were expanded
  so the raised button remains above the two side panels.
- Leaderboard copy, QR caption, and Team/Station footer labels compensate for
  the responsive footer transform so their displayed font size remains at
  least `12px`.
- i18n parity, focused Team V2 Vitest (`12/12`), Frontend lint, production
  build, and bundle gate passed. Authenticated visual and physical-device
  verification remain pending.

## 2026-07-31 Station marker visibility and media affordances

- Team V2 always renders the YouTube and image-gallery controls in Station
  Detail. When their required media is unavailable, the control remains
  readable but disabled with a muted silver-neon treatment; no media action is
  invoked.
- Stations whose Player progress is `Finished` or whose backend status is
  `COMPLETED` do not render a marker, label, or connector. This is a render-only
  filter and does not modify Station coordinates, progress, APIs, or gameplay.
- A backend `LOCKED` Station retains its marker but uses the dedicated
  gray/silver-neon marker, halo, label, and connector palette. Locked state is
  evaluated before selected/active presentation so its unavailable state stays
  visually authoritative.
- Focused Team V2 tests passed (`12/12`) together with Frontend lint,
  production build, and bundle gate. Authenticated in-map and physical-device
  visual verification of these three states remains pending.

## 2026-07-31 Centered score-only map header

- Removed the `.team-v2-team` identity block from the V2 map HUD. Team identity
  data and authenticated state remain unchanged and continue to be available in
  the right footer/settings where already used.
- Total score remains authoritative state data and now occupies the centered
  header grid area in portrait and landscape. Brand and Settings placement are
  unchanged. This section supersedes earlier Team/score-row descriptions.

## 2026-07-31 Single-line marker labels

- Marker code/name text is constrained to one line with ellipsis inside the
  existing label width. The points value remains on its dedicated second line.
- Label dimensions, normalized zoom scale/gap, connector geometry, marker
  anchor, and Station data remain unchanged.
- Frontend lint, production build, bundle gate, focused marker-layout Vitest
  (`3/3`), and diff check passed.

## 2026-07-31 Exact Bézier Konva marker reference

- Replaced the previous polygon/circuit marker with the supplied exact
  Konva-native geometry: `640×620` design, curved outer and inner Bézier pin,
  radius-148 outer ring, black/white core, two highlights, and a seamless
  180-segment green/mint/purple circular neon ring.
- A single artwork transform uses center `(320,248)` and tip offset `(320,606)`,
  so the supplied lower tip remains the unchanged Station screen anchor without
  an image load or second zoom application.
- Marker artwork scales from `32px` to `64px` with normalized zoom and no longer
  contains a number; the Station code remains in the anchored label. The
  state-colored halo, minimum 44px hit target, labels/connectors, interactions,
  map data, and non-V2 screens remain unchanged. Focused marker
  layout Vitest (`3/3`), Frontend lint, production build, bundle gate, and a
  direct Chrome render of the actual repo component passed;
  authenticated in-map and physical-device visual verification remain pending.

## 2026-07-29 Runtime Stability Integration

- V2 state refresh now shares the Team runtime coordinator and polls every 15
  seconds only while visible and online; requests never overlap.
- Closed-overlay steady state uses the lean state request plus visible playing
  counts, staying within the eight-periodic-GET-per-minute budget.
- QR and score mutations execute once and perform at most one fresh state
  reconciliation; transient reconciliation failure does not replay mutations.
- Frontend tests cover hidden/offline polling and mutation reconciliation;
  production-like local smoke passed. Physical devices and Production remain
  unverified.

## 2026-07-30 V2-owned Detail and map HUD refinement

- Marker/label selection opens a near-fullscreen V2-owned Station Detail
  overlay without changing `/team/v2` or routing through Player Detail V1.
- The overlay has state-aware Start/Complete/Cancel behavior, V2 scanner/score
  integration, live timer, stats, video, and a V2-owned lazy image gallery.
- Check-in, completion, and cancel success close back to the V2 map. An active
  Station changes the QR caption to localized `In Progress` plus Station identity;
  camera startup remains user-triggered and rejection keeps the scanner open.
- The fixed banner now uses a shallow center plate with fluid striped rails;
  screen-space labels prefer a compact top position, may overlap each other,
  and always render below marker circles.
- This section supersedes every historical `?from=team-v2`, compact preview,
  collision-free-label-grid, and shared V1 Detail statement below.

## Objective and Scope

## 2026-07-30 Marker anchor and footer reference refinement

## 2026-07-30 Team V2 scanner-pin marker refinement

- Replaced the circular marker icon with a Konva-drawn scanner pin: dark navy
  surface, cyan/purple concentric rings, circuit traces, restrained glow, and
  a lower tip whose exact position is the persisted Station coordinate.
- Label clearance now measures from the visual top attachment of that pin;
  connector and label remain in the label layer below marker icons and use the
  same transformed anchor without a second zoom application.
- Marker state colors, code, click/tap/hover behavior, coordinates, map, API,
  footer, and banner remain unchanged. Authenticated Chrome visual smoke passed
  at map scales `0.3120`, `0.3900`, and `1.9500`; label/pin anchoring remained
  compact and the marker layer stayed above labels.

## 2026-07-30 Team V2 score and banner rails refinement

- Total score now uses explicit bright green foreground plus layered green neon;
  landscape centers it below the brand while portrait keeps the safe right-side
  score placement.
- Rebuilt the center brand plate and both rails with a taller angular frame,
  double cyan lines, long diagonal circuit stripes, and restrained glow matching
  the supplied HUD reference.
- Authenticated Chrome captures passed at 320x568, 390x844, and 844x390. Computed
  score color was `rgb(77, 255, 88)`, both rails remained symmetric, and the
  browser console reported no new errors or warnings.

- Removed the viewport-grid label placement that could place a label far from
  its marker. Every V2 label now derives from the marker's transformed screen
  anchor exactly once, stays above that marker, and uses normalized zoom-clamped
  scale (`0.85..1.15`) plus gap (`4..8px`).
- Label/connector rendering remains below the marker layer, so labels may
  overlap each other but never visually cover marker circles. Station marker
  coordinates, map assets, APIs, and gameplay state remain unchanged.
- Replaced the continuous footer pill with independent angular Leaderboard,
  centered raised QR/pedestal, and Team/progress controls joined only by thin
  cyan rails. Footer copy remains localized and QR/Leaderboard actions are
  unchanged.

### 2026-07-30 Review Decision Log

1. Label direction: always above the marker.
2. Label gap: normalized-zoom clamp from 4px to 8px.
3. Label size: scale the complete label from 0.85 to 1.15.
4. Footer copy: retain VI/EN localization and current state values.
5. Footer structure: three independent controls with decorative cyan rails.
6. Responsive model: uniformly scale the 600px footer composition on narrow viewports.
7. Visual acceptance: compare primarily at 390x844, with 844x390 and 320x568 regressions.

Add a parallel Team-only gameplay screen at `/team/v2` while preserving the
current `/stations/map` flow, database schema, seed data, scoring authority, and
confirmed Business Rules.

This feature covers:

- fullscreen Team Gameplay V2 HUD and responsive layout;
- shared map canvas reuse with the existing Suoi Tien WebP map, station
  coordinates, pan/zoom, and marker state;
- Team-only settings, opacity, language, Zalo, legacy UI return, and logout;
- unified Team Station QR action endpoint for camera and manual QR input;
- V2 leaderboard and V2-owned Station Detail overlays;
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
- Station Detail stays inside `/team/v2`; no Detail route/query is used.
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

- The screen follows the supplied black/cyan fantasy HUD reference over the real
  Suoi Tien map.
- The background is ink `#030C14` with edge vignette and dark top/bottom
  gradients so outdoor-facing text remains readable.
- The exact invariant brand copy at the top center is `MOVEment 2026`. CSS must
  preserve this casing and must not transform it to `MOVEMENT 2026`.
- The existing Aptos/Segoe UI stack remains authoritative. The HUD look comes
  from weight, uppercase gameplay labels, letter spacing, outlines, and glow;
  no runtime web-font dependency is allowed.

### Color Tokens

| Token / role | Value | Usage |
| --- | --- | --- |
| HUD accent / active | `#2FE4F0` | HUD frames, default/active markers, QR focus, and V2 primary controls |
| Cyan soft | `#7DF3F9` | Brand, icon, and secondary highlight |
| Score / completed | `#4DFF8A` | Total points, Station maximum points, completed state/count |
| Selected | `#FF3FD8` | Selected Station marker/connector and QR ring |
| QR secondary | `#B06BFF` | QR conic ring transition |
| Leaderboard | `#FFC94D` | Leaderboard trophy accent |
| Page background | `#030C14` | Fullscreen canvas and empty map space |
| Panel | `rgba(3, 14, 20, 0.82)` | HUD pill, labels, and overlays |
| Main text | `#EAFCFF` | Headings, values, controls, and readable foreground |
| Muted text | `#9FD4D9` | Kicker, help, metadata, and secondary copy |

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
| Top center | `MOVEment 2026` | Centered clipped cyan brand tab |
| Center below brand | Team total, `PTS` | Green neon score always centered in the viewport |
| Top right | Settings gear | 44px target, fixed V2 accent border and glow |
| Bottom left | Localized leaderboard label | Gold trophy inside the pill HUD |
| Bottom center | QR action, localized scan title/help | 74/64px floating dark badge with static pink-purple-cyan ring |
| Bottom right | Localized progress, `<completed>/17`, completed label | Cyan/green progress inside the pill HUD |

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
- Station Detail is a safe-area-aware near-fullscreen overlay capped at 960px
  in landscape and fills the inset viewport in portrait.
- Clicking the backdrop or Close icon dismisses the active overlay. Only one
  primary overlay is visible at a time; Station Detail is suppressed while a
  scanner/settings/score/leaderboard overlay is open.
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
   maximum points for every Station currently inside the viewport; labels may
   overlap each other but must stay below and never cover marker circles.
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

### Supplied HTML Reference Reconciliation

1. Adopt the reference cyan/green/pink/purple/gold tokens as fixed V2 tokens;
   this supersedes the earlier blue HUD and red lower QR arc.
2. Keep `MOVEment 2026` product copy and existing localized Team/gameplay copy;
   the reference controls composition and styling, not product data.
3. Recompose the existing header into a centered clipped brand plus Team/score
   row and Settings target without changing route/session behavior.
4. Recompose the footer into a centered pill panel with Leaderboard left,
   Progress right, and a floating QR CTA in the middle.
5. Keep inline SVG, accessibility target size, no idle animation, scanner
   lifecycle, overlays, map interactions, and V1/Login boundaries unchanged.
6. Apply every reference token through V2-owned constants/custom properties;
   do not read inherited Team Color variables even when global selectors have
   higher specificity.

## Acceptance Criteria

- Team users can open `/team/v2`; Admin users cannot access it.
- V1 map has a visible path to V2, and V2 can return to the existing UI.
- V2 renders fullscreen in portrait and landscape, with safe-area support.
- All 17 markers remain tappable with roughly 44px hit targets.
- Settings, Leaderboard, and Station Detail share the configured opacity.
- Main HUD fixed V2 accent remains full-strength when panel opacity is below 100%.
- Switching between Teams with different `Team.color` values does not change
  V2 HUD, default marker, QR, overlay, or primary-control colors.
- Settings, Leaderboard, QR scanner, and score entry block the underlying HUD
  and are centered/near-fullscreen in both orientations; Station Detail uses
  the same blocking near-fullscreen policy.
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
- Station Detail never leaves `/team/v2`; close, Check-in, completion, and
  cancel return to the preserved map state.
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
- Marker/label selection opens the V2-owned Station Detail overlay directly;
  V1 Player Detail no longer contains a V2 compatibility query branch.
- Settings, Leaderboard, and Station Detail use the V2 opacity value on the
  entire overlay.
- The main HUD uses a centered clipped `MOVEment 2026` brand, Settings at the
  upper right, no Team identity block on the map, a viewport-centered green
  total score, and three independent bottom controls.
- The map keeps the source WebP aspect ratio, uses fixed-size screen-space
  markers/labels with 44px hit targets, and preserves map/overlay state across
  responsive resize without remounting the page.
- The center QR CTA uses the V2-only `TeamV2QrBadge` inline SVG with a static
  pink-purple-cyan conic ring, dark core, 74px default size, and 64px size up to
  380px. Its primary-control CSS retains sufficient route-local specificity to
  override the general Team Color button rule without changing other routes.
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
- Superseded on 2026-07-29: the blue/red 112/96/88px QR/HUD visual was replaced
  by the supplied HTML reference while retaining its scanner lifecycle and
  fixed-palette isolation rules.
- Passed on 2026-07-29: authenticated Team 01 and Team 05 Chrome captures at
  390x844 and 844x390 both computed fixed accent `#2FE4F0`, heading white,
  score `rgb(77, 255, 138)`, no inherited `--team-primary`, Settings opacity
  `0.85`, and main-HUD opacity `1`.
- Passed on 2026-07-29: 320x568 computed a 64x64 QR target, 44x44 Settings and
  bottom targets, centered QR ring
  `#FF3FD8` → `#B06BFF` → `#2FE4F0`, Leaderboard on the left, and Progress on
  the right without viewport crop.
- Passed on 2026-07-29: reference reconciliation retained the previous scanner
  implementation and did not modify V1, Login, shared `QrTokenInput`, Backend,
  database, migration, seed, or token format.
- Windows CRLF conversion warnings from `git diff --check` were non-fatal.
- Not performed: physical HTTPS scan on iPhone Safari/Chrome iOS or Android,
  Production runtime verification, push, or deploy.
- Passed on 2026-07-30: V2 Detail/gallery/scanner targeted Vitest (`8/8`), full
  Frontend Vitest (`26/26`), i18n parity (`391` keys), Frontend lint,
  production build, and bundle gate.
- Passed on 2026-07-30: authenticated Chrome smoke verified banner/rails at
  the approved seven viewport sizes and opening an Available Detail while the
  URL remains `/team/v2`.
- Pending on 2026-07-30: authenticated browser verification for active QR
  caption, Complete/Cancel, and physical mobile camera behavior.

### 2026-07-30 Decision Log

1. Boundary: V2 Detail stays inside `/team/v2`; Settings may still return to V1.
2. Navigation: Detail is an overlay, not a nested or modal route.
3. Capability: match Player V1 Detail features with V2-owned presentation.
4. State actions: Available starts, In Progress completes/cancels, Finished reads.
5. Responsive: use near-fullscreen safe-area geometry.
6. Ownership: V2 owns Detail/gallery UI and reuses shared data/domain helpers.
7. Transition: successful Check-in/Complete/Cancel closes back to the V2 map.
8. Active QR: show localized active Station context; camera starts only on click.
9. Scanner error: preserve the current persistent rejection/retry behavior.

## Rollout Notes

- `OPEN_QUESTIONS_AND_DECISIONS.md` records the fixed-palette V2 exception to
  the general Team Color rule.
- Register this document in `FEATURE_INDEX.md`.
- Update `PROJECT_ANALYSIS_SPEC.md`, `BACKEND_AUDIT.md`, and
  `IMPLEMENTATION_BACKLOG.md` after implementation and verification.
- Prompt path review: `docs/prompts/02_PLAYER_SCREENS_PROMPT.md` is the active
  repository-root path; older `docs/prompts/old/...` references are historical.
