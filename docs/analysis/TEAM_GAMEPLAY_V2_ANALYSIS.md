# Team Gameplay V2 Analysis

## 2026-08-20 Station reference points and score entry

- Marker, Team overview list and V2 Station Detail use the shared reference display; `ST007` renders exactly `???` without fallback to `30`.
- Score input consumes Backend `scoreEntryMax` (`105`). A score above a non-null reference shows a non-blocking confirmation warning.
- ST009 remains on the TIME Check-out success path with provisional `10` and never opens the score modal.

## 2026-08-18 QR tabs, Final retry and compact runtime

- Scanner opens on a full-overlay camera tab and offers a separate paste tab.
  Switching to paste stops camera resources; switching back starts a fresh
  scanner run while preserving normalization, duplicate guards and callbacks.
- Final wrong-answer cooldown is Backend-authoritative at
  `3, 5, 10, 15, 20, ...`, capped at `50` seconds. When local cooldown expires,
  V2 revalidates availability through a single-flight GET before enabling the
  shared button/Enter submit path.
- Correct Final state hides Total Score and replaces decorative sparkle with a
  neon `TrophyFilled` success mark, including restored sessions after reload.
- Overlay opacity controls only background surfaces. Text, icons, borders,
  buttons and form controls remain fully opaque.
- Team V2 polls the compact runtime projection instead of full Player state,
  skips store updates for an unchanged `runtimeVersion`, reloads catalog only
  when `catalogVersion` changes, and stops passive polling after
  `FINAL_STARTED`.
- Local authenticated focused smoke PASS on Chromium and WebKit `3/3` each for
  portrait/landscape QR tabs and wrong-first Final retry/success. BrowserStack
  macOS Playwright WebKit passed the same `3/3`. Real iPhone 15 Safari verified
  the Local tunnel, actual `team01` login/auth bootstrap and map render, but QR
  interaction/rotation remains blocked by BrowserStack's real-device Playwright
  bridge (`route.fetch`, forced click, DOM click and touchscreen/expect failures).

## 2026-08-18 Vietnamese font consistency

- All Team V2 localized/dynamic DOM UI now uses the bundled Space Grotesk
  Vietnamese/Latin family. This includes the Final notice title, overlay titles,
  Team/Station names and the Station Detail start-scan CTA.
- Oxanium remains limited to invariant HUD content that does not require
  Vietnamese glyphs: `MOVEment 2026`, score/`PTS`, marker codes and the gathering
  point `X`. This prevents per-glyph fallback, mismatched baselines and broken
  diacritics while preserving the approved cyberpunk brand treatment.
- Localized labels/actions use the bundled supported weight ceiling `700`
  instead of synthetic `800..900` weights, avoiding jagged Vietnamese strokes.
- Computed-font smoke PASS on authenticated Chromium and local WebKit `3/3` each
  at `390x844`, `844x390`, and `1024x768`; the bundled Vietnamese face reported
  loaded in both engines. Physical Safari/iPhone verification remains pending.

## 2026-08-18 Settings opacity and dual Zalo support

- The Settings opacity slider now drives every full-screen overlay background
  layer, including the demo-v4 panel, header and button surfaces, while text and
  controls remain fully opaque and readable.
- Settings exposes two full-width Zalo support actions. Support 1 keeps the
  existing contact; Support 2 is visibly disabled with localized "coming soon"
  copy until its URL is configured. Updating the second URL automatically
  enables the same safe external-window behavior.
- Portrait stacks the actions; landscape at `640px+` uses two equal columns that
  span the full Settings content width. Both actions retain a minimum `44px`
  target and Safari-compatible CSS fallbacks.
- Verification PASS: full Frontend Vitest `83/83`, i18n parity `453`, lint,
  production build/bundle gate, authenticated Chromium feature smoke `3/3` and
  local WebKit feature smoke `3/3` at `390x844`, `844x390`, and `1024x768`.
  Physical Safari/iPhone verification was not performed.

## 2026-08-15 Settings logout removal

- Removed the visible Logout action from Team V2 Settings and deleted its
  V2-only icon/API handler path.
- Session-expiry and unauthorized-session cleanup remain unchanged; AppFrame
  Team/Admin header logout behavior outside `/team/v2` remains unchanged.
- Verification PASS: Frontend Vitest `69/69`, lint, i18n parity `439`, production
  build/bundle gate, and authenticated Chromium/demo E2E `8/8`.

## 2026-08-15 Dead-code and demo runtime cleanup

- Removed the unreferenced `TeamV2NeonMapMarker` implementation; Graphify showed
  no consumer beyond its own file, and repository search confirmed no imports.
- Removed retired Team V2 CSS generations for Station preview, header
  Fullscreen, event/footer rails, team/station counters, and the pre-demo Legend.
  A token-aware selector audit reports no remaining Team V2 class without a
  Source Code consumer. Duplicate font-face declarations and dead keyframes were
  also removed from the legacy stylesheet layer; the production Team V2 CSS
  asset decreased from `70.14 kB` to `60.30 kB` raw.
- The standalone React/Konva demo now rounds observed geometry and skips equal
  resize updates, relies on ResizeObserver/browser resize for rotation, redraws
  after font readiness without remounting the Stage, and matches the compact
  score/Settings/lowercase-`i` Legend presentation.
