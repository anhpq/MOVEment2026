# Frontend Localization Analysis

## 2026-08-03 Team V2 Station preview copy

- Added synchronized VI/EN accessible copy for the compact Station preview,
  View mission action, and preview close control.
- i18n parity passed with `420` keys.

## 2026-08-02 Shared accessibility copy follow-up

- Localized authorization-denied title, description, and role-specific return
  actions in `ProtectedRoute`.
- Localized primary-navigation/application-branding accessible names and map
  reset/zoom labels.
- Added localized Leaderboard initial-load failure copy with retry behavior.
- Frontend i18n parity passes with `409` keys.


## Status

| Area | Status |
| --- | --- |
| Implementation | Completed for i18n infrastructure, language switch, Player Station Backend localization, Admin bilingual Station editor, core Login/QR/AppFrame copy, Station list/detail/map, Team list, Leaderboard, Final, Admin Operations, and Admin System Config copy |
| Runtime/Production Verification | Blocked: 2026-07-28 read-only smoke found stale/broken Production JS asset reference |
| Browser/Manual Verification | Pending desktop/mobile smoke |

## 2026-08-02 Team V2 fullscreen copy

- Added VI/EN labels for entering and exiting fullscreen, API failure, and the
  iPhone Safari Add to Home Screen fallback. The icon buttons expose the same
  localized text through `aria-label` and `title`.
- i18n parity passed with `399` keys. Full Frontend Vitest, lint, production
  build, and bundle gate passed; physical Safari/iOS copy verification remains
  pending.

## 2026-07-29 Runtime Stability Integration

- Lean Player catalog requests remain language-aware and reload only when the
  language or backend catalog version changes; legacy endpoints remain the
  compatibility fallback for `404/405` only.
- Team/Login surfaces map network, timeout, auth, rate-limit, and service errors
  to safe VI/EN copy without rendering raw Backend text.
- Frontend i18n parity passed with `388` keys and production-like local smoke
  passed. The previously recorded Production asset issue and manual
  desktop/mobile verification remain outside this local completion.

## Objective and Scope

Deliver a Vietnamese/English runtime language switch for Team and Admin UI.
Vietnamese is the default and canonical language. The choice persists under
`movement-language`, updates `<html lang>`, and synchronizes Ant Design locale.

Plan 2 expands the original frontend-only localization into Database, Backend,
Admin CRUD, Player Station APIs, and canonical Station seed translation data.

## Business Rule References

- `OPEN_QUESTIONS_AND_DECISIONS.md`: Station Localization and seed behavior.
- `PROJECT_ANALYSIS_SPEC.md`: shared Player/Admin Station behavior.
- `GAMEPLAY_RESET_AND_STATION_SEED_ANALYSIS.md`: canonical Station seed/sync.

## Current Implementation

- Frontend uses `i18next` and `react-i18next`.
- Valid languages are `vi` and `en`; invalid stored values fallback to `vi`.
- Login, QR Login, AppFrame navigation/account chrome, Ant Design locale, and
  Admin Station Editor use localized strings.
- Player bootstrap calls `GET /api/player/stations?lang=vi|en` and
  `GET /api/player/progress?lang=vi|en`.
- Runtime language change updates static UI immediately and refetches Player
  Station data. The latest request wins; stale responses are ignored.
- If Player Station refetch fails after a language switch, the new locale is
  kept, old Station data is preserved, and a localized warning is shown.
- Admin store keeps `name`, `description`, `nameEn`, and `descriptionEn`.
- Admin System Config derives Station card, QR modal, and accessibility display
  text from `nameEn`/`descriptionEn` in English with per-field VI fallback. It
  switches locally without another Backend request because the Admin progress
  matrix already includes all four fields.
- Station Editor always displays separate VI and EN inputs.
- Language switch renders circular VI/EN flag buttons with no external image
  asset dependency.
- Station list/detail/map status labels and visible controls use localized copy.
- Admin System Config tabs, actions, tracking modes, QR status/preview copy,
  confirmations, toasts, Team summaries, fallback errors, and icon-button ARIA
  labels use localized resources. Seed-style Team names localize in display;
  canonical Admin Station content and preserved identifiers remain unchanged.
- Station gallery actions, preview alt text, Admin URL controls, validation copy,
  and reorder/remove ARIA labels are localized in both VI and EN.
- V2-owned Station Detail, state-aware scan/close/timer copy, active QR Station
  context, and gallery presentation use the same runtime VI/EN resources.
- Station UI ordering uses status order `In Progress`, `New`, `Finished`, then
  natural ascending `stationId`; Station dropdowns without status sort by ID.
- Team display names localize seed-style raw names only: `Team NN`/`Đội NN`
  display as `Đội NN` in VI and `Team NN` in EN. Custom names remain unchanged.
- Final navigation stays compact as `Final`; the screen heading is localized as
  `Thử thách cuối cùng` / `Final Challenge`, and Final navigation/heading uses a
  flag icon while the success trophy remains unchanged.
- Frontend user-facing fallback errors are localized on the updated Station,
  Final, Map, and Operations paths instead of rendering raw Backend messages.
- Shared AppFrame header uses a floating white card layout inspired by the
  approved mockup while preserving the existing `RunningPersonIcon` brand logo.

## Interfaces and Data

- Internal type: `SupportedLanguage = "vi" | "en"`.
- Persistence key: `movement-language`.
- Player API: `GET /api/player/stations?lang=vi|en` and
  `GET /api/player/progress?lang=vi|en`.
- Player Station response shape remains `name`/`description`; Backend projects
  those values by locale and does not expose raw `nameEn`/`descriptionEn`.
