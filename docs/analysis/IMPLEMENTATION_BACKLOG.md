# MOVEment 2026 - Implementation Backlog

## 2026-08-12 Team V2 demo visual port

- [x] Port demo v4 HUD, footer, expandable legend, semantic marker appearance, and local font assets to Team V2 while retaining the production map and behavior.
- [ ] Re-run BrowserStack Safari macOS/iPhone smoke after network permits outbound `hub-aps.browserstack.com`.

## 2026-08-12 Final, Station switching, and Team V2 mobile

- [x] Persist Final Top 10 table and strict internal-whitespace normalization rule.
- [x] Remove Station cancel cooldown and handle A→B transition atomically.
- [x] Reduce Team V2 map React work during gestures and size the low-height landscape footer by viewport height.

## 2026-08-04 Team V2 direct marker-to-game flow

- [x] Remove the intermediate selected-Station preview card.
- [x] Open V2 Station/Game Detail directly from marker clicks.
- [x] Apply the same direct behavior to Team overview Station actions.
- [x] Clear selection when Detail closes.
- [x] Verify focused Vitest `8/8`, lint, build, and bundle budget.

## 2026-08-04 Team V2 overview overlay

- [x] Open a V2-owned Team overview from the right footer tab.
- [x] Show Team score, rank, progress, and current Station from live data.
- [x] Group Stations by Completed/Playing/Not played.
- [x] Show Station code, name, and points on every row.
- [x] Return to the selected Station from Continue/row actions.
- [x] Verify i18n `436`, lint, production build, and bundle budget.
- [ ] Confirm authenticated visual hierarchy and long-name truncation on-device.

## 2026-08-04 Team V2 cyberpunk wing footer

- [x] Replace the rounded frame with clipped left/right neon wings.
- [x] Add angled center notches, technical rails, and a Scan CTA pedestal.
- [x] Preserve BXH, scanner, and Team navigation behavior.
- [x] Verify lint, production build, and bundle budget.
- [ ] Confirm pixel similarity against the supplied footer reference on-device.

## 2026-08-04 Team V2 absolute-centered scanner

- [x] Center-anchor the Scan CTA for equal top/bottom protrusion at every scale.
- [x] Raise the Scan caption by `4px`.
- [x] Verify lint, production build, and bundle budget.

## 2026-08-04 Team V2 centered footer scanner

- [x] Center the `72px` side rails and enclosing border inside the `96px` footer.
- [x] Make the `96px` Scan CTA protrude equally by `12px` above and below.
- [x] Verify lint, production build, and bundle budget.
- [ ] Confirm final geometry on a physical target device.

## 2026-08-04 Team V2 compact footer baseline

- [x] Remove the Team V2 map legend from rendering and state.
- [x] Reduce the Scan CTA to `96px`.
- [x] Align the Scan CTA and enclosing footer frame on one bottom baseline.
- [x] Verify focused Vitest `8/8`, lint, build, and bundle budget.
- [ ] Confirm final footer alignment on a physical target device.

## 2026-08-03 Team V2 attached marker points and scanner framing

- [x] Render points/trophy/lock pills inside the same group as each pin.
- [x] Remove the separate collision-filtered points layer.
- [x] Reduce center Scan CTA to `104px` and prevent frame lines crossing it.
- [x] Verify focused Vitest `8/8`, lint, build, and bundle budget.
- [ ] Confirm footer contour on a physical target device.

## 2026-08-03 Team V2 compact navy marker refinement

- [x] Reduce pins to `30px` default and points pills to `52x18px`.
- [x] Use navy pin interiors and a subtle circular code outline.
- [x] Reduce closed/open legend dimensions.
- [x] Remove duplicate inner footer borders and show the live localized Team name.
- [x] Verify focused Vitest `8/8`, i18n `428`, lint, build, and bundle budget.
- [ ] Confirm dense-marker readability on a physical target device.

## 2026-08-03 Team V2 premium map HUD refinement

- [x] Enclose both footer tabs and the `112px` center Scan CTA in one full-width frame.
- [x] Default the legend to a compact button and add an accessible open panel.
- [x] Remove the active text chip; retain lightning and three gold ground rings.
- [x] Improve Completed-marker legibility and reduce the map vignette.
- [x] Verify focused Vitest `8/8`, i18n `428`, lint, build, and bundle budget.
- [ ] Confirm pixel alignment and touch ergonomics on physical 360–430px devices.

## 2026-08-03 Team V2 dense-map readability and footer

- [x] Reduce markers to `34px` default and points pills to `58x19px`.
- [x] Increase portrait map coverage from `78%` to `94%`.
- [x] Reduce legend width and typography by approximately 20%.
- [x] Scale footer through `2.4x` and enclose tabs plus QR in one outer frame.
- [x] Verify focused Vitest `14/14`, i18n `426`, lint, build, and bundle.
- [ ] Confirm dense-cluster readability and footer clearance on target devices.

## 2026-08-03 Team V2 marker legend

- [x] Add responsive lower-left Available/In Progress/Completed legend.
- [x] Match cyan points, gold points, and blue-gray trophy treatments.
- [x] Preserve Backend-driven marker IDs, states, points, and coordinates.
- [x] Verify focused Vitest `14/14`, i18n `426`, lint, build, and bundle.
- [ ] Confirm legend clearance against real marker density on target devices.

## 2026-08-03 Team V2 spec-locked bottom navigation

- [x] Implement `336x96px` coordinates with `120 + 96 + 120` widths.
- [x] Use `72px` tabs, `96px` CTA, `2px` border, and `16px` outer corners.
- [x] Scale the complete component uniformly between `0.82x` and `1.5x`.
- [x] Remove the extra base frame and wide underlapping geometry.
- [x] Verify focused Vitest `14/14`, i18n `422`, lint, build, and bundle.
- [ ] Confirm authenticated pixel alignment against the annotated reference.

## 2026-08-03 Team V2 overlapped footer geometry

- [x] Add a continuous `82px` footer base frame.
- [x] Extend both `284px` wings beneath the center scanner.
- [x] Place the Scan label inside the `128px` scanner ring.
- [x] Verify focused Vitest `14/14`, i18n `422`, lint, build, and bundle.
- [ ] Confirm authenticated pixel alignment on the reported viewport.

## 2026-08-03 Team V2 large simplified footer

- [x] Increase center scanner to `128px` and footer composition to `154px`.
- [x] Increase wing height to `78px` and enlarge action icons/labels.
- [x] Remove secondary visible headings and score/progress copy from the wings.
- [x] Increase map/preview clearance for the enlarged footer.
- [x] Verify focused Vitest `14/14`, i18n `422`, lint, build, and bundle.
- [ ] Confirm authenticated rendering on the reported viewport.

## 2026-08-03 Team V2 framed HUD regression fix

- [x] Reset inherited header bottom/width/border geometry that covered the map.
- [x] Remove inherited footer container frame and minimum height.
- [x] Keep central footer action labeled Scan in every Station state.
- [x] Verify focused Vitest `14/14`, i18n `422`, lint, build, and bundle.
- [ ] Confirm authenticated rendering on the reported viewport.

## 2026-08-03 Team V2 framed viewport composition

- [x] Move brand and total score into a dedicated HUD above the map canvas.
- [x] Inset the map between header and footer without changing coordinates.
- [x] Replace the `204px` footer with symmetric wings and a `92px` center scan.
- [x] Reposition selected-Station preview above the compact footer.
- [x] Verify focused Vitest `14/14`, i18n `422`, lint, build, and bundle.
- [ ] Confirm authenticated appearance at target kiosk/device resolutions.

## 2026-08-03 Team V2 premium map state hierarchy

- [x] Style Available markers cyan and the active marker gold at `118%` scale.
- [x] Add active Playing chip, lightning badge, stronger halo, and ground rings.
- [x] Replace Completed points pill with a trophy and subdued blue-gray palette.
- [x] Recompose footer hierarchy as Leaderboard, Scan, and My team.
- [x] Verify focused Vitest `14/14`, i18n `422`, lint, build, and bundle.
- [ ] Confirm authenticated rendering and physical-device performance.

## 2026-08-03 Team V2 compact variable-length markers

- [x] Reduce pins to `44px` default (`38..58px`) and pills to `68x22px`.
- [x] Scale marker typography for two-, three-, and four-or-more-character codes.
- [x] Verify focused Vitest `14/14`, i18n `420` keys, lint, build, and bundle.
- [ ] Confirm authenticated in-map rendering on the physical target device.

## 2026-08-03 Team V2 reference-proportioned markers

- [x] Increase pin and pill proportions to match the supplied close-up reference.
- [x] Add restrained double-outline glow and dark number depth surface.
- [x] Keep the pin interior free of decorative icons/illustrations.
- [x] Add selected-state purple pill echoes.
- [x] Preserve state/data/anchor/hit-target and gameplay behavior.
- [x] Pass focused tests, i18n parity, lint, build, and bundle budget.
- [ ] Complete authenticated visual smoke across dense clusters and all marker states.

## 2026-08-03 Team V2 total-score clarity and taller pins

- [x] Identify the green HUD value explicitly as authoritative Team total score.
- [x] Add localized Total score copy and a dedicated background panel.
- [x] Remove the inner pin circle and increase pin width/height.
- [x] Preserve Station number, state, pill, anchor, and hit-target behavior.
- [x] Pass focused tests, i18n parity, lint, build, and bundle budget.
- [ ] Complete authenticated visual smoke for HUD/marker separation at the
  reported viewport and representative phone/tablet orientations.

## 2026-08-03 Team V2 teardrop marker states

- [x] Match the supplied compact teardrop and inner-ring marker silhouette.
- [x] Keep Station numbers dominant and readable.
- [x] Apply cyan Available/active and purple selected presentation.
- [x] Replace Locked points text with a lock symbol while preserving state.
- [x] Pass focused tests, i18n parity, lint, build, and bundle budget.
- [ ] Complete authenticated visual smoke across default, selected, Completed,
  and Locked states at representative phone/tablet sizes.

## 2026-08-03 Team V2 simplified pins and footer