- Legacy v4 files remain intentionally for provenance. No tracked generated
  output, dependency directory, log, TypeScript build info, or zero-byte file was
  found.

## 2026-08-15 Compact HUD controls and Station Detail actions

- Legend popover now sizes to its longest localized row instead of a fixed
  panel width. The visible Legend control is a compact lowercase `i`, while its
  native button keeps a 44px interaction target.
- The score frame is tightened around the numeric score and points unit in both
  portrait and low-height landscape. The Settings ring is visually smaller
  while preserving its accessible hit area and centered icon.
- V2 Station Detail no longer renders Image Gallery. Video remains visible as a
  branded YouTube action, and an available Station uses a prominent QR-first
  start action that keeps the existing `START` scanner callback.
- V2 Settings no longer advertises the legacy interface. V1 routes and media
  galleries outside `/team/v2` remain unchanged.

## 2026-08-15 Demo hygiene and dead score CSS cleanup

- The legacy HTML/React v4 reference remains for provenance, while `demo/movement2026-react-konva` is committed as the independently buildable TypeScript/Konva reference package with its own reproducible lockfile.
- Generated demo dependencies, build output, logs, TypeScript build info and emitted Vite config files are excluded. The retired `reference.png` is removed and the demo documentation routes contributors to the executable reference.
- All demo variants now omit the visible total-score caption, and production removes every dead `.team-v2-score small` selector left after that element was retired.
- Removed a stale emitted `vite.config.js` that shadowed the TypeScript config. The active Vite 8 config now separates app (`11.50 kB`), React (`178.59 kB`) and Konva (`317.37 kB`) chunks without the previous `>500 kB` warning.
- Demo responsive smoke PASS `2/2` at `390x844` and `844x390`: the shell fits the viewport, all buttons are at least `44px`, the caption is absent, Legend opens and the landscape footer/QR remains fully visible.
- Final regression PASS: production Vitest `70/70`, lint, i18n parity `440`, production/demo builds, and combined Chromium E2E `7/7` (five authenticated Team V2 cases plus two standalone demo cases).

## 2026-08-15 Score caption removal

- The visible `Total score` / `Tổng điểm` caption is removed from the centered Team V2 score card; the authoritative numeric score and localized points unit remain unchanged.
- The score card retains its localized accessible name, centered HUD placement and responsive portrait/landscape geometry.
- Verification PASS: Frontend lint, production build/bundle gate, and authenticated Chromium E2E `5/5` across `390x844`, `844x390`, and `1024x768`, including absence of the visible caption and presence of the accessible score label.

## 2026-08-15 Expanded and normalized map zoom

- Team V2 map zoom now spans `0.5x..8x` of the responsive base scale, superseding the previous `0.8x..5x` limits in both portrait and landscape.
- Wheel zoom derives a bounded exponential factor from browser `deltaY`/`deltaMode`, keeping trackpads smooth while making conventional mouse-wheel steps more responsive. Wheel and pinch retain the same focal world coordinate through both zoom clamps; double-click/double-tap still resets to the exact centered base transform.
- Fixed wheel accumulation by reading the live imperative transform and committing it to React after 120 ms of wheel inactivity, so repeated wheel frames continue from the latest scale and refresh marker culling once the gesture settles.
- Verification PASS: full Frontend Vitest `70/70`, lint, i18n parity `440`, production build/bundle gate, and authenticated Chromium E2E `5/5`, including exact `0.5x`, `8x`, and reset assertions at `844x390`.
- This is Frontend presentation/interaction only; map coordinates, marker state, gameplay, QR, APIs and Backend behavior are unchanged.

## 2026-08-15 Overlay type scale and left-side Legend

- Overlay typography now uses shared semantic tokens across Settings, Team, Leaderboard, scanner, score and Station Detail: the common body baseline is exactly 30% above the preceding `15..17px` scale, while all overlay titles share the Leaderboard title token and all secondary text shares one secondary token.
- Legend is a single accessible 44x44 `i` icon at the left edge. Opening it reveals the four marker states in one vertical left-side column. In low-height landscape the total score stays horizontally centered instead of yielding the center to Legend.
- Every Konva marker pin and its points label share one exact two-color gradient pair per semantic state: cyan-purple default, gold-pink active, white-lavender completed and slate-purple locked. Multi-stop three/four-color edges were removed.
- Authenticated Chromium E2E PASS `4/4`: portrait, landscape and desktop full-map geometry; landscape score center within 1px; icon-only Legend dimensions/left placement/vertical grid; overlay body >=19.5px; equal Team/Leaderboard title and body computed sizes.

## 2026-08-15 Legend, Settings and complete Leaderboard refinement

- Legend toggle/popover now uses the rounded cyan-to-magenta border and polygon marker swatches from the standalone React/Konva demo; the Settings button uses the same gradient ring and explicitly centers the Ant Design icon.
- Team V2 Leaderboard renders every row from the authoritative Backend response, preserves each real rank, scrolls inside the full-screen overlay, and uses larger Team/rank/score typography. This supersedes the previous Top 5 + display-rank-6 projection.
- Footer panel underline pseudo-elements have explicit stacking and `pointer-events: none`; overlay information typography is one responsive step larger without changing controls or data.
- Verification PASS: focused Vitest `19/19`, lint, i18n parity `440`, production build/bundle gate, and authenticated Chromium E2E `4/4`, including all-row response parity, Settings icon centering, Legend state count, footer pseudo-element computed styles and typography minimums.

