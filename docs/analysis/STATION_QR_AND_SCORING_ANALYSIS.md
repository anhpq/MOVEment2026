# Station QR and Scoring Analysis

## 2026-08-12 Cancel and Station-switch policy

- Cancel returns the progress to `AVAILABLE` immediately with no Station cooldown.
- Check-in to B abandons an un-checked-out active A and claims B in one serializable transaction; the activity log records `ABANDON_STATION` then `CHECK_IN`.
- A checked-out Station pending score blocks the switch until its score is submitted.

## 2026-08-03 Completed Station gameplay action

- Team V1 Station List and map drawer now disable the gameplay button for a
  finished Station and label it `Hoàn thành` / `Finished`.
- V2 already omits gameplay actions for completed Stations. Media actions remain
  independent and available according to their existing rules.
- Frontend container verification passed: Vitest `61/61`, i18n parity `416`,
  lint, production build, and bundle budget.

## 2026-08-03 Team score confirmation copy

- Team V1 and V2 score confirmations now show the exact score and Station
  identity before submission.
- Vietnamese and English copy explicitly asks whether the user is sure about
  entering the displayed score for the Station before it is recorded.
- The confirmation warns that the Team cannot change its own score afterward;
  Admin correction behavior remains unchanged.
- Frontend container verification passed: Vitest `61/61`, i18n parity `416`,
  lint, production build, and bundle budget (`204.08 KiB` initial gzip JS).

## 2026-08-03 Team score entry without reason

- The Team score modal shown after Check-out now contains only the required
  score input and no longer sends an optional reason.
- Admin score correction retains its required reason field and validation.
- Score limits, tracking modes, completion, and Backend authority are unchanged.
- Frontend container verification passed: Vitest `61/61`, i18n parity `414`,
  lint, production build, and bundle budget.

## 2026-08-03 Shared Station identity row

- Check-in and Check-out now present the Station code as a compact badge beside
  the Station name instead of stacking the two values vertically.
- Long Station names wrap safely without changing QR or gameplay behavior.

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
- Canonical inventory uses `SCORE` for every Station except `ST009`, which remains
  `TIME`; all 17 Stations retain their independent CHECK_IN/CHECK_OUT QR pair.

## Decisions and Stale Assumptions

- Station QR tokens remain independent opaque check-in/check-out tokens.
- No confirmation/scoring code is reintroduced.
- Backend is authoritative for purpose, state, global score-entry cap, and duplicate claims.
- Production `/qr-login` static-hosting behavior was outside this Station QR task.

## Interfaces and Data

- Existing player check-in, check-out, and submit-score APIs remain authoritative.
- `Game.maxPoints` is reference/display data. Team/Admin score entry uses the explicit global cap `scoreEntryMax = 105`; above-reference scores remain valid and return `referenceExceeded`.
- TIME Check-out completes provisionally with `10`; ST009 never opens score entry and is finalized by durable Station rank at Final.
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
4. Scoring review: TIME completes provisionally with `10`; other modes validate integer `0..105`.
5. Concurrency review: claim/update prevents duplicate award.
6. UI review: show reference points (`???` for ST007), use API cap `105`, and warn without blocking above-reference input.
7. Consolidation review: keep Production/browser checks pending.

## Provenance

- `.kilo/plans/1784998100232-qr-checkout-scoring-prod-login-sync.md`

# Final timing — cập nhật 2026-08-17

Check-in bị Backend từ chối sau `eventEndTime` hoặc Final start. Check-out của attempt đang chơi vẫn được phép trước Final start. Tại Final start lifecycle worker reset các attempt chưa Check-out về `AVAILABLE` và log `FINAL_STARTED_CANCEL_STATION`; attempt đã Check-out chờ SCORE/BOTH không bị hủy.
