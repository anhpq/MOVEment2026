# MOVEment 2026 - Current Specification

## 2026-08-04 Team V2 overview overlay

- The right footer tab opens an in-map Team overview with authoritative Team
  score/rank/progress and grouped Station rows containing code, name, and points.
- Station actions return to the selected Station on the V2 map; Backend data
  and gameplay authority are unchanged.

## 2026-08-04 Team V2 cyberpunk wing footer

- Footer navigation uses two clipped neon wings with angled center notches,
  technical rails, and a polygon pedestal behind the centered Scan CTA.

## 2026-08-04 Team V2 absolute-centered scanner

- The footer Scan CTA is center-anchored rather than bottom-anchored, and its
  caption is raised for improved spacing.

## 2026-08-04 Team V2 centered footer scanner

- The `96px` Scan CTA is centered over a `72px` side-rail/footer border band,
  protruding equally by `12px` above and below.

## 2026-08-04 Team V2 compact footer baseline

- Team V2 no longer renders a map legend. Its `96px` Scan CTA shares the same
  bottom baseline and design height as the enclosing footer frame.

## 2026-08-03 Team V2 attached marker points

- Each Station points/state pill is part of the pin render group with a fixed
  offset. The footer uses a `104px` center Scan CTA above its enclosing frame.

## 2026-08-03 Team V2 compact navy marker refinement

- Team V2 uses compact `30px` navy-gradient pins (`26..40px`) with a subtle
  circular code outline and `52x18px` points pills.
- The legend is compact, the footer retains only its enclosing frame, and the
  right tab displays the localized authoritative Team name.

## 2026-08-03 Team V2 premium map HUD refinement

- Team V2 uses a full-width `360x112px` footer design with a `112px` central
  Scan action enclosed by the same outer frame as both navigation tabs.
- The localized map legend defaults to a compact button and expands on demand.
  Active marker emphasis is lightning plus three gold rings; Completed stays
  readable and uses a trophy instead of points.
- Gameplay data, map coordinates/interactions, QR, scoring, and Backend
  contracts are unchanged.

## 2026-08-03 Team V2 dense-map readability

- Team V2 uses compact `34px` default markers (`30..46px`), `58x19px` points
  pills, `94%` portrait map coverage, a compact responsive legend, and a
  viewport-wide scaled footer enclosed around both tabs and the QR CTA.
- Station coordinates/state/points and QR/Backend behavior are unchanged.

## 2026-08-03 Team V2 marker legend

- Team V2 includes a localized lower-left legend for Available, In Progress,
  and Completed marker appearance. The legend is explanatory only; real marker
  identity, state, points, and coordinates remain Backend-driven.

## 2026-08-03 Team V2 framed viewport composition

- Team V2 reserves independent top HUD, map, and bottom HUD regions. Brand and
  authoritative total score render above/outside the map. The compact `112px`
  footer uses two symmetric wings and a `92px` central scanner.
- Gameplay data, map coordinates/interactions, QR, and Backend contracts are unchanged.

## 2026-08-03 Team V2 premium map state hierarchy

- Team V2 uses cyan Available markers, a `118%` gold In Progress marker with
  Playing/lightning/ring emphasis, and subdued blue-gray Completed markers with
  a trophy in place of points. Footer hierarchy is Leaderboard, Scan, My team.
- All displayed Station codes, points, progress, and state remain Backend-driven;
  reference-image example IDs are not hard-coded.

## 2026-08-03 Team V2 compact variable-length markers

- Team V2 pins use a compact `44px` default size (`38..58px`) and `68x22px`
  points pill. Typography scales down for longer display codes such as `ST04`.
- Station state, coordinates, scoring, QR, and Backend contracts are unchanged.

## 2026-08-03 Team V2 reference-proportioned markers

- V2 map pins use a large teardrop silhouette, double-outline glow, dark depth
  surface, high-contrast number, and a proportionate rounded lower pill.
- Selected pins use purple plus fading pill echoes; marker data/state is unchanged.

## 2026-08-03 Team V2 total-score clarity and taller pins

- The Team total score is explicitly labelled in its own HUD panel.
- Map pins use a larger, taller teardrop silhouette without an inner circle;
  Station numbers remain centered directly inside the dark pin body.

