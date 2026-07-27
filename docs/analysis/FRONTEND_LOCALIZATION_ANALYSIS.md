# Frontend Localization Analysis

## Status

| Area | Status |
| --- | --- |
| Implementation | Completed for i18n infrastructure, language switch, Player Station Backend localization, Admin bilingual Station editor, and core Login/QR/AppFrame copy |
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

## Boundaries

- `Station.name` and `Station.description` remain Vietnamese canonical/default.
- Excel export and operational consumers continue to use Vietnamese Station
  names.
- Team names, Station IDs, usernames, tokens, enum/API values, `Game.title`, and
  `clueText` are not translated in this scope.
- EN Station seed text is provisional and may be updated later by canonical seed
  without destructive Station replacement.

## Verification Plan and Risks

- Completed in this implementation run: Prisma generate, targeted Backend
  Player/Admin service tests, Backend lint/build, Frontend lint/build.
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

## Provenance

- Approved Plan 2 execution request: `FE song ngữ VI/EN và Station localization từ Backend`.
- Seven-round Plan Mode decisions were completed before implementation; round 7
  used the recommended default after no response.
