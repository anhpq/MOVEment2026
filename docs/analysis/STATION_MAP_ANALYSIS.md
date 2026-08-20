# Station Map Analysis

## Status

| Area | Status |
| --- | --- |
| Implementation | Completed |
| Runtime/Production Verification | Local automated build/cache/polling verification completed; Production pending |
| Browser/Manual Verification | Authenticated local Chrome geometry/wheel smoke completed; physical touch/pinch pending |

## 2026-08-20 Wheel-to-pan and viewport rebase follow-up

- Mouse pan snapshots `liveMapTransformRef` so a drag started before the wheel
  debounce commit cannot restore stale React scale/position.
- Viewport changes cancel a queued transform frame and rebase the live world
  center plus zoom ratio into the new viewport. Zoom clamps, focal-point math,
  reset behavior, coordinates, marker layers and image selection remain intact.
- Unit coverage verifies world-center/zoom-ratio preservation. Authenticated
  Chrome 151 production-preview smoke verified immediate wheel-to-pan retains
  zoom (`0.5` to `0.6356`) and movement, while portrait rebase drift remained
  below `0.07` world unit.
- Header/Footer selectors and geometry were not changed in this follow-up.
  Physical touch/pinch remains pending.

## 2026-08-20 Team V2 layout regression follow-up

- Total Score được đặt lại vào named area của Header grid, tránh implicit page
  track từng đẩy score sang phải và làm sai geometry Header/map/Footer.
- Middle Konva row tiếp tục nằm hoàn toàn giữa Header và Footer. Footer reserve
  dùng HUD height thực tế, không scale theo viewport width.
- Điểm tập trung luôn được đưa vào marker layout khi Team V2 map đang render,
  không còn bị gate theo Final phase; animation chỉ active trong `NOTICE` và
  `STATIONS_CLOSED`. Tọa độ, visual và hit behavior không đổi.
- Stage transform chỉ có một imperative owner trong gesture; React state là
  final committed transform. Pinch tính scale/pan từ snapshot đầu gesture để
  loại transform drift và jump.
- Konva performance architecture từ refactor trước được giữ nguyên.
- Authenticated Chrome production-preview smoke tại desktop, portrait và short
  landscape đo score center delta `0px`, cả hai overlap `0px`, wheel zoom in/out
  giữ focal drift dưới `0.13` world unit và không có browser error. Physical
  touch/pinch vẫn pending; CDP synthetic pinch không tạo transform.

## 2026-08-20 Team V2 Konva performance refactor

- Scope is `/team/v2` only; shared V1 `StationsMapPanel` rendering and behavior
  are unchanged.
- V2 separates background, cached static marker visuals, animated marker visuals
  and interaction hit areas. Only hit circles listen for events.
- Pan/pinch/wheel update Konva directly, with one final React transform commit.
  Animated markers share one visibility-aware Konva loop instead of owning one
  `requestAnimationFrame` loop each.
- Responsive grid rows reserve Header and Footer outside the Konva middle row.
  Authenticated Chrome smoke verified positive gaps in desktop, portrait and
  short landscape; baseline `HEAD` showed both Header and Footer overlap.
- Automated and headless browser verification passed. Physical-device touch and
  a live active-marker animation remain pending.

## 2026-08-20 Station reference display

- V1 and Team V2 markers use `Game.maxPoints` only as reference/display data.
- `ST007` keeps a nullable reference and renders exactly `???` on marker, list and detail surfaces; the UI must not apply the noncanonical default `30` to this explicit null.
- Score-entry validation is separate and consumes Backend `scoreEntryMax = 105`.

## 2026-08-01 Completed and Locked marker appearance

- Completed and Locked markers remain visible and tappable on the Station map.
  Both use the shared silver `#C3CED8` to neon-purple `#B05CFF` gradient;
  Completed retains its check and Locked retains a lower-right lock badge.
- Backend status is authoritative. Display status `Finished` is used only when
  `backendStatus` is absent. Locked appearance takes precedence over all other
  presentation states.
- Completed markers render at `40%` opacity and rise to `70%` while their detail
  drawer is open. Locked markers remain at `100%`, including while selected.
  Team and Admin/editable maps use the same presentation.