- Admin Station responses/progress matrix include four Station content fields.
- Admin create requires `name` and `nameEn`; descriptions are optional.
- Admin update trims and validates only fields present in the request.
- Player/Admin Station responses include locale-independent ordered
  `imageUrls: string[]`; only gallery labels and accessibility copy are translated.

## Boundaries

- `Station.name` and `Station.description` remain Vietnamese canonical/default.
- Excel export and Backend operational consumers continue to use Vietnamese
  Station names; localized Admin Frontend display may select the EN fields.
- Station IDs, Team IDs, usernames, tokens, enum/API values, `Game.title`, and
  `clueText` are not translated in this scope.
- Team name localization is display-layer only for seed-style names; database,
  API, and seed values remain canonical/raw.
- EN Station seed text is provisional and may be updated later by canonical seed
  without destructive Station replacement.

## Verification Plan and Risks

- Admin Station locale-display correction passed live Backend progress-matrix
  inspection, commit-history comparison, Frontend lint, Frontend production
  build, `git diff --check`, and Graphify code update (`2362` nodes, `3860`
  edges, `209` communities). Post-fix browser/manual smoke remains pending.
- Admin System Config localization fix passed Frontend `i18n:check` with `314`
  parity/no-empty keys, Frontend lint, Frontend production build, the focused
  hard-coded-copy scan, `git diff --check`, and Graphify code update (`2357`
  nodes, `3853` edges, `206` communities). Post-fix browser/manual smoke is
  still pending.
- Completed in the latest follow-up implementation run: Frontend
  `i18n:check`, Frontend lint, Frontend production build, and JSX visible-copy
  scan confirming only the `MOVEment 2026` brand remains as direct text.
- Station gallery follow-up passed i18n parity with `273` keys, Frontend lint,
  production build, and Chrome headless visual review at 320/375/1280px.
- V2 Detail follow-up passed i18n parity with `391` keys, full Frontend Vitest
  (`26/26`), lint, production build, and bundle gate on 2026-07-30; authenticated
  multi-viewport visual review remains pending.
- Completed in the latest header visual follow-up: Frontend lint, Frontend
  production build, and `git diff --check`.
- Completed in the earlier Plan 2 implementation run: Prisma generate, targeted
  Backend Player/Admin service tests, Backend lint/build, Frontend lint/build.
- Still required: migration on disposable DB, two seed runs/idempotency,
  `db:verify`, full Backend Jest suite, locale parity/no-empty check, and manual
  desktop/mobile browser smoke.
- 2026-07-28 Production read-only smoke found that `https://heroes.nalth.top/`
  and `/qr-login?token=__codex_readonly_probe__` return SPA `index.html`, but
  the deployed HTML references `/assets/index-BTYLObga.js` while the current
  local build references `/assets/index-DAFO-QAT.js`; direct JS asset HEAD checks
  returned OBS `403 AccessDenied`. Backend `/api/docs` returned Swagger UI.
  Full runtime localization verification remains blocked until the frontend
  deployment is repaired or rerun successfully.
- Main risks: remaining hard-coded UI copy outside the core screens, manual
  browser coverage pending, and existing npm audit high-severity findings not
  addressed in this feature scope.

## Decision Log

1. Delivery review: use one runtime-switchable app, not separate builds/URLs.
2. Scope review: cover Team/Admin Frontend and extend Station content
   localization through Backend/database where Player Station data is loaded.
3. Default review: Vietnamese remains canonical/default and persisted fallback.
4. API review: Player sends `lang=vi|en` and receives localized
   `name`/`description`; Admin receives all four Station content fields.
5. Fallback review: invalid/missing locale uses VI; missing EN fallback happens
   per field.
6. Seed review: canonical Station seed stores EN provisional text and may update
   only EN translation fields without destructive replacement when gameplay
   inventory is valid.
7. Consumer review: Excel/backend operational consumers continue using VI;
   `Game.title` and `clueText` remain out of scope.
8. Follow-up copy review: user requested all visible Frontend copy except
   `MOVEment`; implementation expands localized resources across Team/Admin
   screens and keeps dynamic identifiers unmodified.
9. Follow-up visual terminology review: language switch uses flag emoji labels;
   Final means the final challenge, keeps compact nav label `Final`, uses a flag
   icon, and reserves cipher wording for actual answer/cipher copy.
10. Follow-up ordering/name review: Station cards sort by status then
    `stationId`; Team seed-style names localize only in the display layer.
11. Follow-up implementation constraint review: choose the least-change path by
    extending existing i18n resources/helpers and avoiding new assets,
    dependencies, database, API, seed, QR, scoring, or Team persistence changes.
12. Header visual follow-up: user requested a prettier mockup-aligned header
    without changing the current brand logo; implementation keeps
    `RunningPersonIcon`, refines AppFrame layout/CSS, and replaces text/emoji
    segmented language labels with inline circular flag buttons.
13. Admin System Config gap review: user screenshots confirmed the shared
    language state changed while page-local copy stayed English; the fix extends
    existing resources without changing canonical Station data, API contracts,
    QR lifecycle, database, migration, or seed behavior.
14. Admin Station data display clarification: English System Config must select
    the bilingual fields already present in the Admin payload instead of
    rendering canonical VI fields or issuing a redundant locale refetch.

## Provenance

- Approved Plan 2 execution request: `FE song ngữ VI/EN và Station localization từ Backend`.
- Seven-round Plan Mode decisions were completed before implementation; round 7
  used the recommended default after no response.
## 2026-08-03 V2 default navigation localization

- Team protected-route recovery now uses bilingual `Quay về trò chơi` / `Back
  to game` copy for the `/team/v2` default destination.
- i18n parity passed with `417` Vietnamese/English keys.