## 2026-08-14 Demo v4 marker/header/footer fidelity pass

- Replaced the rounded Team V2 pin with the demo's slender double-outline Konva pin, preserved the 44px touch target, and matched the active whole-marker heartbeat with circular aura plus three elliptical radar rings.
- Rebuilt the header and footer geometry from the demo: clipped cyan-to-magenta title frame, gradient-ring Settings control, dark inset footer wings, underline accents, circular icon wells, and the multi-ring central QR control. The production map still fills the viewport beneath the HUD.
- Authenticated Chromium E2E PASS at `390x844`, `844x390`, and `1024x768`, including full-viewport Stage bounds, Settings controls, footer bounds and minimum 44px targets. Focused Vitest `16/16`, lint, i18n parity `440`, production build/bundle gate and `git diff --check` also PASS.
- WebKit/Safari was not verified: the local Playwright config contains only Chromium and no local WebKit runner is installed. No Safari PASS is inferred from Chromium.

## 2026-08-13 Demo v4 full-screen presentation reconciliation

- `demo/Movement2026.jsx` và `demo/styles.css` v4 là chuẩn presentation; `reference.png` chỉ là chuẩn thị giác. Không thêm dotted routes hoặc sparkle vào production V2.
- Konva map vẫn dùng production data/gesture nhưng phủ toàn viewport và nằm dưới HUD. Header, score, legend và footer dùng nền transparent/fade, chỉ native controls nhận pointer event để phần HUD trống vẫn pan/pinch map.
- Settings, scanner, Team overview, Leaderboard, score entry và Station Detail giữ nguyên state/callback/QR lifecycle nhưng hiển thị thành full-screen cyberpunk panels có safe-area và scroll nội bộ.
- Frontend verification PASS: focused Vitest `16/16`, lint, i18n parity `440`, production build/bundle gate và authenticated Chromium E2E tại `390x844`, `844x390`, `1024x768`. WebKit/Safari chưa verified vì máy chỉ có Chromium Playwright; BrowserStack vẫn phụ thuộc network ngoài.

## 2026-08-12 Full-map React/Konva demo reconciliation

- The supplied `demo/` is now ported as React HUD components plus Konva Station artwork/animation, rather than a legacy CSS layer alone. The map continues to use production Station data, gestures, scanner, Settings, Team panel and overlays.
- The Konva Stage now covers the whole `100dvh` viewport (`inset: 0`). Header, score, legend and footer are safe-area-aware DOM overlays within the same map viewport; they do not reserve/crop a top, middle and bottom map region.
- Portrait keeps a compact stacked HUD and low-height landscape keeps a 78px QR plus 58px side controls at `844x390`. Chrome/Safari fallbacks retain local fonts, viewport fallback, safe-area and native controls.
- Authenticated Chromium smoke passed at `390x844`, `844x390`, and `1024x768`, including full-map geometry, Settings display switches and footer hit targets. Real Safari remains unverified while BrowserStack connectivity is unavailable.

## 2026-08-12 Demo v4 visual port

- `/team/v2` keeps the real Suoi Tien map, Konva pan/pinch/zoom, Station data, scanner, settings, and overlays while adopting the supplied demo HUD: clipped cyan-to-magenta brand, green score card, framed three-control footer, and expandable marker legend.
- Marker semantics are visual only: unplayed cyan/blue/purple, completed silver, active gold double-heartbeat/radar without a lightning glyph, and locked muted purple/gray with a lock badge. Active animation uses imperative Konva frames and is reduced during map interaction and reduced-motion preference.
- Oxanium and Space Grotesk are bundled local WOFF2 assets with attribution; the route does not request Google Fonts at runtime.
- Portrait uses a compact legend/2×2 legend grid; landscape low-height uses height-capped header, legend, map inset, QR, and footer controls. `100dvh` retains its existing `100vh` minimum fallback and safe-area insets apply to both orientations.

## 2026-08-12 Mobile map interaction and short landscape footer

- Map pan/pinch now applies Stage transforms imperatively at most once per animation frame; React transform/culling layout commits once at gesture end.
- Marker glow is reduced while interacting and restored after release.
- At landscape height <= 500px, footer sizing is capped by viewport height: QR is 78px, side panels 58px, and map/preview/legend share a 92–98px bottom inset.

## 2026-08-08 Settings display controls and QR badge

- Moved the browser fullscreen control from the V2 header into Settings; the header retains only Settings.
- Settings adds a landscape toggle that attempts fullscreen then `screen.orientation.lock("landscape")` when supported. Unsupported/rejected browser paths, including Safari limitations, show localized manual-rotation guidance without a false success state.
- The QR badge SVG now fills its control and uses `translateY(-5px)` at every breakpoint.
- Verification passed: focused fullscreen Vitest `5/5`, i18n parity `439`, and Frontend production build/bundle gate. Manual Chrome/Safari and physical-device verification remain pending.

