# Event Timing and Final Analysis

## Status

| Area | Status |
| --- | --- |
| Implementation | Completed |
| Runtime/Production Verification | Pending verification |
| Browser/Manual Verification | Pending verification |

## Objective and Scope

Keep Event start/end, Final start, and Station close behavior driven by
`EventConfig`. A Team cannot start a Station after Event end, may finish an
attempt started before Event end, and enters Final only from `finalStartsAt`.

## Business Rule References

- `OPEN_QUESTIONS_AND_DECISIONS.md`: Event Config, Event time, and Final rules.
- `PROJECT_ANALYSIS_SPEC.md`: Player Station and Final flows.

## Current Implementation

- 2026-08-22 operational migration sets the existing Event Config to Station
  close `11:30`, Final `11:45`, notification lead `20`, and
  `Asia/Ho_Chi_Minh`. Runtime behavior remains HH:mm-based and configurable.
- The close-to-Final `15` minute gap is an advisory only; Admin may save a
  different valid configuration.

- Commit `b23bc321` separated Final start from Event end.
- Backend Station actions enforce Event end and preserve completion of an
  already-started attempt.
- Player data preserves locked backend status so closed Stations are disabled.
- Final opening uses configured `finalStartsAt`; fixed `11:30`/`11:45` source
  assumptions are stale.

## Decisions and Stale Assumptions

- `eventEndTime` closes new Station starts; it does not open Final.
- No source code may hard-code event or Final times.
- UI display labels may derive a closed state without changing backend enums.
- Production runtime and manual browser checks remain separate from source
  implementation status.

## Interfaces and Data

- `EventConfig`: `eventStartsAt`, `eventEndsAt`, `finalStartsAt`.
- Player Station response retains authoritative backend progress/status.
- Final public response exposes its configured opening time.

## Verification and Risks

- Automated Backend/Frontend verification was recorded in `BACKEND_AUDIT.md`.
- Remaining: Production runtime timing and browser transition smoke tests.
- Risk: stale fixture or operational docs can still imply fixed times; Business
  Rules and Event Config remain authoritative.

## Decision Log

1. Scope review: separate Event close and Final open behavior.
2. Business Rule review: Event Config is authoritative.
3. Backend review: reject new Station starts after Event end.
4. Active-attempt review: allow an existing attempt to finish.
5. Frontend review: preserve locked backend state for disabled UX.
6. Verification review: keep Production/browser checks pending when not run.
7. Consolidation review: remove stale fixed-time assumptions from the plan.

## Provenance

- `.kilo/plans/1784831016754-final-start-event-end-fix-plan.md`

# Final Challenge V2 — cập nhật 2026-08-17

- `eventEndTime` đóng Check-in mới và được cấu hình độc lập với `finalStartsAt`; Admin V2 Event Control không khuyến nghị hoặc bắt buộc khoảng cách giữa hai mốc.
- V2 gửi notice persistent từ `notifyBeforeMinutes` (mặc định 15) và urgent notice ở mốc đóng Station; Final start hủy attempt chưa Check-out, nhưng pending score còn được submit.
- Final takeover giữ HUD Team V2, không đổi URL; map/gameplay overlays bị ẩn khi Team có thể vào Final.
- Sai đáp án dùng cooldown `3, 5, 10, 15, 20, ... 50` giây, cap 50, và thử lại đến khi đúng.

## 2026-08-20 ST009 Final cutoff reconciliation

- Check-out và Final reconciliation dùng cùng PostgreSQL transaction advisory lock; request không thể vượt qua `finalStartsAt` sau preflight rồi vẫn commit.
- Sau khi hủy attempt chưa Check-out, Backend normalize ST009 legacy về provisional `10`, xếp hạng toàn bộ completed set theo duration ms, Check-out ms, Team ID và ghi delta/rank idempotently.
- Final, Leaderboard và Team Results Excel đều reconcile trước khi đọc snapshot.