- [x] Replace dense pin artwork with a simple high-contrast numeric pin.
- [x] Reduce and fully round the points pill.
- [x] Reduce the QR action and footer composition heights.
- [x] Separate QR, caption, and lower footer panels to prevent overlap.
- [x] Preserve responsive hit targets and gameplay behavior.
- [x] Pass focused tests, i18n parity, lint, build, and bundle budget.
- [ ] Complete authenticated visual smoke at the reported viewport plus phone,
  tablet portrait, and low-height landscape sizes.

## 2026-08-03 Team V2 compact numeric markers

- [x] Render the Station display number inside every visible V2 pin.
- [x] Render only effective maximum points in a compact pill below each pin.
- [x] Remove Station names and connector lines from the map surface.
- [x] Preserve state palettes, badges, interactions, and preview/Detail names.
- [x] Pass focused tests, i18n parity, lint, build, and bundle budget.
- [ ] Complete authenticated visual smoke for dense marker clusters, selected,
  Completed, and Locked states at phone/tablet portrait and landscape sizes.

## 2026-08-03 Team V2 selected-Station preview

- [x] Keep the map visible after marker selection.
- [x] Show a compact image/code, name, score, and description preview.
- [x] Open the existing full Detail only from an explicit View mission action.
- [x] Add synchronized VI/EN visible and accessible copy.
- [x] Pass focused tests, i18n parity, lint, build, and bundle budget.
- [ ] Complete authenticated visual smoke at phone, tablet portrait, and
  low-height landscape sizes with long Station names and missing images.

## 2026-08-03 Team V2 portrait HUD readability

- [x] Scale the raised QR/footer composition by portrait height as well as width.
- [x] Keep portrait Fullscreen and Settings actions on one compact row.
- [x] Clamp Station labels to the viewport and suppress screen-space collisions.
- [x] Prioritize selected and active Station labels without hiding markers.
- [x] Pass focused tests, i18n parity, lint, build, and bundle budget.
- [ ] Complete authenticated visual smoke at `390x844`, `824x1312`, and
  `844x390`, plus physical-device safe-area verification.

## 2026-08-03 Team V2 default route trial

- [x] Route Team username and QR login success to `/team/v2`.
- [x] Route authenticated login recovery and Team fallback/home to `/team/v2`.
- [x] Preserve V1 routes and the V2 return-to-V1 action.
- [x] Add synchronized VI/EN Team home recovery copy.
- [x] Pass Frontend tests, i18n parity, lint, build, and bundle budget.
- [ ] Complete authenticated browser smoke for every login and fallback entry.

## 2026-08-03 Completed Station gameplay button

- [x] Disable the Team V1 Station List gameplay button after completion.
- [x] Disable the Team V1 map drawer gameplay button after completion.
- [x] Keep bilingual Finished labels and independent media actions.
- [x] Pass Frontend tests, i18n parity, lint, build, and bundle budget.
- [ ] Complete authenticated mobile visual smoke for disabled completed actions.

## 2026-08-03 Team score confirmation copy

- [x] Show the submitted score and Station identity in Team V1/V2 confirmation.
- [x] Warn that Team score cannot be self-edited after confirmation.
- [x] Keep Vietnamese and English confirmation wording synchronized.
- [x] Pass Frontend tests, i18n parity, lint, build, and bundle budget.
- [ ] Complete authenticated mobile visual smoke for long Station names.

## 2026-08-03 Team score reason removal

- [x] Remove the optional reason field from Team score entry after Check-out.
- [x] Submit only the Team score while retaining mandatory Admin reasons.
- [x] Pass Frontend tests, i18n parity, lint, build, and bundle budget.
- [ ] Complete authenticated mobile visual smoke of the simplified score modal.

## 2026-08-03 QR modal Station identity layout

- [x] Place the Station code badge and name on one responsive row for both
  Check-in and Check-out.
- [x] Pass Frontend tests, lint, production build, and bundle budget.
- [ ] Complete mobile visual smoke with representative long Station names.

## 2026-08-03 Check-out QR camera-first modal

- [x] Match the Station Detail Check-out modal to the camera-first Check-in UI.
- [x] Keep scan auto-submit and collapsible manual token entry.
- [x] Show Station identity and concise player-facing guidance.
- [x] Pass Frontend tests, i18n parity, lint, build, and bundle budget.
- [ ] Complete physical iOS/Android camera and responsive visual smoke.

## 2026-08-03 Check-in QR camera-first modal

- [x] Make camera scanning the primary Station List Check-in action.
- [x] Collapse manual token entry and reveal it on request/camera failure.
- [x] Auto-submit scanned QR and disable empty manual confirmation.
- [x] Replace Backend-oriented explanatory UI with concise player copy.
- [x] Pass full Frontend tests, i18n parity, lint, build, and bundle budget.
- [ ] Complete physical iOS/Android camera and responsive visual smoke.

## 2026-08-02 Video action color refinement

- [x] Reduce enabled Watch Video color intensity in Team V1 and Team V2.
- [x] Preserve disabled state, interaction behavior, and media rules.
- [x] Pass focused tests, Frontend lint, build, and bundle budget.
- [ ] Complete manual mobile/desktop visual review.

## 2026-08-02 Frontend UI usability and accessibility optimization

- [x] Add Leaderboard initial-load error/retry while preserving stale-data UX.
- [x] Redirect unknown routes according to Admin, Team, or anonymous session.
- [x] Localize shared authorization and navigation accessibility copy.
- [x] Label map controls and expose truncated Team/Leaderboard names.
- [x] Improve representative mobile text sizes and touch targets.
- [x] Pass Frontend tests, i18n parity, lint, build, and bundle budget.
- [ ] Complete authenticated desktop/mobile visual and keyboard smoke.
- [ ] Remove confirmed orphaned Legacy CSS in a separate bounded refactor.

## 2026-08-02 Admin Leaderboard authorization fix

- [x] Route Admin Leaderboard reads through `GET /api/leaderboard` and retain
  `GET /api/player/leaderboard` for authenticated Team sessions.
- [x] Stop treating HTTP `403 Forbidden` as an expired session; automatic local
  logout remains limited to HTTP `401 Unauthorized`.
- [ ] Complete a manual browser click-through using an Admin session after the
  rebuilt Frontend is running.

## 2026-08-08 Team V2 Settings display controls

- [x] Move Fullscreen from the header into Settings and add progressive landscape lock with localized fallback.
- [x] Apply the supplied QR badge sizing/offset at every breakpoint.
- [x] Pass focused Frontend Vitest, i18n parity, production build, and bundle gate.
- [ ] Verify fullscreen/landscape behavior in Chrome and Safari, including iPhone Safari manual-rotation guidance.

## 2026-08-02 Team V2 browser fullscreen

- [x] Add an accessible enter/exit fullscreen control next to Team V2 Settings
  using the standard Fullscreen API and Safari `webkit*` fallback.
- [x] Keep the icon synchronized with fullscreen events and suppress the
  redundant control in iOS/Home Screen or standard standalone mode.
- [x] Add localized unsupported-browser guidance, Apple standalone metadata,
  theme/status-bar color, and dynamic viewport-height handling.
- [x] Pass focused Vitest `5/5`, full Frontend Vitest `60/60`, i18n parity
  `399`, full Frontend lint, production build, bundle gate, and diff check.
- [ ] Verify enter/exit behavior on desktop Safari and iPadOS Safari, plus Add
  to Home Screen standalone launch on a physical iPhone.

## 2026-08-02 Request and database hot-path follow-up

- [ ] P0: throttle Team-session `lastSeenAt` writes to a conditional heartbeat
  no more than once per 60 seconds while preserving revocation validation on
  every request; compare tuple updates/WAL and auth behavior before/after.
- [ ] P0: add a 5-15 second single-flight cache for catalog version and lean
  leaderboard with explicit invalidation after relevant Admin/gameplay/Final
  mutations; verify freshness and `/api/player/state` query-count reduction.
- [ ] P0: replace Event Config read-path `upsert` with `findUnique` plus a safe
  missing-row create fallback; verify concurrent missing-row behavior and no
  read-path write statements.
- [ ] P1: capture Production-like Prisma query counts, PostgreSQL statement/WAL
  metrics, and p95 latency before choosing cache TTLs.
- [ ] P2: add Final-submission or Activity Log indexes only after table growth
  plus `EXPLAIN (ANALYZE, BUFFERS)` demonstrates a useful plan change.

## 2026-08-01 Network request and transfer optimization

- [x] Replace the 42-request Admin QR status fan-out with one metadata-only
  summary endpoint while keeping raw-token retrieval behind explicit preview.
- [x] Trim the Admin progress-matrix projection/response from 101,512 to 75,993
  bytes locally and remove its unused changing `serverNow`, enabling a verified
  zero-body `304` when matrix data is unchanged.
- [x] Reuse `/api/player/state.final` on Station List and remove its separate
  periodic Final request.
- [x] Use a 30-second default polling interval and cap map selection at 1920px
  for Data Saver, `2g`, and `slow-2g` clients.
- [x] Enable conditional revalidation for playing counts, Player leaderboard,
  and Admin QR summary; remove JSON Content-Type from bodyless GET requests and
  cache cross-origin preflight permission for 10 minutes.
- [x] Add Nginx gzip plus fingerprinted/stable/HTML cache policies and matching
  OBS object metadata behavior.
- [x] Pass Backend Jest `164/164`, lint/build; Frontend Vitest `55/55`, i18n
  parity `395`, lint/build/bundle gate; deploy shell syntax and workflow YAML
  parse; local CORS preflight returned `204` with max-age `600`; Admin matrix
  and QR summary revalidation returned `304` with zero body bytes.
- [x] Update Graphify to `2784` nodes / `4714` edges and forward-query the new
  System Config summary path; retain known zero-node SQL/hooks and label-refresh
  warnings as non-blocking tooling gaps.
- [ ] Run `nginx -t` on the target server and verify live gzip, cache headers,
  ETag/304, OBS metadata, request counts, and reduced-data map selection in a
  real browser after an authorized deployment.

## 2026-07-31 Team V2 background-only overlay opacity

- [x] Set the new Team V2 overlay default to `95%` and reset the old stored
  preference once through a versioned storage key.
