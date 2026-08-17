# 2026-08-15 Team V2 Settings logout removal

- Frontend-only: removed the visible Logout button, `LogoutOutlined` import, and
  V2-only explicit logout API handler from Team V2 Settings.
- Automatic session expiry, HTTP `401` cleanup, Backend session authority, and
  Team/Admin AppFrame headers outside `/team/v2` remain unchanged.
- Verification PASS: Frontend Vitest `69/69`, lint, i18n parity `439`, production
  build/bundle gate, and authenticated Chromium/demo E2E `8/8`.
- No Backend, API contract, schema, migration, seed, QR, gameplay, or auth policy
  changed.

# 2026-08-15 Team V2 dead-code and demo runtime audit

- Frontend/demo-only cleanup removed one unreferenced 339-line Konva marker
  component plus retired V2 CSS selectors for superseded previews, controls,
  rails, counters, and Legend generations. Duplicate font-face rules and the
  orphaned Legend keyframes were removed; the production Team V2 CSS asset
  decreased from `70.14 kB` to `60.30 kB` raw.
- The React/Konva demo no longer emits duplicate resize state or remounts its
  Stage on rotation/font readiness, and its compact HUD reference was refreshed.
- Static audit PASS: no remaining Team V2 CSS class without a Source Code
  consumer, no additional file-level suspect, no tracked generated artifact, and
  no tracked zero-byte file. Legacy v4 demo source remains historical provenance.
- Verification PASS: Frontend Vitest `69/69`, lint, i18n parity `439`, production
  build/bundle gate, demo TypeScript/Vite build, authenticated Chromium plus demo
  E2E `8/8`, and `git diff --check`.
- No Backend, API, schema, migration, seed, gameplay, scoring, QR, auth, or
  ranking behavior changed. Safari/WebKit was not run for this cleanup.

# 2026-08-15 Team V2 compact HUD and Station Detail actions

- Frontend-only: changed Legend to intrinsic localized width with a compact
  lowercase `i`, tightened score geometry, and reduced the visible Settings ring
  while retaining 44px native hit targets.
- Removed the V2-only Image Gallery component/action and legacy-interface button.
  Video now uses YouTube brand treatment; Start uses a QR-first CTA while still
  calling the existing V2 scanner `START` intent. Shared V1 gallery/routes remain.
- Verification PASS: focused Detail Vitest `7/7`, full Frontend Vitest `69/69`,
  lint, i18n parity `439`, production build/bundle gate, `git diff --check`, and
  authenticated Chromium E2E `8/8` at `390x844`, `844x390`, and `1024x768`.
- Safari/WebKit was not run for this patch; no Safari PASS is inferred.
- No Backend, API, schema, migration, seed, scoring, QR payload or gameplay
  Business Rule changed.

# 2026-08-15 Team V2 demo and dead-style audit

- Frontend/demo-only: added the standalone TypeScript/Konva reference package with a reproducible lockfile and local generated-artifact ignores; retained legacy v4 sources for provenance and removed the retired bitmap reference.
- Removed all dead production score-caption selectors and synchronized the static, React and Konva demo variants with the caption-free score card.
- Fixed the demo's hard `620px` minimum-height landscape overflow, restored `100vh`/`100dvh` behavior and minimum `44px` controls, fitted the low-height footer/QR, and split React/Konva vendor chunks after removing the stale generated Vite config that shadowed source configuration.
- Verification PASS: demo `npm ci`, strict unused TypeScript check, production build, demo build without the prior chunk-size warning, and demo authenticated-independent Chromium smoke `2/2` at portrait/landscape.
- Final Frontend regression PASS: Vitest `70/70`, lint, i18n parity `440`, production bundle gate, and combined Chromium E2E `7/7`.
- No Backend, API, database, migration, seed, scoring or gameplay behavior changed.

# 2026-08-15 Team V2 score caption removal

- Frontend-only: removed the visible localized `Total score` caption from the centered V2 score card while preserving its numeric value, points unit and accessible label.
- Verification PASS: Frontend lint, production build/bundle gate, and authenticated Chromium E2E `5/5` at the three responsive target viewports.
- No Backend, API, database, migration, seed, score authority or calculation changed.

# 2026-08-15 Team V2 expanded map zoom

- Frontend-only: expanded responsive map zoom from `0.8x..5x` to `0.5x..8x`, normalized wheel/trackpad deltas, fixed repeated-wheel accumulation by committing the live transform after idle, and retained focal-point stability for wheel/pinch plus exact reset geometry.
- Verification PASS: full Frontend Vitest `70/70`, lint, i18n parity `440`, production build/bundle gate, and authenticated Chromium E2E `5/5`; the zoom smoke reached both exact clamps and reset at `844x390`.
- No Backend, API, database, migration, seed, gameplay, QR or Station-coordinate behavior changed.

# 2026-08-15 Team V2 overlay typography and left-side Legend

- Frontend-only: increased overlay information typography by 30% through shared semantic title/body/secondary tokens, converted Legend to a left-side 44px icon with a vertical expanded list, centered total score in low-height landscape, and standardized each marker/label state on one exact two-color gradient pair.
- Verification PASS: focused Frontend Vitest `19/19`, lint, i18n parity `440`, production build/bundle gate, and authenticated Chromium E2E `4/4` with computed geometry/type equality assertions.
- No Backend, API, database, migration, seed, gameplay or ranking behavior changed.

# 2026-08-15 Team V2 Legend, Settings and complete Leaderboard

- Frontend-only: aligned Legend and Settings framing with the React/Konva demo, centered the Settings icon, made footer underline stacking explicit, increased overlay typography, and removed the V2 Top 5 projection so every authoritative Leaderboard row renders with its real rank.
- Verification PASS: focused Frontend Vitest `19/19`, lint, i18n parity `440`, production build/bundle gate, and authenticated Chromium E2E `4/4` at the three responsive viewports plus computed-style/all-row Leaderboard coverage.
- No Backend, API, schema, migration, seed, ranking order or tie-break changed.

# 2026-08-14 Team V2 demo marker/header/footer fidelity

- Frontend-only: aligned the production React/Konva marker, header and footer geometry with `demo/Movement2026.jsx` and `demo/styles.css` while preserving the real map, data and callbacks.
- Verification PASS: focused Frontend Vitest `16/16`, lint, i18n parity `440`, production build/bundle gate, `git diff --check`, Graphify update and authenticated Chromium E2E at `390x844`, `844x390`, and `1024x768`.
- Not verified: WebKit/Safari. The local Playwright project is Chromium-only and no real Safari result is inferred.

# 2026-08-12 Team V2 demo visual port

- Frontend-only port of the supplied Team V2 demo visual. It preserves API, Backend, QR, scoring, map data, and Business Rules; local fonts replace runtime web-font loading.
- Frontend verification passed: focused map/layout tests, i18n parity, lint, production build, and authenticated Chromium portrait/landscape E2E. Safari real-device BrowserStack remains blocked by outbound access to `hub-aps.browserstack.com`.

# 2026-08-12 Team V2 full-map HUD reconciliation

- Frontend-only: converted the demo HUD into React components and marker state/heartbeat/radar into Konva rendering. The Stage now fills the complete viewport; header/footer are DOM overlays and do not crop the production map.
- Verification PASS: focused Frontend Vitest `16/16`, lint, i18n parity `440`, production build/bundle gate, and authenticated Chromium E2E at `390x844`, `844x390`, and `1024x768`.
- Not verified: Safari/WebKit real browser run; BrowserStack remains an external network dependency and no pass is inferred from Chromium.

# 2026-08-13 Team V2 demo v4 full-screen overlay presentation

- Frontend-only: made HUD fade/translucent so the full Konva map remains visible and gesture-capable under it; styled Settings, scanner, Team, Leaderboard, score entry and Station Detail as full-screen cyberpunk panels without changing their flows.
- Verification PASS: focused Frontend Vitest `16/16`, lint, i18n parity `440`, production build/bundle gate and authenticated Chromium E2E at `390x844`, `844x390`, `1024x768`.
- Not verified: Safari/WebKit. Local Playwright installation has Chromium only; BrowserStack results are not inferred.

# 2026-08-12 Final / Station transition reconciliation

- Final seed and runtime use `EVERY MOVE COUNTS`, outer trim + case-insensitive comparison, preserved internal whitespace, and persisted Top 10 rewards `40, 30, 25, 22, 20, 18, 16, 14, 12, 10`.
- Station cancel cooldown is removed while preserving Final wrong-answer cooldown. A→B check-in is serializable and abandons only an un-checked-out active A; pending-score A is rejected safely.

# 2026-08-08 Team V2 Settings display controls

- Moved Fullscreen into Team V2 Settings, added progressive landscape lock with localized Safari/manual fallback, and standardized the QR badge layout.
- Verification PASS: focused Frontend Vitest `5/5`, i18n parity `439`, and production build/bundle gate. Manual Chrome/Safari verification remains pending; no Backend, migration, seed, API, or Production behavior changed.

# 2026-08-08 Plan Mode workflow reconciliation

- Removed the mandatory seven-round Plan Mode workflow and `Rà X/7` format from
  active agent instructions. Plan Mode now asks only material questions and
  publishes when the specification is decision-complete.
- Retained concise Feature Analysis decision logs and all historical workflow
  records. This is documentation-only; no Backend, Frontend, migration, seed,
  API, or Production behavior changed.

# 2026-08-04 Team V2 direct marker-to-game flow

- Frontend-only interaction removed the intermediate preview and opens V2
  Station Detail directly from markers/Team overview. Backend unchanged.
- Focused Vitest (`8/8`), lint, build, and bundle budget passed.

# 2026-08-04 Team V2 overview overlay

- Frontend-only Team overlay projects existing Team/Station data and replaces
  the right footer navigation to V1. Backend contracts and state authority remain unchanged.
- i18n (`436`), lint, production build, and bundle budget passed.

# 2026-08-04 Team V2 cyberpunk wing footer

- Frontend-only CSS replaced the rounded footer frame with clipped neon wings,
  technical rails, and a center CTA pedestal. Backend unchanged.
- Lint, production build, and bundle budget passed.

# 2026-08-04 Team V2 absolute-centered scanner

- Frontend CSS now center-anchors the Scan CTA and raises its caption by `4px`.
- Lint, build, and bundle budget passed. Backend unchanged.

# 2026-08-04 Team V2 centered footer scanner

- Frontend-only CSS geometry centered the `96px` Scan CTA over `72px` rails.
- Lint, production build, and bundle budget passed. Backend unchanged.

# 2026-08-04 Team V2 compact footer baseline

- Frontend-only change removed the legend and aligned the smaller `96px` Scan
  CTA with the footer frame baseline. Backend behavior unchanged.
- Focused Vitest (`8/8`), lint, build, and bundle budget passed.

# 2026-08-03 Team V2 attached marker points and scanner framing

- Frontend-only rendering change attached points pills directly to markers and
  placed the smaller Scan CTA above the footer frame. Backend behavior unchanged.
- Focused Vitest (`8/8`), lint, build, and bundle budget passed.

# 2026-08-03 Team V2 compact navy marker refinement

- Frontend-only sizing/palette refinement reduced markers and legend, removed
  duplicate footer tab borders, and projected the existing Team name in the
  right footer action. No Backend or gameplay contract changed.
- Focused Vitest (`8/8`), i18n (`428`), lint, build, and bundle budget passed.

# 2026-08-03 Team V2 premium map HUD refinement

- Frontend-only refinement enlarged and enclosed the bottom navigation, added
  an accessible closed/open legend, clarified the map, and tightened marker
  state emphasis. No Backend, QR, scoring, or Station-state behavior changed.
- Focused Vitest (`8/8`), i18n (`428`), lint, production build, and bundle
  budget passed (`204.28 KiB` initial gzip).

# 2026-08-03 Team V2 dense-map readability and footer

- Frontend-only sizing refinement reduced markers/legend, enlarged portrait map
  coverage, and allowed the enclosed footer to fill wider viewports.
- No Backend, QR, scoring, Station state, or coordinate behavior changed.
- Focused Vitest (`14/14`), i18n (`426`), lint, build, and bundle passed.

# 2026-08-03 Team V2 marker legend

- Added a frontend-only localized three-state legend without hard-coding sample
  Station records or changing Backend state authority.
- Focused Vitest (`14/14`), i18n (`426`), lint, build, and bundle passed.

# 2026-08-03 Team V2 spec-locked bottom navigation

- Frontend-only footer geometry now follows the supplied `336x96px` annotated
  design and scales uniformly per viewport. No Backend behavior changed.
- Focused Vitest (`14/14`), i18n (`422`), lint, build, and bundle passed.

# 2026-08-03 Team V2 overlapped footer geometry

- Frontend-only footer geometry now layers the center scanner over continuous
  side wings and base frame. No Backend behavior changed.
- Focused Vitest (`14/14`), i18n (`422`), lint, build, and bundle passed.

# 2026-08-03 Team V2 large simplified footer

- Frontend-only footer sizing/content refinement enlarged the scan target and
  side wings while removing secondary visible metrics. No Backend change.
- Focused Vitest (`14/14`), i18n (`422`), lint, build, and bundle passed.

# 2026-08-03 Team V2 framed HUD regression fix

- Corrected frontend CSS inheritance that stretched the header over the map and
  rendered an empty footer container frame. No Backend behavior changed.
- Focused Vitest (`14/14`), i18n (`422`), lint, build, and bundle passed.

# 2026-08-03 Team V2 framed viewport composition

- Frontend-only CSS refinement separated the brand/score HUD, map canvas, and
  compact footer into non-overlapping viewport regions.
- No Backend API, data, QR, scoring, Station state, or coordinate behavior
  changed. Focused Vitest (`14/14`), i18n (`422`), lint, build, and bundle passed.

# 2026-08-03 Team V2 premium map state hierarchy

- Frontend-only visual update introduced cyan/gold/blue-gray Station state
  hierarchy and a Leaderboard/Scan/My-team footer using existing authoritative
  Team and Station data.
- No Backend API, persistence, QR, authentication, scoring, coordinates, or
  state derivation changed. Focused Vitest (`14/14`), i18n (`422` keys), lint,
  production build, and bundle budget passed.

# 2026-08-03 Team V2 compact variable-length markers

- Frontend-only marker refinement reduced pin and points-pill geometry and
  added display-code-length-aware font sizing for four-character Station codes.
- No Backend API, persistence, authentication, QR, state, or scoring behavior
  changed. Focused Vitest (`14/14`), i18n (`420` keys), lint, and build passed.

# 2026-08-03 Team V2 reference-proportioned markers

- Enlarged V2 pin/pill geometry and added reference-matched double outlines,
  depth surface, number hierarchy, and selected purple pill echoes.
- Preserved Backend marker state, coordinates, hit targets, points, Locked
  treatment, QR, scoring, database, and gameplay behavior.
- Verification PASS: focused Vitest `13/13`, i18n parity `420`, Frontend lint,
  production build, and bundle budget (`204.16 KiB` initial gzip JavaScript).
- Authenticated visual and physical-device smoke remain pending.

# 2026-08-03 Team V2 total-score clarity and taller pins

- Labelled `activeTeam.score` as Total score in a dedicated HUD panel and
  replaced inner-ring pins with larger, taller, unsegmented teardrops.
- Preserved aggregate authority, marker coordinates/state/hit targets, QR,
  scoring, database, and Backend behavior.
- Verification PASS: focused Vitest `13/13`, i18n parity `420`, Frontend lint,
  production build, and bundle budget (`204.16 KiB` initial gzip JavaScript).
- Authenticated visual and physical-device smoke remain pending.

# 2026-08-03 Team V2 teardrop marker states

- Refined V2 pins to the supplied teardrop/inner-ring reference and replaced
  Locked points text with a lock symbol in the lower pill.
- Preserved authoritative Backend state, Completed opacity/check, coordinates,
  hit targets, QR, scoring, and all gameplay behavior.
- Verification PASS: focused Vitest `13/13`, i18n parity `420`, Frontend lint,
  production build, and bundle budget (`204.16 KiB` initial gzip JavaScript).
- Authenticated visual and physical-device smoke remain pending.

# 2026-08-03 Team V2 simplified pins and footer

- Replaced complex marker artwork with a smaller simple numeric pin, reduced
  and fully rounded points pills, and rebuilt the QR/footer geometry to prevent
  caption and panel overlap.
- Removed the V2 page dependency on the complex marker component without
  changing marker coordinates, hit targets, state, QR, scoring, or Backend.
- Verification PASS: focused Vitest `13/13`, i18n parity `420`, Frontend lint,
  production build, and bundle budget (`204.16 KiB` initial gzip JavaScript).
- Authenticated visual and physical-device smoke remain pending.

# 2026-08-03 Team V2 compact numeric markers

- Removed Station names and connector lines from V2 map labels, moved Station
  display numbers into pins, and retained maximum points in compact lower pills.
- Preserved selected/active/Completed/Locked state appearance and all marker
  hit targets; no Backend, database, QR, scoring, or coordinate change.
- Verification PASS: focused Vitest `13/13`, i18n parity `420`, Frontend lint,
  production build, and bundle budget (`204.17 KiB` initial gzip JavaScript).
- Authenticated visual and physical-device smoke remain pending.

# 2026-08-03 Team V2 selected-Station preview

- Changed marker selection from immediate full Detail to a compact map-level
  preview with an explicit transition to the existing V2 Detail overlay.
- Reused existing Station state and media fields; no new request, Backend,
  database, QR, scoring, or coordinate behavior was introduced.
