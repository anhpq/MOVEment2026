# Production Staged Deployment

Use this runbook only after the completed commits are ready to deploy and an
operator has explicit approval to touch Production.

Do not use push-triggered deployment for Production. Backend and frontend deploy
as two independent manual GitHub Actions phases.

## Phase 0 - Preflight

1. Confirm the intended deploy branch, normally `master`.
2. Confirm `master` contains the approved commits.
3. Confirm the Production ECS host has `/opt/movement/app/be/.env`.
4. Confirm `be/.env` contains production values:
   - `NODE_ENV=production`
   - `PORT=8080`
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CORS_ORIGIN=https://heroes.nalth.top`
   - `FRONTEND_PUBLIC_URL=https://heroes.nalth.top`
5. Take a fresh PostgreSQL backup before Phase 1.
6. Confirm the deployed backend marker exists at
   `/opt/movement/deploy-markers/movement-api.commit`, or prepare the exact
   `base_commit` for the first conditional backend deploy.

Backup command on the Production host:

```bash
cd /opt/movement/app/be
set -a
source .env
set +a
mkdir -p /opt/movement/backups
pg_dump "$DATABASE_URL" --format=custom --file "/opt/movement/backups/movement-$(date -u +%Y%m%dT%H%M%SZ).dump"
```

Do not print or copy the raw `DATABASE_URL`, `JWT_SECRET`, QR
tokens, or SSH keys into logs, issues, workflow files, or chat.

## Phase 1 - Backend

Run GitHub Actions workflow **Deploy Backend (ECS)** manually:

```text
target_branch: master
backup_confirmed: BACKUP_CONFIRMED
deploy_backend: deploy-backend
base_commit: optional, required when the server marker is missing
target_commit: optional, defaults to origin/master on the ECS host
force_database_steps: false
```

If the `production-backend` GitHub Environment has required reviewers, wait for
approval before the job proceeds.

The workflow:

1. refreshes `/opt/movement/app` without deleting protected host files;
2. requires protected host `be/.env`;
3. resolves `TARGET_COMMIT` from `target_commit` or `origin/master`;
4. resolves `BASE_COMMIT` from the workflow input or the protected deployment
   marker;
5. stops if neither `base_commit` nor the deployment marker is available;
6. compares the complete `BASE_COMMIT..TARGET_COMMIT` range for database paths;
7. prints a non-secret database plan summary;
8. runs `npm run prisma:generate`;
9. conditionally runs `npm run prisma:deploy`;
10. conditionally runs `npm run prisma:seed`;
11. conditionally runs `npm run db:verify`;
12. runs `npm run build`;
13. restarts `movement-api` through PM2 or systemd;
14. conditionally runs post-restart `npm run db:verify`;
15. checks `http://127.0.0.1:8080/api/docs`;
16. updates `/opt/movement/deploy-markers/movement-api.commit` only after all
    required database steps, build, restart, verification, and health checks pass.

Database-related paths include Prisma schema, migrations, seed files,
`be/prisma/init.sql`, `be/prisma.config.ts`, database verification scripts, and
deployment/package scripts that can change migration or seed behavior.

Conditional database behavior:

- No database-related changes: skip `prisma migrate deploy`, Production seed,
  and `db:verify`; still install, generate Prisma Client, build, restart, and
  check backend health.
- Schema or migration changes: run Prisma Client generation, `prisma migrate
  deploy`, and `db:verify`.
- Seed-only changes: run Production-safe seed and `db:verify` without running
  `prisma migrate deploy`.
- Combined schema/migration and seed changes: run migration first, then seed,
  then `db:verify`.
- `force_database_steps: true`: run migration, seed, and `db:verify`
  regardless of detected changes.

Stop immediately if Phase 1 fails. Do not start Phase 2 until backend health and
database verification are green.

## Phase 2 - Frontend

Run GitHub Actions workflow **Deploy Frontend (Nginx)** manually only after
Phase 1 succeeds:

```text
target_branch: master
deploy_frontend: deploy-frontend
```

If the `production-frontend` GitHub Environment has required reviewers, wait for
approval before the job proceeds.

The workflow:

1. refreshes `/opt/movement/app` to the selected branch;
2. unsets `VITE_API_BASE_URL`;
3. runs `npm ci`;
4. runs `npm run build`;
5. syncs `fe/dist` to `/var/www/movement/current`;
6. installs the checked-in Nginx config;
7. runs `sudo nginx -t`;
8. reloads Nginx;
9. checks HTTPS root, `/api/docs`, `/qr-login`, refresh-style `/qr-login`, and
   missing asset `404`.

## Post-Deploy Checks

Run non-destructive checks first:

```bash
curl -i https://heroes.nalth.top/ | head
curl -i https://heroes.nalth.top/api/docs | head
curl -i https://heroes.nalth.top/qr-login | head
curl -i "https://heroes.nalth.top/qr-login?token=placeholder" | head
curl -i https://heroes.nalth.top/assets/missing.js | head
```

Then verify application behavior without rotating or revoking QR tokens:

- Admin login.
- Team username/password login.
- Existing reusable Team QR login.
- SQ1 Station Check-in and Check-out with current printed/test QR where allowed.
- Leaderboard loading.
- Final availability according to Event Config.

## Stop Conditions

Stop and do not continue to the next phase when any of these occur:

- no fresh Production database backup;
- missing deployment marker and no explicit `base_commit`;
- missing or unsafe Production environment variable;
- migration, seed, or `db:verify` failure;
- backend build or health check failure;
- Nginx config validation failure;
- frontend HTTPS, `/api`, SPA fallback, or `/qr-login` check failure;
- raw QR token, JWT secret, database URL, or SSH key appears in logs;
- unexpected QR token rotation/revocation would be required.

## Rollback

Backend rollback requires both code and data consideration:

1. Preserve the failing logs.
2. Redeploy the previous known-good commit or branch if no migration/data
   rollback is needed.
3. Restore the pre-deploy PostgreSQL backup into a disposable database first.
4. Restore Production from backup only with explicit approval.

Frontend rollback:

1. Redeploy the previous known-good frontend commit through **Deploy Frontend
   (Nginx)**.
2. If the Nginx config reload failed, keep the existing Nginx config active and
   do not overwrite it manually without approval.

Legacy QR compatibility must remain enabled until physical QR replacement is
confirmed.