## 2026-08-04 Direct marker-to-game flow

- Removed the selected-Station preview card and its View mission step.
- Marker clicks and Team overview Station actions now open the V2 Station/Game
  Detail directly. Closing Detail clears selection and returns to the map.
- Focused Vitest passed (`8/8`), lint, build, and bundle budget passed.

## 2026-08-04 Team overview overlay

- The right footer action now opens a V2-owned Team overview overlay instead of
  navigating to V1. It shows the localized Team identity, authoritative score,
  rank, completed progress, current Station, and grouped Station inventory.
- Station rows display code, localized name, and points. Completed rows prefer
  the recorded score; active/available rows use Station reference points.
- Continue/row actions close the overlay and select the Station on the V2 map.
- i18n parity passed (`436` keys), lint, build, and bundle budget passed
  (`204.41 KiB` initial gzip).

## 2026-08-04 Cyberpunk wing footer

- Replaced the rounded enclosing rectangle with two independently clipped
  cyberpunk wings using cyan-to-purple gradient borders, angled center notches,
  neon depth, and technical rail details.
- Added a clipped pedestal behind the centered `96px` Scan CTA while preserving
  existing navigation behavior. Lint, build, and bundle budget passed.

## 2026-08-04 Absolute-centered scanner caption refinement

- The Scan CTA is now anchored at `top: 50%` with a two-axis `-50%` transform,
  guaranteeing equal visual protrusion above and below the footer rail at every scale.
- Raised the Scan caption by `4px`. Lint, build, and bundle budget passed.

## 2026-08-04 Centered scanner over compact rails

- Footer side rails and enclosing border now use a centered `72px` band inside
  the `96px` footer. The `96px` Scan CTA protrudes exactly `12px` above and
  below that band.
- Frontend lint, production build, and bundle budget passed (`204.28 KiB`).

## 2026-08-04 Baseline-aligned compact scanner

- Removed the legend control/panel from Team V2 rendering and state.
- Reduced the center Scan CTA from `104px` to `96px`. The footer frame and CTA
  now share the same `96px` design height and bottom baseline.
- Focused Vitest passed (`8/8`), Frontend lint, production build, and bundle
  budget passed (`204.27 KiB` initial gzip).

## 2026-08-03 Attached marker points and smaller scanner

- Moved each points/trophy/lock pill into the same Konva group as its pin. The
  pill now has a fixed `6px` offset from the pin anchor and cannot be moved,
  hidden, or separated by the former label collision layer.
- Reduced the center Scan CTA from `112px` to `104px`. The footer enclosing
  frame now renders below the opaque circular CTA so no horizontal frame line
  crosses the button.
- Focused Vitest passed (`8/8`), Frontend lint, production build, and bundle
  budget passed (`204.28 KiB` initial gzip).

## 2026-08-03 Compact navy markers and simplified footer

- Reduced marker width to `30px` by default (`26..40px`) and points pills to
  `52x18px`. Marker interiors now use a dark navy gradient with a subtle inner
  circular outline around the Station code instead of a near-black fill.
- Reduced both the closed legend control and expanded legend panel. Removed
  per-tab borders/shadows from the footer so only its enclosing neon frame remains.
- The right footer tab now displays the localized current Team name from live
  Team data (for example `Đội 1`) instead of the generic My team label.
- Focused Vitest passed (`8/8`), i18n parity passed (`428` keys), Frontend lint,
  production build, and bundle budget passed (`204.27 KiB` initial gzip).

## 2026-08-03 Premium map HUD final refinement

- Rebuilt the bottom navigation on a `360x112px` design grid with `124px`
  side tabs and a `112px` center Scan CTA. The shared outer frame now encloses
  all three actions and scales to the available mobile width.
- The legend is now a compact closed button by default. Opening it reveals a
  readable localized three-state panel with an accessible close action; it is
  hidden while Station previews or blocking overlays are active.
- Removed the active marker text chip, kept only its lightning badge, raised it
  above other markers, and added a third gold ground ring. Completed markers
  remain legible at `74%` opacity and continue to use a trophy pill.
- Reduced the map vignette so the authoritative Suoi Tien image is clearer.
  Station data, coordinates, pan/zoom, QR, scoring, and Backend behavior remain
  unchanged.
- Focused Vitest passed (`8/8`), i18n parity passed (`428` keys), Frontend lint,
  production build, and bundle budget passed (`204.28 KiB` initial gzip).

## 2026-08-03 Dense-map readability and full-width footer

- Reduced default marker width from `44px` to `34px` (`30..46px`) and points
  pills from `68x22px` to `58x19px` to reduce overlap in dense Station clusters.
- Increased portrait default map coverage from `78%` to `94%` of the available
  map viewport height, producing a larger map while preserving coordinates,
  pan/zoom, screen-space marker sizing, and viewport clamping.
- Reduced the legend to `142..184px` (`136px` on narrow phones) with compact
  typography and pills.
- Footer now scales from `0.82x` through `2.4x` based on viewport width, uses
  square-root font compensation, and adds a `2px` outer frame around both tabs
  and the center QR CTA. Map/preview/legend clearance follows `28vw` with caps.
