# MOVEment 2026 — Agent Production Deployment Handoff

## Purpose

This runbook tells Cursor, Codex, or another AI coding agent how to prepare a safe MOVEment 2026 Production release when the current operator:

- can merge code into `master`;
- does not own or fully understand the Production server setup;
- may not have direct ECS, PostgreSQL, PM2, Nginx, OBS, GitHub Environment, or Production secret access;
- must not guess server configuration;
- must not mutate Production without explicit approval.

This file does not override:

```text
AGENTS.md
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/FEATURE_INDEX.md
docs/prompts/00_WORKFLOW.md
deploy/PRODUCTION_STAGED_DEPLOY.md
```

If this document conflicts with the current repository workflow or live server configuration, stop and report the conflict.

---

# 1. Operator Constraint

The current operator can safely:

```text
review
commit
push develop
merge or fast-forward into master
push master
inspect GitHub Actions
manually start an approved workflow
```

Do not assume the operator can:

```text
SSH into Production
read or modify Production .env
run pg_dump on Production
run Prisma commands against Production
restart PM2 or systemd
reload Nginx
change DNS or OBS configuration
change GitHub secrets or Environment protection
rotate or revoke Production QR tokens
```

If one of these actions is required, stop and provide a handoff checklist for the server owner.

---

# 2. Current Deployment Model

Production deployment is staged and manual.

Backend workflow:

```text
.github/workflows/be-deploy.yml
```

Frontend workflow:

```text
.github/workflows/fe-deploy.yml
```

Expected behavior:

```text
workflow_dispatch only
target branch: master
Backend deploy first
Frontend deploy only after Backend verification
```

Frontend must use same-origin API routing:

```text
/api
```

Do not deploy Backend and Frontend in parallel.

---

# 3. Mandatory Reading

Before release work, read:

```text
AGENTS.md
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
docs/analysis/FEATURE_INDEX.md
docs/prompts/00_WORKFLOW.md
deploy/PRODUCTION_STAGED_DEPLOY.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
.github/workflows/be-deploy.yml
.github/workflows/fe-deploy.yml
be/deploy/deploy.sh
be/deploy/plan-database-steps.js
```

Then inspect:

```text
git status
git branch -vv
git log --oneline --decorate
git log origin/master..master
git log origin/develop..develop
```

Do not assume old commit hashes are still current.

---

# 4. Required Deployment Order

```text
1. Verify repository state
2. Merge approved changes into master
3. Push master
4. Confirm no Production workflow auto-started
5. Confirm Production backup with server owner
6. Run Backend workflow manually
7. Verify Backend, migrations, database, health, and logs
8. Run Frontend workflow manually
9. Verify HTTPS, same-origin /api, SPA fallback, and /qr-login
10. Run non-destructive Production smoke
11. Prepare QR reissue and physical-device verification
```

Do not reverse Backend and Frontend order.

---

# 5. Repository Release Gate

Before merging into `master`, confirm:

```text
working tree is clean
develop contains all intended commits
origin/develop is current
master and origin/master are aligned
develop can fast-forward master
Production workflows have no push trigger
workflow_dispatch inputs are valid
deployment shell script passes bash syntax
database-step planner tests pass
git diff --check passes
```

Recommended checks:

```powershell
git status --short
git fetch origin
git branch -vv
git log --oneline origin/master..develop
wsl bash -n /mnt/z/Work/Projects/MOVEment2026/be/deploy/deploy.sh
node be/deploy/plan-database-steps.test.js
git diff --check
```

Stop if any gate fails.

---

# 6. Merge to Master

Use fast-forward only unless another strategy is explicitly approved:

```powershell
git checkout master
git pull --ff-only origin master
git merge --ff-only develop
git status --short
git log --oneline origin/master..master
git push origin master
```

After pushing `master`:

1. Open GitHub Actions.
2. Confirm no Production workflow started automatically.
3. Confirm Backend and Frontend workflows remain manual-only.
4. Do not run either workflow until backup and server ownership are confirmed.

---

# 7. Server Owner Handoff Before Backend Deploy

The server owner must confirm:

```text
1. Fresh Production database backup completed
2. Backup path and timestamp recorded
3. Restore procedure confirmed
4. Current deployed Backend commit recorded
5. Production .env exists and is valid
6. Production database is reachable
7. PM2 or systemd service name is known
8. Live Nginx config is known
9. GitHub Environment approvals are configured
10. GitHub Secrets are valid
11. Deployment marker path is writable
12. Rollback operator is available
```