- [x] Apply opacity only to backdrop/panel background colors through a shared
  typed CSS-variable helper; keep all overlay content at `100%` opacity.
- [x] Cover default, invalid-value fallback, clamping, and absence of parent
  `opacity` with focused tests.
- [x] Pass focused Vitest `11/11`, full Frontend Vitest `39/39`, i18n parity,
  Frontend lint, production build, bundle gate, diff check, and Chrome visual
  verification.

## 2026-07-31 Team V2 inactive language contrast

- [x] Darken and desaturate the unselected Settings language control while
  preserving a readable hover/focus state and the selected cyan treatment.
- [x] Scope the override to Team V2 Settings without modifying the shared
  component or other screens.
- [x] Pass full Frontend Vitest `37/37`, i18n parity, Frontend lint, production
  build, bundle gate, diff check, and Chrome visual verification using the real
  `LanguageSwitch` component.

## 2026-07-31 Team V2 Settings and compact Leaderboard

- [x] Center Settings at intrinsic content height on desktop and portrait while
  retaining viewport-capped scrolling.
- [x] Display the first five Leaderboard response rows and append the current
  Team with V2 display rank `6` only when it is outside those rows.
- [x] Preserve the authoritative response and all Backend ranking/scoring/API
  behavior; add focused projection coverage including non-mutation.
- [x] Pass focused Vitest `10/10`, full Frontend Vitest `37/37`, i18n parity,
  Frontend lint, production build, bundle gate, diff check, and Settings Chrome
  visual verification at `390x844`.
- [ ] Complete authenticated Leaderboard-data and physical-device verification.

## 2026-07-31 Team V2 marker interaction performance

- [x] Cache unchanged normal/silver marker artwork while preserving the exact
  180-segment design, glow, state palette, and `32..64px` output.
- [x] Coalesce pan, wheel, and touch transform updates to one latest-value React
  commit per animation frame with reset/unmount cleanup.
- [x] Cull marker groups outside the viewport consistently with labels and
  connectors.
- [x] Pass focused Vitest `15/15`, full Frontend Vitest `34/34`, i18n parity,
  Frontend lint, production build, bundle gate, diff check, and a 17-marker
  Chrome cache/clipping stress preview.
- [ ] Record authenticated physical-device FPS/frame-time before and after the
  optimization under representative pan and pinch gestures.

## 2026-07-31 Team V2 Detail sizing and footer readability

- [x] Size Station Detail to intrinsic content, center it, and retain
  viewport-capped scrolling without mobile full-height stretching.
- [x] Use compact `BXH`/`RANK` footer copy and increase the QR button from
  `74px` to `222px` with non-overlapping raised geometry.
- [x] Keep displayed Leaderboard, QR-caption, and Team/Station-label typography
  at least `12px` after responsive footer scaling.
- [x] Pass i18n parity, focused Vitest `12/12`, Frontend lint, production build,
  and bundle gate.
- [ ] Complete authenticated responsive visual and physical-device verification.

## 2026-07-31 Team V2 marker states and disabled media controls

- [x] Keep YouTube and image-gallery controls visible and style unavailable
  actions as readable disabled silver-neon controls.
- [x] Hide the complete Team V2 marker group for `Finished`/`COMPLETED`
  Stations without changing Station coordinates or progress data.
- [x] Render backend `LOCKED` Stations with an authoritative silver-neon
  marker, halo, label, and connector.
- [x] Pass focused Vitest `12/12`, Frontend lint, production build, and bundle
  gate.
- [ ] Complete authenticated in-map state comparison and physical-device visual
  verification.

## 2026-07-31 Team V2 exact Bézier Konva marker

- [x] Replace polygon/circuit artwork with the supplied `640×620` curved outer
  and inner Bézier paths, exact rings/core/highlights, and 180-Arc circular
  neon gradient.
- [x] Align tip `(320,606)` to the unchanged Station anchor and preserve the
  `32..64px` size clamp, state halo, hit target, labels, and map behavior.
- [x] Pass Frontend lint, production build, bundle gate, focused marker-layout
  Vitest `3/3`, diff check, and direct Chrome rendering of the repo component.

## 2026-07-31 Team V2 single-line marker labels

- [x] Keep marker code/name on one line and truncate overflow with ellipsis.
- [x] Preserve the points row beneath the name plus all anchor/scale/gap
  geometry.
- [x] Pass Frontend lint, production build, bundle gate, focused marker-layout
  Vitest `3/3`, and diff check.

## 2026-07-31 Team V2 centered score-only map header

- [x] Remove `.team-v2-team` identity markup and route-local styles from the V2
  map header without changing Team state or other identity surfaces.
- [x] Keep `.team-v2-score` in the centered header grid area for portrait and
  landscape while preserving authoritative score data and green neon styling.
- [x] Pass Frontend lint, production build, bundle gate, and diff check.

## 2026-07-31 Team V2 supplied Konva-native marker (superseded)

- [x] Replace the interim SVG-image marker with the supplied native Konva
  geometry, gradients, rings, circuit traces, speed lines, and glow.
- [x] Use the supplied `(320, 590)` tip as the single marker offset; clamp its
  normalized-zoom size to `32..64px` without applying zoom twice.
- [x] Remove the number inside the marker while keeping Station code in the
  anchored label; preserve state halo, minimum hit target, and map behavior.
- [x] Remove the obsolete SVG asset/load lifecycle and pass focused marker
  layout Vitest `3/3`, Frontend lint, production build, bundle gate, and diff
  check.
- [ ] Run authenticated in-map and physical-device visual verification.

## 2026-07-31 Team V2 supplied SVG marker (superseded)

- [x] Replace only the Team V2 hand-built pin artwork with the supplied
  cyan/purple SVG marker.
- [x] Keep the SVG lower tip on the unchanged Station anchor and preserve the
  Station code, state halo, hit target, labels, connectors, and map behavior.
- [x] Pass focused marker-layout Vitest `3/3`, Frontend lint, production build,
  bundle gate, diff check, and direct Chrome SVG rendering.
- [ ] Run authenticated in-map and physical-device visual verification.

## 2026-07-30 Team V2 score and banner rails refinement

- [x] Render total score in bright green with layered neon and center it below
  the brand in landscape while preserving portrait-safe placement.
- [x] Replace the shallow brand/rails styling with a taller angular plate and
  long symmetric striped cyan rails.
- [x] Pass i18n parity `395`, lint, full Vitest `29/29`, production build,
  bundle gate, diff check, authenticated 320x568/390x844/844x390 captures, and
  browser-console inspection.

## 2026-07-30 Team V2 scanner-pin marker refinement

- [x] Replace the circular V2 map marker with a vector scanner pin whose lower
  tip remains the exact Station coordinate, preserving state colors and input.
- [x] Keep labels/connectors attached from the pin top using the shared
  screen-space anchor, clamped scale/gap, and marker-above-label layer order.
- [x] Pass focused marker layout `3/3`, full Frontend Vitest `29/29`, i18n
  parity `395`, lint, production build, bundle gate, and diff check.
- [x] Capture authenticated marker screenshots at min/default/max map scales
  `0.3120`, `0.3900`, and `1.9500`; inspect browser console with no new issues.

## 2026-07-30 Canonical Station seed data synchronization

- [x] Apply the supplied 17-record Station dataset to canonical seed fields:
  content, media URL, points, exact decimal map coordinates, and `ST` type.
- [x] Make local/test content synchronization upsert Station/Game data in place
  so canonical content changes do not trigger destructive Station replacement.
- [x] Validate 17 unique records, four `ST` games, two seed executions, zero
  database mismatches, 34 active Station QR tokens, 425 progress rows, Backend
  lint/build, full Jest `162/162`, and `db:verify`.
- [~] Local data caveat: the initial validation seed used the prior replacement
  behavior and reset local gameplay state before the in-place guard was added.
  Production was not accessed; retain this as an operational warning until a
  fresh non-destructive seed rehearsal starts from non-empty progress data.

## 2026-07-30 Team Gameplay V2 marker anchoring and footer refinement

- [x] Replace V2 viewport-grid marker label placement with a single marker
  screen anchor, clamped scale/gap, label/connector-under-marker draw order,
  and no Station-coordinate mutation.
- [x] Replace the V2 footer pill with independent angular Leaderboard, raised
  QR pedestal, and Team/completed-Station controls joined only by thin rails.
- [x] Add VI/EN footer copy and focused marker-layout geometry tests.
- [x] Pass marker-layout Vitest `3/3`, full Frontend Vitest `29/29`, i18n
  parity `395`, lint, production build, bundle gate, and diff check.
- [x] Complete authenticated visual comparison at 390x844, 844x390, and
  320x568 with no footer overlap/crop after responsive state settled.

## 2026-07-30 Team Gameplay V2-owned Detail and map HUD

- [x] Replace V2 routing through `?from=team-v2` with a V2-owned Detail overlay
  that preserves `/team/v2` URL and map state.
- [x] Add state-aware Start/Complete/Cancel behavior using existing V2 scanner,
  score, cancel, Player state, and backend-authoritative QR action contracts.
- [x] Add a V2-owned lazy Station gallery presentation without changing V1.
- [x] Show localized active Station status/code/name below the on-demand QR CTA.
- [x] Refine the reference banner, compact label placement/connectors, and
  label-below-marker draw order without changing Station coordinates.
- [x] Pass targeted V2 Detail/Gallery/Scanner Vitest `8/8`, full Frontend Vitest `26/26`, i18n parity
  `391`, Frontend lint, production build, and bundle gate.
- [~] Authenticated Chrome smoke passed banner/rails at all approved viewports
  and Detail opening without URL change; active-Station Complete/Cancel remains
  pending browser verification.
- [ ] Complete physical iOS/Android camera and Production runtime verification.

## 2026-07-29 Team runtime stability resume completion

- [x] Review mutation reconciliation, session-principal isolation, polling
  guards, and lean-to-legacy fallback after checkpoint `d952af55`.
- [x] Restore Frontend dependencies from lockfile and make Vitest Web Storage
  setup deterministic on Node v26.
