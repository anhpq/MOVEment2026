# MOVEment 2026 - Current Specification

## Authority

Confirmed Business Rules are defined in:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

This file summarizes shared product behavior. It does not override the Source of Truth.

## Product Scope

MOVEment 2026 is a mobile-first station game web application.

Team users:

- login by username/password or Automatic URL QR Login;
- view Station map and progress;
- scan Station Check-in and Check-out QR;
- enter score when required;
- join Final Challenge;
- view leaderboard.

Admin users:

- manage Event Config;
- manage Teams and Stations;
- configure tracking mode and max score;
- manage QR lifecycle;
- correct scores and operational state;
- view audit/activity data;
- export reports.

## Actors

### Admin

Authenticated by username/password with role:

```text
ADMIN
```

### Team

Uses a separate Team model and Team session.

There is no Staff account or Staff role.

The person supervising a Station may enter score on the device currently logged into the Team account and must provide the scoring confirmation code.

## Authentication and Session

Admin login:

```text
POST /api/auth/login
```

Team password login uses the current Team login endpoint.

Automatic URL QR Login:

```text
{FRONTEND_PUBLIC_URL}/qr-login?token={RAW_TEAM_QR_TOKEN}
```

Rules:

- one active session per Team;
- new Team login revokes the previous Team session;
- QR Login and password login share the same session policy;
- backend enforces session validity;
- Team QR token and Team session are separate objects.

## Team QR Login

Each active Team has one active reusable controlled QR Login token.

Token must be random, opaque, unique, revocable, rotatable, and subject to expiry or Event validity.

Successful login does not permanently consume the token.

Creating a Team automatically provisions its token.

Local/test seed repairs a missing token without rotating an existing valid token.

Predictable tokens such as `MV26-TEAM-01-LOGIN` are Legacy only.

## Station QR

Each active Station has exactly:

```text
1 CHECK_IN token
1 CHECK_OUT token
```

Official format:

```text
MV26-SQ1-I-<randomToken>
MV26-SQ1-O-<randomToken>
```

Rules:

- tokens are generated independently;
- tokens do not expose Station ID or code;
- database record determines Station and purpose;
- visible `I` or `O` is not authoritative;
- creating a Station automatically provisions both tokens;
- the transaction rolls back if the complete pair cannot be created;
- each token supports independent revoke and rotate.

Legacy predictable Station QR is not the official format for new data.

## Station State

Official states:

```text
LOCKED
AVAILABLE
CHECKED_IN
PLAYING
COMPLETED
```

Do not add official statuses:

```text
WAITING_SCORE
CANCELLED
REOPENED
```

Waiting for score is derived from Check-out and completion fields.

Every active Station begins as `AVAILABLE` for every Team.

Stations are not unlocked in a fixed sequence.

A Team may play only one Station at a time.

Cancel returns the Team Station to `AVAILABLE` and applies the configured cooldown, default 5 minutes.

## Tracking Modes

Each Station has:

```text
SCORE
TIME
BOTH
```

| Mode | Duration | Score |
| --- | --- | --- |
| `SCORE` | Does not contribute play duration under the confirmed rule. | Required after Check-out. |
| `TIME` | Real Check-in to Check-out duration. | Backend completes with score 0; no score modal. |
| `BOTH` | Real Check-in to Check-out duration. | Required after Check-out. |

## Check-in

Backend validates:

- authenticated Team;
- active Team session;
- QR token;
- token active/revoked/expired;
- Station active;
- Event time;
- Team cooldown;
- Team does not have another active Station.

## Check-out

Backend resolves purpose from the Station QR token record.

For `TIME`, Check-out completes the progress with score 0.

For `SCORE` and `BOTH`, Check-out leaves the progress awaiting score and the frontend opens the score-entry modal.

## Scoring

Default Station max score:

```text
30
```

Each Station may configure a different max.

Score rules:

- integer;
- minimum 0;
- maximum Station max score;
- backend authoritative;
- confirmation code required;
- raw confirmation code is not stored or exposed;
- duplicate request does not duplicate completion or score;
- Admin correction is a separate audited flow.

## Event Config

Event start time, Event end time, and Final start time are managed by Admin Event Config.

Do not hard-code fixed values such as `11:30` or `11:45`.

After Event end:

- Team cannot start a new Station;
- Team that checked in before Event end may finish its current Station.

Final becomes available according to `finalStartsAt` in Admin Event Config.

Team with an active Station must finish it before Final.

## Final Challenge

Keyword:

```text
DISANVANHOA2026
```

Frontend and backend trim and uppercase input.

Backend stores the normalized Final keyword directly in the compatibility column `answerHash` and compares normalized submitted text directly against that stored value. Public APIs and logs must not expose the configured answer.

Team may retry until correct or Final closes.

Wrong-answer cooldown increases from 1 second up to 10 seconds and is enforced by backend.

Rank is assigned by database-confirmed first correct submission.

Bonus:

```text
Rank 1 = 10
...
Rank 10 = 1
Rank 11+ = 0
```

One Team receives at most one rank and one bonus.

## Leaderboard

Sort order:

1. total score descending;
2. total play duration ascending;
3. completed Station count descending.

Backend is authoritative.

Total score includes Station score and Final bonus.

## QR Camera

Camera availability depends on:

```text
navigator.mediaDevices.getUserMedia
```

Requirements:

- HTTPS or localhost Secure Context;
- prefer native `BarcodeDetector`;
- fallback to `jsQR`;
- `autoPlay`, `muted`, `playsInline`;
- explicit scanner lifecycle and cleanup;
- manual paste/token entry always available;
- safe Vietnamese errors;
- duplicate decode protection.

Real iPhone Safari and Chrome iOS verification remains required until recorded as passed.

## Seed

Local/test seed must be idempotent and environment-safe.

It may generate example values freely when not fixed by a Business Rule.

It must provision:

- Admin test account;
- Team test accounts;
- Team QR tokens;
- Stations;
- Station QR pairs;
- Event Config;
- Final keyword/config.

Production seed must not print raw secrets or create local test credentials automatically.

Temporary Production Final Challenge seed override remains enabled through `2026-08-21 23:59:59 Asia/Ho_Chi_Minh`: each seed run overwrites only seed-managed Final Challenge fields with canonical values. Starting `2026-08-22 00:00:00 Asia/Ho_Chi_Minh`, Production seed preserves an existing Final Challenge record and only creates it if missing.

## Audit and Logging

Meaningful actions should create appropriate activity/audit records:

- Team login/session replacement;
- QR generation, rotate, revoke;
- Station Check-in/Check-out;
- score submit and Admin correction;
- Final submission and rank;
- Admin operational override.

Do not log raw QR tokens, passwords, JWTs, refresh tokens, or scoring codes.

## Current Known Implementation Gaps

Historical audit indicates that current or recent implementation may still contain:

- one-time consumed Automatic URL QR tokens;
- predictable Legacy Team QR tokens;
- predictable Station QR containing Station code;
- smoke scripts and fixtures using Legacy payloads;
- production CORS verification not completed;
- real iPhone HTTPS camera verification pending.

Documentation synchronization does not close these implementation gaps.