- Verification PASS: focused Vitest `13/13`, i18n parity `420`, Frontend lint,
  production build, and bundle budget (`204.16 KiB` initial gzip JavaScript).
- Authenticated responsive browser and physical-device visual smoke remain pending.

# 2026-08-03 Team V2 portrait HUD readability

- Added height-aware portrait scaling for the Team V2 footer/QR composition and
  compact horizontal header actions.
- Added viewport clamping and deterministic collision filtering for Station
  labels while preserving every marker and selected/active label priority.
- No Backend, database, QR, scoring, Station-state, or coordinate change.
- Verification PASS: focused Vitest `7/7`, i18n parity `417`, Frontend lint,
  production build, and bundle budget (`204.11 KiB` initial gzip JavaScript).
- Authenticated browser and physical-device visual smoke remain pending.

# 2026-08-03 Team V2 default route trial

- Switched every Team authentication and home/fallback redirect to `/team/v2`.
- Preserved Admin redirects and V1 routes; no Backend, session, database, QR,
  scoring, or Final behavior changed.
- Frontend container verification PASS: Vitest `61/61`, i18n parity `417`,
  lint, production build, and bundle budget (`204.10 KiB` initial gzip JS).

# 2026-08-03 Completed Station gameplay button

- Disabled the Team V1 gameplay button for finished Stations in both Station
  List and map drawer, using the existing bilingual Finished status label.
- Backend completion enforcement and V2 completed-state behavior were unchanged.
- Frontend container verification PASS: Vitest `61/61`, i18n parity `416`,
  lint, production build, and bundle budget (`204.08 KiB` initial gzip JS).

# 2026-08-03 Team score confirmation copy

- Replaced the generic Team score confirmation in V1 and V2 with localized,
  interpolated score and Station details plus a no-self-edit warning.
- Refined both Vietnamese and English wording to ask whether the user is sure
  they want to enter the displayed score for the Station.
- Frontend container verification PASS: Vitest `61/61`, i18n parity `416`,
  lint, production build, and bundle budget (`204.08 KiB` initial gzip JS).
- Admin correction messaging and all score submission behavior remain unchanged.
- Frontend container verification PASS: Vitest `61/61`, i18n parity `416`,
  lint, production build, and bundle budget (`204.05 KiB` initial gzip JS).

# 2026-08-03 Team score reason removal

- Removed the optional Team reason field from post-Check-out score entry and
  stopped including it in the Team score request.
- Preserved the separate mandatory Admin correction reason path and all Backend
  score validation.
- Frontend container verification PASS: Vitest `61/61`, i18n parity `414`,
  lint, production build, and bundle budget (`203.98 KiB` initial gzip JS).

# 2026-08-03 QR modal Station identity layout

- Refined the shared Check-in/Check-out Station identity block into a compact
  horizontal code badge and wrapping Station name. No behavior or Backend
  contract changed.
- Frontend container verification PASS: Vitest `61/61`, lint, production build,
  and bundle budget (`203.98 KiB` initial gzip JS).

# 2026-08-03 Check-out QR camera-first modal

- Aligned the V1 Station Detail Check-out modal with the camera-first Check-in
  experience while preserving the existing Check-out API and scoring flow.
- Camera scans still auto-submit; manual entry is a collapsible fallback with
  an explicit confirmation action.
- No Backend, database, authentication, QR-purpose, tracking-mode, or scoring
  behavior changed.
- Frontend container verification PASS: Vitest `61/61`, i18n parity `414`,
  lint, production build, and bundle budget (`203.98 KiB` initial gzip JS).
  Physical mobile camera and responsive visual smoke remain pending.

# 2026-08-02 Admin Leaderboard authorization fix

- Fixed the shared Leaderboard page to select the public Leaderboard endpoint
  for Admin sessions while Team sessions continue using the lean authenticated
  Player endpoint.
- Corrected Frontend authorization classification: HTTP `401` invalidates the
  local session, while HTTP `403` is treated as a forbidden operation and no
  longer logs out an otherwise valid Admin or Team session.
- Runtime root-cause verification reproduced Admin `GET /api/player/leaderboard`
  as `403` and public `GET /api/leaderboard` as `200` before the fix.
- Verification PASS: focused Frontend Vitest `5/5`, full Frontend Vitest
  `61/61`, full Frontend lint, production build, and bundle budget (`203.64
  KiB` initial gzip JavaScript).
  Host-side Vitest was unavailable because dependencies are installed in the
  Docker volume; the same validation passed inside the running Frontend
  container. Manual browser click-through remains pending.

# 2026-08-02 Team V2 browser fullscreen

- Added an accessible Team V2 enter/exit fullscreen control using the standard
  Fullscreen API with `navigationUI: "hide"` and Safari `webkit*` fallbacks.
  Fullscreen events keep the control state synchronized; installed standalone
  mode hides the redundant control.
- Unsupported iPhone Safari receives localized Add to Home Screen guidance.
  Apple standalone/status-bar metadata, theme color, `100dvh`, and existing
  safe-area handling cover browser-chrome and Home Screen launch behavior.
- Verification PASS: focused fullscreen Vitest `5/5`, full Frontend Vitest
  `60/60`, i18n parity `399`, full Frontend lint, production build, and bundle gate
  at `203.63 KiB` initial gzip JavaScript. Physical Safari/iOS and Production
  verification were not performed. Backend, database, deploy, migration, and
  seed behavior were unchanged.

# 2026-08-02 Backend and database hot-path audit

- Confirmed that every authenticated Team request reads a session and writes
  `lastSeenAt`. Local PostgreSQL statistics show `292` updates and `28` dead
  tuples for `69` session rows. P0 optimization: keep revocation reads on every
  request but conditionally write the heartbeat at most once per minute.
- Confirmed that every `/api/player/state` poll rebuilds the global catalog
  version and lean leaderboard, in addition to Team progress, Event Config,
  Final Challenge, and Final submission state. P0 optimization: bounded
  single-flight caching with explicit invalidation after relevant mutations.
- Confirmed that `EventConfigService.getConfig()` performs an empty-update
  `upsert` on read paths. P0 optimization: `findUnique` for normal reads and a
  missing-row create fallback.
- The local database is approximately `9.8 MiB` with `25` Teams, `17` Stations,
  `425` progress rows, `217` activity logs, and zero Final submissions. No
  general index migration is justified yet. Candidate Activity Log and Final
  submission indexes remain deferred until Production query plans or growth
  metrics show a benefit.
- This pass was read-only for Backend and database. No cache, index, migration,
  seed, or Production state was changed.

# 2026-07-31 Team V2 exact Bézier Konva marker

- Replaced the prior polygon/circuit artwork with the supplied exact component:
  curved outer/inner `Path` geometry, radius-148 outer ring, black/white core,
  two highlights, and a seamless 180-`Arc` circular neon gradient.
- The `640×620` design uses center `(320,248)` and tip offset `(320,606)` while
  retaining the existing `32..64px` normalized-zoom clamp, state halo, minimum
  hit target, labels, Station coordinates, and V1 UI.
- Frontend lint, production build, bundle gate, focused marker-layout Vitest
  (`3/3`), diff check, and direct Chrome rendering of the repo component passed.

# 2026-08-01 Tối ưu request và dung lượng truyền

- Phân loại `Refactor`; không thay đổi Business Rules về auth, QR, scoring,
  Final hay leaderboard.
- Thêm `GET /api/admin/qr-status-summary`, chỉ trả metadata trạng thái/count và
  không select/trả raw token. System Config giảm từ 42 request QR-token xuống 1
  request summary; cùng progress matrix, bootstrap canonical giảm từ 43 xuống 2
  request. Token chi tiết vẫn chỉ tải khi Admin bấm mở QR. Local matrix đo được
  75,993 bytes thay cho baseline 101,512 bytes (giảm 25.1%); QR summary là
  1,767 bytes.
- Lưu `state.final` từ `/api/player/state` vào Zustand và bỏ polling Final riêng
  trên Station List. Steady state giảm từ khoảng 12 xuống 8 GET/phút; Data Saver
  hoặc `2g`/`slow-2g` dùng chu kỳ 30 giây, còn khoảng 4 GET/phút.
- Giới hạn map reduced-data ở WebP 1920px; bỏ `Content-Type: application/json`
  khỏi GET không có body; cho playing-counts, leaderboard và QR summary dùng
  `private, no-cache` để tái sử dụng ETag/304; cache CORS preflight 10 phút để
  giảm OPTIONS lặp lại trên đường OBS/API khác origin.
- Bật gzip và cache policy trong Nginx; OBS deploy gắn cache 30 ngày cho file
  ổn định, một năm immutable cho `/assets`, và để HTML `no-cache` nhằm cho phép
  revalidate/304. `chattri` dùng `REPLACE_NEW` để giữ nguyên metadata không được
  chỉ định như `Content-Type`. Không deploy hoặc thay đổi Production state.
- Verification PASS: Backend Jest `164/164`, lint, build; Frontend Vitest
  `55/55`, i18n parity `395`, lint, production build và bundle gate
  `203.38 KiB` initial gzip. Targeted Backend QR summary và Frontend
  QR/data-saver/api-client tests đều PASS. `bash -n fe/deploy/deploy.sh` và YAML
  parse PASS. Local Backend preflight thật trả `204` cùng
  `Access-Control-Max-Age: 600`; matrix và QR summary không đổi đều trả `304`
  với zero body bytes. `nginx -t`, live OBS metadata/gzip, browser Network panel,
  physical device và Production runtime chưa được verify.
- `graphify update .` PASS với `2784` nodes, `4714` edges, `209` communities;
  focused query tìm được `getAdminQrStatusSummary()` và hai detailed-token calls
  trong System Config. Cảnh báo không chặn vẫn còn: `hooks.json` zero-node, thiếu
  `tree_sitter_sql` cho 19 SQL files và community labels cần refresh.

# 2026-07-31 Team V2 single-line marker labels

- Changed the Team V2 Konva marker name row from word wrapping to one line with
  ellipsis. The points row remains unchanged beneath it.
- Marker/label geometry, anchors, Station data, APIs, and other screens are
  unchanged.
- Frontend lint, production build, bundle gate, focused marker-layout Vitest
  (`3/3`), and diff check passed.

# 2026-07-31 Team V2 centered score-only map header

- Removed only the `.team-v2-team` block from the Team V2 map header; Team data,
  authentication, footer progress, Settings, APIs, and other screens remain
  unchanged.
- Reworked the header grid so `.team-v2-score` always occupies the centered
  column in portrait and landscape while retaining its green neon treatment.
- Frontend lint, production build, bundle gate, and diff check passed.

# 2026-07-31 Team V2 supplied Konva-native marker (superseded)

- Replaced the interim SVG image/load path with the supplied native Konva
  geometry: gradient body, concentric rings, circuit traces, speed lines, and
  glow. The route no longer ships or decodes a separate Station marker asset.
- The artwork group uses the supplied `(320, 590)` tip as its offset and one
  normalized-zoom scale that clamps the rendered marker to `32..64px`. The
  marker has no internal number; Station code remains in its label. The screen
  anchor, state halo, minimum 44px interaction target, labels/connectors, map
  transforms, and V1 UI remain preserved.
- Focused marker-layout Vitest (`3/3`), Frontend lint, production build, bundle
  gate, and diff check passed. Authenticated in-map and physical-device visual
  verification were not performed.

# 2026-07-31 Team V2 supplied SVG marker (superseded)

- Replaced only the hand-built Team V2 Konva marker artwork with the supplied
  route-local cyan/purple SVG. The image is decoded once and reused by all
  marker nodes; the lower tip stays on the existing Station screen anchor.
- Preserved Station code, state-colored halo, 44px interaction target,
  label/connector geometry, map transforms, coordinates, APIs, and V1 UI.
- Focused marker-layout Vitest (`3/3`), Frontend lint, production build, bundle
  gate, diff check, and direct Chrome SVG rendering passed. Authenticated
  in-map and physical-device verification were not performed.

# 2026-07-30 Team Gameplay V2-owned Detail overlay

# 2026-07-30 Team V2 score and banner rails refinement

- Strengthened the total-score foreground to bright green with layered neon and
  centered it below the brand in landscape while preserving the portrait-safe
  right-side placement.
- Rebuilt the V2 brand plate and rails as a taller angular cyan HUD with long
  symmetric striped rails; marker, footer, data, API, and Backend behavior were
  unchanged.
- Frontend i18n parity (`395`), lint, full Vitest (`29/29`), production build,
  bundle gate, and diff check passed. Authenticated Chrome captures passed at
  320x568, 390x844, and 844x390; computed score was `rgb(77, 255, 88)` with
  layered neon and the browser console had no errors/warnings.

# 2026-07-30 Team V2 scanner-pin marker refinement

- Replaced only the Team V2 Konva marker drawing with a vector scanner pin:
  circuit traces, layered cyan/purple rings, a dark surface, modest glow, and
  a tip anchored to the unchanged Station coordinate.
- Updated label attachment clearance and connector start to the pin's visual
  top edge while keeping the existing single screen-space transform and marker
  layer above labels/connectors.
- Verification passed: focused marker-layout Vitest (`3/3`), full Frontend
  Vitest (`29/29`), i18n parity (`395`), lint, production build, bundle gate,
  diff check, and authenticated Chrome captures at min/default/max map scales.

# 2026-07-30 Canonical Station seed data synchronization

- Updated the canonical 17-Station dataset with supplied Vietnamese/English
  descriptions, exact decimal map coordinates, max points, and four YouTube
  media URLs. `ST001` keeps the user-confirmed YouTube Shorts URL rather than
  the supplied obsolete share.google URL.
- Changed normal local/test content synchronization to upsert canonical Station
  and Game records in place. Production inventory mismatch remains guarded by
  the explicit replacement confirmation path.
- Verification passed: canonical validation (17 records, 4 `ST`, valid points
  and coordinates), Backend lint/build, full Backend Jest (`162/162`), two
  local seed runs, database comparison (`0` mismatches), and `db:verify`.
- Local validation caveat: the first seed run occurred before the in-place
  guard and invoked the pre-existing destructive local replacement path. It
  reset local gameplay data only; no Production database was accessed. The two
  subsequent seed runs preserved the 34 Station QR token fingerprints and 425
  progress-row count.

# 2026-07-30 Team Gameplay V2 marker anchoring and footer refinement

- Replaced the V2 label collision/grid placement with a single transformed
  marker anchor, clamped normalized-zoom label scale/gap, and a connector to
  the scaled label bottom. Marker coordinates, map assets, APIs, Backend,
  database, migration, and seed data remain unchanged.
- Rebuilt only the V2 footer as independent angular Leaderboard, raised QR
  pedestal, and Team/completed-Station panels with thin cyan rails. The
  Leaderboard and scanner actions remain unchanged; copy is localized VI/EN.
- Verification passed: marker-layout Vitest (`3/3`), full Frontend Vitest
  (`29/29`), i18n parity (`395`), Frontend lint, TypeScript production build,
  bundle gate, and `git diff --check`.
- Authenticated Chrome visual comparison passed at 390x844, 844x390, and
  320x568 with full three-region footer content and no browser-console issues.
  Physical mobile and Production verification were not performed.

- Replaced V2-to-V1 `?from=team-v2` navigation with a V2-owned near-fullscreen
  Detail overlay; V1 Player/Admin Station Detail behavior remains native.
- Added V2-owned lazy gallery presentation while reusing the existing image API,
  Player state, QR action, cancel, and score mutation helpers.
- Added state-aware Detail actions and active Station QR caption. Scanner camera
  remains on-demand; rejection persistence and cleanup behavior are unchanged.
- Refined the V2 banner rails, compact marker-label placement, connectors, and
  Konva label/marker draw order without changing Station coordinates or APIs.
- Verification passed: targeted Detail/gallery/scanner Vitest `8/8`, full Frontend
  Vitest `26/26`, i18n parity `391`, lint, production build, and bundle gate.
- Authenticated Chrome smoke passed for banner/rails across the approved seven
  viewport sizes and opening an Available Detail without URL change. The
  active-Station Complete/Cancel browser path remains pending; physical mobile
  camera and Production runtime verification were not performed.
  Backend/database/migration/seed were unchanged.

# 2026-07-30 Frontend OBS deploy sync reliability

- Root cause of the recurring `Deploy Frontend (OBS)` failure: `obsutil sync`
  reported `Succeed count: 11  Failed count: 1` and exited `8`, which failed the
  step. Runs `30427654430`, `30338153365` (1 failed object) and `30345371924`
  (3 failed objects) share the same signature, so the failure is intermittent
  per-object upload loss, not a credential, bucket, or argument problem.
- Confirmed the per-object cause was never observable: obsutil writes it only to
  the result files under `OutputDir` (`/home/runner/.obsutil_output`), never to
  stdout. Run metrics (`max cost:38816 ms`, `average tps:0.18`, ~68KB/s across 5
  parallel jobs) point at the largest assets, `fe/dist/images/map/*.png`
  (1.86MB and 936KB), timing out while sharing low regional throughput.
- Changed only [`.github/workflows/fe-deploy.yml`](../../.github/workflows/fe-deploy.yml):
  `sync` and the `index.html` `cp` now run through a 3-attempt retry with
  10s/20s backoff, `sync` uses `-j=3` and `-o=<workspace>/obsutil-report`, the
  failed result files are printed when all attempts fail, and they are uploaded
  as the `obsutil-report` artifact on failure.