Expected paths from repository documentation:

```text
Repository: /opt/movement/app
Deployment marker: /opt/movement/deploy-markers/movement-api.commit
```

These paths must be verified by the server owner.

---

# 8. Production Backup Gate

Backend deployment must not start until a fresh backup is confirmed.

Documented backup shape:

```bash
pg_dump "$DATABASE_URL"   --format=custom   --file "/opt/movement/backups/movement-<timestamp>.dump"
```

Required evidence:

```text
timestamp
backup path
non-zero file
correct environment/database
restore command known
server owner confirmation
```

The AI agent must not run this without Production access and explicit approval.

---

# 9. Backend Manual Workflow

Expected workflow:

```text
Deploy Backend (ECS)
```

Run from `master` only.

Use the exact current input names from `.github/workflows/be-deploy.yml`. Expected inputs may include:

```text
target_branch
backup_confirmed
deploy_backend
base_commit
target_commit
force_database_steps
```

Do not guess values.

Typical required values:

```text
target_branch=master
backup_confirmed=BACKUP_CONFIRMED
deploy_backend=deploy-backend
force_database_steps=false
```

`base_commit` must identify the actual currently deployed Backend commit if the deployment marker is absent.

Do not use `HEAD~1` as a substitute for the deployed base.

---

# 10. Conditional Database Deployment

Database steps must be based on the full undeployed commit range.

Database-related paths include at minimum:

```text
be/prisma/schema.prisma
be/prisma/migrations/**
be/prisma/seed.ts
be/prisma/seed/**
be/prisma/init.sql
be/prisma.config.ts
be/scripts/db-verify*
database migration or seed behavior scripts
```

## No database change

```text
skip prisma migrate deploy
skip Production seed
skip database-specific verification
continue install, build, restart, and health checks
```

## Schema or migration change

```text
run prisma generate
run prisma migrate deploy
run db:verify
```

## Seed-only change

```text
skip prisma migrate deploy
run Production-safe seed
run db:verify
```

## Migration and seed change

```text
run prisma generate
run prisma migrate deploy
run Production-safe seed
run db:verify
```

Manual override:

```text
force_database_steps=true
```

must default to `false` and requires explicit approval.

Never inspect only the latest commit when an earlier undeployed commit may contain Prisma changes.

---

# 11. Expected Migration Review

The release may include migrations equivalent to:

```text
000005_reusable_qr_login_tokens
000006_secure_station_qr_tokens
000007_station_score_defaults
000008_final_event_defaults
```

Confirm the actual migration directory before deployment.

Do not assume this list is complete.

---

# 12. Backend Stop Conditions

Stop immediately if:

```text
backup confirmation is missing
base commit cannot be determined
target commit is not on master
Production .env is missing
unsafe default secret is detected
CORS_ORIGIN is wrong
FRONTEND_PUBLIC_URL is wrong
migration fails
seed fails
db:verify fails
build fails
restart fails
health check fails
secret appears in logs
deployment marker cannot be updated safely
```

Do not proceed to Frontend after any Backend failure.

---

# 13. Backend Post-Deploy Verification

Verify:

```text
Backend process is online
API health responds
/api/docs responds when enabled
database migrations completed or were safely skipped
seed ran or was safely skipped
db:verify passed when required
no duplicate seed data
no raw QR token in logs
no scoring code in logs
reusable Team QR works
one active Team session still works
SQ1 Station QR works
Station scoring works
Final configuration exists
```

Expected domain from current documentation:

```text
https://heroes.nalth.top/api/docs
```

Use the actual configured domain if different.

---

# 14. Frontend Manual Workflow

Run only after Backend verification passes.

Expected workflow:

```text
Deploy Frontend (Nginx)
```

Use exact current inputs, typically equivalent to:

```text
target_branch=master
deploy_frontend=deploy-frontend
```

Frontend must build with same-origin API behavior:

```text
VITE_API_BASE_URL unset
```

or the current repository-approved equivalent.

---

# 15. Frontend Post-Deploy Verification

Verify:

```text
https://heroes.nalth.top/
https://heroes.nalth.top/api/docs
https://heroes.nalth.top/qr-login
```

Required behavior:

