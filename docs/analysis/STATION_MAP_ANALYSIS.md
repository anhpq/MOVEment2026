# Station Map Analysis

## Status

| Area | Status |
| --- | --- |
| Implementation | Completed |
| Runtime/Production Verification | Local automated build/cache/polling verification completed; Production pending |
| Browser/Manual Verification | Pending verification |

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
  fallback and keeps accessible labels/reduced-motion behavior.
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

