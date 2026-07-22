# MOVEment 2026 - Implementation Backlog

## 2026-07-22 Final Challenge completion

- [x] Final opening is verified against Admin Event Config `eventEndTime`; changing Event Config changes availability without Source Code changes.
- [x] Active Source Code no longer uses fixed `11:30` or `11:45`; remaining matches are historical documentation warnings or the original baseline migration.
- [x] Local/test seed creates or repairs the active Final keyword hash for `DISANVANHOA2026` and remains idempotent when run repeatedly.
- [x] Backend and frontend trim and uppercase answer input; backend remains the authoritative validator and frontend source does not contain the official answer.
- [x] Wrong-answer cooldown is backend-enforced inside the serializable submission transaction and increases from 1 second to maximum 10 seconds.
- [x] Final eligibility is verified for configured Event end, active Station blocking, no all-Station completion requirement, and existing Station lifecycle regression.
- [x] Final ranking and bonus are verified for rank 1, rank 2, rank 10, rank 11, duplicate correct submission, retry, and unique-rank concurrency protection.
- [x] Leaderboard integration remains through `team.totalPoints`, so Final bonus is included once when awarded.
- [ ] Production migration and production-like Final smoke remain open.
- [ ] Manual browser double-click/multiple-tab UX verification remains open.

## 2026-07-22 Station tracking and scoring completion

- [x] Re-verified `SCORE`, `TIME`, and `BOTH` behavior after SQ1 Station QR migration.
- [x] `TIME` records real duration, auto-completes with score `0`, and does not require Team score submission.
- [x] `SCORE` contributes no play duration and requires Team-device score submission after Check-out.
- [x] `BOTH` records real duration and requires Team-device score submission after Check-out.
- [x] Station max score now defaults to `30` at database and Admin creation service layers.
- [x] Backend service validation rejects non-integer, negative, and above-max scores for Team and Admin score paths.
- [x] Duplicate/stale/concurrent Team score submission is covered by tests and the transaction claim.
- [x] Frontend score input uses Station max score as UX validation only; backend remains authoritative.
- [x] Admin score correction remains a separate audited flow.
- [ ] Production migration and production-like Station scoring smoke remain open.

## 2026-07-22 Secure Station QR completion

- [x] Station QR now uses official SQ1 opaque token format for new creation, Admin rotation, and local/test seed repair.
- [x] Station creation provisions one `CHECK_IN` and one `CHECK_OUT` token atomically with Station/Game/progress creation.
- [x] Player Check-in/Check-out resolves Station and purpose from the database token record after fingerprint/hash/lifecycle validation.
- [x] Admin can inspect, rotate, and revoke Station `CHECK_IN` and `CHECK_OUT` independently.
- [x] Local/test seed repairs missing or Legacy Station QR tokens by purpose and preserves existing active SQ1 tokens across repeated runs.
- [x] Reprint strategy is rotate-to-reprint; raw Station QR tokens are display-once and not stored in tracked files.
- [x] Legacy predictable Station QR generation is removed from new creation, seed repair, and smoke script paths; active Legacy DB rows remain compatibility-only.
- [ ] Production migration, production QR reissue, and physical QR scan verification remain open.
- [ ] Legacy Station QR compatibility window and removal date remain open.

## 2026-07-22 Automatic URL Team QR completion

- [x] Reusable controlled Team QR login, usage auditing, and one-active-session replacement are implemented and locally verified.
- [x] Team creation provisioning, idempotent local/test seed repair, and distinct Admin generate/rotate/revoke actions are implemented.
- [x] New Team and seed data no longer generate predictable Legacy Team QR credentials; existing Legacy credentials and endpoint remain for compatibility.
- [x] Rotate-to-reprint is the selected raw-token strategy; raw URLs are returned only when created and are not stored in tracked files.
- [ ] Production migration and deployed QR flow verification remain open.
- [ ] Station QR migration remains out of scope and open.

## Rules

- `[x]` means implementation and required verification are complete.
- `[ ]` means incomplete, not verified, or blocked.
- Documentation-only reconciliation does not complete Source Code work.
- Historical audit evidence remains in `BACKEND_AUDIT.md`.
- Use the smallest relevant Feature Prompt.

## P0 — QR Security and Provisioning

- [x] Migrate Automatic URL Team QR Login from one-time consumption to reusable controlled token behavior.
- [x] Ensure successful QR login does not consume the active Team token.
- [x] Preserve one-active-session-per-Team behavior for password and QR login.
- [x] Automatically provision a secure Team QR token in every Team creation path.
- [x] Add idempotent missing-Team-token repair.
- [x] Ensure Admin can generate, rotate, revoke, and inspect Team QR token status.
- [x] Select and document raw-token reprint strategy: display once and rotate to reprint.
- [x] Remove predictable Team QR generation for new data while retaining existing Legacy credentials for compatibility.
- [x] Migrate Station QR to `MV26-SQ1-I/O-<randomToken>`.
- [x] Automatically provision one Check-in and one Check-out token when creating a Station.
- [x] Roll back Station creation when the complete QR pair cannot be created.
- [x] Support independent Station Check-in and Check-out rotation/revocation.
- [x] Update database constraints and indexes for token uniqueness and active-token invariants.
- [x] Update seed, fixtures, and smoke scripts that hard-code Legacy QR payloads.
- [ ] Define and verify Legacy compatibility removal conditions.

