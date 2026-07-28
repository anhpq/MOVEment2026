# Frontend Localization Analysis

## Status

| Area | Status |
| --- | --- |
| Implementation | Completed for i18n infrastructure, language switch, Player Station Backend localization, Admin bilingual Station editor, core Login/QR/AppFrame copy, Station list/detail/map, Team list, Leaderboard, Final, and Admin Operations copy |
| Runtime/Production Verification | Not performed |
| Browser/Manual Verification | Pending desktop/mobile smoke |

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
- Station Editor always displays separate VI and EN inputs.
- Language switch renders circular VI/EN flag buttons with no external image
  asset dependency.
- Station list/detail/map status labels and visible controls use localized copy.
- Station gallery actions, preview alt text, Admin URL controls, validation copy,
  and reorder/remove ARIA labels are localized in both VI and EN.
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
- Excel export and operational consumers continue to use Vietnamese Station
  names.
- Station IDs, Team IDs, usernames, tokens, enum/API values, `Game.title`, and
  `clueText` are not translated in this scope.
- Team name localization is display-layer only for seed-style names; database,
  API, and seed values remain canonical/raw.
- EN Station seed text is provisional and may be updated later by canonical seed
  without destructive Station replacement.

## Verification Plan and Risks

- Completed in the latest follow-up implementation run: Frontend
  `i18n:check`, Frontend lint, Frontend production build, and JSX visible-copy
  scan confirming only the `MOVEment 2026` brand remains as direct text.
- Station gallery follow-up passed i18n parity with `273` keys, Frontend lint,
  production build, and Chrome headless visual review at 320/375/1280px.
- Completed in the latest header visual follow-up: Frontend lint, Frontend
  production build, and `git diff --check`.
- Completed in the earlier Plan 2 implementation run: Prisma generate, targeted
  Backend Player/Admin service tests, Backend lint/build, Frontend lint/build.
- Still required: migration on disposable DB, two seed runs/idempotency,
  `db:verify`, full Backend Jest suite, locale parity/no-empty check, and manual
  desktop/mobile browser smoke.
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

## Provenance

- Approved Plan 2 execution request: `FE song ngữ VI/EN và Station localization từ Backend`.
- Seven-round Plan Mode decisions were completed before implementation; round 7
  used the recommended default after no response.