## 2026-08-03 Team V2 teardrop marker states

- V2 markers use a compact teardrop outline with a dark inner ring and numeric
  identity; selected state uses purple and Locked uses silver-purple.
- Locked markers show a lock symbol in the lower pill instead of points.

## 2026-08-03 Team V2 simplified marker/footer geometry

- Team V2 uses a simple numeric circular pin with a small fully rounded points
  pill, prioritizing readability over decorative marker detail.
- The QR action, caption, and lower footer panels use separate layout bands so
  controls do not overlap at responsive scales.

## 2026-08-03 Team V2 compact map markers

- Each Team V2 map pin shows only its Station display number, with effective
  maximum points in a compact pill below the pin.
- Station names are intentionally reserved for the selected preview and Detail,
  reducing map clutter without changing marker interaction or Station state.

## 2026-08-03 Team V2 selected-Station preview

- Selecting a Team V2 marker preserves the map and opens a compact Station
  preview above the QR/footer area.
- Full Station Detail opens only from the preview's explicit View mission
  action; closing Detail returns to the preview.
- Existing gameplay, QR, scoring, media, and Backend behavior is unchanged.

## 2026-08-03 Team V2 portrait HUD readability

- Team V2 scales its raised QR/footer composition by both width and available
  portrait height and keeps header utility controls in a compact row.
- Map labels stay within the viewport and overlapping labels are suppressed
  with selected and active Stations prioritized; all markers remain tappable.
- Gameplay, QR, scoring, map coordinates, and Backend behavior are unchanged.

## 2026-08-03 Default Team interface trial

- Team login and Team home/fallback navigation now default to `/team/v2`.
- V1 remains available at `/stations` and `/stations/map`, including the V2
  Settings return action.

## 2026-08-03 Completed Station action state

- Completed Stations cannot be started again: Team V1 disables and relabels the
  gameplay button, while Team V2 omits completed gameplay actions.
- Station media actions remain independent of completion status.

## 2026-08-03 Team score confirmation

- Before score submission, Team V1 and V2 show the exact score and Station and
  warn that the Team cannot change the score after confirmation.

## 2026-08-03 Team score entry presentation

- After Check-out, Team score entry asks only for the score. Optional Team
  reason input is not shown or submitted.
- Admin score correction continues to require a non-empty reason.

## 2026-08-03 QR modal Station identity layout

- Check-in and Check-out share a compact horizontal Station identity row with a
  code badge and a safely wrapping Station name.

## 2026-08-03 Check-out QR modal presentation

- Station Detail Check-out follows the same camera-first interaction as
  Check-in: decoded QR values auto-submit and manual entry is a fallback.
- The scan modal shows Station identity and concise instructions; accepted
  Check-out and subsequent scoring continue to follow tracking-mode rules.

## 2026-08-03 Check-in QR modal presentation

- Station List Check-in is camera-first: a decoded QR auto-submits, while
  manual entry is an explicit fallback and appears automatically when camera
  capability/startup fails.
- The modal presents Station identity and concise player guidance without
  exposing Backend implementation terminology.


## 2026-08-02 Shared UI usability baseline

- Initial Leaderboard load failures provide a localized retry action; refresh
  failures retain and identify stale rows.
- Unknown routes return Admin to `/teams`, Team to `/stations`, and anonymous
  users to `/login`.
- Icon-only map controls provide localized accessible names and tooltips.
- Shared mobile UI keeps important controls near a 44px touch target and avoids
  sub-12px text for the optimized Leaderboard/Admin/Team-list metadata paths.


## Authority

Confirmed Business Rules are defined in:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

This file summarizes shared product behavior. It does not override the Source of Truth.

## Feature Analysis Workflow

Implementation plans are stored directly in `docs/analysis` as
`<FEATURE>_ANALYSIS.md` and routed through `FEATURE_INDEX.md`. `.kilo/plans` is
not used. These analysis files record implementation and verification status,
but never override confirmed Business Rules.

Frontend Vietnamese/English localization is tracked in
`FRONTEND_LOCALIZATION_ANALYSIS.md`; Plan 2 is implemented for i18n
infrastructure, Login/QR/AppFrame and Admin System Config copy,
Backend-projected Player Station content, and Admin bilingual Station editing.
Full browser/manual verification remains pending.