- Focused Vitest passed (`14/14`), i18n parity passed (`426` keys), Frontend
  lint, production build, and bundle budget passed (`204.25 KiB` initial gzip).

## 2026-08-03 Three-state map legend

- Added a localized V2 `LegendCard` above the footer at the map's lower-left.
  It explains Available with cyan pin/points, In Progress with gold pin/points,
  and Completed with blue-gray pin/trophy, matching the supplied mockup.
- Renamed the internal canvas marker components to `StationMarker` and
  `StationMarkerLabel` for clearer V2 ownership. Real markers continue to use
  Backend Station IDs, status, points, and coordinates; visual-reference sample
  Station IDs are intentionally not hard-coded into gameplay.
- The legend is non-interactive, responsive, and yields visually to Station
  preview and blocking overlays through its lower z-index.
- Focused Vitest passed (`14/14`), i18n parity passed (`426` keys), Frontend
  lint, production build, and bundle budget passed (`204.25 KiB` initial gzip).

## 2026-08-03 Spec-locked 336px bottom navigation

- Replaced the prior estimated footer geometry with the supplied annotated spec:
  `336x96px` design coordinates split into `120px + 96px + 120px`, `72px`
  side-tab height, `96px` center CTA, `2px` borders, and `16px` outer corners.
- The complete component scales uniformly from `0.82x` to `1.5x` based on both
  viewport width and portrait height. Typography now scales with the component
  rather than using inverse font compensation.
- Removed the extra base frame and wide underlapping wings. Scan copy stays
  inside the lower CTA, with single-line localized side labels.
- QR behavior, map clearance, gameplay state, points, and Backend are unchanged.
- Focused Vitest passed (`14/14`), i18n parity passed (`422` keys), Frontend
  lint, production build, and bundle budget passed (`204.19 KiB` initial gzip).

## 2026-08-03 Overlapped footer geometry

- Matched the supplied footer geometry as a layered composition rather than
  three adjacent controls: an `82px` continuous base frame, `284px` wings that
  extend beneath the center, and a `128px` scanner layered above both wings.
- Moved the Scan label inside the lower portion of the scanner ring and retained
  single-line icon/action labels on each wing.
- QR behavior, map clearance, state, scoring, and Backend remain unchanged.
- Focused Vitest passed (`14/14`), i18n parity passed (`422` keys), Frontend
  lint, production build, and bundle budget passed (`204.20 KiB` initial gzip).

## 2026-08-03 Large simplified footer

- Enlarged the compact V2 footer to match the supplied right-side reference:
  `154px` composition height, `128px` center scanner, and `78px` side wings.
- Side wings now show only large Leaderboard and My team labels with larger
  icons. Removed secondary headings and score/progress copy from the visible
  footer to keep the mobile HUD clean; authoritative score remains in the top HUD.
- Increased map and selected-preview bottom clearance for the larger footer.
- QR behavior, Team/Station state, points, coordinates, and Backend are unchanged.
- Focused Vitest passed (`14/14`), i18n parity passed (`422` keys), Frontend
  lint, production build, and bundle budget passed (`204.19 KiB` initial gzip).

## 2026-08-03 Framed HUD regression fix

- Fixed a CSS cascade regression where the legacy shared header/footer/preview
  selector left both `top` and `bottom` on the header, stretching its dark panel
  across most of the viewport. Header geometry now explicitly resets bottom,
  width, margin, border, radius, and shadow before applying the top HUD style.
- Reset inherited footer container padding, border, background, shadow, and
  minimum height so only the two wings and center scan control are visible.
- Center footer copy is now consistently localized as Scan instead of switching
  to In Progress. Active Station emphasis remains on the gold map marker.
- Focused Vitest passed (`14/14`), i18n parity passed (`422` keys), Frontend
  lint, production build, and bundle budget passed (`204.19 KiB` initial gzip).

## 2026-08-03 Framed header, map, and footer composition

- Rebuilt the V2 vertical composition into three non-overlapping regions: a
  dedicated top HUD, an inset middle map canvas, and a compact bottom HUD.
- `MOVEment 2026` now uses a wider clipped neon banner matching the supplied
  casing/proportions. The authoritative total score card sits in the top HUD
  outside the map canvas rather than floating over map content.
- Reduced the footer design height from `204px` to `112px`, with a `92px`
  central scanner and symmetrical Leaderboard/My-team wings cut around it.
  Removed the secondary active-Station caption that previously crowded the
  footer; active context remains visible through the gold map marker/detail.
- Selected-Station preview clearance follows the compact footer. QR behavior,
  score/state authority, coordinates, map interactions, and Backend remain unchanged.
- Focused Vitest passed (`14/14`), i18n parity passed (`422` keys), Frontend
  lint, production build, and bundle budget passed (`204.19 KiB` initial gzip).

## 2026-08-03 Premium three-state event-map markers

- Reconciled the V2 map with the supplied premium cyberpunk reference while
  keeping the compact variable-length marker geometry and real Backend data.
- Available markers remain cyan. The authoritative In Progress marker is gold,
  scales to `118%`, adds a strong halo, two ground rings, a localized Playing
  chip, and a lightning badge so it is the dominant map element.
