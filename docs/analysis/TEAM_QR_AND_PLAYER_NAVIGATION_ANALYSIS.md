# Team QR and Player Navigation Analysis

## Status

| Area | Status |
| --- | --- |
| Implementation | Completed |
| Runtime/Production Verification | Pending verification |
| Browser/Manual Verification | Pending verification |

## Objective and Scope

Provide reusable non-expiring Team QR login, privacy-safe live Station counts,
visible-only polling, and fixed bottom navigation themed by Team Color.

## Business Rule References

- `OPEN_QUESTIONS_AND_DECISIONS.md`: Team QR lifecycle and Team Color.
- `QR_LOGIN.md` and `QR_PAYLOADS.md`: Automatic URL QR login.
- `PROJECT_ANALYSIS_SPEC.md`: Player navigation and live data.

## Current Implementation

- Commit `bb41dd12` completed reusable Team QR, Station playing counts, polling,
  safe stale-data handling, and fixed navigation.
- Commit `55254db0` themes fixed navigation active/hover/focus states with scoped
  Team variables while preserving default Movement coral outside Team context.
- Team QR APIs return `expiresAt: null`; active lookup never falls back to revoked
  or consumed historical tokens.
- Playing-count responses expose only Station ID and Team count.

## Decisions and Stale Assumptions

- Team QR is reusable, revocable, rotatable, and non-expiring.
- Historical Team QR `EXPIRED` state and TTL settings are superseded.
- Poll every five seconds only while visible, prevent overlap, retain prior data
  on network/5xx, and clear auth on 401/403.
- Bottom navigation follows Team Color only in Team/single-Team contexts.

## Interfaces and Data

- `QrLoginToken.expiresAt` remains nullable; active Team QR returns `null`.
- Team QR status: `ACTIVE | CONSUMED | REVOKED | INACTIVE`.
- `GET /api/player/stations/playing-counts` returns only
  `{stationId, playingTeamCount}` entries.

## Verification and Risks

- Targeted Backend tests, Backend/Frontend lint/build, and diff checks passed and
  are recorded in audit/backlog.
- Remaining: live-count, hidden-tab, leaderboard, QR lifecycle, safe-area, and
  multi-Team-color browser smoke; Production mutation/deploy remains pending.

## Decision Log

1. Lifecycle review: Team QR has no active expiry.
2. Migration review: nullable expiry rollout avoids bulk data rewrite.
3. Concurrency review: login transaction rechecks token lifecycle.
4. Privacy review: counts expose no Team identity.
5. Polling review: visible-only, non-overlapping, stale-data preserving behavior.
6. Navigation review: fixed safe-area layout retains role-specific destinations.
7. Theme review: Team context uses scoped color; default context stays coral.

## Provenance

- `.kilo/plans/1785080746001-team-qr-no-expire-fixed-bottom-navigation.md`