Team runtime now uses lean Player catalog/state/image/leaderboard projections,
session-principal-owned data, visible/online non-overlapping 15-second polling,
30-second polling for browser-reported reduced-data/2G conditions, bounded GET
retry, and one post-mutation state reconciliation. Station List consumes Final
availability from Player state rather than polling Final separately. Existing
cross-origin preflight responses are cacheable for 10 minutes. Player APIs
remain available for compatibility. A production-like local smoke
measured the canonical state/catalog at 3,885/5,908 bytes and passed the full
auth, QR, scoring, Final, leaderboard, migration, seed, and environment-guard
flow.

Team Gameplay V2 provides a header fullscreen control using the standard
Fullscreen API with Safari `webkit*` fallback. It requests hidden navigation UI,
tracks enter/exit state, uses dynamic viewport height and safe-area insets, and
recognizes installed standalone mode. Because iPhone Safari does not reliably
offer element fullscreen, unsupported devices receive localized Add to Home
Screen guidance; the page includes the Apple standalone/status-bar metadata
needed for that launch mode.

## Product Scope

MOVEment 2026 is a mobile-first station game web application.

Team users:

- login by username/password or Automatic URL QR Login;
- view Station map and progress;
- scan Station Check-in and Check-out QR;
- enter score when required;
- join Final Challenge;
- view leaderboard.

Admin users:

- manage Event Config;
- manage Teams and Stations;
- open a Team first to view that Team's Station/progress list; Admin has no standalone Stations navigation item;
- never present a selected Team as the Admin's own/current Team;
- configure tracking mode and max score;
- choose Station Game Type from `ST` or `STANDARD`;
- manage QR lifecycle;
- correct scores and operational state;
- view audit/activity data;
- export reports.

## Actors

### Admin

Authenticated by username/password with role:

```text
ADMIN
```

### Team

Uses a separate Team model and Team session.

There is no Staff account or Staff role.

The person supervising a Station may enter score on the device currently logged into the Team account after a valid Check-out. No scoring confirmation code is required.

## Authentication and Session

Admin login:

```text
POST /api/auth/login
```

Team password login uses the current Team login endpoint.

Automatic URL QR Login:

```text
{FRONTEND_PUBLIC_URL}/qr-login?token={RAW_TEAM_QR_TOKEN}
```

Rules:

- one active session per Team;
- new Team login revokes the previous Team session;
- QR Login and password login share the same session policy;
- every Admin and Team session expires at the next daily `22:00 Asia/Ho_Chi_Minh` cutoff;
- a login exactly at or after `22:00` expires at `22:00` the next day;
- backend signs the JWT and returns `expiresAt` for that same cutoff; frontend persists that value without calculating a separate TTL and clears local auth state when the cutoff is reached;
- session activity and `lastSeenAt` do not extend the absolute cutoff;
- backend enforces session validity;
- frontend clears local authentication for HTTP `401 Unauthorized`; HTTP `403
  Forbidden` represents an authorization denial and does not invalidate an
  otherwise active session;
- Team QR token and Team session are separate objects.
- Team user header identifies the current Team by name in the logout button instead of the generic `User` label. The Team logout button remains visible in every environment until a separate release task hides it. Admin header logout remains unchanged.

## Team QR Login

Each active Team has one active reusable controlled QR Login token.

Token must be random, opaque, unique, revocable, rotatable, and non-expiring by
time. New and active Team QR Login API responses use `expiresAt: null`.

Successful login does not permanently consume the token.

Creating a Team automatically provisions its token.

Local/test seed repairs a missing token without rotating an existing valid token.

Predictable tokens such as `MV26-TEAM-01-LOGIN` are Legacy only.

## Station QR

Each active Station has exactly:

```text
1 CHECK_IN token
1 CHECK_OUT token
```

Official format:

```text
MV26-SQ1-I-<randomToken>
MV26-SQ1-O-<randomToken>
```

Rules:

- tokens are generated independently;
- tokens do not expose Station ID or code;
- database record determines Station and purpose;
- visible `I` or `O` is not authoritative;
- creating a Station automatically provisions both tokens;
- the transaction rolls back if the complete pair cannot be created;
- each token supports independent revoke and rotate.