- Retry is safe because `sync` skips objects already present with matching
  size/mtime, so a retry re-uploads only the objects that actually failed.
- Verification: `fe-deploy.yml` parsed as YAML, the step script passed
  `bash -n`, and the rendered script was executed against an obsutil stub for
  the succeed-first, fail-twice-then-succeed, and always-fail cases. Exit codes
  were `0`, `0`, and `1`, and the failure case printed the failed report.
- Not performed: a real OBS deploy run, so the fix is not yet confirmed against
  live Huawei Cloud throughput. `-meta=Cache-Control:no-cache,no-store,must-revalidate`
  was left unquoted because obsutil separates metadata pairs with `#`, not `,`,
  and the shell does not split on commas. `NODE_VERSION` remains `20`; the Node
  20 deprecation warning is unrelated to this failure. No push or deploy.

# 2026-07-29 Team runtime stability resume completion

- Completed the post-checkpoint review of lean/legacy Player data, mutation
  reconciliation, session-principal isolation, visible/online polling, and
  route/heavy-module loading.
- Added Node v26-safe Vitest Web Storage setup and tests for hidden/offline
  polling, non-overlap, successful mutation reconciliation, and unknown mutation
  outcome reconciliation.
- Updated `scripts/production-like-smoke.ps1` for current bilingual Station DTO,
  idempotent duplicate score behavior, TIME score `10`, separate
  `finalStartsAt`, and lean payload assertions.
- Verification passed: Backend Jest `162/162`, lint, build; Frontend Vitest
  `19/19`, lint, i18n parity `388`, production build/bundle gate; disposable
  PostgreSQL all 18 migrations, seed twice, `db:verify`, HTTPS authenticated
  smoke, secret scan, and production environment guard.
- Measured `/api/player/state` at `3,885` bytes and VI catalog at `5,908` bytes
  with 17 Stations and no `imageUrls`. Initial static JavaScript remained
  `203.27–203.28 KiB` gzip against the `420 KiB` limit.
- Production deploy/runtime, physical iOS/Android, and manual responsive browser
  verification were not performed. Two high-severity React Router RSC-only npm
  advisories remain accepted without a breaking forced upgrade.

# 2026-07-29 Team Gameplay V2 supplied-reference reconciliation

- Reconciled only `/team/v2` to the supplied HTML reference: fixed cyan/green/
  pink/purple/gold palette, centered clipped brand, Team/score row, rounded pill
  footer, gold Leaderboard left, Progress right, and floating QR center.
- Replaced the prior blue/red oversized badge visual with a 74px default/64px
  small-screen inline SVG QR glyph and static pink-purple-cyan conic ring. The
  persistent scanner implementation and no-idle-animation decision remain.
- V2 palette ownership remains route-local in `--team-v2-*` variables and the
  canvas `V2_HUD_ACCENT`; no `Team.color`, inherited `--team-*`, or global AntD
  theme value participates in the rendered HUD/marker/control colors.
- Verification passed: Frontend `i18n:check` (`372` keys), lint, production
  build, `git diff --check`, and authenticated Team 01/05 Chrome captures at
  320x568, 390x844, and 844x390. Both Teams computed accent `#2FE4F0`, white
  heading, score `rgb(77, 255, 138)`, no inherited `--team-primary`, overlay
  opacity `0.85`, and main-HUD opacity `1`.
- Backend, database, migration, seed, QR token format, V1, Login, and shared
  `QrTokenInput` were not changed. Physical iOS/Android and Production runtime
  verification were not performed; push/deploy were not performed.

# 2026-07-29 Team Gameplay V2 QR badge and persistent scanner

- Replaced only `/team/v2`'s center QR CTA with `TeamV2QrBadge`, an inline SVG
  using fixed cyan `#7DF9FF`, decorative lower red `#FF4D4F`, and responsive
  112/96/88px sizing. V1, Login, and shared `QrTokenInput` remain unchanged.
- Added V2-only `TeamV2QrScanner`: camera auto-start, persistent preview after
  safe API rejection, manual fallback after camera/API failure, held rejected
  token suppression, immediate different-token handling, 600ms empty-frame
  re-arm, and complete success/close/unmount track/detector/RAF/metadata cleanup.
- Added VI/EN safe error mapping for QR lifecycle, Station state, cooldown,
  conflicting play, checkout state, network/server, and generic failures. Raw
  Backend bodies, stack traces, and QR tokens are not rendered or logged.
- Fixed a remaining V2 palette override: the global Team Color primary-button
  selector had higher specificity than the V2 scanner rule. Route-local V2
  selectors now retain the fixed blue gradient and white content.
- Verification passed: Frontend `i18n:check` (`372` keys), lint, production
  build, `git diff --check`, authenticated 320x568/390x844/844x390 badge smoke,
  and Chrome fake-camera scanner lifecycle smoke. Actual local Backend rejects
  verified persistent preview and `403` no-logout behavior; the accepted
  frontend cleanup path used a synthetic `200` response.
- Not performed: physical HTTPS camera scan on iPhone Safari/Chrome iOS or
  Android, Production runtime verification, push, or deploy. Vite retains the
  known non-blocking large-chunk warning.

# 2026-07-29 Team Gameplay V2 fixed-palette isolation

- Root cause: `TeamGameplayV2Page` called `getTeamThemeVars(activeTeam.teamColor)`
  and passed `--team-primary` into CSS plus canvas markers. Team 05 therefore
  replaced the approved V2 blue/green HUD with its magenta Team Color.
- Removed V2's dependency on `getTeamThemeVars`, inline `--team-*` values, and
  per-Team canvas marker colors. Route-local V2 tokens now own HUD accent,
  gradients, focus rings, overlays, QR, default markers, and primary controls.
- Fixed V2 palette is HUD `#1677FF`, score `#00FF72`, active `#00F5FF`, selected
  `#FF20DF`, and completed `#00F574`. V1 and other Team-facing routes retain
  the existing Team Color behavior.
- Verification passed: Frontend i18n parity (`356` keys), lint, production
  build, and authenticated Team 01/Team 05 Chrome captures at 390x844 and
  844x390. Both Teams computed the same V2 accent/heading/chip colors, score
  remained green, and V2 inherited no `--team-primary` value.
- Not performed: physical-device review, Production deployment/runtime
  verification, push, or deploy.

# 2026-07-29 Team Gameplay V2 HUD and Team Color reconciliation

- Reconciled the rendered Team Gameplay V2 screen with the approved angular
  black-grid/neon HUD specification. Team identity plates, Settings, bottom HUD
  chips, the QR pedestal, and overlay corners now use sharper sci-fi geometry
  with scoped Team Color lines, wash, and glow.
- Corrected panel-opacity scope: the saved opacity still applies to Settings,
  Leaderboard, scanner, score, and Station preview overlay layers, but no longer
  attenuates the main header/footer HUD or its Team Color identity.
- Preserved semantic colors: score and Station points remain `#00FF72`; active,
  selected, and completed Station colors remain independent of Team Color.
- Verification passed: Frontend i18n parity (`356` keys), lint, production
  build, `git diff --check`, and authenticated headless Chrome captures at
  390x844 and 844x390. Team 01 resolved to `#1677FF`, Team 05 to `#C41D7F`,
  score stayed `#00FF72`, Settings measured 374x828 at 390x844 with opacity
  `0.85`, and the main HUD computed opacity was `1`.
- Not performed: physical-device review, Production deployment/runtime
  verification, push, or deploy.

# 2026-07-28 Team Gameplay V2 parallel implementation

- Added a parallel Team-only fullscreen gameplay route `/team/v2` while keeping
  the default login redirect and existing `/stations/map` flow unchanged.
- Added Backend `POST /api/player/qr-action`, which validates the raw Station QR
  token through the database token record, resolves the authoritative
  `QrPurpose`, and reuses existing check-in/check-out domain logic. The response
  returns action, Station ID, `requiresScore`, and progress without exposing raw
  tokens or backend internals.
- Preserved V1 check-in/check-out endpoints and added idempotent duplicate scan
  behavior: duplicate active Check-in does not increment `attemptNo`, and
  duplicate completed Check-out returns existing progress without another write.
- Frontend V2 uses the existing WebP map assets, Station coordinates, QR camera
  input, Team session, Team Color scoped vars, localized Team display name, and
  live polling. Settings, Leaderboard, and Station preview share the whole-panel
  opacity setting saved in `movement-team-v2-panel-opacity`.
- Frontend V2 main HUD now follows the approved neon reference layout and keeps
  all in-viewport Station names/maximum points visible through screen-space
  collision handling. Pan, wheel/pinch zoom, and double-click/double-tap reset
  no longer depend on floating map-control buttons.
- V2 Settings, Leaderboard, QR scanner, and score entry now use blocking,
  centered near-fullscreen modal layers in portrait and landscape; Station
  preview is centered and the exact top-center brand casing is `MOVEment 2026`.
- Station Detail honors fixed `?from=team-v2` for Team gameplay action returns;
  no arbitrary return URL was added.
- Verification passed: targeted PlayerService Jest (`28/28`), full Backend Jest
  (`157/157`), Backend lint/build, Frontend `i18n:check` (`356` keys), Frontend
  lint/build, responsive headless Chrome screenshots, map interaction smoke,
  centered/near-fullscreen overlay geometry smoke, exact brand-casing smoke,
  and `git diff --check`. Vite retains the known non-blocking large-chunk warning.
- Not performed: real camera scan, physical iOS/Android verification,
  Production runtime verification, push, or deploy.

# 2026-07-28 Production deploy preflight and partial smoke

- Confirmed `origin/master` and `origin/develop` both point at
  `9929d0252687a629b3f8d19cdce2906c159d3907`; no repository push was required
  for the current local HEAD to be available on the deployment branch.
- Confirmed current source deployment workflows differ from older staged docs:
  [`.github/workflows/be-deploy.yml`](../../.github/workflows/be-deploy.yml)
  supports `push` to `master` and `workflow_dispatch`, and
  [`.github/workflows/fe-deploy.yml`](../../.github/workflows/fe-deploy.yml)
  deploys directly to OBS with required HTTPS `VITE_API_BASE_URL`.
- Backend Production read-only smoke passed for
  `https://heroes.nalth.top/api/docs`: it returned Swagger UI for
  `MOVEment 2026 API` version `0.1.0`.
- Frontend Production read-only smoke found a blocker:
  `https://heroes.nalth.top/` and `/qr-login?token=__codex_readonly_probe__`
  return SPA `index.html`, but that HTML references
  `/assets/index-BTYLObga.js`; the current local build references
  `/assets/index-DAFO-QAT.js`, and direct HEAD checks for both JS assets returned
  OBS `403 AccessDenied`. The browser-visible app may fail to load until the
  frontend deployment is repaired or rerun successfully.
- Deployment was not triggered from this workspace because GitHub CLI is not
  installed, no GitHub dispatch token is present, and no Huawei
  `HUAWEI_ACCESS_KEY`/`HUAWEI_SECRET_KEY` credentials are present for direct OBS
  sync. Backend redeploy was also not attempted because the user requested to
  skip DB work and the recent commit range includes migration/seed/schema
  changes that the backend deploy detector would treat as database-related
  unless the server marker already proves those changes are deployed.
- Graphify query ran successfully through the console entrypoint. Earlier
  fallback attempts through missing `.graphify_python`, `py`, and `python`
  failed in this Windows session, but no NetworkX fallback was needed.
- No Source Code, migration, seed, Production data, push, or destructive Git
  operation was performed.

# 2026-07-28 Tester auto-stop conflicting local processes

- Added opt-in `-StopConflictingProcesses` handling to `tester-run.ps1` and
  enabled it for root `tester`, `tester:no-seed`, `tester:smoke`, and
  `tester:serve` npm scripts. Direct script invocation without the switch keeps
  the existing fail-fast port guard.
- Before preparation, the runner now stops only unique listener PIDs on the
  configured API, Frontend, and Prisma Studio ports, logs PID/process name,
  refuses protected/current PIDs, waits up to five seconds for release, and
  re-runs the availability assertion before database/build work.
- Full `npm run tester:smoke -- -SkipInstall -SkipSeed` verification auto-stopped
  the existing Frontend listener PID `24060` on `4173`, completed Prisma
  generate/migrate, Backend/Frontend builds, started and probed API/Frontend/
  Prisma Studio, exited `0`, and left ports `3000`, `4173`, and `5555` free.
- Graphify code update completed with `2366` nodes, `3866` edges, and `206`
  communities; it retained the known `hooks.json` zero-node and no-Gemini
  documentation semantic-extraction warnings.
- The known non-blocking Vite large-chunk warning remains. Production, remote
  database, push, and deploy actions were not performed.

# 2026-07-28 Admin System Config Station locale display

- Confirmed by live `GET /api/admin/progress-matrix` inspection that Backend
  returns `name`, `nameEn`, `description`, and `descriptionEn`; ST001 returned
  `Memory Waterway` and its English description alongside canonical VI data.
- Commit-history comparison confirmed the earlier localization patch did not
  remove an Admin locale fetch or EN selection: System Config rendered
  `station.name`/`station.description` before and after that patch.
- Updated System Config to select EN Station name/description locally when the
  Admin locale is English, with per-field VI fallback. Card text, Station QR
  modal text, alt text, and edit/delete accessibility labels share the localized
  display name. No redundant Backend refetch is required.
- Frontend lint and production build passed. Vite retains the known non-blocking
  large-chunk warning. Local Frontend HTTP smoke at `127.0.0.1:4173` could not
  run because no preview server was listening; post-fix browser/mobile and
  Production runtime verification were not run.
- Graphify code update completed with `2362` nodes, `3860` edges, and `209`
  communities; it retained the known `hooks.json` zero-node and no-Gemini
  documentation semantic-extraction warnings.

# 2026-07-28 YouTube-style Player video action

- Restyled enabled Player `Watch Video` actions across Station List, Map drawer,
  and Station Detail with YouTube red, white copy/icon, filled YouTube mark, and
  explicit hover/focus/active feedback.
- Preserved the existing neutral disabled style and the eligibility gate:
  `gameType = ST` plus a usable YouTube URL. Gameplay, Team Color primary
  actions, Admin Team Station cards, Backend, API, database, migration, and seed
  behavior are unchanged.
- Verification passed: Frontend lint, Frontend production build, and
  `git diff --check`. Vite retains the known non-blocking large-chunk warning;
  post-change browser/mobile and Production runtime verification were not run.
- Graphify code update completed with `2359` nodes, `3855` edges, and `205`
  communities; it retained the known `hooks.json` zero-node and no-Gemini
  documentation semantic-extraction warnings.

# 2026-07-28 Admin System Config localization fix

- Localized Admin System Config tabs, create/show/delete actions, tracking-mode
  options, QR status and preview copy, confirmations, toasts, Team progress
  summaries, fallback errors, and icon-button accessibility labels in VI/EN.
- Applied display-layer localization to seed-style Team names while preserving
  canonical Vietnamese Admin Station content, Station/Team IDs, QR payloads,
  token purpose/status values, API contracts, and Backend behavior.
- Removed raw Backend error messages from updated System Config user-facing
  branches and replaced them with localized action-specific fallback copy.
- Verification passed: Frontend i18n parity/no-empty check (`314` keys),
  Frontend lint, Frontend production build, focused hard-coded-copy scan, and
  `git diff --check`. Vite retains the known non-blocking large-chunk warning.
- Graphify code update completed with `2357` nodes, `3853` edges, and `206`
  communities. It retained the known `hooks.json` zero-node warning and did not
  semantically re-extract changed docs without Gemini.
- Post-fix desktop/mobile browser smoke and Production runtime verification were
  not performed.

# 2026-07-28 Station Media Gallery and Player action layout

- Added normalized `station_images` persistence with ordered/cascade/unique/range
  constraints. Existing 17 canonical Stations remain empty until Admin supplies
  at most 10 unique HTTPS URLs; Backend validates without fetching external URLs.
- Admin Station create/update now manages `imageUrls` atomically with preserve,
  clear, replace, and reorder semantics. Player/Admin Station responses return
  ordered URL arrays without persistence IDs.
- Added VI/EN Admin gallery controls and a shared Player Image PreviewGroup with
  no-referrer loading and broken-image fallback. Station List/Map show Video and
  Images above full-width Play/In Progress; Detail keeps Complete and Cancel.
- Verification passed: Prisma generate, local migration deploy, database
  constraint/index inspection, seed twice, `db:verify`, targeted tests `63/63`,
  full Backend Jest `153/153`, Backend lint/build, Frontend i18n parity `273`,
  Frontend lint/build, authenticated API smoke, and Chrome visual review at
  320/375/1280px. Vite retains the known non-blocking large-chunk warning.
- Graphify code update completed with 2355 nodes, 3848 edges, and 208 communities;
  it retained the known `hooks.json` zero-node warning and did not semantically
  re-extract changed docs because no Gemini backend was configured.
- Production deploy/runtime and physical-device verification were not performed.

## 2026-07-28 Station map interaction performance

- Reduced the Konva Stage backing canvas to the visible viewport while keeping
  the existing logical map size, persisted `0..100` marker coordinates, Admin
  update API, and pan/zoom transform behavior unchanged.
- Isolated the static WebP map image in a non-listening background Layer and
  markers in a separate interactive Layer, preventing marker animation from
  continuously redrawing the background image.
- Limited animation to the active Station, paused it during dragging, honored
  `prefers-reduced-motion`, and disabled unnecessary perfect/stroke-shadow draw
  work on the marker body.