- [x] Add automated hidden/offline/non-overlap polling and one-refresh mutation
  reconciliation coverage; Frontend Vitest passes `19/19`.
- [x] Re-run Backend Jest `162/162`, Backend lint/build, Frontend lint, i18n
  parity `388`, production build, and bundle gate.
- [x] Pass production-like HTTPS smoke on a disposable database: 18 migrations,
  seed twice, `db:verify`, auth/QR/scoring/Final/leaderboard, secret scan, and
  production environment guards.
- [x] Measure lean canonical payloads: state `3,885` bytes, catalog `5,908`
  bytes, 17 Stations, and no catalog `imageUrls`.
- [x] Reconcile production-like fixtures with bilingual Station DTO,
  idempotent duplicate score behavior, TIME score `10`, and independent
  `finalStartsAt`.
- [ ] Manual responsive Team V1/V2 browser smoke and physical iOS/Android remain
  pending.
- [ ] Production migration/deploy/runtime verification remains pending and
  requires explicit authorization.
- [ ] React Router reports two high-severity advisories limited to unused
  unstable RSC APIs; a breaking forced upgrade remains deferred.

# 2026-07-28 Team Gameplay V2 parallel implementation

- [x] Create and register `TEAM_GAMEPLAY_V2_ANALYSIS.md`.
- [x] Add Team-only `/team/v2` fullscreen route without changing default login redirect.
- [x] Keep V1 `/stations/map` available and add a V2 entry button there.
- [x] Add Backend `POST /api/player/qr-action` using database-resolved Station
  QR purpose and existing check-in/check-out logic.
- [x] Keep duplicate Check-in from creating another attempt and duplicate
  completed Check-out from writing again.
- [x] Add V2 Settings, Station preview, Leaderboard, scanner, score entry, Zalo,
  V1 return, and logout controls.
- [x] Apply whole-overlay opacity to Settings, Leaderboard, and Station preview;
  persist in `movement-team-v2-panel-opacity`.
- [x] Add VI/EN V2 and shared QR scanner copy.
- [x] Return successful Team Station Detail actions opened with
  `?from=team-v2` to `/team/v2`.
- [x] Pass targeted PlayerService Jest (`28/28`), full Backend Jest (`157/157`),
  Backend lint/build, Frontend `i18n:check`, Frontend lint/build, and
  `git diff --check`.
- [x] Complete authenticated headless Chrome responsive HUD smoke at 320, 375,
  430 portrait and 667x375, 844x390, 1024x768 tablet landscape.
- [ ] Complete real camera permission denied/retry/manual fallback smoke.
- [x] Confirm pan, wheel/pinch zoom, double-click/double-tap reset, 44px marker
  hit targets, and overlay rotation state in headless Chrome.
- [x] Center Station preview and make Settings, Leaderboard, QR scanner, and
  score entry near-fullscreen modal layers in portrait and landscape.
- [x] Document the V2 palette, typography, HUD copy, exact `MOVEment 2026`
  center brand, icon inventory, and overlay layout policy.
- [x] Reconcile the rendered V2 HUD with the angular sci-fi reference: keep
  the fixed V2 accent full-strength on the main HUD, scope saved opacity to
  overlay panels, strengthen V2 lines/corners/glow, and preserve score and
  Station-state semantic colors.
- [x] Verify the reconciled HUD with authenticated Team 01/Team 05 Chrome
  captures at 390x844 and 844x390, including fixed-palette isolation across
  different Team colors, semantic score green, main-HUD opacity, and
  near-fullscreen Settings geometry.
- [x] Replace only the V2 QR CTA with the inline-SVG 112/96/88px cyan/red badge;
  preserve V1, Login, and shared `QrTokenInput` markup/lifecycle.
- [x] Add the V2-only persistent scanner with camera auto-start, safe VI/EN
  errors, manual fallback after failure, rejected-token suppression, 600ms
  empty-frame re-arm, and full success/close/unmount cleanup.
- [x] Override the higher-specificity global Team Color primary-button rule
  inside `/team/v2` so scanner/manual primary controls keep the V2 blue gradient.
- [x] Pass Chrome fake-camera smoke for responsive badge geometry/palette,
  persistent rejection preview, held-token dedupe, different-token retry,
  600ms re-arm, manual reject/accept, permission/playback fallback, and track/
  decode cleanup. The accepted frontend path used a synthetic successful API
  response; rejected paths used the local Backend.
- [x] Pass Frontend `i18n:check` (`372` keys), lint, production build, and
  `git diff --check`; retain the known non-blocking Vite large-chunk warning.
- [x] Reconcile `/team/v2` to the supplied HTML reference: fixed cyan/green/
  pink/purple/gold palette, centered clipped brand, Team/score row, pill footer,
  gold Leaderboard left, Progress right, and floating conic-ring QR center.
- [x] Keep the new reference palette route-local in CSS and canvas constants;
  authenticated Team 01 and Team 05 resolve identical accent/score/heading
  colors and no inherited `--team-primary`.
- [x] Pass authenticated reference visual smoke at 320x568, 390x844, and
  844x390, including 44px minimum controls, 64px small-screen QR, uncropped HUD,
  preserved overlay opacity, and exact `MOVEment 2026` casing.
- [ ] Complete physical HTTPS scan and camera-indicator cleanup verification on
  iPhone Safari, Chrome iOS, and Android.
- [ ] Confirm opacity persistence through logout/Team switch, Zalo launch, and
  old map/Admin route regressions in browser.
- [ ] Review whether Team login/logout should be hidden before 2026-08-20; this
  task intentionally keeps logout.
- [ ] Production runtime verification remains out of scope without explicit
  approval.

## 2026-07-28 Tester auto-stop conflicting local processes

- [x] Add opt-in exact-port listener cleanup with protected/current PID guards
  and a bounded port-release wait to `tester-run.ps1`.
- [x] Enable cleanup for root `tester`, `tester:no-seed`, `tester:smoke`, and
  `tester:serve` npm scripts while preserving direct-script fail-fast behavior.
- [x] Verify PowerShell/package syntax and `git diff --check`.
- [x] Run full smoke with an existing listener on `4173`; confirm auto-stop,
  three-service readiness, exit `0`, cleanup, and all configured ports free.
- [x] Update Graphify code graph (`2366` nodes, `3866` edges, `206`
  communities), retaining the known `hooks.json`/no-Gemini warnings.
- [ ] Production/remote-database runtime verification remains out of scope.

## 2026-07-28 Production deploy preflight and partial smoke

- [x] Confirm remote `master` and `develop` both point at current HEAD
  `9929d0252687a629b3f8d19cdce2906c159d3907`.
- [x] Verify current source workflows: Backend deploy is ECS with push/manual
  triggers; Frontend deploy is OBS with required HTTPS `VITE_API_BASE_URL`.
- [x] Verify Production Backend `/api/docs` returns Swagger UI for
  `MOVEment 2026 API`.
- [x] Verify Production `/` and `/qr-login?token=__codex_readonly_probe__`
  return SPA `index.html`.
- [ ] Repair or rerun Frontend Production deployment: deployed HTML references
  `/assets/index-BTYLObga.js`, current local build references
  `/assets/index-DAFO-QAT.js`, and direct JS asset HEAD checks returned OBS
  `403 AccessDenied`.
- [ ] Trigger GitHub Actions or direct OBS deploy only after a GitHub dispatch
  token/CLI or Huawei OBS credentials are available.
- [ ] Do not force Backend deployment to skip DB detection. If Backend deploy is
  still needed, first establish the server deployment marker/base commit; stop
  if the range requires migrate/seed under the user's no-DB instruction.
- [ ] Complete authenticated desktop/mobile Team/Admin browser smoke after the
  frontend asset blocker is resolved.

## 2026-07-28 Admin System Config Station locale display

- [x] Verify live Admin progress-matrix payload contains VI/EN Station fields.
- [x] Confirm commit history did not remove an Admin EN fetch/selection path.
- [x] Select `nameEn`/`descriptionEn` for English System Config display with
  per-field VI fallback and no redundant Backend refetch.
- [x] Apply localized Station display to card, QR modal, alt text, and ARIA copy.
- [x] Pass Frontend lint and production build.
- [x] Update Graphify code graph (`2362` nodes, `3860` edges, `209`
  communities), retaining the known `hooks.json`/no-Gemini warnings.
- [ ] Complete post-fix desktop/mobile Admin browser smoke and Production
  runtime verification.

## 2026-07-28 YouTube-style Player video action

- [x] Apply YouTube-red enabled styling and a filled YouTube icon to Player
  video actions on Station List, Map drawer, and Station Detail.
- [x] Preserve neutral disabled styling and the existing `ST`/valid URL gate.
- [x] Pass Frontend lint, production build, and `git diff --check`.
- [x] Update Graphify code graph (`2359` nodes, `3855` edges, `205`
  communities), retaining the known `hooks.json`/no-Gemini warnings.
- [ ] Complete post-change desktop/mobile browser smoke and Production runtime
  verification.

## 2026-07-28 Admin System Config localization fix

- [x] Localize System Config tabs, actions, tracking modes, QR copy/status,
  confirmations, toasts, Team summaries, fallback errors, and ARIA labels.
- [x] Preserve canonical Admin Station data and technical IDs/token values while
  localizing seed-style Team display names.
- [x] Pass Frontend i18n parity/no-empty (`314` keys), lint, production build,
  focused hard-coded-copy scan, and `git diff --check`.
- [x] Update the Graphify code graph (`2357` nodes, `3853` edges, `206`
  communities); retain the known `hooks.json`/no-Gemini documentation warnings.
- [ ] Complete post-fix desktop/mobile Admin browser smoke and Production
  runtime verification.

# 2026-07-28 Station Media Gallery and Player action layout