Legacy predictable Station QR is not the official format for new data.

## Station State

Official states:

```text
LOCKED
AVAILABLE
CHECKED_IN
PLAYING
COMPLETED
```

Do not add official statuses:

```text
WAITING_SCORE
CANCELLED
REOPENED
```

Waiting for score is derived from Check-out and completion fields.

Admin score correction is an audited override. It changes only the progress
score and the Team total by the corresponding delta, preserves progress status
and all timestamps, and always requires a non-empty reason. It is allowed only
after the progress is already `COMPLETED`.

Every active Station begins as `AVAILABLE` for every Team.

Stations are not unlocked in a fixed sequence.

A Team may play only one Station at a time.

Cancel returns the Team Station to `AVAILABLE` and applies the configured cooldown, default 5 minutes.
Player Station list and map UI must surface this cooldown from `nextCheckInAllowedAt` as a countdown and prevent opening the Check-in QR modal until the deadline passes. Backend remains the authority if the client clock is wrong.

## Station Localization

Vietnamese is canonical/default for Station `name` and `description`. Station
records also store `name_en` and nullable `description_en`.

Player Station APIs accept `lang=vi|en`. They keep the public shape
`name`/`description`, but Backend projects those values by locale. Missing or
invalid locale uses Vietnamese. Missing English content falls back per field to
the Vietnamese value.

Admin Station data includes `name`, `description`, `nameEn`, and
`descriptionEn`. Admin create requires non-empty `name` and `nameEn`; update
trims and validates only supplied fields.

Admin System Config selects `nameEn`/`descriptionEn` for English display and
falls back per field to canonical `name`/`description`; Vietnamese display uses
the canonical fields. The locale switch does not refetch Admin data because the
progress matrix already contains all four fields.

Admin System Config obtains Team and Station QR badge metadata from one
`GET /api/admin/qr-status-summary` response. This summary contains entity IDs,
status, and Station active count only; it never contains raw tokens or hashes.
The detailed Team/Station token endpoints remain the source for an explicit QR
preview action only. The progress matrix projects only fields consumed by the
Admin client and excludes a changing server timestamp so unchanged matrix and
summary responses can revalidate to a bodyless `304`.

Excel export, backend operational consumers, Station IDs, enum/API values,
`Game.title`, and `clueText` remain outside this localization scope.

Team display names are localized only in the Frontend display layer for raw
seed-style names `Team NN` or `Đội NN`: Vietnamese shows `Đội NN`, English shows
`Team NN`, and custom Team names remain unchanged. Database, API, seed, Team ID,
username, QR payload, and token values are not changed.

Frontend Station UI sorts status-bearing Station lists by `In Progress`, `New`,
`Finished`, then natural ascending `stationId`. Station collections without
status sort by Station ID. Map marker coordinates are not changed by sorting.

Final navigation can remain the compact label `Final`; the full screen heading
is `Thử thách cuối cùng` in Vietnamese and `Final Challenge` in English. Final
UI uses a flag icon for navigation/heading and keeps trophy success iconography.

## Tracking Modes

Each Station has:

```text
SCORE
TIME
BOTH
```

| Mode | Duration | Score |
| --- | --- | --- |
| `SCORE` | Stores accepted Check-out QR scan time but does not contribute play duration. | Required after Check-out. |
| `TIME` | Real Check-in to accepted Check-out QR scan duration. | Backend completes with score 10; no score modal. |
| `BOTH` | Real Check-in to accepted Check-out QR scan duration. | Required after Check-out. |

## Check-in

Backend validates:

- authenticated Team;
- active Team session;
- QR token;
- token active/revoked/expired;
- Station active;
- Event time;
- Team cooldown;
- Team does not have another active Station.

## Check-out

Backend resolves purpose from the Station QR token record.

For `TIME`, Check-out completes the progress with score 10.

For `SCORE` and `BOTH`, Check-out leaves the progress awaiting score and the frontend opens the score-entry modal.

## Scoring

Default Station max score:

```text
30
```

Each Station may configure a different max.

Score rules:

- integer;
- minimum 0;
- maximum effective Station max score; `TIME` effective max is 10 even when stored `game.maxPoints` differs;
- backend authoritative;
- no scoring confirmation code is required or stored;
- duplicate request does not duplicate completion or score;
- Admin correction is a separate audited flow.

## Station Game Type

Station Game Type is restricted to:

```text
ST
STANDARD
```

- `ST` requires a valid HTTPS YouTube URL and is the only type that enables `Watch Video`.
- `STANDARD` is the default type for an ordinary Station and never enables video, even when a media URL remains stored; the Team/User Station list retains a disabled `Watch Video` action to keep card layouts consistent.
- Enabled Player `Watch Video` actions use a branded YouTube-red treatment with
  a filled YouTube icon across Station List, Map drawer, and Station Detail;
  disabled actions retain the explicit neutral style.
- Admin Team Station lists do not expose video actions; each Admin card provides only `View & Edit`.
- The canonical active Station inventory has exactly 17 Stations, 17 active Games, Team `maxPossiblePoints = 300`, 4 `ST` Games, and 13 `STANDARD` Games. The sum of current per-Station `games.max_points` is Station configuration data and is not a hard validation for Team `maxPossiblePoints`.
- Station technical IDs remain `ST001`...`ST017` for database, API, routes, React keys, select values, and QR mapping. Station list and map UI display the shorter code `01`...`17` for the canonical inventory and support `ST018` as `18` if it appears later; other noncanonical IDs remain unchanged when displayed.
- The current designated `ST` Stations are `ST001` Thủy Lộ Ký Ức, `ST002` Ngự Ảnh Tái Hiện, `ST003` Vạn Vật Ghi Tâm, and `ST004` Thiên Địa Chao Đảo; all other Stations are `STANDARD` even if they retain a stored media URL.
- Admin selects the type from a fixed combobox; Backend and database reject unsupported values.
- Legacy `CIPHER` Games migrate to `STANDARD`. Station cipher-answer UI, API, validation, and storage are removed.
- Final Challenge remains independent from Station Game Type and is unchanged.

## Station Media Gallery

- Gallery belongs to a Station and is independent from `ST`/`STANDARD` Game Type.
- Each Station stores at most 10 ordered, unique HTTPS image URLs without captions.
- Backend validates and stores URLs but never fetches external images server-side.
- Admin Station create/edit manages `imageUrls`; create omission produces an empty gallery, update omission preserves, and an empty array clears.
- Player and Admin Station responses expose ordered `imageUrls: string[]` without persistence IDs.
- Player Station List, Map drawer, and Detail always render `View Images`; it is disabled when the gallery is empty.
- List/Map media actions share the first row and the current gameplay action spans the row below. `In Progress` replaces `Play` for an active Station and still opens Station Detail.
- Station Detail keeps `Complete` for Check-out and keeps Cancel as a separate action.
- Existing canonical Stations remain empty until Admin supplies image URLs; migration and seed do not backfill guessed content.

## Event Config

Event start time, Event end time, and Final start time are managed by Admin Event Config.

Do not hard-code fixed values such as `11:30` or `11:45`.

After Event end:

- Team cannot start a new Station;
- Team that checked in before Event end may finish its current Station.

Final becomes available according to `finalStartsAt` in Admin Event Config.

Team with an active Station must finish it before Final.

## Final Challenge

Keyword:

```text
DISANVANHOA2026
```

Frontend and backend trim and uppercase input.

Backend stores the normalized Final keyword directly in the compatibility column `answerHash` and compares normalized submitted text directly against that stored value. Public APIs and logs must not expose the configured answer.

Team may retry until correct or Final closes.

Wrong-answer cooldown increases from 1 second up to 10 seconds and is enforced by backend.

Rank is assigned by database-confirmed first correct submission.

Bonus:

```text
Rank 1 = 10
...
Rank 10 = 1
Rank 11+ = 0
```

One Team receives at most one rank and one bonus.

## Leaderboard

Leaderboard ranks all non-deleted Teams and uses the same centralized comparator as Team Results Excel:

1. `Total Score` descending from `team.totalPoints`.
2. `Total Play Time` ascending from `team.totalPlaySeconds`.
3. `Total Stations Completed` descending.
4. `Final Submitted At` ascending, nulls last.
5. `Team Code` ascending, currently numeric `Team.id`.