- Normal-zoom WebP selection now uses visible viewport width. Map live-count
  polling and the cooldown timer run only while the Station drawer is open.
- Final worktree verification passed: full Backend Jest suite (`148/148`),
  Backend lint/build, Frontend lint/build, Frontend i18n parity (`261` keys), and
  `git diff --check`. The known non-blocking large-chunk warning remains.
  Browser/device FPS profiling, authenticated persistence smoke, and Production
  runtime verification were not performed.

## 2026-07-28 Daily 22:00 session expiry

- Changed the confirmed session policy for both Admin and Team authentication:
  every session expires at the next daily `22:00 Asia/Ho_Chi_Minh` cutoff;
  login exactly at or after `22:00` expires at `22:00` the following day.
- Backend now computes one authoritative cutoff, writes it to JWT `exp`, and
  returns the matching ISO `expiresAt` from password, Legacy Team QR, and
  Automatic URL Team QR login responses. The cutoff is absolute and is not
  extended by activity or `lastSeenAt`.
- Frontend login flows now persist Backend `expiresAt` unchanged, globally clear
  local auth state at that cutoff even while the tab remains open, and no longer
  create an independent 24-hour expiry. Removed the obsolete tracked
  `JWT_EXPIRES_IN=12h` configuration from examples, tester Compose, and the
  production-like smoke harness; local secret env files were not modified.
- Verification passed: cutoff unit tests for before/exactly-at/after `22:00`,
  full Backend Jest suite (`148/148`), Backend lint/build, and Frontend lint/build.
  Frontend dependencies were synchronized with `npm ci`; npm reported four high
  severity advisories in the full tree, and `npm audit --omit=dev` reported two
  high `react-router` advisories whose available `--force` fix is breaking. They
  were not auto-fixed in this task.
- Not performed: browser clock/manual expiry test, Production runtime
  verification, deploy, push, or destructive Git operations.

## 2026-07-27 Localized header visual refinement

- Refined the shared AppFrame header into a floating rounded white card with
  polished account badge, divider, responsive mobile compaction, and Team-color
  accents while preserving the existing `RunningPersonIcon` brand logo.
- Finalized the account cluster order as language switch, divider/build stamp,
  then account actions so locale and deployment context stay visible before the
  logout control on both Admin and Team headers.
- Replaced the Ant Design segmented language control with inline circular VI/EN
  flag buttons, keeping the existing persisted i18next language behavior and
  Player Station refetch hook unchanged.
- Verification passed: Frontend lint, Frontend production build, and
  `git diff --check`. Frontend build retains the known non-blocking large-chunk
  warning. Manual browser visual smoke was not performed in this workspace.

## 2026-07-27 Frontend localization follow-up

- Extended the confirmed Frontend localization behavior without Backend,
  migration, seed, QR, scoring, or API contract changes.
- Added display-layer Team name localization for seed-style `Team NN`/`Đội NN`
  names while preserving raw Team data, Team IDs, usernames, tokens, and custom
  Team names.
- Updated Team/Admin visible copy on Station list/detail/map, Team list,
  Leaderboard, Final, and Admin Operations to use VI/EN resources. `MOVEment
  2026` remains unchanged.
- Language switch initially displayed compact VI/EN labels; the later localized
  header visual refinement supersedes this with circular inline flag buttons.
  Station UI ordering now uses status order then natural `stationId`; Station
  dropdowns without status sort by Station ID.
- Final UI keeps compact navigation label `Final`, uses a flag icon, and shows
  the full heading as `Thử thách cuối cùng` / `Final Challenge`. Success trophy
  remains unchanged.
- Verification passed: Frontend `i18n:check` (`259` keys), Frontend lint,
  Frontend production build, and JSX visible-copy scan showing only the
  permitted `MOVEment 2026` brand text remains. Frontend build retains the known
  non-blocking large-chunk warning.
- Pending: manual desktop/mobile Team/Admin browser smoke and full hard-coded
  copy audit beyond the JSX direct-text scan.

## 2026-07-27 Station localization and FE language switch

- Added Station bilingual storage with `stations.name_en` and nullable
  `stations.description_en`; Vietnamese `name`/`description` remain canonical.
- Added provisional English content for the 17 canonical Stations in migration
  and seed data. Canonical signature intentionally ignores EN fields so normal
  seed can update translations without destructive Station replacement when the
  gameplay inventory already matches.
- Player Station and Progress APIs accept `lang=vi|en`, preserve the public
  `name`/`description` response shape, fallback invalid/missing locale to VI,
  and fallback missing EN per field to VI without exposing raw bilingual fields
  to Player responses.
- Admin Station create/update and progress matrix now support
  `name`, `description`, `nameEn`, and `descriptionEn`; create requires non-empty
  VI/EN names, update trims only supplied fields, and QR/scoring/progress
  transaction behavior is unchanged.
- Frontend added `i18next`/`react-i18next`, persisted `movement-language`, AntD
  locale sync, `<html lang>` sync, Login/QR/AppFrame language switch, Player
  Station refetch on language change with latest-request-wins, and Admin Station
  Editor VI/EN sections.
- Verification passed: Prisma Client generation, migration deploy on local
  disposable-style DB target `127.0.0.1:55432/movement`, two consecutive seed
  runs, `db:verify`, canonical `name_en` count check (`17`), targeted
  `player.service.spec.ts` (`24/24`), targeted `admin.service.spec.ts` (`34/34`),
  full Backend Jest suite (`144/144`), Backend lint/build, Frontend
  `i18n:check` (`86` keys), Frontend lint/build, `git diff --check`, and
  Graphify code graph update. Frontend build retains the known non-blocking
  large-chunk warning. Graphify retains warnings for `hooks.json` zero nodes and
  missing optional `tree_sitter_sql` SQL extraction.
- Pending: browser smoke and final commit.
- `npm install i18next react-i18next` reported existing 4 high-severity npm audit
  findings; vulnerability remediation is not part of this localization change.

## 2026-07-27 Feature Analysis workflow consolidation

- Replaced `.kilo/plans` with seven routed Feature Analysis documents directly
  under `docs/analysis`.
- Consolidated 11 historical plans with provenance, current implementation
  status, pending runtime/browser verification, risks, and stale assumptions.
- Renamed the Excel/Team Color requirements file to
  `EXCEL_EXPORT_AND_TEAM_COLOR_ANALYSIS.md` and updated tracked references.
- Added the mandatory seven-round Plan Mode workflow to `AGENTS.md` and
  `docs/prompts/00_WORKFLOW.md`.
- This is documentation/workflow reconciliation only; no Backend, Frontend,
  migration, seed, API, or Production behavior changed.

## 2026-07-27 Team header identity

- Added the confirmed Authentication/User Header rule: Team users see the current Team name in the app header instead of the generic `User` label.
- Preserved Admin behavior: Admin continues to see the existing `Admin` logout button in every environment.
- Updated the Frontend `AppFrame` so Team users keep a logout button labeled with the Team name in every environment; hiding Team logout is deferred to a separate release task.
- Removed the redundant Team-only `Current team: ...` header line and added ellipsis styling so long Team names remain constrained; the Team logout button remains visible on mobile while the Deploy stamp keeps its existing mobile hide behavior.
- No Backend API, session policy, seed, migration, QR, or database behavior changed.
- Verification passed: Frontend lint, Frontend build, Frontend production build, `git diff --check`, and Graphify code graph update. Frontend builds retain the known non-blocking large-chunk warning.

## 2026-07-27 Player cancel cooldown UX

- Preserved the confirmed Station Flow Business Rule: Cancel returns the Team Station to `AVAILABLE` and applies the configured cooldown, default 5 minutes.
- Added PlayerService regression coverage for `Start game -> Cancel/cooldown -> Start game`: Backend rejects restart before `nextCheckInAllowedAt`, allows restart after the deadline, and clears `nextCheckInAllowedAt` on the successful new Check-in.
- Mapped `nextCheckInAllowedAt` into the Frontend `TeamStation` model and added shared cooldown helpers so Station List and Player Map show `Cooldown mm:ss`, disable the Play action during cooldown, and avoid opening the Check-in QR modal before the deadline.
- Verification passed: targeted PlayerService Jest test (`21/21`), full Backend Jest suite (`134/134`), Backend lint/build, Frontend lint/build, and `git diff --check`. Frontend build retains the known non-blocking large-chunk warning.
- Graphify code graph update passed through the saved Python interpreter; full semantic doc/image update was attempted but failed because 52 doc/image files required an LLM backend/API key in this environment.

## 2026-07-27 Team Results tracking-mode headers

- Extended the confirmed Team Results Excel Business Rule so every active Station's three column headers identify its tracking mode as `[Score only]`, `[Time only]`, or `[Both time and score]`.
- Updated ExcelJS workbook generation to derive the display label from the existing `TeamResultStationColumn.trackingMode`; no Station column, worksheet, API field, database schema, migration, seed, ranking, score, duration, or timestamp behavior changed.
- Added workbook regression coverage for all three tracking modes, duplicate Station headers, and a completed `SCORE` Station whose accepted Check-in and Check-out timestamps remain different.
- Verification passed: targeted Team Results Jest test (`3/3`), full Backend Jest suite (`132/132`), Backend lint, and Backend build.
- Graphify incremental update was attempted through the saved Python interpreter but stopped before updating the graph because 52 changed documents/images required a semantic extraction backend; `--code-only` was not used because it would omit the changed documentation.
- Manual Excel/Google Sheets open review, Production runtime verification, push, and deploy were not performed.

## 2026-07-27 Tester backend ExcelJS dependency detection

- Investigated the Backend build failure in `src/modules/team-results/team-results-excel.ts` where TypeScript could not resolve `exceljs` and then inferred `worksheet.columns.forEach(...)` parameters as `any`.
- Confirmed `exceljs` is already declared in `be/package.json`/`be/package-lock.json`; the failure was caused by an incomplete local Backend `node_modules`, not by a missing source dependency or Team Results Excel implementation error.
- Restored local dependencies with `npm ci`, regenerated Prisma Client after reinstall, and confirmed `npm run build` passes in `be`.
- Updated `scripts/tester-run.ps1` so Backend dependency detection treats `exceljs` as a required package and triggers install when it is missing.
- No Backend API, database schema, migration, seed, Team Results workbook content, routing, or Business Rule behavior was changed.

## 2026-07-27 Station numeric display code UI

- Added a frontend-only Station display code for canonical Station IDs: `ST001`...`ST017` render as `01`...`17`, and `ST018` renders as `18` if it appears later, in the Team/Admin Station list, Player map markers, Admin map station selector, map drawer title, and check-in modal copy.
- Replaced the Station List and map drawer play-icon avatars with the same display code, removed the duplicate code Tag beside the Station name, and retained compact rendering for noncanonical IDs.
- Preserved the technical Station ID contract for database/API/routes/keys/select values: actions still use raw IDs such as `ST001`; other noncanonical IDs such as `ST047` or `ST15A` render unchanged.
- No Backend, database schema, migration, seed, QR, scoring, Station Detail, System Config editor, or sorting behavior was changed.
- Verification passed: frontend lint, frontend build, and `git diff --check`. Frontend build retains the known non-blocking large-chunk warning. The bare `graphify` console entrypoint was absent from the inherited PATH, but the installed CLI remained available through `python -m graphify`; a NetworkX fallback was not required.

## 2026-07-26 Station QR checkout scoring update

- Updated Station QR Check-in/Check-out UX so camera-decoded Station QR tokens auto-submit while manual paste/type still requires Submit.
- Changed confirmed `TIME` Station Check-out behavior to auto-complete with score `10`, add a `TIME_STATION_AUTO_SCORE` score event, and keep real Check-in to Check-out duration.
- Changed `SCORE` Check-out to store the accepted QR scan time while preserving zero play-duration contribution through shared scoring helpers.
- Updated Admin Station create/update maxPossiblePoints synchronization to use effective max points: `TIME = 10`, `SCORE`/`BOTH = game.maxPoints`.
- Updated Team/User Station list, map drawer, and detail stats to show `Score / Max` using the effective max score.
- Verification passed: targeted Player/Admin service tests, backend build, frontend lint/build, `git diff --check`, `stations:sync -- --audit-only`, and `graphify update .`. Frontend build retains the known non-blocking large-chunk warning; Graphify retains warnings for `hooks.json` zero nodes and missing optional `tree_sitter_sql` extraction.

## 2026-07-25 Backend deploy healthcheck race

- Production `Deploy Backend (ECS)` failed after a successful PM2 restart with `curl: (7) Failed to connect to 127.0.0.1 port 8080` because `be/deploy/deploy.sh` healthchecked immediately while Nest was still booting.
- Updated `deploy.sh` to retry `HEALTHCHECK_URL` up to 30 times every 2 seconds, print PM2 status/logs on final failure, and only then update `/opt/movement/deploy-markers/movement-api.commit`.
- Manual ECS verification earlier the same day confirmed the API becomes healthy shortly after restart (`http://127.0.0.1:8080/api/docs` and `https://heroes.nalth.top/api/docs` both returned 200).


## 2026-07-25 Admin Station map position update

- Hardened Admin `/system-config` map marker updates in `StationsMapPanel` by snapshotting the selected Station and finite `mapX`/`mapY` payload before the confirmation modal calls `PATCH /api/admin/stations/:stationId`.
- Preserved the backend Station identifier contract: `stationId` remains the `Station.id` string primary key such as `ST001`; no numeric ID/code fallback, route change, guard weakening, QR, scoring, or Team behavior change was introduced.
- Verification passed: frontend lint/build, backend build, and `git diff --check`. Manual browser persistence verification was not performed in this workspace session.

## 2026-07-24 Canonical 17-Station seed and sync

- Replaced the old local/test Station seed inventory with the canonical 17 Stations `ST001`...`ST017`, preserving `ST` for `ST001`-`ST004` and normalizing `null`/`standard`/`STANDARD` input to DB/API `STANDARD`.
- Added shared canonical Station data, Station replacement logic, and manual `stations:sync` with safe DB target metadata, schema/constraint audit, explicit `CONFIRM_REPLACE_ALL_PROD_STATIONS=YES` guard, one transaction, FK-safe delete order, fresh SQ1 Station QR pairs, Team scoring reset, and post-sync verification.
- Updated seed idempotency so non-canonical local/test Station data is replaced once, repeated seed preserves canonical Station QR tokens, and seed-managed Teams get `maxPossiblePoints = 300` while per-Station `maxScore` values remain independent Station configuration data.
- Local verification passed: Prisma generate, Backend lint/build, full Backend Jest suite (`127/127`), two consecutive seed runs, `db:verify`, `stations:sync -- --audit-only`, and `git diff --check`. Local audit target was `127.0.0.1/movement`, with 17 canonical Stations, 34 active SQ1 Station QR tokens, 425 available progress rows, 4 `ST`, 13 `STANDARD`, zero score/final submissions, and no orphan-related counts reported by post-seed audit.
- Production sync was not run because the active `DATABASE_URL` target in this workspace is local (`127.0.0.1/movement`), not Production. No source push, deploy, schema drop, migration reset, or Production destructive data change was performed.

## 2026-07-24 Team Color palette and gradient buttons

- Added a stable 25-color uppercase HEX palette for seed-managed `team01`...`team25`, with fail-fast validation and direct Team 01-25 mapping without color rotation.
- Production Team fixture handling now silently skips missing seed-managed Teams and updates only `color` for existing matches; password hashing, fixture field updates, progress initialization, and QR credential work remain non-Production for this path.
- Added Team-context gradients for enabled primary page/footer and AntD overlay buttons with white `#FFFFFF` text/icons while preserving disabled, danger, default, QR info modal, and non-button semantics.
- Added body-level Team theme owner stacking for AppFrame and Team Editor preview cleanup, valid create preview behavior, saved-color edit fallback, and Team-colored current-Team Leaderboard highlighting.
- Reconciled the Station list/detail presentation pulled through `b9e3a485`; its new and revised primary actions remain covered by the shared Team-context selector, while the new disabled `Watch Video` style remains excluded from Team gradients.
- Verification passed after the pull: targeted Team color seed tests (`7/7`), Backend lint/build, Frontend lint/build, two consecutive local seed runs, `db:verify`, and `graphify update .`. Frontend build retains the known non-blocking large-chunk warning; Graphify retains warnings for `hooks.json` zero nodes and missing optional `tree_sitter_sql` extraction.
- Not performed: manual browser review, Production runtime verification, push, or deploy.

## 2026-07-24 Team Results Excel export and Team Color UI

- Added shared Team Results ranking/export logic with the confirmed comparator: `team.totalPoints` descending, `team.totalPlaySeconds` ascending, active completed Stations descending, correct Final submitted time ascending with nulls last, then numeric Team ID ascending.
- Added new Admin Team Results Excel endpoint `GET /api/admin/reports/team-results.xlsx` using ExcelJS, one worksheet, one row per non-deleted Team, active Station `Check-in`/`Check-out`/`Score` groups, HCMC filename/datetime conversion, numeric Excel date/duration formats, and `Content-Disposition` filename support.
- Kept legacy `/api/admin/reports/summary.xlsx` for compatibility; Admin Operations now downloads the new Team Results export.
- Added canonical `teamColor` API field with temporary `color` alias, strict Admin `#RRGGBB`/`null` validation, uppercase normalization, explicit clear behavior, missing-field unchanged update behavior, and conflicting alias rejection.
- Added scoped Team Color UI variables for Team-facing shell, Admin single-Team contexts, Admin Team list cards, and Team editor color input/preview without changing Admin map routes or `StationsMapPanel` behavior.
- Synchronized Business Rules, project spec, Feature routing, and the Excel/Team Color requirements document.
- Verification passed: targeted backend tests (`64/64`), full backend Jest suite (`120/120`), backend lint/build, frontend lint/build, `git diff --check`, and `graphify update .`. Frontend build retains the known non-blocking large-chunk warning. Graphify warned that `hooks.json` produced zero nodes and SQL extraction lacked `tree_sitter_sql`.
- Not performed: commit, push, deploy, Production migration/runtime verification, manual Excel/Google Sheets open check, manual browser Team Color review.