- [x] Confirm gallery Business Rules through the nine-round Plan Mode review.
- [x] Register `STATION_MEDIA_GALLERY_ANALYSIS.md` and document the target API/UI behavior.
- [x] Add `station_images` schema/migration and transactional Admin create/update handling.
- [x] Return ordered `imageUrls` in Player/Admin Station responses.
- [x] Add Admin gallery inputs and Player List/Map/Detail gallery preview/action layout.
- [x] Complete migration, seed, automated, API, and representative visual verification.
- [x] Complete Graphify code update and final diff review; `hooks.json` remains a known zero-node warning and changed docs were not semantically re-extracted without Gemini.
- [x] Create the verified local commit after the final status/diff review.
- [ ] Existing routing references `docs/prompts/02_PLAYER_SCREENS_PROMPT.md`, which is absent; do not recreate it unless the repeatable Player-screen workflow is intentionally restored.
- [ ] Production deployment/runtime verification remains out of scope and requires explicit approval.

## 2026-07-27 Frontend localization follow-up

- [x] Language switch displays `🇻🇳 VI` and `🇬🇧 EN` without new image assets.
- [x] Final navigation keeps compact `Final`, Final heading is localized as
  `Thử thách cuối cùng` / `Final Challenge`, and Final navigation/heading uses a
  flag icon while success trophy remains unchanged.
- [x] Station list/detail/map visible labels, statuses, actions, empty states,
  modal copy, and key fallback errors use VI/EN resources.
- [x] Station ordering uses `In Progress`, `New`, `Finished`, then natural
  ascending `stationId`; Station map editor dropdown sorts by Station ID.
- [x] Seed-style Team names localize in display only: `Team NN`/`Đội NN` become
  `Team NN` in EN and `Đội NN` in VI; custom Team names remain unchanged.
- [x] Team list, Leaderboard, Final, and Admin Operations visible copy use the
  existing i18n resource architecture.
- [x] Frontend `i18n:check`, Frontend lint, Frontend production build, and JSX
  visible-copy scan passed. Build retains the known non-blocking large-chunk
  warning.
- [ ] Manual desktop/mobile Team/Admin browser smoke remains pending.
- [ ] Full hard-coded copy audit beyond JSX direct text remains recommended
  before event lock, because complex prop strings and dynamic API field labels
  may still need product review.

## 2026-07-27 Station localization and FE language switch

- [x] Station schema includes `name_en` and nullable `description_en`.
- [x] Migration backfills provisional EN for 17 canonical Stations and safe
  `name_en = name` fallback for noncanonical rows.
- [x] Canonical seed/replacement writes VI and EN Station content while gameplay
  signature excludes translation fields.
- [x] Player Station APIs accept `lang=vi|en`, localize `name`/`description`,
  fallback invalid locale to VI, and fallback missing EN per field.
- [x] Admin Station create/update and progress matrix carry both VI and EN
  Station content fields.
- [x] Frontend has persisted `movement-language`, AntD locale sync, `<html lang>`
  sync, Login/QR/AppFrame switch, runtime Player Station refetch, stale response
  guard, failure warning, and Admin Station Editor VI/EN sections.
- [x] Targeted Backend Player/Admin service tests, full Backend Jest suite,
  Backend lint/build, Frontend lint/build, and Prisma generate passed in this
  run.
- [x] Local migration deploy, two seed runs, canonical `name_en` count check,
  and `db:verify` passed.
- [x] Locale resource parity/no-empty automation exists and passed with `86`
  keys.
- [x] `git diff --check` and Graphify code graph update passed; Graphify retained
  warnings for `hooks.json` zero nodes and missing optional `tree_sitter_sql`.
- [ ] Manual desktop/mobile Team/Admin browser smoke remains pending.
- [ ] Existing npm audit high-severity findings remain outside this scope.

## 2026-07-27 Feature Analysis workflow and localization planning

- [x] Defined the mandatory seven-round Plan Mode review workflow.
- [x] Registered Feature Analysis files directly under `docs/analysis`.
- [x] Consolidated all 11 `.kilo/plans` sources with provenance and split
  implementation/runtime/browser statuses.
- [x] Renamed and re-routed the Excel Export/Team Color analysis.
- [ ] Implement `FRONTEND_LOCALIZATION_ANALYSIS.md` after a separate execution
  request and complete bilingual desktop/mobile browser verification.
- [ ] Complete the Production and manual browser/Excel checks retained as
  pending in the consolidated Feature Analysis files.

## 2026-07-27 Team header identity

- [x] Team user header displays the current Team name instead of generic `User`.
- [x] Team users keep a logout button in every environment, but its visible label is the Team name.
- [ ] Hiding Team logout before release is deferred to a separate release task.
- [x] Admin header logout remains unchanged in every environment.
- [x] Redundant `Current team: ...` copy was removed; Deploy remains present and keeps the existing mobile hide behavior.
- [x] Frontend lint/build and production build passed; build retains the known non-blocking large-chunk warning.
- [x] `git diff --check` and Graphify code graph update passed.
- [x] Local commit created for the scoped implementation.
- [ ] Manual browser review across desktop/mobile and long Team names remains pending.

## 2026-07-27 Player cancel cooldown UX

- [x] Backend keeps Cancel cooldown authoritative and rejects Check-in before `nextCheckInAllowedAt`.
- [x] Successful Check-in after the cooldown deadline clears `nextCheckInAllowedAt`.
- [x] Player Station List maps and displays cooldown as `Cooldown mm:ss`, disables Play during cooldown, and avoids opening the Check-in QR modal before the deadline.
- [x] Player Map drawer uses the same cooldown countdown and disabled Play behavior.
- [x] Targeted PlayerService Jest test (`21/21`), full Backend Jest suite (`134/134`), Backend lint/build, Frontend lint/build, and `git diff --check` passed.
- [x] Graphify code graph update passed through the saved Python interpreter.
- [ ] Full Graphify semantic doc/image update remains pending because 52 changed doc/image files require an LLM backend/API key in this environment.
- [ ] Manual browser click-through remains pending.

## 2026-07-27 Team Results tracking-mode headers

- [x] Every active Station's three Team Results headers display `[Score only]`, `[Time only]`, or `[Both time and score]` from the existing Station tracking mode.
- [x] Check-in/Check-out timestamps, three-column Station schema, ranking, scores, and play-duration behavior remain unchanged.
- [x] Workbook tests cover all three tracking modes, duplicate Station names, and different accepted Check-in/Check-out timestamps for a completed `SCORE` Station.
- [x] Targeted Team Results tests (`3/3`), full Backend Jest suite (`132/132`), Backend lint, and Backend build passed.
- [ ] Graphify incremental update remains pending because the available CLI stopped before semantic extraction; no code-only graph replacement was performed.
- [ ] Manual Excel/Google Sheets open review and Production runtime verification remain pending.

## 2026-07-27 Tester backend ExcelJS dependency detection

- [x] Confirmed Team Results Excel export still uses the declared `exceljs` dependency.
- [x] Restored local Backend install and regenerated Prisma Client so Backend build can resolve `exceljs` and generated Prisma types.
- [x] Updated `scripts/tester-run.ps1` to detect missing Backend package `exceljs` and run dependency installation before build.
- [x] Backend build passed after `npm ci` and `npm run prisma:generate`.
- [ ] Production/runtime deployment verification was not performed and remains out of scope without explicit approval.

## 2026-07-27 Station numeric display code UI

- [x] Canonical Station IDs `ST001`...`ST017` keep their technical value for database, API, route, React key, select value, and QR mapping.
- [x] Team/Admin Station list shows the shorter display code `01`...`17` beside each Station name.
- [x] Station List and map drawer avatars show the display code instead of the play icon, without a duplicate code Tag beside the Station name.
- [x] `ST018` is supported as display code `18` if it appears later.
- [x] Player map markers and Admin map selector use the same display code helper.
- [x] Other noncanonical Station IDs remain unchanged when displayed.
- [x] Frontend lint/build and `git diff --check` passed; build retains the known non-blocking large-chunk warning.
- [x] Local commit created for the scoped implementation.
- [ ] Manual browser review of List/Map display remains pending.

## 2026-07-26 Station QR checkout scoring update

- [x] Camera-decoded Station Check-in and Check-out QR tokens auto-submit without requiring Modal OK.
- [x] Manual paste/type Station QR input remains explicit and requires Submit.
- [x] `TIME` Check-out auto-completes with score `10`, records real duration, and writes a score event.
- [x] `SCORE` Check-out stores accepted scan time while contributing `0` play seconds.
- [x] `TIME` effective max score is `10` in Admin maximum synchronization and Team/User score display.
- [x] Targeted Player/Admin service tests, backend build, frontend lint/build, `git diff --check`, and Graphify update passed during implementation.
- [ ] Commit and push are tracked by the active task.
- [ ] Production QR route/static hosting fix is explicitly out of scope for this task.

## 2026-07-24 Team Color palette and gradient buttons

- [x] Seed-managed Team 01-25 use 25 stable unique uppercase HEX colors without palette rotation.
- [x] Production seed repairs only `color` for existing `team01`...`team25` and silently skips missing fixtures without password, QR credential, progress, or other fixture updates.
- [x] Enabled primary buttons use Team gradients with white `#FFFFFF` text/icons in Team-context pages, footer, Modal, Drawer, and confirm overlays.
- [x] Disabled, danger, default, QR info modal, status, marker, and non-button semantics remain outside the gradient override.
- [x] Station list/detail primary actions from the latest pull remain covered by the shared selector; the disabled `Watch Video` action keeps its disabled style.
- [x] Team Editor valid create/edit preview and body theme owner cleanup are implemented; saved null color retains `#FF765C` Team-context fallback.
- [x] Targeted seed policy tests (`7/7`), Backend lint/build, Frontend lint/build, two consecutive local seed runs, `db:verify`, and Graphify update passed after the latest pull; diff hygiene is reviewed before commit.
- [ ] Manual browser review across Team 01/25, overlays, disabled states, route cleanup, and representative contrast colors remains pending.
- [ ] Production deployment/runtime verification remains pending and requires explicit approval.

## 2026-07-24 Team Results Excel export and Team Color UI