- Completed markers use subdued blue-gray light and replace the points pill
  content with a trophy. Locked markers retain a distinct gray treatment and
  lock glyph. Long `ST` display codes continue using adaptive font sizing.
- Footer hierarchy is now Leaderboard, central Scan, and My team. The Team
  panel shows authoritative total points and completed-Station progress.
- No Station IDs are hard-coded from the visual reference. Station identity,
  status, points, coordinates, QR, scoring, and Backend authority are unchanged.
- Focused Vitest passed (`14/14`), i18n parity passed (`422` keys), Frontend
  lint, production build, and bundle budget passed (`204.19 KiB` initial gzip).

## 2026-08-03 Compact variable-length markers

- Reduced V2 marker width from `58px` to `44px` by default, with a responsive
  `38..58px` range, and reduced the points/Locked pill to `68x22px`.
- Marker number typography now scales by display-code length: two-character
  codes remain prominent while longer codes such as `ST04` shrink to fit.
- Marker states, points authority, hit targets, coordinates, QR, scoring, and
  Backend behavior remain unchanged.
- Focused Vitest passed (`14/14`), i18n parity passed (`420` keys), Frontend
  lint, production build, and bundle budget passed (`204.16 KiB` initial gzip).

## 2026-08-03 Reference-proportioned hero markers

- Increased V2 markers to reference-like hero proportions: `58px` default
  width (`50..76px` responsive), approximately `1.52x` silhouette height, and
  an `82x26px` points/Locked pill.
- Added a restrained double-outline glow and dark depth surface behind the
  Station number without adding an icon or illustration inside the pin.
- Selected markers retain purple and add two fading pill echoes beneath the
  primary pill, matching the supplied reference hierarchy.
- State authority, number/points content, Locked symbol, hit targets,
  coordinates, QR, scoring, preview, and Backend behavior remain unchanged.
- Focused Vitest passed (`13/13`), i18n parity passed (`420` keys), Frontend
  lint, production build, and bundle budget passed (`204.16 KiB` initial gzip
  JavaScript). Authenticated visual and physical-device verification remain pending.

## 2026-08-03 Explicit total score and taller pins

- The green HUD score is the authoritative Team total from `activeTeam.score`.
  It now renders in a dedicated dark panel with localized Total score copy so
  it cannot be mistaken for a Station marker.
- Removed the inner circle from map pins and changed the silhouette to a larger,
  taller teardrop. Default width is `44px` (`38..64px` responsive) and the
  outline height is approximately `1.45x` its width.
- Station number, points/Locked pill, state colors, hit target, coordinate
  anchor, preview, QR, scoring, and Backend behavior remain unchanged.
- Focused Vitest passed (`13/13`), i18n parity passed (`420` keys), Frontend
  lint, production build, and bundle budget passed (`204.16 KiB` initial gzip
  JavaScript). Authenticated visual and physical-device verification remain pending.

## 2026-08-03 Teardrop marker state treatment

- Refined the simplified marker into a single proportional teardrop outline
  with a dark inner circle and high-contrast Station number, matching the
  supplied close-up reference without restoring the prior dense artwork.
- Available/active pins use cyan, selected pins and pills use purple, and
  Locked pins retain the confirmed silver-purple treatment.
- Locked markers replace the points text in the lower pill with a centered lock
  symbol. Backend marker state, Completed behavior, hit targets, coordinates,
  preview, and gameplay remain unchanged.
- Focused Vitest passed (`13/13`), i18n parity passed (`420` keys), Frontend
  lint, production build, and bundle budget passed (`204.16 KiB` initial gzip
  JavaScript). Authenticated visual and physical-device verification remain pending.

## 2026-08-03 Simplified pins and separated footer geometry

- Replaced the dense 640x620 Bézier neon marker artwork with a simple dark
  circular pin and short tip so the Station number remains the dominant mark.
- Default marker size is now `36px` (`30..52px` responsive), while the points
  pill is `64x20px` with a fully rounded shape.
- Reduced the QR action from `222px` to `116px` and the footer composition from
  `286px` to `204px`. QR, caption, and the two lower panels now occupy separate
  vertical bands, with a dedicated center gap between the side panels.
- Preview clearance was adjusted for the rebuilt footer. QR/scanner behavior,
  Station state, scoring, map coordinates, and Backend contracts are unchanged.
- Focused Vitest passed (`13/13`), i18n parity passed (`420` keys), Frontend
  lint, production build, and bundle budget passed (`204.16 KiB` initial gzip
  JavaScript). Authenticated visual and physical-device verification remain pending.

## 2026-08-03 Numeric marker and points pill

- Team V2 map markers now place the compact Station display number inside the
  pin and show only the Station reference points in a small pill below it.
- Station names and connector lines are no longer rendered on the map; names
  remain available in the selected-Station preview and full Detail.
- Selected, active, Completed, and Locked palettes remain authoritative.
  Completed keeps its check as a small badge so the numeric identity stays
  readable; Locked keeps its existing lock badge.
- This supersedes the earlier exact-marker decision that intentionally omitted
  the number from the pin and kept Station code/name in a separate label.