## 2026-07-24 Compact Admin headers and Team identity cleanup

- Reduced padding, icon size, title size, and spacing for Teams, Leaderboard, and Operations Center page headers.
- Removed the redundant Leaderboard and Teams header descriptions.
- Admin no longer sees `Current team` in the global header or a current-Team badge/style in the Team list.
- Player current-Team identity remains unchanged.
- Frontend lint and production build passed.

## 2026-07-24 Role-aware Leaderboard current-Team marker

- Leaderboard now derives the current Team marker only for Player sessions.
- Admin no longer sees `Your team` or the current-Team row highlight based on the last selected Admin Team.
- Player behavior remains unchanged.
- Frontend lint and production build passed.

## 2026-07-24 Admin Team-first Station navigation

- Removed the standalone Stations footer action for Admin while preserving it for Players.
- Admin login now opens `/teams`; selecting a Team opens `/teams/:teamId/stations`.
- Admin Station detail uses `/teams/:teamId/stations/:stationId`, preserving Team context for score/status actions and back navigation.
- Player `/stations`, `/stations/:stationId`, and map flows remain Player-only.
- Frontend lint and production build passed.

## 2026-07-24 Designated ST Station set

- Business designated exactly four `ST` Stations: `ST003`, `ST004`, `ST010`, and `ST047`.
- Added migration `20260724153000_designate_st_stations`, preserving `CIPHER`, assigning the designated set to `ST`, and assigning every other non-Cipher Game to `STANDARD`.
- Updated seed definitions so fresh databases use the same designated set.
- Applied the migration to the tester database. Result: `3 CIPHER`, `4 ST`, and `3 STANDARD`; the earlier `3 CIPHER` plus `7 ST` migration result is superseded.
- Verification passed: all `113` Backend tests, Backend/Frontend builds, migration status, two consecutive seed runs, and `db:verify`.

## 2026-07-24 Station Game Type constraint and video visibility

- Replaced free-text Station Game Type with the fixed values `CIPHER`, `ST`, and `STANDARD`.
- Added migration `20260724150000_constrain_station_game_types`: Legacy `CIPHER` values are preserved, other Games with a supported YouTube URL become `ST`, remaining Games become `STANDARD`, and a database `CHECK` constraint rejects other values.
- Backend DTO/service validation rejects unsupported types and rejects `ST` without a valid HTTPS YouTube URL.
- Admin Station create/edit uses a combobox. Player Station detail and map expose `Watch Video` only for `ST`; the Team/User Station list always renders the action but disables it unless the Station is `ST` with a usable URL. Admin Team Station lists omit video actions.
- Updated local/test seed and production-like smoke inputs to use the canonical types.
- Applied the migration to the tester database. Result: `3 CIPHER`, `7 ST`, `0 STANDARD`; all seven non-Cipher seed Games have a valid stored YouTube URL.
- Verification passed: all `113` Backend tests, Backend/Frontend lint and build, migration status, two consecutive seed runs, `db:verify`, and local Backend/Frontend HTTP route checks.

## 2026-07-24 Admin Station game configuration edit

- Admin Station edit now accepts and persists `gameType` and integer `maxPoints`.
- The Station Game update and corresponding `team.maxPossiblePoints` delta run in the existing Station update transaction.
- The Station editor enables both fields for existing Stations and submits them through the audited Admin update API.
- Verification passed: targeted Admin service tests (`25/25`) and Backend/Frontend production builds.

## 2026-07-24 Admin Operations UI merge recovery

- Restored the responsive, styled local Admin Operations page that was replaced by the minimal remote version during merge conflict resolution.
- Preserved the remote Event/Final behavior by adding `finalStartsAt`, keeping the read-only current keyword plus optional keyword rotation, and describing Final opening independently from Event end.
- Retained loading/error handling, formatted dashboard metrics, structured operation lists, responsive tabs/forms, refresh control, and Excel export from the local UI version.

## 2026-07-24 Admin score-only correction

- Fixed Station Detail Admin score adjustment to always use the audited Admin correction endpoint instead of selecting the waiting-score submission endpoint from Frontend status.
- Admin score correction now always requires a non-empty reason in both the Admin DTO/service and the UI form.
- Correction is available only for an already `COMPLETED` progress. The UI disables the form otherwise, and the Backend independently rejects direct requests for non-completed progress.
- Admin correction updates only `scoreAchieved` and `scoreEnteredByUserId` on progress, adjusts Team total points by the score delta, and writes score/activity audit records. It preserves progress status plus Check-in, Check-out, and completion timestamps.
- The confirmation dialog now states that status and timestamps remain unchanged.
- Verification passed: all 109 Backend tests, including non-completed Admin correction rejection and Player score regression coverage, Backend/Frontend lint and build, diff check, Graphify update, and local tester container recreation. The tester API is healthy; the known non-blocking Frontend large-chunk warning remains.

## 2026-07-24 Scoring confirmation code removal

- Removed the scoring confirmation-code mechanism from the accepted Business Rules, Team score DTO/API, Player service, frontend Station score form, environment validation, seed/config, smoke scripts, and current operational documentation.
- Team score submission now requires a valid authenticated Team session and completed Check-out, while retaining backend score bounds, duplicate-completion protection, and the separate Admin correction/audit path.
- Added migration `20260724120000_remove_scoring_confirmation_code` to drop `event_config.scoring_code_hash`. Historical migration and audit records remain unchanged as history.
- Verification passed: Prisma Client generation and schema validation, all 107 Backend tests, Backend lint/build, Frontend lint/build, active-source reference scan, `git diff --check`, and Graphify update. The tester Backend/Frontend containers were recreated, all migrations applied, seed completed, the API became healthy, and its live OpenAPI document contains no `confirmationCode` or `TeamSubmitScoreDto`. The Frontend build retains the known non-blocking large-chunk warning.
- Production migration and deployment have not been performed.

## 2026-07-24 Tester runner Prisma Studio

- Added Prisma Studio to `scripts/tester-run.ps1` so `npm run tester`, `tester:serve`, and `tester:smoke` start Backend API, Frontend preview, and Prisma Studio together.
- Added configurable `-PrismaStudioPort` with default `5555`, port availability checks, a tracked Prisma Studio background job, readiness probing, URL output, and `.tester-logs/prisma-studio.log` cleanup/log reporting.
- Verification passed: `npm run tester:smoke -- -SkipInstall -SkipSeed -ApiPort 3100 -FrontendPort 4273 -PrismaStudioPort 5655`, backend lint/build, frontend lint/build, and `git diff --check`. Frontend build retains the known non-blocking large-chunk warning. Production deploy, push, and destructive Git operations were not performed.

## 2026-07-24 Final start and Event end separation

- Changed the active Final opening path to use Admin Event Config `finalStartsAt` through `EventConfigService.isPastFinalStart()` instead of `eventEndTime`. `eventEndTime` now remains scoped to closing new Station check-ins.
- Added `finalStartsAt` update validation and public Event Config exposure. Admin Event Config UI now shows and submits `finalStartsAt` beside `eventEndTime`, and Player Final UI states Station close time separately from Final opening time.
- Preserved Station lifecycle behavior: new check-in after `eventEndTime` is blocked with a closed Station message, while Check-out and score submission for a Station already in progress remain allowed. Player Station list/map now keep backend `LOCKED` status and show a closed Station message instead of opening the QR check-in modal.
- Updated Business Rule, Feature routing, project analysis, and Final prompt documentation to separate `finalStartsAt` from `eventEndTime`.
- Verification passed: targeted Final/Player service tests, backend lint, backend build, frontend lint, frontend production build, `git diff --check`, and `graphify update .`. No migration or seed change was required because `event_config.final_starts_at` already exists. Graphify update warned that `hooks.json` produced zero nodes and SQL extraction lacked `tree_sitter_sql`; Production deploy, Production runtime verification, push, and physical/manual browser click-through were not performed.

## 2026-07-24 Team QR raw token display

- Changed Team QR Login storage so new, seed-repaired, replaced, and rotated QR Login records store `raw_token` in the backend database while preserving fingerprint/hash validation for Team QR login.
- Admin Team QR listing now returns `rawToken`, `qrLoginUrl`, and `loginUrl` when available so the UI can display/download existing Team QR Login without generating or rotating tokens.
- Added migration `000010_team_qr_raw_token`; local migration deploy and seed repair update active Team QR rows with raw token values. Existing pre-migration tokens without raw values cannot be recovered from hash and are repaired by seed/rotation/replacement.
- Verification passed: Prisma Client generation, local migration deploy, seed, `db:verify`, active Team QR raw-token count check, backend admin service tests, backend lint/build, frontend lint/build, and `git diff --check`. Production migration, deploy, and physical QR scan were not performed.

## 2026-07-23 Station QR raw token display

- Changed Station QR storage so new, seed-repaired, replaced, and rotated SQ1 Station QR records store `raw_token` in the backend database while preserving hash/fingerprint validation for Player Check-in/Check-out.
- Admin Station QR listing now returns `rawToken` when available so the UI can display and download existing Check-in/Check-out QR strings without generating or rotating tokens.
- Added migration `000009_station_qr_raw_token`; local migration deploy and seed repaired active SQ1 Station QR rows with raw token values. Existing pre-migration tokens without raw values cannot be recovered from hash and are repaired by seed/rotation/replacement.
- Verification passed: Prisma Client generation, local migration deploy, seed, `db:verify`, active SQ1 raw-token count check, backend admin service tests, backend lint/build, frontend lint/build, and `git diff --check`. Production migration, deploy, and physical QR scan were not performed.

## 2026-07-23 iOS QR camera lifecycle cleanup

- Fixed the frontend QR camera lifecycle for the Login QR scanner and shared Station QR scanner without changing backend APIs, QR token formats, authentication, scoring, or Station validation behavior.
- Added an idempotent cleanup path that invalidates the scanner run, marks scanner refs inactive, cancels `requestAnimationFrame`, clears the Login scan interval, cancels pending video metadata listeners, disposes QR frame detector resources, stops all `MediaStreamTrack`s from either the stored stream ref or `video.srcObject`, clears `streamRef`, pauses the video, clears `srcObject`, removes `src`, and calls `video.load()` for iOS camera release.
- Hardened pending-start behavior so stopping while `getUserMedia`, render RAF, metadata, or `video.play()` is still pending does not create late streams, duplicate decode callbacks, or false camera errors after a user-initiated stop.
- Preserved manual token input, camera permission/error messaging, native `BarcodeDetector` preference, `jsQR` fallback, Team QR parsing, Station QR backend validation, and duplicate frontend submit guards.
- Verification passed: frontend lint, frontend TypeScript/Vite build, and frontend `build:prod`. Manual iPhone Safari/Chrome HTTPS camera-indicator verification remains pending and was not performed in this Windows workspace.
- Graphify update was attempted after the source changes but could not run because the `graphify` CLI is not installed or available in PATH on this host.

## 2026-07-23 Seed diagnostics and tester runner completion

- Investigated the reported `npm run tester` stop at `Running seed command \`ts-node prisma/seed.ts\` ...` against local PostgreSQL `127.0.0.1:55432/movement`. Migrations were not the cause; `prisma migrate deploy` reported all 8 migrations applied.
- Added explicit seed phase logging and durations for database connection, admin account, stations, challenges, Station QR repair, teams, Event Config, Final event, completion, and Prisma disconnect. The seed entrypoint now uses a `main().then(...).catch(...)` structure that always awaits `prisma.$disconnect()` and sets `process.exitCode = 1` on failure without `process.exit(0)`.
- Root cause found during full tester verification: seed itself completed successfully and exited; `npm run tester` later failed because frontend `node_modules` was incomplete and missing installed package `jsqr` even though `fe/package.json` and lockfile already declared it. The tester dependency check only verified local binaries, so it skipped `npm ci`.
- Hardened `scripts/tester-run.ps1` to check required package directories such as `jsqr`, log elapsed time for each checked command, use IPv4 loopback health URLs for backend/frontend readiness, and include the last readiness error when a service does not respond.
- Changed root `npm run tester` into a smoke runner that starts backend/frontend, verifies readiness, stops jobs, and exits `0`. Added `npm run tester:serve` for the previous keep-open manual testing behavior.
- Verification passed: standalone `npm run seed` twice, `npm run db:verify`, direct DB query confirmed Final Challenge `answerHash` is plaintext `DISANVANHOA2026`, and full root `npm run tester` exited `0`. The known non-blocking frontend large-chunk warning remains.
- Graphify update was attempted after the source changes but could not run because the `graphify` CLI is not installed or available in PATH on this host.

## 2026-07-23 Final Challenge Plain Answer and Production Seed Override

- Changed Final Challenge validation so backend no longer bcrypt-hashes the configured keyword or submitted answer. The existing `final_challenges.answer_hash` compatibility column now stores the normalized plain-text keyword, and validation compares normalized submitted text directly against the normalized stored value.
- Preserved Final answer secrecy at API/log boundaries: public challenge/submission DTOs still omit the configured answer, and Admin update logs continue redacting submitted answer values.
- Added a dedicated Final Challenge seed policy with canonical answer `DISANVANHOA2026`, stable business key title `Final Cipher`, and a temporary Production override through `2026-08-21 23:59:59 Asia/Ho_Chi_Minh`. During the window, seed updates only seed-managed Final Challenge fields; starting `2026-08-22 00:00:00 Asia/Ho_Chi_Minh`, Production seed preserves an existing record and creates only if missing.
- Verification passed: focused Final service tests, focused Final seed policy tests, backend typecheck, full backend Jest suite, backend lint, backend build, root smoke test, `git diff --check`, and frontend lint/build for cross-package safety. No database reset, Production migration, deploy, `.env` edit, or real Production mutation was performed.

## 2026-07-22 Conditional Backend Database Deployment

- Added commit-range database change detection to the manual `Deploy Backend (ECS)` workflow. The workflow now accepts optional `base_commit`, optional `target_commit`, and boolean `force_database_steps` inputs while preserving the `master` branch guard and backup/deploy confirmation gates.
- Backend deployment now resolves the target commit from the input or `origin/master`, resolves the base commit from input or protected server marker `/opt/movement/deploy-markers/movement-api.commit`, and stops safely when neither base source is available. It does not compare only `HEAD~1`.
- `be/deploy/deploy.sh` classifies the complete deployed range with `be/deploy/plan-database-steps.js`. Schema/migration paths trigger Prisma migrate and `db:verify`; seed and database-verification paths trigger Production-safe seed and `db:verify`; `force_database_steps=true` runs migration, seed, and `db:verify` regardless of detected changes.
- Application-only backend changes now skip `prisma migrate deploy`, Production seed, and database-specific verification while still installing dependencies, running Prisma Client generation for build safety, building, restarting `movement-api`, checking backend health, and updating the deployed marker only after success.
- Failure behavior remains fail-fast: failed migration, seed, database verification, build, restart, or health check stops the deployment before marker update. Migration, seed, and pre-restart database verification failures occur before backend restart.
- No frontend deployment behavior, application Business Rules, QR behavior, Station scoring, Final Challenge behavior, Production secrets, Production state, push, or deploy action was changed or performed.

## 2026-07-22 Staged Production Deployment Workflow

- Converted Production deployment from push-triggered workflows to two independent manual phases. `Deploy Backend (ECS)` is now Phase 1 and can only run by `workflow_dispatch` with explicit `BACKUP_CONFIRMED` and `deploy-backend` inputs.
- Preserved the existing backend ECS deployment script and branch strategy. The backend workflow still defaults to `master`, rejects any non-`master` Production deploy branch, requires host `be/.env`, runs Prisma generate, `prisma migrate deploy`, Production-safe seed, `db:verify`, build, backend restart through PM2/systemd, post-restart `db:verify`, and then checks local backend `/api/docs`.
- Replaced the frontend OBS production workflow with a separate manual `Deploy Frontend (Nginx)` Phase 2 workflow. It defaults to `master`, requires exact `deploy-frontend` input, uses the `production-frontend` environment gate, builds with `VITE_API_BASE_URL` unset so browser requests stay same-origin `/api`, syncs `fe/dist` to `/var/www/movement/current`, validates and reloads Nginx, and checks HTTPS root, `/api/docs`, `/qr-login`, refresh-style `/qr-login?token=...`, and missing asset `404`.
- Removed automatic `push` triggers from both Production deployment workflows so fast-forwarding `develop` into `master` cannot accidentally start backend and frontend deployments in parallel. GitHub Environments `production-backend` and `production-frontend` are referenced for approval gates; required reviewers must be configured in repository settings.
- No application Business Rules, QR behavior, Station scoring, Final Challenge behavior, database migrations, seed source, production secrets, DNS, server files, or Production state were changed. No deploy, push, Production migration, Production access, or QR token lifecycle action was performed.

## 2026-07-22 Production-like Integration Verification