- [x] Added ExcelJS backend dependency and Team Results workbook generation.
- [x] Added shared Team Results comparator reused by Leaderboard and Excel export.
- [x] Leaderboard ranks all non-deleted Teams using the confirmed five-step comparator.
- [x] New Team Results export includes one worksheet, one row per non-deleted Team, active Station column groups, `Captain Name`, `Username`, `Total Play Time`, `Total Score`, `Computed Score`, Rank, and correct Final fields.
- [x] New export excludes `Team Color`, `Team Status`, `Total Stations`, `Final Challenge Status`, per-Station `Status`, per-Station `Duration`, QR/password/token fields, and Final answer text.
- [x] Admin Operations export button downloads `/api/admin/reports/team-results.xlsx` and preserves backend filename from `Content-Disposition` with fallback.
- [x] Backend CORS exposes `Content-Disposition`.
- [x] `teamColor` is canonical API field with compatibility `color` alias.
- [x] Admin create/update validates `#RRGGBB` or `null`, normalizes lowercase HEX, clears on `null`, leaves missing field unchanged, and rejects conflicting aliases.
- [x] Team-facing UI, Admin Team list cards, Admin Team editor, and Admin single-Team Station contexts use scoped Team Color vars with fallback `#FF765C`.
- [x] Admin map routes and `StationsMapPanel` Admin action behavior were left unchanged.
- [x] Targeted backend tests, full backend tests, backend lint/build, and frontend lint/build passed.
- [ ] Manual Excel/Google Sheets open verification remains pending.
- [ ] Manual Team Color browser review across light/dark colors, mobile/desktop, and route transitions remains pending.
- [ ] Production deployment/runtime verification remains pending and requires explicit approval.
- [x] Graphify update ran successfully; warnings remain for `hooks.json` zero nodes and missing optional `tree_sitter_sql` SQL extraction.

## 2026-07-24 Compact Admin headers and Team identity cleanup

- [x] Teams, Leaderboard, and Operations Center headers use compact spacing, icons, and titles.
- [x] Redundant Teams and Leaderboard header descriptions were removed.
- [x] Admin global header and Team list no longer imply that Admin belongs to a Team.
- [x] Player current-Team identity remains unchanged.
- [x] Frontend lint and production build passed.
- [ ] Manual responsive browser review remains pending.

## 2026-07-24 Role-aware Leaderboard current-Team marker

- [x] Admin Leaderboard does not show `Your team` or current-Team highlighting.
- [x] Player Leaderboard continues to identify the authenticated Team.
- [x] Frontend lint and production build passed.

## 2026-07-24 Admin Team-first Station navigation

- [x] Admin footer no longer exposes a standalone Stations menu.
- [x] Admin login opens Teams, and selecting a Team opens that Team's Station/progress list.
- [x] Team context remains in Admin Station list/detail routes and after Admin score/status actions.
- [x] Player Station menu and routes remain available only to Players.
- [x] Frontend lint and production build passed.
- [ ] Manual Admin browser click-through remains pending.

## 2026-07-24 Canonical 17-Station seed and sync

- [x] Canonical active Station inventory uses deterministic IDs `ST001`...`ST017`.
- [x] `ST001`, `ST002`, `ST003`, and `ST004` are the designated `ST` Stations; the remaining 13 Stations are `STANDARD`.
- [x] Input `gameType: null`, `undefined`, `standard`, or `STANDARD` normalizes to `STANDARD`; `ST` remains `ST`; unsupported values fail fast.
- [x] Seed and `stations:sync` share the canonical Station data and replacement behavior.
- [x] Full replacement resets Station progress, score events, Final submissions, Team score aggregates, `startedAt`, status, and Team `maxPossiblePoints = 300` while preserving Team identity, sessions/auth, Team QR login tokens, colors, and Final Challenge/config.
- [x] Local validation passed: Prisma generate, Backend lint/build, full Backend Jest suite (`127/127`), two consecutive seed runs, `db:verify`, `stations:sync -- --audit-only`, and `git diff --check`.
- [ ] Production Station sync remains blocked/not run in this workspace because the active DB target is local `127.0.0.1/movement`, not Production. Run only after safe Production target metadata is shown and `CONFIRM_REPLACE_ALL_PROD_STATIONS=YES` is set.

## 2026-07-24 Designated ST Station set

- [x] Historical old set `ST003`, `ST004`, `ST010`, and `ST047` is superseded by the canonical 17-Station inventory above.
- [x] Historical tester result `4 ST` and `6 STANDARD` is superseded by canonical `4 ST` and `13 STANDARD`.
- [ ] Production migration/deployment remains pending and requires explicit deployment approval.

## 2026-07-24 Station Game Type constraint and video visibility

- [x] Station Game Type is restricted to `ST` and `STANDARD` in Admin UI, Backend validation, and database constraint.
- [x] Legacy `CIPHER` Station data is migrated to `STANDARD`; Station cipher-answer UI, endpoint, DTO, service logic, and storage are removed.
- [x] Only `ST` with a valid HTTPS YouTube URL enables `Watch Video`; the Team/User Station list shows the action disabled for all other Stations, while Admin Station lists omit it.
- [x] Historical tester results containing `CIPHER` are superseded by the two-type Station Game Type rule.
- [x] All `113` Backend tests, Backend/Frontend lint and build, and local route health checks passed.
- [ ] Production migration and deployed browser verification remain pending and require explicit deployment approval.

## 2026-07-24 Admin Station game configuration edit

- [x] Existing Stations allow Admin to edit `gameType` and integer `maxPoints`.
- [x] Backend updates the active Game and synchronizes Team maximum totals transactionally.
- [x] Targeted Admin service tests (`25/25`) and Backend/Frontend production builds passed.

## 2026-07-24 Admin Operations UI merge recovery

- [x] Restored the local responsive Admin Operations UI after the merge selected the minimal remote component.
- [x] Integrated remote `finalStartsAt` Event Config behavior and current/new Final keyword handling.
- [x] Preserved structured dashboard, score queue, submissions, logs, refresh, error feedback, and Excel export.

## 2026-07-24 Admin score-only correction

- [x] Admin Station Detail always calls the score-correction endpoint and no longer falls into `Progress is not waiting for score` based on Frontend status.
- [x] Non-empty Admin correction reason is required by Frontend and Backend.
- [x] Admin correction is enabled only for `COMPLETED` progress and rejected otherwise by both UI and Backend.
- [x] Admin correction preserves progress status and all timestamps while updating score, Team total delta, and audit records.
- [x] All 109 Backend tests, including Player score regression coverage, Backend/Frontend lint and build, diff check, Graphify update, and local tester runtime verification passed.

## 2026-07-24 Scoring confirmation code removal

- [x] Updated the confirmed Business Rule so Team score submission after Check-out does not require a confirmation code.
- [x] Removed the confirmation-code field and verification from Backend and Frontend score submission.
- [x] Removed `SCORING_CODE` and its bcrypt hash from runtime configuration, environment validation, seed, and current smoke/deployment scripts.
- [x] Added a forward-only migration to drop `event_config.scoring_code_hash`.
- [x] Verified Prisma schema/client, all 107 Backend tests, Backend/Frontend lint and build, active-source reference scan, diff check, and Graphify update.
- [x] Recreated the local tester containers, applied all migrations, ran seed, confirmed the API is healthy, and confirmed the live OpenAPI document has no legacy scoring-code DTO or field.
- [ ] Apply and verify the migration in Production during an explicitly approved deployment.
## 2026-07-24 Tester runner Prisma Studio

- [x] `npm run tester` starts Prisma Studio together with Backend API and Frontend preview.
- [x] Added configurable `-PrismaStudioPort` with default `5555`.
- [x] Runner checks Prisma Studio port availability, probes readiness, prints the Studio URL, logs to `.tester-logs/prisma-studio.log`, and stops the Studio job during cleanup.
- [x] Verified with `npm run tester:smoke -- -SkipInstall -SkipSeed -ApiPort 3100 -FrontendPort 4273 -PrismaStudioPort 5655`.
- [x] Backend lint/build, frontend lint/build, and `git diff --check` passed.
- [ ] Manual long-running `npm run tester` keep-open usage remains pending.

## 2026-07-24 Final start and Event end separation

- [x] Final Challenge opening is verified against Admin Event Config `finalStartsAt`, not `eventEndTime`.
- [x] Admin Event Config UI exposes `finalStartsAt` beside `eventEndTime`.
- [x] `eventEndTime` remains the Station close time for new check-ins.
- [x] Station Check-out and scoring remain allowed for Stations already started before `eventEndTime`.
- [x] Player Station list/map click on a locked Station now reports that the Station is closed instead of opening check-in.
- [x] Targeted backend Final/Player service tests, backend lint/build, frontend lint/build, and `git diff --check` passed.
- [ ] Production deployment/runtime verification remains open and requires explicit approval.
- [ ] Manual browser click-through after the deployed Event Config times remains pending.

## 2026-07-23 iOS QR camera lifecycle cleanup

- [x] Login QR scanner cleanup invalidates the run, clears RAF/timer resources, stops active media tracks, clears and reloads the video element, and disposes detector resources.
- [x] Shared Station QR scanner cleanup invalidates the run, clears RAF resources, stops active media tracks, clears and reloads the video element, and disposes detector resources.
- [x] Pending `loadedmetadata` listeners are cancelled on stop/unmount so scanner event listeners do not survive UI close.
- [x] Pending start paths guard against late streams, duplicate decode callbacks, and false errors after user stop.
- [x] Manual QR input, Team QR parsing, Station QR validation flow, native `BarcodeDetector`, and `jsQR` fallback are preserved.
- [x] Frontend lint, frontend build, and frontend build:prod passed.
- [ ] Manual HTTPS test on real iPhone Safari remains pending.
- [ ] Manual HTTPS test on real Chrome iOS remains pending.
- [ ] Confirm physical iOS camera indicator turns off after repeated open/stop cycles on device.

## 2026-07-23 Seed diagnostics and tester runner completion

- [x] Added seed phase logs for database connection, stations, challenges, teams, Final event, completion, and Prisma disconnect.
- [x] Verified standalone seed twice against local PostgreSQL without duplicate seed data or process hang.
- [x] Confirmed Final Challenge canonical keyword remains plaintext `DISANVANHOA2026` in the compatibility `answerHash` field.
- [x] Fixed tester dependency detection so incomplete frontend installs missing `jsqr` trigger `npm ci`.
- [x] Updated tester readiness checks to use IPv4 loopback URLs and report the last readiness error.
- [x] Made `npm run tester` complete as a smoke runner with exit code `0`; use `npm run tester:serve` for keep-open manual testing.
- [ ] The frontend large-chunk warning remains non-blocking and can be addressed in a separate performance/code-splitting task.