Backend is authoritative.

The shared Leaderboard screen is available to both roles. Admin sessions read
the public `GET /api/leaderboard` projection, while Team sessions use the lean
authenticated `GET /api/player/leaderboard` projection.

Player Station list, Station map drawer, and Station detail show live Playing
Teams counts from `GET /api/player/stations/playing-counts`. The endpoint
returns only `stationId` and `playingTeamCount`, and the frontend polls it only
while the tab is visible. Playing-count and Player leaderboard GET responses use
private cache revalidation so an unchanged poll may return `304` without a
response body.

## Team Results Excel Export

Admin can export a new one-worksheet Team Results `.xlsx` file with exactly one row per non-deleted Team.

Base columns are `Team Code`, `Team Name`, `Captain Name`, `Username`, `Total Stations Completed`, `Total Play Time`, `Total Score`, `Computed Score`, `Rank`, `Final Submitted At`, `Final Rank`, and `Final Bonus Score`.

`Team Code` is `Team.id`; the export omits duplicate `Team ID`, `Team Color`, `Team Status`, `Total Stations`, and `Final Challenge Status` columns.

Station columns include active Stations only. Each active Station group has only `Check-in`, `Check-out`, and `Score`, using `Station.name` with deterministic suffixes for duplicate names. Every Station header appends its tracking mode as `[Score only]`, `[Time only]`, or `[Both time and score]` so actual Check-in/Check-out timestamps remain unambiguous without adding a per-Station `Duration` column.

`Total Score` and Rank use `team.totalPoints`. `Computed Score` is reconciliation only: active completed Station scores plus correct Final bonus. `Total Play Time` uses `team.totalPlaySeconds` for tie-break visibility and is not recomputed by export.

Incomplete Station attempts are ignored in totals and export blank Check-in/Check-out with score `0`. Wrong-only Final attempts export blank submitted/rank and bonus `0`.

## Team Color UI

Team Color reuses `Team.color`. API responses expose canonical `teamColor` and temporary compatibility alias `color`.

Admin create/update accepts only `#RRGGBB` or `null`; `null` clears color, missing update field leaves it unchanged, and conflicting `teamColor`/`color` aliases return `400`.

Team-facing UI and single-Team Admin contexts use scoped CSS variables from the active/viewed Team Color with fallback `#FF765C`. Enabled primary buttons in Team context use Team gradients with white `#FFFFFF` text/icons; disabled, danger, default, QR info modal, and non-button semantics remain unchanged. `/teams` remains a multi-Team Admin list with default shell/header/nav while each Team card uses its own scoped color. Admin map route/action behavior is unchanged.

## Map Assets

The runtime Station map uses WebP variants at 1280, 1920, and 2950 pixels wide.
The original PNG source asset is kept outside `public` under `fe/source-assets`.
Frontend selection is based on rendered width and device pixel ratio, keeps the
current image while an upgrade loads, and only upgrades to the full-width image
for high zoom rather than downgrading on resize. When the browser reports Data
Saver, `2g`, or `slow-2g`, selection is capped at the 1920-pixel variant even at
high zoom.

The Konva Stage is limited to the visible viewport while the existing logical
map coordinate space remains unchanged. The static map image is isolated in a
non-listening background Layer; markers render in a separate interactive Layer.
Only the active Station animates, with animation paused during map dragging and
when the device requests reduced motion. Map-drawer live counts and cooldown
clock updates run only while the drawer is open.

## Team Gameplay V2

Team users can open the parallel fullscreen gameplay screen at:

```text
/team/v2
```

The default login redirect remains unchanged and still opens the existing Team
UI. The existing Station map exposes an explicit V2 entry button, and V2 can
return to `/stations/map`.

V2 reuses the existing Suoi Tien WebP map assets, Station coordinates, Team
Station state, language persistence, shared QR decode helpers, leaderboard API,
and Team score submission API. Its `TeamV2QrScanner` is route-specific so API
rejection can keep camera preview active without changing V1/Login scanner
behavior. Settings, V2-owned Station Detail, and the V2 leaderboard use a
device-local opacity setting stored in:

