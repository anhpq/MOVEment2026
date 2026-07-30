# Station Media Gallery Analysis

## Status

| Area | Status |
| --- | --- |
| Business Rules | Confirmed |
| Implementation | Completed |
| Automated Verification | Passed |
| Browser/Manual Verification | Passed in local Chrome headless at representative widths |
| Production Verification | Out of scope |

## Objective and Scope

Add an ordered HTTPS image gallery to each Station, let Admin manage it through
the existing Station create/edit flow, and provide one consistent Player media
action layout across Station List, Map drawer, and Station Detail.

## Business Rule References

- `OPEN_QUESTIONS_AND_DECISIONS.md` section `13.3 Station Media Gallery`.
- Existing Station Game Type and Team Color rules remain authoritative.

## Implemented Behavior

- `Game.mediaUrl` remains dedicated to the YouTube URL for eligible `ST` Stations.
- `StationImage` persists ordered gallery URLs under Station with database
  uniqueness, order-range, index, and cascade constraints.
- Admin create/update validates and replaces `imageUrls` atomically; Player and
  Admin responses expose only the ordered URL array.
- Admin Station Editor provides add/remove/up/down controls for at most 10 URLs.
- A shared Player preview component provides no-referrer gallery navigation,
  zoom, close, disabled-empty behavior, and broken-image fallback.
- `/team/v2` uses a dedicated gallery presentation with the same lazy image API,
  ordering, no-referrer, preview/zoom, disabled-empty, and fallback rules; V1
  keeps the shared Player component.
- Station List/Map use two media buttons above one full-width gameplay action;
  Station Detail uses the same media row above Complete and retains Cancel.
- Enabled Player video actions use a YouTube-red button and filled YouTube icon
  across List, Map drawer, and Detail. Disabled video actions retain the neutral
  style and existing `ST` plus valid-URL gate.

## Target Interfaces and Data

- A normalized `station_images` table owns `url` and `sort_order` under Station.
- Create/update Station accepts optional `imageUrls: string[]` with a maximum of
  10 unique HTTPS URLs.
- Player/Admin Station responses return ordered `imageUrls: string[]`.
- Update omission preserves gallery data; an empty array clears it; a supplied
  array replaces it atomically.
- Backend performs syntax/protocol/length/uniqueness validation only and never
  fetches an external image URL.

## UI Behavior

- Player List/Map: `Watch Video | View Images` above one full-width primary
  gameplay action.
- List/Map active Station action reads `In Progress`, retains the Play icon, and
  opens Station Detail.
- Player Detail: media actions above full-width Complete; Cancel stays separate.
- `View Images` is always rendered and disabled for an empty gallery.
- Admin Team Station `View & Edit` behavior is unchanged.
- Enabled `Watch Video` uses branded YouTube red with white copy/icon and
  dedicated hover/focus/active feedback; disabled video remains neutral.

## Verification Plan and Risks

- Verify create, preserve, replace, reorder, clear, duplicate, invalid protocol,
  URL length, maximum count, ordered response, and transaction rollback cases.
- Verify migration constraints/indexes, seed idempotency, and existing empty
  Station galleries.
- Verify VI/EN copy, List/Map/Detail action layout, cooldown, video gating,
  empty/one/multiple/broken images, and responsive widths.
- External image availability is not controlled by MOVEment2026. Frontend uses a
  fallback and no-referrer policy; server-side proxying is explicitly excluded.

## Verification Results

- Prisma Client generation, local migration deploy, constraint/index inspection,
  two consecutive seed runs, and `db:verify` passed. Existing gallery count is 0.
- Targeted Admin/Player tests passed `63/63`; full Backend Jest passed `153/153`.
- Backend lint/build and Frontend i18n parity (`273` keys), lint, and production
  build passed. The existing non-blocking large-chunk warning remains.
- Authenticated API smoke passed ordered Admin/Player responses, clear/restore,
  and three invalid cases (`http`, duplicate, and 11 URLs).
- Chrome headless visual review passed Station List at 320/375/1280px, Map drawer
  and Detail at 375px, empty/enabled gallery actions, broken-image fallback, and
  Admin Editor at 375px without overflow.
- `graphify update .` rebuilt the code graph to 2355 nodes, 3848 edges, and 208
  communities. It retained the known `hooks.json` zero-node warning; changed docs
  were not semantically re-extracted because no Gemini backend was configured.
- YouTube button visual follow-up passed Frontend lint, Frontend production
  build, `git diff --check`, and Graphify code update (`2359` nodes, `3855`
  edges, `205` communities); post-change browser/manual review remains pending.
  The existing non-blocking Vite large-chunk warning remains.
- Physical-device and Production runtime verification were not performed.
- On 2026-07-30 the V2-owned Detail/gallery integration passed full Frontend
  Vitest (`26/26`), i18n parity (`391`), lint, production build, and bundle gate;
  authenticated responsive browser review remains pending.

## Decision Log

1. UI scope: apply Player layout to Station List, Map drawer, and Station Detail.
2. Image behavior: implement a real managed gallery rather than a placeholder.
3. Storage: Admin supplies HTTPS URLs; no file or object-storage upload flow.
4. Gallery shape: maximum 10 ordered URLs without captions.
5. Visibility: every Station renders the action; enable it when at least one image exists.
6. Viewer: use in-app Ant Design image preview with navigation and zoom.
7. Play style: Team primary, full-width, and retain the Play icon.
8. Active flow: List/Map show `In Progress`; Detail retains Complete for Check-out.
9. Initial inventory: existing canonical Station galleries remain empty for Admin entry.
10. Video visual follow-up: user requested a YouTube-like design; apply branded
    red only to enabled Player video actions while preserving the neutral
    disabled state and all existing eligibility rules.

## Provenance

- User-approved nine-round Plan Mode review on 2026-07-28.