- Audited current runner options before changing files. Existing `npm.cmd run tester` and `docker-compose.tester.yml` verify local HTTP same-origin behavior through Vite preview, but neither provided a disposable HTTPS-origin reverse-proxy smoke. The checked-in production Nginx config targets the real `heroes.nalth.top` host and was not used or modified.
- Added disposable harness `scripts/production-like-smoke.ps1` to fill the verification gap without changing product behavior. The harness tries Docker PostgreSQL first, falls back to a random clean database on the local PostgreSQL service when Docker is unavailable, runs Prisma generate/deploy through migration `000008`, seed twice, `db:verify`, starts the backend with `NODE_ENV=production` and runtime-generated non-production secrets, serves the built frontend over local HTTPS, proxies same-origin `/api`, and exercises Team QR, SQ1 Station QR, Station scoring, Final Challenge, leaderboard, CORS, SPA fallback, and tracked/log secret scans.
- The live smoke found and fixed a CORS configuration issue: passing a single string to Nest/CORS caused the configured origin to be echoed even for a disallowed request origin. `main.ts` now uses `buildCorsOrigin()` with an allow-list callback for configured origins while retaining wildcard behavior for explicit/unset development use.
- Production-like smoke passed using HTTPS origin `https://127.0.0.1:4443`, API origin `http://127.0.0.1:3100`, and a disposable database `movement_smoke_20260722220523`. It verified clean migrations through `000008`, seed idempotency, `db:verify`, production-mode backend startup, direct and refresh `/qr-login` SPA fallback, same-origin `/api/docs`, missing-asset 404, configured-origin CORS allow and disallowed-origin deny, reusable Team QR login, one-active-session replacement, revoked/rotated Team QR behavior, new Station QR pair creation, SQ1 Check-in/Check-out, wrong-purpose and revoked-token failures, independent Station QR rotation, `SCORE`/`TIME`/`BOTH` scoring behavior, invalid/over-max/negative score rejection, duplicate score rejection, Final before/after Event end, active-Station Final block, keyword normalization, cooldown rejection, rank 1/10/11 points, duplicate Final idempotency, and leaderboard total including Station score plus Final bonus once.
- Verification passed: Docker Compose config render, backend full Jest suite (89), backend lint, backend build, frontend lint, frontend production build, Prisma Client generation, production-like smoke, production environment guard spec, `git diff --check`, static tracked-file raw-secret search, and production-like log secret scan. Docker daemon remained inaccessible on this host, so the smoke used the local PostgreSQL fallback instead of a Docker database container.
- Not performed: actual Production mutation, production deployment, push, physical QR scan, browser UI click-through beyond HTTPS route fetches, or destructive Git history operations. Business Rules, Team QR token design, Station QR schema/provisioning rules, Station scoring rules, Final Challenge rules, and production deployment configuration were not redesigned.

## 2026-07-22 Final Challenge Event Config, Keyword, Cooldown, and Ranking

- Historical note: this 2026-07-22 verification used Admin Event Config `eventEndTime` through `EventConfigService.isPastEventEnd()` for Final opening; that behavior was superseded on 2026-07-24 by the `finalStartsAt` rule. Active Source Code no longer depends on fixed `11:30` or `11:45` values.
- Changed current Event Config database defaults from fixed event rehearsal times to neutral `23:59` defaults through Prisma schema, init SQL, and migration `000008_final_event_defaults`. Runtime Final availability remains controlled by the persisted Admin Event Config row, not by a hard-coded Final start value.
- Repaired local/test seed behavior for the official Final keyword `DISANVANHOA2026`: seed now creates new active Final challenges with that keyword and repairs an existing active challenge when its hash does not match, while repeated seed preserves an already-valid hash.
- Backend and frontend now trim and uppercase Final answers before submission/validation. Backend bcrypt comparison remains authoritative; the frontend does not contain the authoritative keyword and performs only input UX normalization.
- Moved wrong-answer cooldown enforcement into the serializable Final submission transaction so retries, concurrent requests, and multiple-tab attempts re-check current cooldown state before creating a new submission. Cooldown continues to derive from wrong `final_submissions` history and increases from 1 second to a maximum of 10 seconds.
- Preserved eligibility rules: a Team does not need to complete all Stations before Final, but a Team with active `CHECKED_IN`/`PLAYING` progress is blocked until that Station is finished. Station Check-in after Event end and Check-out for a Station started before Event end remain governed by the existing Player flow.
- Preserved ranking and bonus rules: first correct database-confirmed submission determines rank; ranks 1 through 10 award 10 down to 1 points; rank 11 and later award 0. Existing unique `(final_challenge_id, winner_rank)` constraint prevents duplicate non-null ranks, and service-level idempotency prevents one Team from receiving a second Final rank or bonus.
- Verification passed: focused Final service tests (17), full backend Jest suite (87), backend lint, backend build, local Prisma migration deploy, seed twice, `db:verify`, direct active Final keyword hash check, frontend lint, and frontend production build. Static search confirmed no active Source Code path contains fixed `11:30` or `11:45`; frontend source does not contain `DISANVANHOA2026`.
- Not performed: Production migration, production smoke, physical QR scan, manual browser double-click test, push, or deploy. Team QR Login, Station QR token schema/provisioning, Station tracking/scoring Business Rules, Final close scheduling, and production deployment configuration were not changed.

## 2026-07-22 Station Tracking Mode and Station Scoring

- Verified current tracking behavior after the SQ1 Station QR migration: `SCORE` Check-out sets `checked_out_at` to `checked_in_at` and waits for Team-device score entry; `TIME` Check-out records real duration, completes immediately with score `0`, and does not require score submission; `BOTH` Check-out records real duration and waits for score entry.
- Added the official Station score default to the database layer: `games.max_points` now has Prisma and SQL default `30` through migration `000007_station_score_defaults`, and Admin Station creation applies the same default when `maxPoints` is omitted.
- Hardened backend score validation in both Team score submission and Admin audited correction. The service layer now rejects non-integer, negative, and above-max scores even if controller/frontend DTO validation is bypassed.
- Preserved scoring-code security: Team score submission still verifies only against the bcrypt hash in `event_config.scoring_code_hash`; the raw code is not returned by API responses or exposed in the frontend bundle. Admin score correction remains a separate Admin-guarded audited flow and does not use the Team scoring-code path.
- Preserved duplicate/concurrency protection for Team score submission through the conditional transaction claim on `completed_at IS NULL` and `checked_out_at IS NOT NULL`; focused tests now cover stale/concurrent duplicate submission awarding score only once.
- Updated frontend score UX to use the Station's configured max score, falling back to `30`, instead of a hard-coded `1000`. The existing Team Check-out modal logic still skips score entry for `TIME` and opens score entry only for `SCORE`/`BOTH`.
- Verification passed: focused Player/Admin service tests (32), full backend Jest suite (77), backend lint, backend build, Prisma Client generation, local migration deploy, seed twice, `db:verify`, frontend lint, frontend production build, and disposable local API smoke using SQ1 Check-in/Check-out plus Team score submission for two Teams. The smoke reset/reopened local/test progress targets through audited Admin APIs and rotated only local/test Station QR tokens needed to obtain raw SQ1 payloads.
- Not performed: Production migration, production smoke, physical QR scan, push, or deploy. Team QR Login, Station QR token format, Final Challenge, deployment, and production configuration were not changed.

## 2026-07-22 Secure Station QR provisioning and migration

- Migrated Station QR issuance from predictable `MV26-STATION-<stationId>-<purpose>` generation to official SQ1 opaque tokens: `MV26-SQ1-I-<randomToken>` and `MV26-SQ1-O-<randomToken>`. The random portion is generated from 16 cryptographically secure random bytes and encoded as 26-character uppercase Base32, giving 128 bits of entropy.
- Added `qr_tokens.schema_version`, `revoked_at`, `updated_at`, lifecycle consistency, and partial unique index `qr_tokens_one_active_per_station_purpose` so each Station/purpose can have at most one active token. Existing rows are marked `LEGACY`; duplicate active rows are deactivated during migration.
- Station creation now creates Station, Game, one `CHECK_IN` SQ1 token, one `CHECK_OUT` SQ1 token, Team progress rows, and Team max-point updates in one transaction. If either token cannot be created, Station creation rolls back with the transaction.
- Player Check-in/Check-out now looks up the token by SHA-256 fingerprint, verifies bcrypt hash and lifecycle, then uses the database token record as the source of truth for Station and purpose. The route Station ID is only checked against the resolved token Station to reject mismatched screen/token use.
- Admin now supports Station QR status, independent `CHECK_IN` rotate/revoke, and independent `CHECK_OUT` rotate/revoke. Rotate returns the raw token once; revoke marks only the selected purpose inactive/revoked.
- Local/test seed repairs missing or Legacy Station QR tokens by purpose, preserves existing active SQ1 tokens on repeated runs, and writes newly generated raw Station tokens only to ignored local artifact `.tester-logs/dev-station-qr-tokens.txt`. Production-mode seed emitted no raw Station QR token output in local verification.
- Reprint strategy selected: rotate-to-reprint. Raw Station tokens are not stored plaintext or encrypted and no protected QR artifact is stored, so reprinting an unavailable raw token requires rotating that Station/purpose.
- Legacy predictable Station QR compatibility is retained only when an active Legacy database record still exists. New Station creation, seed repair, and smoke scripts no longer generate predictable Station QR payloads.
- Local migration `000006_secure_station_qr_tokens` applied successfully. Initial seed converted the 10 seeded Stations to 20 active SQ1 tokens; a repeated seed preserved the active token inventory digest. A simulated missing `ST002 CHECK_OUT` token repair created one replacement row, restored exactly one active `CHECK_OUT`, and left no duplicate active Station/purpose rows.
- Verification passed: Prisma Client generation, migration deploy, seed repeated idempotency, missing-token repair, production-mode local seed guard, `db:verify`, focused Station QR/Admin/Player/helper tests (24), full backend Jest suite (65), backend build, backend lint, frontend lint, and frontend production build. The frontend build retains the known non-blocking large-chunk warning.
- Not performed: Production migration, production printed QR reissue, manual camera scan on physical devices, live Admin QR printing workflow, push, or deploy. Team QR Login, Final Challenge, and Station scoring Business Rules were not changed.

## 2026-07-22 Reusable Automatic URL Team QR Login

- Migrated Automatic URL Team QR Login from one-time consumption to a reusable controlled token. Successful login now updates `last_used_at` and `usage_count` without setting `consumed_at`; password and QR login continue to share the one-active-session-per-Team replacement path.
- Added `qr_login_tokens.is_active`, a partial unique index enforcing at most one active token per Team, nonnegative usage validation, and an active/not-revoked consistency check. The migration activates only the newest valid unconsumed token per Team; consumed, revoked, and expired history is not reactivated.
- Team creation now provisions the secure Automatic URL token in the Team transaction and returns its raw URL once. New Team creation and local/test seed no longer generate predictable Legacy Team QR credentials; existing `Team.loginQr*` values and `POST /api/auth/team-qr-login` remain available for already-issued Legacy QR compatibility.
- Local/test seed repairs a missing token, deactivates stale active records before replacement, preserves a valid active token on repeated runs, and continues to write newly generated URLs only to the ignored local artifact. Production-mode seed does not generate or print Automatic URL tokens.
- Admin generate, rotate, revoke, and status operations are distinct. Generate refuses to replace a valid active token, rotate revokes the old token before returning a replacement URL, and revoke marks the token inactive without deleting the Team. Raw-token strategy remains display-once with rotation required for reprint.
- Admin UI now shows the automatically provisioned URL once after Team creation, exposes separate Generate and Rotate actions, reports unbounded usage count, and describes the credential as reusable while active. Legacy consumed-token errors remain mapped for compatibility.
- Local migration `000005_reusable_qr_login_tokens` applied successfully. The first seed repaired 25 expired Team tokens; a second seed preserved the same 25-token inventory digest. A simulated missing-token repair produced one replacement and retained exactly one active token for each of 25 Teams with no duplicate active rows.
- Verification passed: Prisma Client generation, migration deploy, focused Auth/Admin tests (17), full backend Jest suite (56), backend build, backend lint, seed twice, missing-token repair, production-mode local seed guard, `db:verify`, frontend lint, and frontend production build. The frontend build retains the known non-blocking large-chunk warning.
- Not performed: Production migration, Production QR issuance, deployed `/qr-login` verification, manual browser/phone login, push, or deploy. Station QR implementation was not changed.

<!-- DOC_RECONCILIATION_2026-07-22 -->
## 2026-07-22 Source of Truth and QR documentation reconciliation

- Documentation-only reconciliation completed. No Source Code, migration, database, seed runtime, deployment, or production environment was changed by this documentation step.
- Established `OPEN_QUESTIONS_AND_DECISIONS.md` as the Business Rule Source of Truth, `FEATURE_INDEX.md` as Feature routing, `AGENTS.md` as Agent Operational Instructions, and `00_WORKFLOW.md` as Prompt selection workflow.
- Updated QR documentation to require Automatic URL Team QR Login with a reusable controlled opaque token and Station QR format `MV26-SQ1-I/O-<randomToken>`.
- Updated documentation to require automatic Team token provisioning and automatic Station Check-in/Check-out token provisioning.
- Updated Event and Final documentation to use Admin Event Config end time instead of fixed `11:30`/`11:45`.
- Updated Station scoring documentation for `SCORE`, `TIME`, and `BOTH`, with default max score `30`, backend authority, hashed scoring-code handling, and duplicate protection.
- Historical audit entries containing predictable QR values remain preserved as evidence of previously verified Legacy behavior; they are not the current desired Business Rule.
- Known implementation gaps remain open: one-time Automatic URL token consumption, predictable Team/Station QR generation, Legacy seed/smoke fixtures, Production CORS/login verification, and real iPhone HTTPS camera verification.
- Verification for this documentation step: generated replacement Markdown files and an idempotent PowerShell apply script. Source Code tests were not run because Source Code was not modified.

# Backend Audit Status

## 2026-07-21 iOS QR camera fallback

- Root cause confirmed in the current frontend: `LoginPage` returned before opening the camera when `BarcodeDetector` was unavailable, and `QrTokenInput` disabled the camera button from the same native-detector check. iPhone Safari and Chrome iOS do not expose `BarcodeDetector`, so camera QR scan could not start even when `getUserMedia` was available over HTTPS.
- Added shared frontend QR detection that gates camera availability on `navigator.mediaDevices.getUserMedia`, opens the rear-preferred camera with `facingMode: {ideal: "environment"}`, prefers native `BarcodeDetector`, and falls back to canvas-frame `jsQR` decoding for iOS/WebKit browsers.
- Login QR and station check-in/check-out QR inputs now share the detector helper, keep `muted`/`playsInline` video elements, avoid overlapping frame decode work, stop streams/timers/animation frames on stop/success/error/unmount, and preserve Paste QR/manual token entry.
- Verification: `npm.cmd install jsqr`, frontend lint, and frontend production build (`tsc -b && vite build`) passed. No frontend test files are present. Real iPhone Safari/Chrome iOS HTTPS camera verification is pending manual device testing.

## 2026-07-21 iOS QR camera lifecycle audit

- Root cause confirmed after the first fallback fix: station QR camera start was driven by a React effect after toggling `isCameraOpen`, so lifecycle cleanup could stop the stream during normal modal rerenders; the video also lacked `autoPlay` and decoding could begin before loaded metadata/non-zero dimensions. This matches the iPhone Safari symptom where a black preview appears briefly and the scanner resets without a decode.
- Reworked `QrTokenInput` so `getUserMedia` runs from the button handler, scanner state is explicit (`idle`, `requestingPermission`, `active`, `decoding`, `success`, `error`), start/stop are idempotent, streams/scanner runs live in refs, and decoding starts only after `loadedmetadata`, successful `video.play()`, and non-zero `videoWidth`/`videoHeight`.
- Added Vietnamese safe error categories for denied permission, missing camera, camera in use, browser/camera constraint failure, video playback failure, and QR scanner initialization failure. Development-only console diagnostics log secure context, `mediaDevices`, selected camera label after permission, stream state, video ready state/dimensions, play success/failure, and stop reason.
- Login QR video was aligned with iOS requirements by adding `autoPlay` and waiting for metadata before `video.play()`.
- Verification: frontend lint, standalone TypeScript build, frontend production build, and `build:prod` passed. Real iPhone Safari HTTPS verification is still pending on device.

## 2026-07-21 QR automatic login

- Added a separate one-time QR login flow instead of reusing the legacy predictable team QR token format. The legacy `POST /api/auth/team-qr-login` remains for compatibility; new HTTPS QR URLs exchange an opaque token through `POST /api/auth/qr-login`.
- Added `qr_login_tokens` with a unique SHA-256 token hash, team association, expiry, consumed/revoked timestamps, usage counters, creator, and last-used metadata. Raw QR tokens are returned only in the admin generation response and are not stored in the database.
- Backend exchange consumes tokens with a conditional update inside a transaction before issuing the normal team JWT/session. Concurrent scans/replay attempts cannot both create sessions; the losing request is rejected as consumed.
- Admin can generate, inspect, and revoke QR login tokens from the team list in System Config. Generation rotates outstanding active QR login tokens for the team and builds the URL from `FRONTEND_PUBLIC_URL`.
- Frontend added public `/qr-login`, removes `?token=` from the visible URL immediately, prevents duplicate submissions in the page lifecycle, maps safe backend error codes to user-friendly Vietnamese messages, and redirects successful team QR login to the normal team map flow.
- Historical note: this earlier implementation documented `QR_LOGIN_TOKEN_TTL_MINUTES`; the 2026-07-27 Team QR non-expiring update supersedes that TTL behavior. Existing Nginx SPA fallback covers `/qr-login`; `/api/` remains a separate reverse proxy and must not be rewritten to `index.html`.
- Verification: `npm.cmd --prefix be run prisma:generate`, backend build, full backend Jest suite (47 tests), and frontend build passed. Frontend has no existing test runner, so QR route behavior is build-verified only.

