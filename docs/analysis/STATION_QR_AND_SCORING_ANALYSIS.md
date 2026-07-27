# Station QR and Scoring Analysis

## Status

| Area | Status |
| --- | --- |
| Implementation | Completed |
| Runtime/Production Verification | Pending verification |
| Browser/Manual Verification | Pending verification |

## Objective and Scope

Keep Station QR camera scans ergonomic while preserving secure backend mapping,
tracking-mode scoring, max-score enforcement, and duplicate protection.

## Business Rule References

- `OPEN_QUESTIONS_AND_DECISIONS.md`: Station QR, tracking modes, and scoring.
- `QR_PAYLOADS.md`: secure Station QR format and database authority.
- `PROJECT_ANALYSIS_SPEC.md`: Station check-in/check-out and score flow.

## Current Implementation

- Commit `794143e8` aligned QR scan auto-submit, TIME score `10`, SCORE/BOTH
  checkout behavior, and effective max-score UI.
- Camera decode auto-submits; manual paste/type still requires explicit submit.
- Backend resolves Station and purpose from the stored token, not visible payload.
- TIME completes at checkout with score `10`; SCORE/BOTH wait for validated score
  input and prevent duplicate completion/award.

## Decisions and Stale Assumptions

- Station QR tokens remain independent opaque check-in/check-out tokens.
- No confirmation/scoring code is reintroduced.
- Backend is authoritative for purpose, state, max score, and duplicate claims.
- Production `/qr-login` static-hosting behavior was outside this Station QR task.

## Interfaces and Data

- Existing player check-in, check-out, and submit-score APIs remain authoritative.
- Effective max score is `10` for TIME and Station-configured/default max otherwise.
- Accepted checkout timestamp is retained according to tracking-mode rules.

## Verification and Risks

- Targeted Backend tests, db verification, lint/build, and Frontend lint/build are
  recorded in audit/backlog.
- Remaining: real camera/browser smoke, duplicate interaction smoke, and
  Production migration/runtime verification where backlog remains open.

## Decision Log

1. QR review: auto-submit camera results only.
2. Security review: database token mapping remains authoritative.
3. Tracking review: preserve SCORE, TIME, and BOTH semantics.
4. Scoring review: TIME completes with `10`; other modes validate input.
5. Concurrency review: claim/update prevents duplicate award.
6. UI review: show effective max without changing backend authority.
7. Consolidation review: keep Production/browser checks pending.

## Provenance

- `.kilo/plans/1784998100232-qr-checkout-scoring-prod-login-sync.md`