Acceptance:

- Team token is random, opaque, reusable while valid, revocable, and rotatable.
- Station token does not expose Station ID/code.
- Database token record determines Station and purpose.
- Repeated seed does not rotate valid tokens or create duplicates.
- Production logs and tracked files contain no raw token.

## P0 — Authentication and Session

- [x] Admin username/password authentication exists.
- [x] Team username/password authentication exists.
- [x] New Team login replaces previous active Team session.
- [x] Verify session replacement after reusable Automatic URL QR migration.
- [x] Verify inactive Team and revoked/expired QR behavior after migration.
- [x] Verify QR rate limiting on the active implementation.

## P0 — Station Flow and Scoring

- [x] One active Station per Team is implemented.
- [x] Active Stations initialize as `AVAILABLE`.
- [x] Cancel returns to `AVAILABLE` with cooldown.
- [x] Tracking modes `SCORE`, `TIME`, and `BOTH` exist in historical verified implementation.
- [x] `TIME` auto-completes with score 0 in historical verification.
- [x] `SCORE` and `BOTH` require score entry in historical verification.
- [x] Backend score limits and confirmation-code flow have historical verification.
- [x] Re-run Station flow verification after Station QR migration.
- [x] Verify new Station creation automatically provisions both secure QR tokens.
- [x] Verify duplicate score submissions after migration.
- [ ] Verify duplicate Check-out after migration in a production-like smoke environment.

## P0 — Final Challenge

- [x] Final keyword `DISANVANHOA2026` is created or repaired by local/test seed.
- [x] Uppercase normalization is implemented in backend validation and frontend input UX.
- [x] Final opens from Admin Event Config end time.
- [x] Top-10 bonus and concurrency/idempotency are covered by focused tests.
- [x] Re-run Final verification after documentation, QR, and Station scoring migration work.
- [x] Confirm no active code path still uses fixed `11:30` or `11:45`.
- [x] Confirm cooldown progression is backend-enforced from 1 to maximum 10 seconds.
- [ ] Production-like Final smoke remains open.

## P0 — Documentation and Prompt Consistency

- [x] Business Rule Source of Truth created.
- [x] Feature Index created.
- [x] Workflow converted to Feature-based routing.
- [x] `AGENTS.md` operational authority clarified.
- [x] Master Prompt converted to Multi-Feature Orchestrator.
- [x] iOS QR Camera analysis synchronized.
- [x] QR Login analysis synchronized.
- [x] QR payload analysis synchronized.
- [x] Team login data removed hard-coded raw QR tokens.
- [x] QR Login Prompt synchronized.
- [x] Final Prompt synchronized.
- [x] Station Scoring Prompt synchronized.
- [x] Implementation Sync Prompt synchronized.
- [x] Project Analysis Spec synchronized.
- [ ] Run repository-wide Markdown link/path review after applying the bundle.
- [ ] Inspect prompts `01`–`07` before using them; treat Legacy assumptions as historical input unless reconciled.

## P1 — iOS QR Camera

- [x] Camera capability uses `getUserMedia`.
- [x] Native `BarcodeDetector` preferred.
- [x] `jsQR` fallback added in historical implementation.
- [x] Scanner lifecycle and cleanup improved in historical implementation.
- [ ] Manual Production HTTPS test on iPhone Safari.
- [ ] Manual Production HTTPS test on Chrome iOS.
- [ ] Confirm repeated open/close does not leak camera tracks.
- [ ] Confirm one QR frame produces one API request.

## P1 — Production Readiness

- [x] Production config fail-fast behavior has historical verification.
- [x] Database backup/restore and report export have historical verification.
- [ ] Merge and run the latest backend deployment workflow on the intended branch.
- [ ] Verify login through frontend HTTPS same-origin `/api`.
- [ ] Verify active Production CORS configuration.
- [ ] Verify `/qr-login` direct navigation and refresh in Production.
- [ ] Verify Production seed does not generate or print raw QR secrets.
- [ ] Verify migrated reusable Team QR behavior in Production or a production-like environment.
- [ ] Verify secure Station QR pair generation in a production-like environment.

## P2 — Legacy Removal

- [ ] Inventory Legacy Team QR endpoint and parser usage.
- [ ] Inventory Legacy Station QR parser and seed usage.
- [ ] Reissue printed Team QR codes.
- [ ] Reissue printed Station Check-in and Check-out QR codes.
- [ ] Update tester documentation and rehearsal instructions.
- [x] Disable Legacy Team token generation for new Team and seed data; Station Legacy generation remains open.
- [ ] Disable Legacy parser/endpoints after compatibility window.
- [ ] Remove obsolete migration fields only after safe deployment and rollback review.

## Next Execution Order

1. Run Production-like smoke tests.
2. Run `docs/prompts/08_IMPLEMENTATION_SYNC_PROMPT.md`.
3. Review diff, run `git diff --check`, and create scoped local commits.
4. Do not push or deploy without explicit user request.