- Focused Vitest passed (`13/13`), i18n parity passed (`420` keys), Frontend
  lint, production build, and bundle budget passed (`204.17 KiB` initial gzip
  JavaScript). Authenticated visual and physical-device verification remain pending.

## 2026-08-03 Readable selected-Station preview

- Selecting a map marker now opens a compact bottom preview instead of
  immediately covering the map with the full Station Detail overlay.
- The preview shows the first already-loaded Station image when available,
  otherwise a Station-code fallback, plus name, maximum points, a short
  description, and an explicit View mission action.
- View mission opens the existing full V2-owned Detail. Closing Detail returns
  to the selected preview, while closing the preview clears the selection.
- QR, Station actions, scoring, map coordinates, marker state, Backend
  contracts, and the fixed V2 palette remain unchanged.
- Focused Vitest passed (`13/13`), i18n parity passed (`420` keys), Frontend
  lint, production build, and bundle budget passed (`204.16 KiB` initial gzip
  JavaScript). Authenticated visual and physical-device verification remain
  pending.

## 2026-08-03 Portrait HUD and marker readability refinement

- Portrait Fullscreen and Settings controls now remain on one horizontal row.
- The raised QR/footer composition scales against both viewport width and
  portrait height, preventing short portrait screens from receiving the
  width-only maximum size while preserving the existing action hierarchy.
- Station labels are clamped inside the viewport and collision-filtered in
  screen space. Selected labels have first priority, followed by the active
  Station; markers remain visible and tappable when their overlapping label is
  suppressed.
- QR behavior, Station state, map coordinates, scoring, fixed V2 palette, and
  Backend contracts are unchanged.
- Focused marker layout Vitest passed (`7/7`), i18n parity passed (`417` keys),
  Frontend lint, production build, and bundle budget passed (`204.11 KiB`
  initial gzip JavaScript). Authenticated browser and physical-device visual
  verification remain pending.

## 2026-08-03 Default Team experience trial

- `/team/v2` is now the default destination for Team username login, Team QR
  login, automatic URL QR login, authenticated login-page recovery, forbidden
  route recovery, and unknown-route fallback.
- V1 remains available at `/stations` and `/stations/map`; the 2026-08-15
  decision removes the explicit return-to-V1 action from V2 Settings.
- Admin redirects and all authentication, QR, Station, scoring, and Final
  Business Rules remain unchanged.
- Frontend container verification passed: Vitest `61/61`, i18n parity `417`,
  lint, production build, and bundle budget (`204.10 KiB` initial gzip JS).
  Authenticated browser redirect smoke remains pending.

## Status

| Area | Status |
| --- | --- |
| Implementation | Completed for supplied reference HTML palette/layout; V2 route, unified QR endpoint, persistent scanner, i18n, and navigation remain completed |
| Runtime/Production Verification | Local build and authenticated browser verification completed; Production verification not performed |
| Browser/Manual Verification | Team 01/05 cross-Team visual smoke completed at 320x568, 390x844, and 844x390; the new fullscreen control and physical iOS/Android behavior remain pending |

## 2026-08-02 Browser fullscreen control

- The Team V2 header now exposes an accessible enter/exit fullscreen icon next
  to Settings. It requests the standard Fullscreen API with
  `navigationUI: "hide"`, falls back to Safari's `webkit*` API, and synchronizes
  the icon with both standard and prefixed fullscreen change events.
- Installed iOS/Home Screen and standard standalone display modes are detected
  so the redundant fullscreen control is hidden. Browsers without element
  fullscreen, notably iPhone Safari, receive localized Add to Home Screen
  guidance instead of a false success state.
- The document advertises standalone-capable Apple metadata and a dark status
  bar/theme color. Team V2 uses `100dvh` in addition to its existing fixed
  viewport and safe-area layout so browser chrome changes do not leave a stale
  viewport height.
- Focused fullscreen Vitest passed (`5/5`), full Frontend Vitest passed
  (`60/60`), i18n parity passed (`399` keys), full Frontend lint passed, and the
  production build/bundle gate passed at `203.63 KiB` initial gzip JavaScript.
  Automated browser tooling and physical Safari/iOS verification were not
  available in this workspace and remain pending.

## 2026-08-01 Completed and Locked marker appearance

- Team V2 no longer removes Completed marker groups. Completed and Locked
  markers remain tappable and use a silver `#C3CED8` to neon-purple `#B05CFF`
  gradient across pin, halo, connector, and label border.
- Completed uses a check and shares `40%` opacity across marker, label, and
  connector, rising to `70%` while selected. Locked uses a lower-right lock
  badge and remains at `100%`, including while selected.
- Backend `COMPLETED`/`LOCKED` state is authoritative. `Finished` is a
  completion fallback only when backend status is absent; gameplay, Station
  Detail, coordinates, APIs, cache, culling, and pan/zoom behavior are unchanged.
- Focused marker Vitest passed (`10/10`), full Frontend Vitest passed (`44/44`),
  and i18n parity, Frontend lint, production build, and bundle gate passed.
  Authenticated in-map and physical-device visual verification remain pending.

### Review Decision Log

