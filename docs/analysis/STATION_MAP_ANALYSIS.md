# Station Map Analysis

## Status

| Area | Status |
| --- | --- |
| Implementation | Completed |
| Runtime/Production Verification | Pending verification |
| Browser/Manual Verification | Pending verification |

## Objective and Scope

Provide stable Station map markers, persistent Admin position updates, and
responsive WebP map delivery without changing Station coordinates or APIs.

## Current Implementation

- Marker UI derives state from authoritative backend status with a display-status
  fallback and keeps accessible labels/reduced-motion behavior.
- Position updates preserve the existing Admin API contract and numeric `0..100`
  coordinate validation.
- Commit `18c7207a` added 1280/1920/2950 WebP variants, DPR/container selection,
  cached loading, and one-way high-zoom upgrade without image flicker.
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

## Verification and Risks

- Frontend lint/build and static asset checks passed when implemented.
- Remaining: authenticated browser persistence smoke, Network request inspection,
  mobile/desktop framing, and maximum-zoom verification.
- Production runtime asset delivery is not claimed until deployed and observed.

## Decision Log

1. State review: backend status remains authoritative.
2. Visual review: marker design changes stay frontend-only.
3. Accessibility review: preserve labels and reduced motion.
4. Persistence review: keep the existing update API and coordinate validation.
5. Asset review: serve committed WebP variants, not the source PNG.
6. Loading review: cache, retain current image, and only upgrade at high zoom.
7. Consolidation review: retain manual persistence/network checks as pending.

## Provenance

- `.kilo/plans/1784907806750-station-map-node-ui.md`
- `.kilo/plans/1784908400589-station-map-position-update-fix.md`
- `.kilo/plans/system-config-map-webp-optimization.md`