## 2026-07-23 Final Challenge plain answer and Production seed override

- [x] Final Challenge no longer hashes the canonical keyword before storing it in `answerHash`.
- [x] Final Challenge validation no longer hashes submitted answers and instead compares normalized submitted text to normalized stored text.
- [x] Public APIs and activity logs continue to avoid exposing the configured Final answer.
- [x] Production seed overwrites only seed-managed Final Challenge fields through `2026-08-21 23:59:59 Asia/Ho_Chi_Minh`.
- [x] Production seed preserves existing Final Challenge records starting `2026-08-22 00:00:00 Asia/Ho_Chi_Minh`, while still creating the record if missing.
- [x] Seed policy tests cover production before cutoff, on August 21, after cutoff, non-production, repeated planning, missing record creation, and update field scope.
- [ ] Production deployment/runtime verification remains open and requires explicit approval.
- [ ] Plain-text Final answer storage increases database-read exposure risk and should be reviewed after the event/cutoff window.

## 2026-07-22 Conditional backend database deployment completion

- [x] Backend Production workflow supports independent manual deployment inputs for `base_commit`, `target_commit`, and `force_database_steps`.
- [x] Backend deploy resolves the complete deployed commit range from explicit input or protected server marker instead of assuming `HEAD~1`.
- [x] Application-only backend changes skip `prisma migrate deploy`, Production seed, and database-specific verification while preserving install, build, restart, and health checks.
- [x] Schema or migration changes run Prisma Client generation, `prisma migrate deploy`, and `db:verify`.
- [x] Seed-only changes run Production-safe seed and `db:verify` without running `prisma migrate deploy`.
- [x] Combined migration/schema and seed changes run migration before seed and then `db:verify`.
- [x] `force_database_steps=true` runs migration, seed, and `db:verify` regardless of detected changes.
- [x] Deployment marker updates only after required database steps, build, restart, post-restart verification when required, and backend health pass.
- [ ] Actual Production deployment remains open and requires explicit approval.
- [ ] First conditional Production deploy must provide `base_commit` if `/opt/movement/deploy-markers/movement-api.commit` is not already present.

## 2026-07-22 Staged Production deployment workflow completion

- [x] Production backend deployment is manual-only through `workflow_dispatch`, with explicit backup confirmation and backend deploy confirmation inputs.
- [x] Production frontend deployment is manual-only through a separate Nginx workflow, with explicit frontend deploy confirmation input.
- [x] Automatic `push` triggers were removed from both Production deployment workflows, so merging or fast-forwarding `develop` into `master` cannot start backend and frontend deploy phases in parallel.
- [x] Backend Phase 1 preserves the existing fail-fast deploy script: migrations, Production-safe seed, `db:verify`, and build must pass before the backend restart; post-restart `db:verify` and backend health check remain required.
- [x] Frontend Phase 2 builds with `VITE_API_BASE_URL` unset for same-origin `/api`, syncs assets to the Nginx document root, validates Nginx config, reloads Nginx, and checks HTTPS, `/api`, SPA fallback, `/qr-login`, and missing asset behavior.
- [ ] Actual Production backend deployment remains open and requires explicit approval.
- [ ] Actual Production frontend deployment remains open and requires explicit approval after backend verification.

## 2026-07-22 Production-like integration verification completion

- [x] Audited current local tester, Docker Compose, Vite preview proxy, production Nginx config, CORS config, environment guards, migration/seed path, and existing smoke coverage.
- [x] Added `scripts/production-like-smoke.ps1` as a disposable HTTPS same-origin integration harness for a clean database, production-mode backend startup, and local HTTPS reverse proxy.
- [x] The smoke applies clean migrations through `000008`, runs seed twice, runs `db:verify`, starts the backend with `NODE_ENV=production`, serves the frontend build over HTTPS, proxies same-origin `/api`, verifies `/qr-login` direct navigation and refresh, and checks CORS allow/deny behavior.
- [x] The live smoke verifies reusable Team QR login, one-active-session replacement, revoked/rotated Team QR behavior, SQ1 Station Check-in/Check-out, wrong-purpose and revoked Station token failures, independent Station QR rotation, `SCORE`/`TIME`/`BOTH`, Final Event Config opening, cooldown, rank bonuses, leaderboard totals, and tracked/log secret scans.
- [x] Backend full Jest suite, backend lint/build, frontend lint/build, Prisma Client generation, Docker Compose config render, production-like smoke, production environment guard spec, static tracked-file secret search, production-like log secret scan, and `git diff --check` passed.
- [x] Docker daemon remained unavailable on this host, so the smoke used its local PostgreSQL disposable-database fallback and dropped the temporary database during cleanup.
- [ ] Actual Production deployment/runtime verification remains open and was not performed.

## 2026-07-22 Final Challenge completion

- [x] Historical 2026-07-22 verification used Admin Event Config `eventEndTime` for Final opening; this was superseded on 2026-07-24 by `finalStartsAt` as the Final opening rule.
- [x] Active Source Code no longer uses fixed `11:30` or `11:45`; remaining matches are historical documentation warnings or the original baseline migration.
- [x] Local/test seed creates or repairs the active Final keyword hash for `DISANVANHOA2026` and remains idempotent when run repeatedly.
- [x] Backend and frontend trim and uppercase answer input; backend remains the authoritative validator and frontend source does not contain the official answer.
- [x] Wrong-answer cooldown is backend-enforced inside the serializable submission transaction and increases from 1 second to maximum 10 seconds.
- [x] Final eligibility is verified for configured Event end, active Station blocking, no all-Station completion requirement, and existing Station lifecycle regression.
- [x] Final ranking and bonus are verified for rank 1, rank 2, rank 10, rank 11, duplicate correct submission, retry, and unique-rank concurrency protection.
- [x] Leaderboard integration remains through `team.totalPoints`, so Final bonus is included once when awarded.
- [ ] Production migration and production-like Final smoke remain open.
- [ ] Manual browser double-click/multiple-tab UX verification remains open.

## 2026-07-22 Station tracking and scoring completion

- [x] Re-verified `SCORE`, `TIME`, and `BOTH` behavior after SQ1 Station QR migration.
- [x] `TIME` records real duration, auto-completes with score `0`, and does not require Team score submission.
- [x] `SCORE` contributes no play duration and requires Team-device score submission after Check-out.
- [x] `BOTH` records real duration and requires Team-device score submission after Check-out.
- [x] Station max score now defaults to `30` at database and Admin creation service layers.
- [x] Backend service validation rejects non-integer, negative, and above-max scores for Team and Admin score paths.
- [x] Duplicate/stale/concurrent Team score submission is covered by tests and the transaction claim.
- [x] Frontend score input uses Station max score as UX validation only; backend remains authoritative.
- [x] Admin score correction remains a separate audited flow.
- [ ] Production migration and production-like Station scoring smoke remain open.

## 2026-07-22 Secure Station QR completion

- [x] Station QR now uses official SQ1 opaque token format for new creation, Admin rotation, and local/test seed repair.
- [x] Station creation provisions one `CHECK_IN` and one `CHECK_OUT` token atomically with Station/Game/progress creation.
- [x] Player Check-in/Check-out resolves Station and purpose from the database token record after fingerprint/hash/lifecycle validation.
- [x] Admin can inspect, rotate, and revoke Station `CHECK_IN` and `CHECK_OUT` independently.
- [x] Local/test seed repairs missing or Legacy Station QR tokens by purpose and preserves existing active SQ1 tokens across repeated runs.
- [x] Reprint strategy stores raw Station QR tokens in the protected backend database for new, repaired, replaced, or rotated SQ1 tokens so Admin can view and print Check-in/Check-out QR string values; tracked files still must not contain raw tokens.
- [x] Legacy predictable Station QR generation is removed from new creation, seed repair, and smoke script paths; active Legacy DB rows remain compatibility-only.
- [ ] Production migration, production QR reissue, and physical QR scan verification remain open.
- [ ] Legacy Station QR compatibility window and removal date remain open.

## 2026-07-22 Automatic URL Team QR completion

- [x] Reusable controlled Team QR login, usage auditing, and one-active-session replacement are implemented and locally verified.
- [x] Team creation provisioning, idempotent local/test seed repair, and distinct Admin generate/rotate/revoke actions are implemented.
- [x] New Team and seed data no longer generate predictable Legacy Team QR credentials; existing Legacy credentials and endpoint remain for compatibility.
- [x] Reprint strategy stores raw Team QR Login tokens in the protected backend database for new, repaired, replaced, or rotated tokens so Admin can view and print QR Login string/URL values; tracked files still must not contain raw tokens.
- [ ] Production migration and deployed QR flow verification remain open.
- [ ] Station QR migration remains out of scope and open.

## Rules

- `[x]` means implementation and required verification are complete.
- `[ ]` means incomplete, not verified, or blocked.
- Documentation-only reconciliation does not complete Source Code work.
- Historical audit evidence remains in `BACKEND_AUDIT.md`.
- Use the smallest relevant Feature Prompt.

## P0 — QR Security and Provisioning

- [x] Migrate Automatic URL Team QR Login from one-time consumption to reusable controlled token behavior.
- [x] Ensure successful QR login does not consume the active Team token.
- [x] Preserve one-active-session-per-Team behavior for password and QR login.
- [x] Automatically provision a secure Team QR token in every Team creation path.
- [x] Add idempotent missing-Team-token repair.
- [x] Ensure Admin can generate, rotate, revoke, and inspect Team QR token status.
- [x] Select and document raw-token reprint strategy: display once and rotate to reprint.
- [x] Remove predictable Team QR generation for new data while retaining existing Legacy credentials for compatibility.
- [x] Migrate Station QR to `MV26-SQ1-I/O-<randomToken>`.
- [x] Automatically provision one Check-in and one Check-out token when creating a Station.
- [x] Roll back Station creation when the complete QR pair cannot be created.
- [x] Support independent Station Check-in and Check-out rotation/revocation.
- [x] Update database constraints and indexes for token uniqueness and active-token invariants.
- [x] Update seed, fixtures, and smoke scripts that hard-code Legacy QR payloads.
- [ ] Define and verify Legacy compatibility removal conditions.