1. Symbols: Completed uses a check; Locked uses a lock badge.
2. Locked opacity: keep `100%`; only Completed is dimmed.
3. Selected priority: Locked remains authoritative silver-purple.
4. Lock placement: lower-right badge outside the marker center.
5. Interaction: both states remain tappable and open V2 Station Detail.
6. Palette scope: pin, halo, connector, and label border share the state palette
   and marker opacity.
7. Palette token: use neon purple `#B05CFF` with silver `#C3CED8`.

## 2026-07-31 Background-only overlay opacity

- All Team V2 overlays now default to `95%` background opacity. A versioned
  local-storage key resets the previous default/preference once, after which
  the existing Settings slider continues to persist new choices.
- Opacity is carried by `--team-v2-overlay-opacity` and applied only to backdrop
  and panel background colors. The overlay DOM container no longer uses CSS
  `opacity`, so text, icons, buttons, form controls, and media render at `100%`.
- A shared typed helper is used by Leaderboard, Settings, Station Detail,
  Scanner, and Score overlays and clamps invalid values safely.
- Focused Vitest passed (`11/11`) and full Frontend Vitest passed (`39/39`);
  i18n parity, Frontend lint, production build, and bundle gate passed. Chrome
  visual verification confirmed a 95% background with fully opaque content.

## 2026-07-31 Inactive language control contrast

- The unselected language button inside Team V2 Settings now uses a near-black
  background, subdued border/inset shadow, and a strongly desaturated,
  darkened flag. Hover/focus raises it slightly while keeping it visibly
  inactive; the selected cyan treatment remains unchanged.
- Selectors are scoped to `.team-v2-settings`, so Login, QR Login, AppFrame,
  and other shared `LanguageSwitch` consumers are unchanged.
- Full Frontend Vitest passed (`37/37`), i18n parity, Frontend lint, production
  build, bundle gate, and a Chrome render of the real `LanguageSwitch` passed.

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

- This dated media rule is superseded on 2026-08-15: Team V2 Detail renders the
  branded YouTube action only. Missing video remains readable and disabled;
  Image Gallery remains available outside V2 Detail.
- Completed and Locked Stations retain their marker, label, and connector.
  Both use the dedicated silver-purple marker palette; Completed is dimmed and
  uses a check, while Locked stays fully opaque with a lock badge. Locked state
  is evaluated before selected/active presentation so its unavailable state
  stays visually authoritative.
- The prior hide-completed behavior in this dated section is superseded by the
  2026-08-01 marker-appearance decision and verification above.

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
- Team-only settings, opacity, language, and Zalo support;
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
| Execute/manual QR action | `CameraOutlined` |
| Station score | `StarFilled` |
| Teams playing | `TeamOutlined` |

All primary gameplay targets remain at least 44px. Icons inherit the fixed V2
accent or semantic color from their container; danger semantics remain available
for gameplay actions where required.

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
12. Release hygiene: the 2026-08-15 decision supersedes the visible Team V2
    Settings logout action; session expiry and auth-failure cleanup remain.

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
# Final Challenge V2 — cập nhật 2026-08-17

`/team/v2` render Final native, không route qua V1. Với đáp án hiện tại, UI nhận `answerLength` authoritative và render 17 ô ký tự gồm cả space; space phải được nhập tay, hiển thị ô đã điền nhưng không render glyph. Enter hoặc button submit; sai đáp án xóa ô và lock theo cooldown.

## Final notice và Điểm tập trung — quyết định 2026-08-18

- Banner `NOTICE`/`STATIONS_CLOSED` nằm dưới Total Score, có title, hướng dẫn trở về Điểm tập trung và countdown đồng nhất VI/EN.
- Marker Điểm tập trung là Konva presentation marker không tương tác tại `65.56%, 68.94%`; chỉ hiện từ `NOTICE` qua `STATIONS_CLOSED`, giữ neon hồng và biến mất khi `FINAL_STARTED`.
- Marker không thuộc Station catalog/progress, không mở Detail và không thay đổi QR hoặc quyền Check-in.
- Final answer dùng một native input làm nguồn dữ liệu để loại race khi gõ nhanh; các slot chỉ trình bày ký tự và trạng thái filled.
- Player state và Station playing-count polling dừng ngay sau khi Store xác nhận `FINAL_STARTED`; Final API vẫn hoạt động độc lập.

### Decision log

- Review concern: banner che score, copy chưa định hướng Team, Final input lặp ký tự và polling tiếp tục sau Final.
- Decision: neo banner theo geometry score, dùng marker thông báo riêng, một input chuỗi và phase làm polling gate.
- Effect: không đổi Backend/API/schema/seed hoặc Station gameplay; thay đổi giới hạn trong Team V2 presentation và runtime polling.

### Verification result

- PASS focused Vitest `22/22`, full Frontend Vitest `83/83`, i18n parity `451`, lint và production build/bundle gate.
- PASS authenticated Chromium: existing Team V2 smoke `6/6` và Final notice/input/polling `5/5`.
- PASS local Playwright WebKit Final notice/input/polling `5/5` tại `390x844`, `844x390`, `1024x768` sau khi guard cleanup khỏi global `MediaStream` không tồn tại.
- Physical iPhone Safari vẫn chưa được xác nhận.
