# MOVEment 2026 QR Payloads

Last updated: 2026-07-19

All QR payloads below are intentionally namespaced with `MV26` so team-login QR tokens cannot collide with station start/end QR tokens.

## Team login QR payloads

Each team has exactly one official QR login token. Backend seed stores only a bcrypt hash plus a SHA-256 fingerprint for lookup/uniqueness.

| Team | QR payload |
| --- | --- |
| Team 01 | `MV26-TEAM-01-LOGIN` |
| Team 02 | `MV26-TEAM-02-LOGIN` |
| Team 03 | `MV26-TEAM-03-LOGIN` |
| Team 04 | `MV26-TEAM-04-LOGIN` |
| Team 05 | `MV26-TEAM-05-LOGIN` |
| Team 06 | `MV26-TEAM-06-LOGIN` |
| Team 07 | `MV26-TEAM-07-LOGIN` |
| Team 08 | `MV26-TEAM-08-LOGIN` |
| Team 09 | `MV26-TEAM-09-LOGIN` |
| Team 10 | `MV26-TEAM-10-LOGIN` |
| Team 11 | `MV26-TEAM-11-LOGIN` |
| Team 12 | `MV26-TEAM-12-LOGIN` |
| Team 13 | `MV26-TEAM-13-LOGIN` |
| Team 14 | `MV26-TEAM-14-LOGIN` |
| Team 15 | `MV26-TEAM-15-LOGIN` |
| Team 16 | `MV26-TEAM-16-LOGIN` |
| Team 17 | `MV26-TEAM-17-LOGIN` |
| Team 18 | `MV26-TEAM-18-LOGIN` |
| Team 19 | `MV26-TEAM-19-LOGIN` |
| Team 20 | `MV26-TEAM-20-LOGIN` |
| Team 21 | `MV26-TEAM-21-LOGIN` |
| Team 22 | `MV26-TEAM-22-LOGIN` |
| Team 23 | `MV26-TEAM-23-LOGIN` |
| Team 24 | `MV26-TEAM-24-LOGIN` |
| Team 25 | `MV26-TEAM-25-LOGIN` |

## Station QR payloads

Every station has two unique QR payloads: one for check-in/start and one for check-out/end.

| Station | Start/check-in QR | End/check-out QR |
| --- | --- | --- |
| ST002 | `MV26-STATION-ST002-CHECK_IN` | `MV26-STATION-ST002-CHECK_OUT` |
| ST047 | `MV26-STATION-ST047-CHECK_IN` | `MV26-STATION-ST047-CHECK_OUT` |
| ST017 | `MV26-STATION-ST017-CHECK_IN` | `MV26-STATION-ST017-CHECK_OUT` |
| ST15A | `MV26-STATION-ST15A-CHECK_IN` | `MV26-STATION-ST15A-CHECK_OUT` |
| ST029 | `MV26-STATION-ST029-CHECK_IN` | `MV26-STATION-ST029-CHECK_OUT` |
| ST003 | `MV26-STATION-ST003-CHECK_IN` | `MV26-STATION-ST003-CHECK_OUT` |
| ST004 | `MV26-STATION-ST004-CHECK_IN` | `MV26-STATION-ST004-CHECK_OUT` |
| ST005 | `MV26-STATION-ST005-CHECK_IN` | `MV26-STATION-ST005-CHECK_OUT` |
| ST006 | `MV26-STATION-ST006-CHECK_IN` | `MV26-STATION-ST006-CHECK_OUT` |
| ST010 | `MV26-STATION-ST010-CHECK_IN` | `MV26-STATION-ST010-CHECK_OUT` |
