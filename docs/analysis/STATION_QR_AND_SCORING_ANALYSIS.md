# Station QR and Scoring Analysis

## 2026-08-03 Station Detail camera-first Check-out

- The V1 Station Detail Check-out modal now matches the Check-in camera-first
  pattern, with Station identity and concise guidance.
- Manual token entry remains available as a collapsible fallback; camera decode
  continues to auto-submit through the existing authoritative Check-out mutation.
- The informational scoring panel and default modal footer were removed from
  this scan step without changing tracking-mode or scoring behavior.
- Frontend container verification passed: Vitest `61/61`, i18n parity `414`,
  lint, production build, and bundle budget. Physical mobile smoke remains open.

## 2026-08-03 Station List camera-first Check-in

- The V1 Station List Check-in modal now prioritizes camera scanning and keeps
  manual token entry as a collapsible fallback.
- Camera decode continues to invoke the same authoritative Check-in mutation;
  no QR validation, purpose, session, or scoring Business Rule changed.
- Full Frontend verification passed; physical camera verification remains open.


## Status

| Area | Status |
| --- | --- |
| Implementation | Completed |
| Runtime/Production Verification | Production-like local QR/scoring smoke completed; Production pending |
| Browser/Manual Verification | Pending verification |

## 2026-07-29 Runtime Stability Integration

- Check-in, check-out, cancel, unified QR action, and score transitions are
  conditional/idempotent and protected by the database one-active-Station
  invariant.
- Frontend mutations are never automatically replayed and perform at most one
  fresh state reconciliation after the POST.
- Production-like local smoke verified wrong-purpose QR, SCORE/TIME/BOTH,
  idempotent duplicate score completion, active-Station Final blocking, and
  separate `finalStartsAt` behavior. Production/physical QR remain unverified.

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
- V2 Detail opens the existing V2 scanner on demand for Start/Complete; rejected
  tokens keep that scanner open and successful transitions return to the V2 map.
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
- The 2026-07-30 V2 Detail integration passed V2 scanner/Detail targeted tests,
  the full Frontend suite, i18n parity, lint, build, and bundle gate. No Backend
  QR/scoring contract changed.

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