```text
movement-team-v2-panel-opacity
```

The V2 center QR CTA is an inline SVG/CSS badge with a static conic ring from
pink `#FF3FD8` through purple `#B06BFF` to cyan `#2FE4F0`, a dark core, and a
light QR glyph. It renders at 74px by default and 64px at viewport widths up to
380px. Its palette and V2 primary controls override inherited Team Color rules
locally.

Opening the V2 scanner auto-starts the camera. Backend/API rejection keeps the
healthy stream active, exposes safe localized feedback and manual input, and
blocks the rejected token until a different token appears or the frame remains
empty for at least 600ms. Success, close, and unmount stop all tracks and decode
callbacks.

Opacity applies only to overlay backdrop and panel backgrounds. Text, icons,
buttons, controls, and media remain fully opaque. The supported range is
50-100, with default 95.

The main V2 screen follows the supplied black/cyan fantasy HUD reference with
exact invariant brand copy `MOVEment 2026` in a centered clipped tab, Fullscreen
and Settings at the upper right, no Team identity block on the map HUD, a tall angular brand
plate with symmetric striped cyan rails, and a bright green multi-layer neon
total score centered below the brand in every responsive mode, plus
three independent sci-fi footer controls: Leaderboard left, a raised
floating QR/pedestal center, and Team plus completed Station count right. Thin
cyan rails may connect visually to the QR pedestal but must not create one
continuous pill panel. Settings, Leaderboard, QR scanner, and score entry are blocking,
centered near-fullscreen modal layers in both orientations. V2 Station Detail
is also a near-fullscreen overlay and must not be rendered as a small corner panel.

V2 owns a fixed route-local palette: cyan/active `#2FE4F0`, cyan-soft
`#7DF3F9`, score `#4DFF8A`, selected `#FF3FD8`, QR secondary
`#B06BFF`, Leaderboard gold `#FFC94D`, ink `#030C14`, text `#EAFCFF`, muted
text `#9FD4D9`, and panel `rgba(3,14,20,0.82)`. It must not
inherit or derive its HUD, marker, overlay, or primary-control colors from
`Team.color`, `--team-*`, body Team theme, or global Ant Design theme. Other
Team-facing routes continue to use Team Color normally. Completed and Locked
markers are the state-specific exception: their complete visual groups use the
fixed silver `#C3CED8` to neon-purple `#B05CFF` gradient.

V2 uses unified Station QR action:

```http
POST /api/player/qr-action
```

The backend resolves Station and `QrPurpose` from the stored QR token record,
then runs the same domain behavior as the existing check-in/check-out endpoints.
`TIME` checkout completes immediately. `SCORE` and `BOTH` checkout return
`requiresScore: true`, after which score entry still uses the Team session on
the same device.

Marker/label selection opens a V2-owned Station Detail overlay without changing
the `/team/v2` URL. It uses state-aware Start/Complete/Cancel actions, the V2
scanner and score overlay, shared authoritative Player data/mutations, and a
V2-owned lazy gallery presentation. It never routes through
`/stations/:stationId` and does not use `?from=team-v2`.

Check-in, completion, and cancel success close Detail back to the preserved map.
While a Station is active, the center QR caption shows localized `In Progress`
plus Station code/name; camera startup remains user-triggered.