## 2026-07-21 QR login URL and seed structure

- Standardized generated QR URLs on `FRONTEND_PUBLIC_URL` with `PUBLIC_FRONTEND_URL` kept as a backward-compatible fallback. The URL builder normalizes trailing slashes and always emits `/qr-login?token=...`.
- Development seed now creates missing one-time `QrLoginToken` records for seeded teams only outside production, stores hashes only, and writes newly generated raw URLs to ignored local artifact `.tester-logs/dev-qr-login-urls.txt`. Re-running seed preserves active QR tokens and does not rotate printed QR codes.
- Production deploy still runs seed, but `NODE_ENV=production` prevents seed from generating or logging raw QR login secrets. Production QR generation remains an authenticated Admin action.
- Added Admin route aliases matching the public runbook: `POST /api/admin/teams/:teamId/qr-login`, `POST /api/admin/teams/:teamId/qr-login/rotate`, and `DELETE /api/admin/teams/:teamId/qr-login`.
- Added `docs/analysis/QR_LOGIN.md` covering local browser QR, physical-phone LAN QR, production HTTPS QR, Team 1 development QR generation, regeneration/revocation, and raw-token security warnings.

## 2026-07-21 Final Challenge event-end flow

- Replaced the legacy Final opening rule with server-side event end time from Admin Event Config. `FinalService` now uses `EventConfigService.isPastEventEnd()` and blocks Final submission until the event has ended.
- Preserved station lifecycle requirements: new station check-in remains blocked after event end, while existing station check-out and score submission still work. Final entry is blocked while the team has an active `CHECKED_IN`/`PLAYING` station.
- Added wrong-answer cooldown without a database migration by deriving state from existing incorrect `final_submissions`: cooldown seconds are `min(wrongAttemptCount, 10)`. Bonus points now use the fixed rank formula `max(11 - rank, 0)`.
- Frontend Final page now polls `/api/player/final`, shows active-station blocking, wrong-attempt cooldown, and correct rank/bonus result. Station list polls for Final availability and shows an automatic CTA when the team is free.
- Historical note: Admin UI did not expose Final start time in this 2026-07-21 implementation, and Final opened from Event Config event end time. This was superseded on 2026-07-24 by exposing `finalStartsAt` in Admin Event Config.
- Verification: backend build/lint passed, full backend Jest suite passed (41 tests), frontend lint/build passed. Vite still reports the known large chunk warning.

## 2026-07-21 Deployment database initialization audit

- Root cause confirmed: production backend deploy refreshed code, installed dependencies, built the backend, ran `prisma migrate deploy`, and restarted PM2/systemd, but never executed the Prisma seed. Local tester and Docker tester did run seed, so CI/CD differed from local setup and deploy could be green with an initialized schema but missing admin/team/station/progress seed data.
- Fixed `be/deploy/deploy.sh` to run `prisma generate`, `prisma migrate deploy`, `prisma db seed`, seed verification, backend build, process restart, and a post-restart seed verification. The deploy script uses `set -euo pipefail`, so migration, seed, verification, or build failures fail the deployment.
- Added `db:reset` for local development only and `db:verify` for deployment smoke checks. Production must not use `migrate reset`; seed remains idempotent and is executed after migrations against the configured `DATABASE_URL`.
- Aligned `be/deploy/.env.example` with the production Nginx/API expectation: `PORT=8080`, `CORS_ORIGIN=https://heroes.nalth.top`, and `JWT_EXPIRES_IN`.
- Verification: `npm run prisma:generate`, `npm run prisma:deploy`, `npm run prisma:seed`, `npm run db:verify`, and `npm run build` passed locally against `127.0.0.1:55432/movement`. `db:verify` reported 25 teams, 10 active stations, 250 progress rows, and 20 station QR fingerprints.

## 2026-07-21 Local tester fail-fast fix

- Root cause confirmed: backend dependencies are installed inside `be/`, not through a root npm workspace. The required local dev/runtime packages are already declared in `be/package.json`: `prisma`, `@prisma/client`, `ts-node`, `@nestjs/cli`, and `typescript`.
- Fixed `scripts/tester-run.ps1` so it detects incomplete `node_modules` installs by checking required local binaries, runs `npm ci` in the affected app directory, checks `$LASTEXITCODE` after each npm command, and stops immediately with the failed command name and exit code.
- The runner now fails if backend/frontend ports are already occupied, throws if readiness checks do not pass, and clears `VITE_API_BASE_URL` for the frontend build so local tester traffic stays same-origin through `/api`.
- Verification: backend Prisma generate/deploy, seed, backend build, and frontend build passed locally. User smoke confirmed `http://localhost:4173/api/docs` serves Swagger through the frontend preview proxy.

## 2026-07-20 Docker frontend API proxy fix

- Root cause confirmed: `fe/vite.config.ts` proxied `/api` to `http://localhost:3000`, which points at the frontend container when Vite preview runs inside Docker; `docker-compose.tester.yml` also set client-side `VITE_API_BASE_URL=http://localhost:3000`.
- Fixed Vite config to use server-side `API_PROXY_TARGET`, defaulting to `http://localhost:3000` for host-local Vite runs, and applied the same proxy to both `server.proxy` and `preview.proxy`.
- Docker frontend now sets `API_PROXY_TARGET=http://api:3000` and no longer sets `VITE_API_BASE_URL`, so browser requests stay same-origin `/api/...` and Docker service URLs are not exposed in the bundle.
- Added an API healthcheck for `GET http://127.0.0.1:3000/api/docs` and made the frontend wait for the API service to be healthy before starting preview. Backend route `POST /api/auth/team-login` exists in `AuthController`, and the API command applies Prisma deploy/seed before `start:prod`.
- Verification: frontend lint/build passed; `docker compose -f docker-compose.tester.yml config` validated the resolved compose model; built bundle search found no `api:3000`, `localhost:3000`, or `/api/api`. Live compose smoke could not run on this machine because Docker daemon is not running (`docker_engine` pipe missing).

## 2026-07-20 heroes.nalth.top SPA routing fallback

- Confirmed frontend uses React Router `BrowserRouter` in `fe/src/main.tsx`; `/login`, `/teams`, `/stations`, and related paths are client-side routes in `fe/src/features/movement/routes.tsx`, not physical files in `fe/dist`.
- Production check before applying the config: `GET https://heroes.nalth.top/` returned `200 text/html`, while `GET https://heroes.nalth.top/login` returned `404 text/html`; `GET https://heroes.nalth.top/api/docs` also returned `404 text/html`. This indicates the live web server/static host is serving the root document but is not applying SPA history fallback or the `/api` reverse proxy.
- Updated `deploy/nginx/movement.conf` for `heroes.nalth.top`: `/api/` is a separate reverse proxy to the local Nest backend, static assets use `try_files $uri =404`, and `location /` uses `try_files $uri $uri/ /index.html` so BrowserRouter routes refresh correctly.
- Added `deploy/nginx/README.md` with build, publish, Nginx install/reload, and verification commands.
- Verification in repo: frontend lint/build passed; `fe/dist` contains `index.html` and assets but no physical `/login`, `/teams`, or `/stations` files. Nginx binary is not installed in this workspace, so `nginx -t` must be run on the server after copying the config.

## 2026-07-20 Login 405 object-storage investigation

- Traced login, QR login, QR paste, station check-in, and station check-out requests. Frontend API calls are centralized in `fe/src/features/movement/api.ts` and target `VITE_API_BASE_URL` plus `/api/...` paths.
- Confirmed backend routes accept `POST /api/auth/team-login`, `POST /api/auth/login`, `POST /api/auth/team-qr-login`, `POST /api/player/stations/:stationId/check-in`, and `POST /api/player/stations/:stationId/check-out`.
- Root-cause finding: a 405 response with `Code=MethodNotAllowed`, `Method=POST`, and `ResourceType=OBJECT` indicates the login POST reached static object storage instead of the Nest backend API. The failing runtime URL is `POST <VITE_API_BASE_URL>/api/auth/team-login` first for username/password team login, then `POST <VITE_API_BASE_URL>/api/auth/login` during admin fallback; QR login uses `POST <VITE_API_BASE_URL>/api/auth/team-qr-login`.
- Recommended deployment fix: build frontend with `VITE_API_BASE_URL` set to the backend API/proxy origin, or configure the production reverse proxy so `/api/*` goes to the ECS/API service rather than the OBS/static bucket. Direct blob uploads are not present in the runtime app; OBS usage is limited to the frontend deploy script, so no frontend upload endpoint needs POST-to-PUT correction.
- Frontend error handling now strips raw HTML/XML/object-storage bodies from user-facing messages and preserves method/status/URL in a sanitized `ApiError`. Login fallback from team to admin now only happens on auth failures, so infrastructure/routing errors are not masked by a second request.
- After pulling deploy workflows, confirmed `.github/workflows/fe-deploy.yml` builds with `vars.VITE_API_BASE_URL`. Added a workflow guard so FE deploy fails if that repository variable is missing/empty or points to OBS/static hosting; frontend code also ignores blank env values instead of using a same-origin API base.
- Production-standard refactor: frontend API calls now default to relative `/api/...` paths, with `VITE_API_BASE_URL` only as an optional environment override. Added `deploy/nginx/movement.conf` for HTTPS same-origin frontend hosting plus `/api` reverse proxy to the local Nest process. Deployed HTTPS builds reject insecure HTTP API overrides to avoid mixed-content failures.
- API client structure split endpoint contracts from HTTP/config/error handling in `fe/src/features/movement/apiClient.ts`; user-facing errors are sanitized and mapped to short operator-friendly messages.
- Verification: frontend lint and production build passed; Vite reported the known large chunk warning. Repo search found no hardcoded public backend IP URLs outside generated build artifacts.

## 2026-07-20 Remaining feature integration

- Added audited Admin Station create/update/deactivate APIs. Creation provisions a game, two purpose-specific QR tokens, and AVAILABLE progress for every team; deactivation preserves history and disables game/QR use.
- Added frontend Player leaderboard, station cancel, cipher submission, and Final Challenge routes.
- Added Admin Operations UI for dashboard, score queue, event config, activity logs, report export, Final config and submissions.
- Removed the legacy `system-admin` role and remaining Admin simulated check-in branch; map marker/media changes now persist through the backend.
- Backend build, frontend build/lint and read-only runtime smoke checks passed.
- The current backend `node_modules` is production-only/incomplete, so backend lint/tests could not be rerun locally (`typescript-eslint` and `jest` are absent). This does not affect the successful Nest build or runtime smoke result; rerun `npm ci` before the full backend quality gate.

## 2026-07-20 Runtime test-data cleanup

- Removed the legacy frontend dummy dataset/page/components and `public/assets/database.json`.
- Removed credential-bearing QR rehearsal fallback and demo credentials from the login screen; QR login now accepts only team QR tokens.
- Removed generated fake station scores/timestamps from the local normalization fallback.
- Replaced hard-coded `Playing Teams = 2` with a count derived from backend progress state.
- Removed the unsupported estimated-duration field from station cards and the Admin station editor.
- PostgreSQL rehearsal seed and automated test fixtures remain intentionally isolated from production runtime data.

Last updated: 2026-07-19

## Verification completed

- `npm ci` completed and Prisma Client was generated with `npm run prisma:generate`.
- `npm test -- --runInBand`: **36 passed**, across auth service/controller, team QR login, JWT guard, production environment validation, Player QR/scoring flow, and Final scoring/idempotency/retry handling.
- `npm run build`: **passed**.
- `npm run lint`: **passed** after adding the backend ESLint flat configuration.
- Prisma config has been migrated from deprecated `package.json#prisma` to `be/prisma.config.ts`; `npm run prisma:generate`, `npm run prisma:deploy`, and `npm run seed` all load the new config without the Prisma 7 deprecation warning.
- Production startup validation now rejects missing or development-default `DATABASE_URL`, `JWT_SECRET`, `SCORING_CODE`, and wildcard `CORS_ORIGIN` when `NODE_ENV=production`.
- Runtime CORS now accepts a comma-separated `CORS_ORIGIN` list while production validation rejects wildcard origins, including wildcard entries inside a list.
- `npm run prisma:deploy` applied the initial migration against local PostgreSQL at `127.0.0.1:55432/movement`.
- `npm run seed` completed and created 25 team accounts (`Team 01` through `Team 25`, usernames/passwords `team01/team01` through `team25/team25`), 25 unique team QR login tokens, 10 stations, and 20 unique station QR tokens.
- Team login smoke test passed for `team01/team01`, QR login token `MV26-TEAM-01-LOGIN`, and `GET /api/auth/me` returned a `TEAM` session for `team01`.
- QR uniqueness DB check passed after seed: 25/25 team QR fingerprints are non-null and unique; 20/20 station QR fingerprints are non-null and unique.
- QR login replacement smoke passed on temporary API port `3002`: first `MV26-TEAM-01-LOGIN` session was rejected with HTTP 401 after the second QR login for the same team.
- Station QR smoke passed on temporary API port `3002`: `team25` logged in with `MV26-TEAM-25-LOGIN`, checked in to `ST002` with `MV26-STATION-ST002-CHECK_IN`, and checked out with `MV26-STATION-ST002-CHECK_OUT`.
- Station tracking mode requirement added: DB stores `SCORE`, `TIME`, or `BOTH`; `SCORE` stations keep check-in and check-out timestamps equal so no play duration is accumulated, while `TIME` stations auto-complete at check-out with score 0 and accumulated duration.
- Station tracking mode smoke passed on temporary API port `3002`: admin patched `ST002` to `SCORE`, `team24` checked in/out with station QR tokens, and backend returned equal `checkedInAt`/`checkedOutAt`; `ST002` was patched back to `BOTH` afterward.
- Time-only station smoke passed on temporary API port `3002`: admin patched `ST047` to `TIME`, `team23` checked in/out with station QR tokens, backend auto-completed the progress with score 0 and real start/end timestamps, then `ST047` was patched back to `BOTH`.
- Two-team API smoke script added at `be/scripts/smoke-two-team.ps1`; run it against a freshly seeded or disposable rehearsal database because it mutates station progress and scores.
- Report export helper added at `be/scripts/export-summary-report.ps1`; README now documents export verification plus PostgreSQL backup/restore rehearsal commands.
- Two-team API smoke test passed against the local API after opening the rehearsal event window to `23:59`: `team01` completed `ST002` for 25 points and `team02` completed `ST047` for 30 points.
- Report export passed against the local API and produced a non-empty `.xlsx` workbook.
- Database recovery rehearsal passed: `pg_dump` created a custom-format backup, `pg_restore` restored it into `movement_restore_codex_20260719`, a temporary API on port `3001` returned admin dashboard data, and report export from the restored database produced a non-empty workbook.
- Frontend lint now passes cleanly after fixing `StationMap.tsx` hook dependencies and the `StationsMapPanel.tsx` effect-state lint violation.
- Frontend production build passes; Vite still reports a non-blocking large chunk warning for the bundled app.
- Player startup bootstrap was consolidated on 2026-07-19: team, station, and progress APIs load in parallel through one shared mapper; authenticated player routes wait for backend data instead of rendering the local seed; login no longer races the persisted-session redirect; and the large map image begins preloading immediately after team authentication. Frontend lint and production build both pass after the change.
- Player bootstrap regression fixed on 2026-07-20: `normalizeSqlTeams()` now distinguishes normalized frontend `Team` objects (`id`/`name`) from raw SQL team rows (`team_id`/`team_name`) before calling SQL-only normalization. This removes the post-login `Cannot read properties of undefined (reading 'trim')` error. Frontend lint and production build pass.
- Station list check-in flow was corrected on 2026-07-20: the former simulated success action now uses the shared camera/manual QR input, submits the decoded token to the backend check-in endpoint, refreshes player data, and navigates only after backend acceptance. Frontend lint and production build pass.
- Initial station availability was corrected on 2026-07-20: seed now creates every active team/station progress as `AVAILABLE` instead of opening only the first two stations. Existing `LOCKED` progress rows in the local rehearsal API were force-opened through the audited admin status endpoint; the one-active-station and event-time guards remain authoritative.
- Frontend completed-state copy was standardized on 2026-07-20: the player/admin UI now displays `Finished` consistently while the backend/API status remains `COMPLETED`.

## Backend work still required

### P0 remaining work

- [x] Automated coverage exists for auth, QR check-in/check-out, score confirmation rejection/acceptance, Final rank award, same-team idempotency, and Final transaction retry behavior.

### P1 event-readiness checks

- [x] Validate migration and seed against a clean database.
- [x] Run an end-to-end smoke test using two simultaneous team sessions.
- [x] Add `prisma migrate deploy` to the deployment path.
- [ ] Validate production CORS and secrets in the deployed environment.
- [x] Rehearse report export and database recovery.

## Maintenance findings