- Focused marker Vitest passed (`10/10`), full Frontend Vitest passed (`44/44`),
  and i18n parity, Frontend lint, production build, and bundle gate passed.
  Authenticated browser and physical-device visual verification remain pending.

### Review Decision Log

1. Symbols: Completed uses a check; Locked uses a lock badge.
2. Locked opacity: keep `100%`; only Completed is dimmed.
3. Selected priority: Locked remains authoritative silver-purple.
4. Lock placement: lower-right badge so the Station code remains readable.
5. Interaction: both states remain tappable; gameplay guards remain unchanged.
6. Palette scope: apply the gradient to the complete visual marker group.
7. Palette token: use neon purple `#B05CFF` with silver `#C3CED8`.

## 2026-07-29 Runtime Stability Integration

- Team map data now comes from the lean catalog/state split; image URLs and map
  image variants load lazily and rejected map image requests are evicted/retried.
- Playing counts and state polling run only while their consumers are visible
  and online, never overlap, and preserve last-known marker data on transient
  failure.
- Automated polling/cache tests and the production bundle gate pass; physical
  responsive map verification remains pending.

## Objective and Scope

Provide stable Station map markers, persistent Admin position updates, and
responsive WebP map delivery without changing Station coordinates or APIs.

## Current Implementation

- Marker UI derives state from authoritative backend status with a display-status
  fallback only when backend status is absent, and keeps accessible labels/
  reduced-motion behavior.
- The Konva Stage matches the visible viewport instead of allocating the full
  off-screen map width; the existing logical `2.5:1` map space still owns image
  and marker coordinates so persisted positions and transforms remain unchanged.
- The static map image uses a non-listening background Layer, while interactive
  markers use a separate Layer. Only the active Station animates, and marker
  animation pauses during drag or when `prefers-reduced-motion` is enabled.
- Position updates preserve the existing Admin API contract and numeric `0..100`
  coordinate validation.
- Commit `18c7207a` added 1280/1920/2950 WebP variants, DPR/container selection,
  cached loading, and one-way high-zoom upgrade without image flicker.
- Normal-zoom WebP selection now uses the visible viewport width rather than the
  wider logical map space, avoiding premature 2950-pixel loads on portrait and
  high-DPR devices.
- The original 2950x1440 PNG is outside `public` as a source asset.

## Decisions and Stale Assumptions

- Do not add backend statuses for marker presentation.
- Do not alter map coordinates, marker transform, Station API, schema, or seed.
- Do not reload/downgrade the current image on resize.
- Old references to the large served PNG are superseded.

## Interfaces and Data

- Existing Station map position update endpoint remains unchanged.
- `TeamStation.backendStatus` remains authoritative for map state.
- Static WebP variants are selected only by rendered width, DPR, and high zoom.
- Playing-count polling and the one-second cooldown clock run on the map only
  while the Station detail drawer is open.

## Verification and Risks

- Frontend lint and production build passed after the viewport/Layer/animation
  performance patch on 2026-07-28. The existing non-blocking Vite large-chunk
  warning remains.
- Remaining: authenticated browser persistence smoke, Network request inspection,
  mobile/desktop framing, maximum-zoom verification, and physical-device FPS/
  frame-time profiling during pan and zoom.
- Production runtime asset delivery is not claimed until deployed and observed.

## Decision Log

1. State review: backend status remains authoritative.
2. Visual review: marker design changes stay frontend-only.
3. Accessibility review: preserve labels and reduced motion.
4. Persistence review: keep the existing update API and coordinate validation.
5. Asset review: serve committed WebP variants, not the source PNG.
6. Loading review: cache, retain current image, and only upgrade at high zoom.
7. Consolidation review: retain manual persistence/network checks as pending.
8. Performance review: preserve WebP quality and logical coordinates; first
   reduce canvas area, background redraws, and unnecessary marker animation.

## Provenance

- `.kilo/plans/1784907806750-station-map-node-ui.md`
- `.kilo/plans/1784908400589-station-map-position-update-fix.md`
- `.kilo/plans/system-config-map-webp-optimization.md`