Acceptance:

- Team token is random, opaque, reusable while valid, revocable, and rotatable.
- Station token does not expose Station ID/code.
- Database token record determines Station and purpose.
- Repeated seed does not rotate valid tokens or create duplicates.
- Production logs and tracked files contain no raw token.

## P0 — Authentication and Session

- [x] Admin username/password authentication exists.
- [x] Team username/password authentication exists.
- [x] New Team login replaces previous active Team session.
- [x] Admin and Team JWTs expire at the next daily `22:00 Asia/Ho_Chi_Minh` cutoff.
- [x] Login exactly at or after `22:00` expires at `22:00` the next day.
- [x] All login responses return Backend-authoritative `expiresAt`; Frontend no longer calculates a separate TTL.
- [x] Frontend globally clears local auth state at Backend `expiresAt`, including while a tab remains open.
- [x] Verify cutoff boundary, JWT `exp`/response alignment, full Backend suite, and Backend/Frontend lint/build.
- [ ] Verify the `22:00` cutoff against an actual Production runtime and browser clock.
- [x] Verify session replacement after reusable Automatic URL QR migration.
- [x] Verify inactive Team and revoked/expired QR behavior after migration.
- [x] Verify QR rate limiting on the active implementation.

## P0 — Station Flow and Scoring

- [x] One active Station per Team is implemented.
- [x] Active Stations initialize as `AVAILABLE`.
- [x] Cancel returns to `AVAILABLE` with cooldown.
- [x] Tracking modes `SCORE`, `TIME`, and `BOTH` exist in historical verified implementation.
- [x] `TIME` auto-completes with score 0 in historical verification.
- [x] `SCORE` and `BOTH` require score entry in historical verification.
- [x] Backend score limits and confirmation-code flow have historical verification.
- [x] Re-run Station flow verification after Station QR migration.
- [x] Verify new Station creation automatically provisions both secure QR tokens.
- [x] Verify duplicate score submissions after migration.
- [ ] Verify duplicate Check-out after migration in a production-like smoke environment.

## P0 — Final Challenge

- [x] Final keyword `DISANVANHOA2026` is created or repaired by local/test seed.
- [x] Uppercase normalization is implemented in backend validation and frontend input UX.
- [x] Final opens from Admin Event Config end time.
- [x] Top-10 bonus and concurrency/idempotency are covered by focused tests.
- [x] Re-run Final verification after documentation, QR, and Station scoring migration work.
- [x] Confirm no active code path still uses fixed `11:30` or `11:45`.
- [x] Confirm cooldown progression is backend-enforced from 1 to maximum 10 seconds.
- [ ] Production-like Final smoke remains open.

## P0 — Documentation and Prompt Consistency

- [x] Business Rule Source of Truth created.
- [x] Feature Index created.
- [x] Workflow converted to Feature-based routing.
- [x] `AGENTS.md` operational authority clarified.
- [x] Master Prompt converted to Multi-Feature Orchestrator.
- [x] iOS QR Camera analysis synchronized.
- [x] QR Login analysis synchronized.
- [x] QR payload analysis synchronized.
- [x] Team login data removed hard-coded raw QR tokens.
- [x] QR Login Prompt synchronized.
- [x] Final Prompt synchronized.
- [x] Station Scoring Prompt synchronized.
- [x] Implementation Sync Prompt synchronized.
- [x] Project Analysis Spec synchronized.
- [ ] Run repository-wide Markdown link/path review after applying the bundle.
- [ ] Inspect prompts `01`–`07` before using them; treat Legacy assumptions as historical input unless reconciled.

## P1 — iOS QR Camera

- [x] Camera capability uses `getUserMedia`.
- [x] Native `BarcodeDetector` preferred.
- [x] `jsQR` fallback added in historical implementation.
- [x] Scanner lifecycle and cleanup improved in historical implementation.
- [ ] Manual Production HTTPS test on iPhone Safari.
- [ ] Manual Production HTTPS test on Chrome iOS.
- [ ] Confirm repeated open/close does not leak camera tracks.
- [ ] Confirm one QR frame produces one API request.

## P1 — Production Readiness

- [x] Production config fail-fast behavior has historical verification.
- [x] Database backup/restore and report export have historical verification.
- [x] Split Production deploy into independent manual backend and frontend phases.
- [ ] Merge and run the latest backend deployment workflow on the intended branch.
- [ ] Verify login through frontend HTTPS same-origin `/api`.
- [ ] Verify active Production CORS configuration.
- [ ] Verify `/qr-login` direct navigation and refresh in Production.
- [ ] Verify Production seed does not generate or print raw QR secrets.
- [x] Verify migrated reusable Team QR behavior in Production or a production-like environment.
- [x] Verify secure Station QR pair generation in a production-like environment.
- [x] Run disposable production-like smoke with clean database, HTTPS same-origin `/api`, CORS allow/deny, `/qr-login` direct/refresh, Station scoring, Final, leaderboard, and secret/log scans.

## P2 — Legacy Removal

- [ ] Inventory Legacy Team QR endpoint and parser usage.
- [ ] Inventory Legacy Station QR parser and seed usage.
- [ ] Reissue printed Team QR codes.
- [ ] Reissue printed Station Check-in and Check-out QR codes.
- [ ] Update tester documentation and rehearsal instructions.
- [x] Disable Legacy Team token generation for new Team and seed data; Station Legacy generation remains open.
- [ ] Disable Legacy parser/endpoints after compatibility window.
- [ ] Remove obsolete migration fields only after safe deployment and rollback review.

## P2 — Leaderboard presentation

- [x] Differentiate gold, silver, and bronze podium colors across rank and points styling.
- [ ] Perform final visual review on representative desktop and mobile devices.

## P2 — Shared header presentation

- [x] Keep the Team page label visible beside its icon on mobile.
- [x] Reduce shared shell and primary page-header sizing consistently.
- [x] Refine shared AppFrame header into a floating rounded card and circular
  VI/EN flag switch while preserving the current brand logo.
- [ ] Perform final visual review on representative desktop and mobile devices.

## P2 — Team Station list presentation

- [x] Compact the mobile shell header, Team summary, and Station cards.
- [x] Balance the Team identity and equal-width score/progress metrics.
- [x] Keep the shell brand responsive and align both Team metrics to identical content axes.
- [x] Keep Player `Play` as the white secondary Station action.
- [x] Keep `Watch Video | Play` in a stable two-column row and disable unavailable video actions.
- [x] Make disabled Station video actions visually distinct from enabled primary actions.
- [x] Hide Station video actions from Admin Team Station lists and expand `View & Edit` to the full action row.
- [x] Keep every Admin `View & Edit` action primary regardless of Station video metadata.
- [x] Redesign Station detail identity and metrics for clearer hierarchy and balanced mobile spacing.
- [x] Apply scoped Team-color accents without changing Station behavior.
- [ ] Perform final visual review on representative mobile devices.

## Next Execution Order

1. Run Production-like smoke tests.
2. Run `docs/prompts/08_IMPLEMENTATION_SYNC_PROMPT.md`.
3. Review diff, run `git diff --check`, and create scoped local commits.
4. Do not push or deploy without explicit user request.

## 2026-07-28 Station map interaction performance

- [x] Size the Konva Stage to the visible viewport while retaining the existing
  logical map size and persisted marker coordinate behavior.
- [x] Separate the static, non-listening map image Layer from the interactive
  marker Layer.
- [x] Animate only the active Station; pause animation during drag and for
  `prefers-reduced-motion`.
- [x] Select normal-zoom WebP variants from visible viewport width and retain the
  current one-way high-zoom upgrade behavior.
- [x] Limit map live-count polling and cooldown clock updates to an open Station
  drawer.
- [x] Full Backend tests (`148/148`), Backend lint/build, Frontend lint/build,
  Frontend i18n parity (`261` keys), and `git diff --check` pass; the existing
  non-blocking large-chunk warning remains.
- [ ] Profile pan/zoom FPS and frame time on representative iPhone and Android
  devices, and confirm WebP requests plus maximum-zoom sharpness in DevTools.

## 2026-07-27 Team QR live navigation, reset guard, and map WebP

- [x] Team QR `expiresAt` is nullable and active/new Team QR tokens are non-expiring by time.
- [x] Team QR migration drops `NOT NULL` only and does not null-out active tokens during rollout.
- [x] QR login transaction re-checks `consumedAt: null`; race coverage rejects tokens consumed between preflight and claim.
- [x] Admin Team QR status set is `ACTIVE`, `CONSUMED`, `REVOKED`, and `INACTIVE`; System Config does not render historical revoked/consumed payloads.
- [x] `GET /api/player/stations/playing-counts` returns only `stationId` and `playingTeamCount`.
- [x] Player Station list, Station map drawer, Station detail, and Leaderboard use visible-only 5-second polling with overlap protection and stale-data preservation.
- [x] Fixed bottom navigation is preserved after fast-forward and includes safe-area top/right/bottom/left padding.
- [x] Gameplay reset execute path enforces confirmation/backup guards before destructive transaction entry.
- [x] Reset transaction verifies canonical Station/progress/Event/Final/Team QR/session/gameplay invariants.
- [x] Runtime map asset uses 1280/1920/2950 WebP variants; original large PNG is retained under `fe/source-assets`.
- [x] Targeted Backend tests, Backend lint/build, Frontend lint/build, and Prisma generate passed during implementation.
- [ ] Full Backend Jest suite, disposable DB reset execute/idempotency, `db:verify`, Graphify update, and final diff check remain pending in the active run.
- [ ] Manual browser smoke for live counts, hidden-tab polling, fixed nav safe-area, map persistence, WebP network requests, Team QR lifecycle, and Leaderboard polling remains pending.
- [ ] Production mutation, push, deploy, and Production runtime verification remain out of scope without explicit approval.