V2 labels derive from each marker's single screen anchor after the map transform.
They remain above their own marker with clamped label scale and marker gap, may
overlap other labels, and render below the marker layer. They must not use
independent viewport/grid coordinates or alter persisted Station coordinates.
Each label keeps Station code/name on one ellipsized line and the points value
on a dedicated second line.
Team V2 keeps Completed and Locked marker groups visible and tappable. Completed
uses a check with `40%` opacity, rising to `70%` while selected. Locked uses a
lower-right lock badge and remains fully opaque. Marker, label, and connector
share the same state opacity and silver-purple palette. Station Detail keeps
both YouTube and image-gallery
controls visible; unavailable media renders as a readable disabled
silver-neon control instead of disappearing.
Team V2 Station Detail uses centered intrinsic content height, capped by the
available viewport with overflow scrolling. The footer uses `BXH`/`RANK` for
its compact Leaderboard control, a `222px` center QR button (three times the
prior baseline), and responsive font compensation that keeps the displayed QR
caption, Leaderboard, and Team/Station labels at least `12px`.
Team V2 Settings follows the same centered intrinsic-height behavior with
viewport-capped scrolling. Its Leaderboard overlay displays the first five
authoritative API rows; when the current Team is outside those rows, it is
appended as a sixth row with V2 display rank `6`. The projection must not mutate
the API response or alter Backend ranking, sorting, or scoring.
Within Team V2 Settings, the unselected language choice uses a visibly darker,
desaturated treatment than the active cyan choice. This contrast override is
route-local and must not alter shared `LanguageSwitch` styling elsewhere.
All Team V2 overlays default to `95%` opacity for backdrop/panel backgrounds.
The opacity preference must be represented as a background CSS variable rather
than parent `opacity`, so overlay text, icons, buttons, inputs, and media remain
fully opaque. The Settings slider may persist later user choices.
The marker uses the route-local `640×620` Konva Bézier reference with curved
outer/inner pin paths, a radius-148 outer ring, black/white core, and a seamless
180-segment green/mint/purple circular neon ring. Its inner group has one
uniform scale and offsets tip `(320,606)` to the Station screen anchor. Its
visual size scales once from `32px` to `64px`
with normalized zoom; no number renders inside the pin, while Station code
remains in the anchored label. The state-colored halo remains a canvas overlay,
and the label connector starts at the pin's upper attachment edge.
To keep Team V2 pan/zoom responsive with dense markers, unchanged marker
artwork is cached locally after its exact 180-segment render, map transform
events are coalesced to at most one React commit per animation frame, and the
marker Layer skips offscreen groups using the same layout visibility flag as
labels/connectors. Cache and scheduling must not change coordinates, marker
state, hit targets, anchoring, or visual geometry.

## QR Camera

Station Check-in and Check-out camera decodes auto-submit the decoded QR token immediately. Manual paste/type remains available and requires the user to press Submit.

Camera availability depends on:

```text
navigator.mediaDevices.getUserMedia
```

Requirements:

- HTTPS or localhost Secure Context;
- prefer native `BarcodeDetector`;
- fallback to `jsQR`;
- `autoPlay`, `muted`, `playsInline`;
- explicit scanner lifecycle and cleanup;
- manual paste/token entry always available;
- safe Vietnamese errors;
- duplicate decode protection.

Real iPhone Safari and Chrome iOS verification remains required until recorded as passed.

## Seed

Local/test seed must be idempotent and environment-safe.

It may generate example values freely when not fixed by a Business Rule.

It must provision:

- Admin test account;
- Team test accounts;
- Team QR tokens;
- Stations;
- Station QR pairs;
- Event Config;
- Final keyword/config.

Production seed must not print raw secrets or create local test credentials automatically.

`npm run reset:gameplay` is dry-run by default. `--execute` requires
`RESET_GAMEPLAY_CONFIRM="RESET MOVEMENT2026 GAMEPLAY"` for all targets and
`RESET_GAMEPLAY_BACKUP_CONFIRMED="BACKUP_CONFIRMED"` for Production-like
targets.

Temporary Production Final Challenge seed override remains enabled through `2026-08-21 23:59:59 Asia/Ho_Chi_Minh`: each seed run overwrites only seed-managed Final Challenge fields with canonical values. Starting `2026-08-22 00:00:00 Asia/Ho_Chi_Minh`, Production seed preserves an existing Final Challenge record and only creates it if missing.

## Audit and Logging

Meaningful actions should create appropriate activity/audit records:

- Team login/session replacement;
- QR generation, rotate, revoke;
- Station Check-in/Check-out;
- score submit and Admin correction;
- Final submission and rank;
- Admin operational override.

Do not log raw QR tokens, passwords, JWTs, or refresh tokens.

## Current Known Implementation Gaps

Historical audit indicates that current or recent implementation may still contain:

- predictable Legacy Team QR tokens;
- predictable Station QR containing Station code;
- smoke scripts and fixtures using Legacy payloads;
- production CORS verification not completed;
- real iPhone HTTPS camera verification pending.

Documentation synchronization does not close these implementation gaps.