- HTTPS succeeds.
- Frontend assets return 200.
- `/api` reaches Backend.
- `/qr-login` direct navigation loads the SPA.
- Refreshing `/qr-login` does not return 404.
- No mixed content.
- CORS does not block same-origin requests.
- Frontend bundle contains no scoring code or raw QR secret.

---

# 16. Non-Destructive Production Smoke

Use only approved test entities.

Minimum checks:

```text
Admin login
Team password login
Reusable Team QR login
new login replaces old Team session
SQ1 Check-in
SQ1 Check-out
TIME flow
SCORE flow
BOTH flow
Final availability from Event Config
Final keyword normalization
Leaderboard total
```

Do not:

```text
delete real Teams
rotate real QR without reissue plan
change live Event time casually
submit fake Final ranks during a live Event
modify real scores without an audit reason
```

Stop when no safe test data exists.

---

# 17. QR Reissue Plan

Official Station QR format:

```text
MV26-SQ1-I-<randomToken>
MV26-SQ1-O-<randomToken>
```

Before disabling Legacy compatibility:

```text
1. Inventory printed Team QR
2. Inventory printed Station QR
3. Generate or retrieve approved QR artifacts
4. Print and label new QR
5. Test each physical QR
6. Replace every Station QR
7. Confirm event-operator acceptance
8. Disable Legacy only after replacement
```

Do not rotate or revoke a Production QR before its replacement artifact is ready.

---

# 18. iPhone Verification

Production camera verification remains incomplete until tested on:

```text
Safari on iPhone
Chrome on iOS
```

Verify over HTTPS:

```text
camera permission
inline preview
rear-camera preference
jsQR fallback
manual input
repeated open/close
navigation cleanup
one scan creates one request
Team QR
Station Check-in
Station Check-out
```

Do not close the iOS backlog based only on build or lint success.

---

# 19. Rollback

## Backend code

Redeploy the previous known-good commit.

Do not rewrite Production Git history destructively.

## Database

Prisma migrations do not automatically reverse.

When migration/data impact is unsafe:

```text
stop writes when required
restore pre-deploy backup
redeploy previous known-good Backend
run health and data verification
document the incident
```

Database recovery requires the server owner.

## Frontend

Restore or redeploy the previous known-good frontend artifact.

Check Backend/Frontend compatibility before partial rollback.

---

# 20. Agent Permission Rules

The AI agent may perform repository-local actions when requested:

```text
inspect
edit
test
commit
prepare merge
prepare workflow inputs
write operator instructions
```

Explicit approval is required before:

```text
push
merge master when not already approved
run a Production workflow
SSH to Production
run pg_dump
run Production migrations
run Production seed
restart PM2/systemd
reload Nginx
modify Production .env
modify secrets
rotate/revoke QR
run destructive Production smoke
```

When access is missing, provide commands for the authorized server owner.

---

# 21. Required Final Report

After any Production release task, report:

```text
1. Repository branch and deployed commit
2. Backend workflow run ID
3. Frontend workflow run ID
4. Backup confirmation
5. Base and target commits
6. Database changes detected
7. Migration executed or skipped
8. Seed executed or skipped
9. db:verify result
10. Backend health
11. Frontend HTTPS
12. /api routing
13. /qr-login direct and refresh
14. CORS result
15. Smoke tests
16. QR reissue status
17. iPhone verification status
18. Remaining risks
19. Rollback readiness
20. Actions not performed
```

Separate:

```text
Confirmed
Inferred
Not verified
Blocked by missing access
Requires server owner
```

Never claim Production is deployed or verified without live evidence.

---

# 22. Minimal Handoff for the Server Owner

```text
Code has been merged to master.
No Production deployment was executed by the current operator.

Server owner must:

1. Confirm a fresh PostgreSQL backup.
2. Confirm the currently deployed Backend commit.
3. Confirm Production .env and secrets.
4. Run Deploy Backend (ECS) manually.
5. Verify migration/seed decisions, db:verify, process health, and logs.
6. Confirm Backend is healthy.
7. Run Deploy Frontend (Nginx) manually.
8. Verify HTTPS, /api, /qr-login, CORS, and SPA refresh.
9. Run approved non-destructive smoke tests.
10. Prepare and test new SQ1 Station QR artifacts.
11. Keep Legacy compatibility until physical QR replacement is complete.
```