- `npm audit fix` upgraded `@nestjs/platform-express` to `11.1.28` and `multer` to `2.2.0`; `npm audit --audit-level=high` now reports 0 vulnerabilities.
- Prisma 7 readiness item complete: seed config now lives in `be/prisma.config.ts`, and `be/package.json` no longer uses deprecated `package.json#prisma`.
- The `ts-jest` configuration was migrated from deprecated `globals` to `transform`.

## 2026-07-20 Backend production CI/CD

- Re-enabled [`.github/workflows/be-deploy.yml`](../../.github/workflows/be-deploy.yml): push/merge to `master` on `be/**` (or the workflow file) deploys via SSH to Huawei ECS; `workflow_dispatch` supported for manual runs.
- Workflow sets `DEPLOY_BRANCH=master` and calls `be/deploy/deploy.sh` (`npm ci --include=dev` so Nest CLI is available for build).
- Host path: `/opt/movement/app` → refresh `master` → require `be/.env` → build → `prisma migrate deploy` → PM2 (`movement-api`).

## 2026-07-20 BE host bootstrap (production ECS host)

- One-time host setup completed on Ubuntu 22.04 as `root` (PEM `backend_test_poc.pem`).
- Runtime present: Node 20.20.2, npm 10.8.2, pm2 7.0.3, git 2.34.1; `pm2-root` systemd enabled.
- Git checkout repaired: clean `master` clone at `/opt/movement/app` (previous empty `.git` tree moved aside). Host git uses HTTPS credentials (`url.insteadOf` + `/root/.git-credentials`) because the GitHub token lacked deploy-key/admin scopes.
- Production `be/.env` restored and completed: `PORT=8080`, `SCORING_CODE` set (non-`2468`), `CORS_ORIGIN` set to the frontend HTTPS origin. Existing `DATABASE_URL`/`JWT_SECRET` preserved. Postgres role `movement` granted LOGIN and password synced to `.env`.
- Legacy Python API `movement-be.service` (uvicorn on `:8080`) stopped/disabled so Nest can bind the FE-facing port.
- Manual deploy smoke: migrations applied, `pm2` process `movement-api` online, backend `/api/docs` returned **200** on the ECS host.
- GitHub secrets `ECS_HOST` / `ECS_USER` / `ECS_SSH_KEY` refreshed to this host + PEM. `*.pem` added to `.gitignore`.
- Remaining: merge latest workflow + `deploy.sh` fix to `master`, run Actions `workflow_dispatch`, then confirm browser CORS login from the OBS FE origin. Note `SCORING_CODE` lives only on the host `.env` (not in git).

## Next recommended task

Run Actions **Deploy Backend (ECS)** after merging the workflow/`deploy.sh` changes, then validate login/CORS from the frontend HTTPS origin through same-origin `/api`.

## 2026-07-20 Admin integration verification

- Admin bootstrap now reads `/api/admin/progress-matrix`; the local JSON seed is no longer the source of truth for the Admin role.
- Team create/update/delete are backed by audited Admin endpoints. Creation initializes AVAILABLE progress for every active station and generates a team login QR credential; deletion removes related sessions, progress, scores and final submissions transactionally.
- Station quick status/score updates now use the existing audited progress status and score endpoints. `COMPLETED` remains score-driven and cannot be forced directly.
- Backend build, frontend build and frontend lint passed.
- Runtime smoke test passed against the rehearsal database: Admin login, 25-team/10-station progress matrix, team create (10 progress rows initialized), update, and transactional delete.

## 2026-07-20 Tester one-command runner

- Added root `npm.cmd run tester` / `npm.cmd run tester:no-seed` commands through `scripts/tester-run.ps1`.
- The runner prepares local env, installs missing dependencies, runs Prisma generate/deploy, optionally seeds the local database, builds backend/frontend, then starts the API on `http://localhost:3000` and frontend preview on `http://localhost:4173`.
- The runner refuses to migrate/seed non-local database URLs unless explicitly run with `-AllowRemoteDatabase`.
- Verification passed: PowerShell syntax check, root npm script listing, backend build, and frontend build. Frontend build still reports the known non-blocking Vite large chunk warning.
- Graphify update was attempted after the code/doc change but could not run because `graphify` is not installed, the Windows Python alias is unusable, and `graphifyy` is not present in the local `uv` cache. Installing `graphifyy` from PyPI requires explicit user approval for the external package fetch.

## 2026-07-20 Tester Docker compose runner

- Added `docker-compose.tester.yml` so testers can run PostgreSQL, backend API, and frontend preview with Docker Desktop.
- The compose runner uses a dedicated PostgreSQL volume, applies Prisma migrations, seeds test data, builds backend/frontend, and exposes frontend on `http://localhost:4173` and API docs on `http://localhost:3000/api/docs`.
- Added root `npm.cmd run tester:docker` as a convenience wrapper around `docker compose -f docker-compose.tester.yml up --build`.
- Verification note: root npm script listing passed. Docker compose config/runtime verification could not be run on this machine because Docker CLI is not installed.

## 2026-07-20 Agent and Markdown docs refresh

- Standardized `AGENTS.md` into a clearer agent contract: `AGENTS.md` first, relevant project docs second, Graphify only when useful, source files last, and small scoped edits.
- Clarified that Graphify is advisory and must not override direct user instructions, privacy rules, `AGENTS.md`, or architecture docs.
- Replaced the frontend template README with MOVEment-specific frontend run/build/verification notes.
- Updated the backlog execution checklist so Graphify update follows `AGENTS.md` and runs when useful/available rather than being treated as an unconditional first step.
- Compared Markdown docs against backend controllers, frontend routes, frontend API client, and Prisma schema. Updated `be/README.md` API route list and `fe/README.md` frontend route list to match source.
- Verification: reviewed Markdown diffs; no source code changed. `graphify update .` completed and regenerated `graphify-out/` artifacts, with warnings that `hooks.json` produced zero nodes and SQL extraction needs `tree_sitter_sql`.

## 2026-07-24 Leaderboard podium palette

- Refined the Leaderboard podium styling without changing ranking or scoring behavior.
- Rank 1 now uses a distinct bright gold/amber palette, rank 2 a cool silver palette, and rank 3 a darker brown/copper palette across the row, rank badge, side accent, and points badge.
- Frontend lint and production build passed. The existing non-blocking Vite large-chunk warning remains.

## 2026-07-24 Compact shared headers

- Added the visible `Team` label beside the icon on `/teams`, including mobile layouts.
- Reduced the shared shell branding and the Teams, Leaderboard, Operation Center, and Final page headers by one visual step.
- Frontend lint and production build passed. The existing non-blocking Vite large-chunk warning remains.

## 2026-07-24 Remove Station Cipher game type

- Station Game Type now supports only `ST` and `STANDARD`; the Admin combobox labels are `ST` and `Standard`.
- Removed the Station cipher-answer button, frontend API call, backend route/DTO/service logic, and the `games.answer_hash` column. Final Challenge remains unchanged.
- Added and applied migration `20260724190000_remove_station_cipher_game_type`; Legacy `CIPHER` Games become `STANDARD`, and the database constraint rejects values outside `ST`/`STANDARD`.
- Tester database verification passed with `4 ST`, `6 STANDARD`, no `games.answer_hash` column, two consecutive seed runs, and `db:verify`.
- Backend build and all 120 tests passed. Frontend lint and production build passed; the known non-blocking Vite large-chunk warning remains.

## 2026-07-24 Compact Team Station list

- Redesigned the mobile `/teams/:teamId/stations` presentation without changing Station behavior.
- Converted the shell header and Team summary to compact horizontal layouts, hid secondary deploy/current-team copy on narrow screens, and reduced Station card padding, icons, metrics, and actions.
- Added scoped Team-color accents to the Team summary and Station cards.
- Frontend lint and production build passed; localhost route smoke returned `200`. The known non-blocking Vite large-chunk warning remains.
- Follow-up refinement aligns the Team icon and name in one centered identity row and places Score/Finished in an equal-width glass metric bar below for better visual balance.
- Responsive follow-up removes the mobile header spacer, constrains the brand with fluid sizing/ellipsis, and gives both Team metrics identical icon/content grids with left-aligned copy.
- Player `Play` remains the white right-side action on `/stations`; Admin `View & Edit` styling is unchanged.
- Team/User Station cards consistently render `Watch Video | Play` on desktop and mobile, with `Watch Video` disabled for non-`ST` Stations or missing URLs.
- Disabled Station video actions use an explicit neutral visual state so the shared primary-button styling cannot make unavailable video look interactive.
- Admin Team Station cards render only a full-width `View & Edit` action and do not expose `Watch Video`.
- Admin `View & Edit` is consistently primary/coral and no longer changes style based on Station Game Type or YouTube URL.
- Station detail now uses a responsive visual summary with Station identity/status and a balanced icon-based 2×2 metric grid instead of the default loose `Descriptions` layout.
## 2026-07-27 Team QR, live counts, reset guard, and map WebP completion

- Fast-forwarded local `develop` to `origin/develop` and reapplied the protected worktree stash without textual conflicts. The semantic overlap in `App.css` and `AppFrame.tsx` was reconciled by preserving remote Team header/logout behavior and the fixed bottom navigation.
- Team QR Login is now non-expiring by time for active tokens: migration only drops `qr_login_tokens.expires_at` `NOT NULL`, new Team/seed/rotate tokens use `expiresAt: null`, historical past `expiresAt` values are ignored by QR login, and the transaction claim re-checks `consumedAt: null`.
- Admin Team QR responses/status no longer expose `EXPIRED` as a Team QR status; activity metadata records non-expiring generation without stale expiry, and System Config no longer falls back to historical revoked/consumed tokens for QR display.
- Added `GET /api/player/stations/playing-counts`, returning only `stationId` and `playingTeamCount`. Player Station list, Station detail, map drawer, and Leaderboard now poll every 5 seconds only while the tab is visible, avoid overlapping requests, preserve old data on transient failures, and logout on auth failures where applicable.
- Hardened `npm run reset:gameplay`: dry-run remains default, destructive execution requires confirmation guards at the exported execution boundary, Production-like targets require backup acknowledgement, and the reset transaction verifies Team/User preservation, cleared sessions/gameplay/audit rows, canonical Station/progress counts, one EventConfig, one Final Challenge, and one active non-expiring Team QR per Team.
- Replaced the runtime 6.4 MB PNG map with generated WebP variants at 1280/1920/2950 pixels; the original PNG moved to `fe/source-assets/images/map/`, and the frontend upgrades variants without downgrading or blanking the current map image.
- Verification passed so far: Prisma Client generation, targeted Backend tests (`76/76`), Backend lint/build, and Frontend lint/build. Frontend build retains the known non-blocking large-chunk warning.
- Not performed: Production mutation, push, deploy, browser/manual Excel checks, physical QR scan, or destructive reset execute against Production.

# 2026-07-31 Team V2 marker states and disabled media controls

- Added a V2-only render filter that removes marker, label, and connector for
  Player `Finished` or backend `COMPLETED` Stations without mutating Station
  coordinates or Backend progress.
- Added an authoritative silver-neon Konva palette for backend `LOCKED`
  Stations, including marker artwork, halo, label, and connector.
- Kept YouTube and gallery controls visible in Team V2 Station Detail and added
  a readable silver-neon disabled treatment when the required media is absent.
  The YouTube button now has an explicit localized accessible name.
- No Backend, API, schema, migration, seed, or non-V2 screen changed. Focused
  Vitest passed (`12/12`); Frontend lint, production build, and bundle gate
  passed. Authenticated visual smoke and physical-device verification remain
  pending.

# 2026-07-31 Team V2 Detail sizing and footer readability

- Replaced fixed/full-height V2 Station Detail sizing with centered intrinsic
  height plus viewport-capped overflow scrolling.
- Shortened only the main-map Leaderboard control to localized `BXH`/`RANK`,
  increased the center QR diameter exactly from `74px` to `222px`, and expanded
  its transparent footer layout region so the QR remains raised above side
  panels.
- Added inverse footer-scale font compensation for displayed `12px` minimum
  Leaderboard, QR-caption, Team, and Station-label copy.
- No Backend, API, schema, seed, Station coordinate, or non-V2 screen changed.
  i18n parity, focused Vitest (`12/12`), Frontend lint, production build, and
  bundle gate passed; authenticated visual and physical-device verification
  remain pending.

# 2026-07-31 Team V2 marker interaction performance

- Cached each unchanged Team V2 Konva marker artwork after its exact
  180-segment render, so subsequent map redraws composite the local cache
  instead of replaying every artwork child. Cache resolution covers the
  existing `32..64px` marker output and is cleared on palette change/unmount.
- Coalesced mouse pan, wheel zoom, touch pan, and pinch transform updates to the
  latest value per animation frame. Pending frames are cancelled by reset and
  component cleanup.
- Added marker-Layer viewport culling using the existing authoritative layout
  flag. Marker coordinates, label anchoring, state colors, APIs, Backend,
  schema, seed, and non-V2 screens are unchanged.
- Focused Vitest passed (`15/15`) and full Frontend Vitest passed (`34/34`);
  i18n parity, Frontend lint, production build, and bundle gate passed. Chrome
  rendered a 17-marker stress preview with correct normal
  and silver artwork/glow and no cache clipping. Authenticated physical-device
  FPS profiling remains pending.

# 2026-07-31 Team V2 Settings and compact Leaderboard

- Changed only V2 Settings sizing from fixed/full portrait height to centered
  intrinsic content height with the existing viewport cap and overflow scroll.
- Added a pure V2 Leaderboard projection: first five API rows, plus the current
  Team as display rank `6` when it is not in those rows. Team name, completed
  Stations, and score still come from the authoritative response.
- The source array is not mutated. Backend ranking, sorting, scoring, APIs,
  schema, seed, and non-V2 screens are unchanged.
- Focused Vitest passed (`10/10`) and full Frontend Vitest passed (`37/37`);
  i18n parity, Frontend lint, production build, and bundle gate passed. Chrome
  visual verification at `390x844` confirmed centered intrinsic Settings
  height. Authenticated Leaderboard-data verification remains pending.

# 2026-07-31 Team V2 inactive language contrast

- Added a Team V2 Settings-only inactive language style with near-black
  background, restrained border/shadow, and lower flag saturation, brightness,
  and opacity. Hover/focus remains visible without resembling the active state.
- The active language style and shared `LanguageSwitch` component are unchanged;
  Login, QR Login, AppFrame, Backend, APIs, schema, and seed are unaffected.
- Full Frontend Vitest (`37/37`), i18n parity, Frontend lint, production build,
  bundle gate, and Chrome visual verification using the real component passed.

# 2026-07-31 Team V2 background-only overlay opacity

- Changed Team V2 overlay default opacity from `85%` to `95%` and versioned the
  local-storage key so existing clients adopt the new default once. Later
  Settings slider changes continue to persist.
- Replaced parent-layer CSS `opacity` on Leaderboard, Settings, Station Detail,
  Scanner, and Score with a typed `--team-v2-overlay-opacity` variable consumed
  only by backdrop and panel backgrounds. Text, icons, controls, and media now
  retain full opacity.
- No Backend, API, schema, seed, gameplay, or non-V2 screen changed. Focused
  Vitest (`11/11`), full Frontend Vitest (`39/39`), i18n parity, Frontend lint,
  production build, bundle gate, and Chrome visual verification passed.
# 2026-08-02 Frontend UI usability and accessibility optimization

- Added an explicit initial-load error with retry action to the shared
  Leaderboard while preserving stale rows on refresh failures.
- Made unknown-route redirects session-aware: Admin returns to `/teams`, Team
  returns to `/stations`, and anonymous users return to `/login`.
- Added localized accessible labels/tooltips for map zoom/reset controls,
  primary navigation, application branding, and authorization-denied UI.
- Improved mobile readability and touch targets for Leaderboard, Admin
  Operations, Team list, language controls, and map controls; truncated Team
  and Leaderboard names now expose their full value through a title.
- Verification PASS: Frontend Vitest `61/61`, i18n parity `409`, full lint,
  TypeScript production build, and bundle budget (`203.85 KiB` initial gzip).
- Manual authenticated desktop/mobile visual review remains pending.
# 2026-08-02 Video action color refinement

- Softened enabled `Watch Video` actions from saturated red to a light rose
  treatment in Team V1 and a muted dark-rose treatment in Team V2.
- Preserved YouTube recognition, hover/active feedback, disabled appearance,
  layout, and all media behavior.
- Verification PASS: focused Team V2 detail tests `6/6`, Frontend lint,
  production build, and bundle budget (`203.84 KiB` initial gzip).
# 2026-08-03 Check-in QR camera-first modal

- Redesigned the Station List Check-in modal around the primary camera action.
- Manual token entry is collapsed by default and opens explicitly or
  automatically when camera support is unavailable or camera startup fails.
- Replaced the large Backend-oriented flow alert with a concise Station
  identity card and player-facing instruction; scanned QR still auto-submits.
- Preserved shared `QrTokenInput` compatibility for Check-out, map, and login
  consumers through optional presentation/submission props.
- Verification PASS: Frontend Vitest `61/61`, i18n parity `413`, lint,
  production build, and bundle budget (`203.95 KiB` initial gzip).
- Manual physical-camera and mobile visual verification remains pending.
# Final lifecycle — cập nhật 2026-08-17

`EventLifecycleService` reconcile mỗi 5 giây và tại các Player/Final read-write boundary. Reconcile idempotent theo `updateMany`, chỉ cancel progress `CHECKED_IN`/`PLAYING` chưa `checkedOutAt`, reset attempt state và ghi System activity log. Public event/final/player state trả phase, timing, pending score để V2 takeover.
