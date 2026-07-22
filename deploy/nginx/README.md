# Nginx Frontend Deploy

Use this when `heroes.nalth.top` is served by Nginx on the ECS host.

Production frontend deployment is intentionally staged separately from the
backend deployment. The GitHub workflow `.github/workflows/fe-deploy.yml` is
manual-only and should be run only after the backend Phase 1 workflow has
completed, migrations and seed verification have passed, and backend health has
been checked.

See `deploy/PRODUCTION_STAGED_DEPLOY.md` for the full two-phase Production
runbook, backup gate, stop conditions, and rollback notes.

Do not deploy the frontend from an automatic `push` trigger. The app should be
built without `VITE_API_BASE_URL` so browser requests use same-origin `/api/...`
through this Nginx reverse proxy.

## Manual GitHub Workflow

Run **Deploy Frontend (Nginx)** with:

```text
target_branch: master
deploy_frontend: deploy-frontend
```

If the repository environment `production-frontend` has required reviewers, the
workflow waits for that approval before executing the ECS/Nginx deploy.

## Build Frontend

Build without `VITE_API_BASE_URL` so the app uses same-origin `/api/...` calls:

```bash
cd /opt/movement/app/fe
unset VITE_API_BASE_URL
npm ci
npm run build
```

## Publish Static Files

```bash
sudo mkdir -p /var/www/movement/current
sudo rsync -a --delete dist/ /var/www/movement/current/
```

## Install Nginx Config

```bash
sudo cp /opt/movement/app/deploy/nginx/movement.conf /etc/nginx/sites-available/heroes.nalth.top
sudo ln -sfn /etc/nginx/sites-available/heroes.nalth.top /etc/nginx/sites-enabled/heroes.nalth.top
sudo nginx -t
sudo systemctl reload nginx
```

## Verify

```bash
curl -i https://heroes.nalth.top/ | head
curl -i https://heroes.nalth.top/qr-login | head
curl -i "https://heroes.nalth.top/qr-login?token=placeholder" | head
curl -i https://heroes.nalth.top/login | head
curl -i https://heroes.nalth.top/stations | head
curl -i https://heroes.nalth.top/teams | head
curl -i https://heroes.nalth.top/favicon.svg | head
curl -i https://heroes.nalth.top/assets/missing.js | head
curl -i https://heroes.nalth.top/api/docs | head
```

Expected behavior:

- `/`, `/login`, `/stations`, `/teams`, and other frontend routes return `index.html`.
- Existing JS/CSS/image assets return the physical files.
- Missing JS/CSS/image assets return `404`.
- `/api/*` is proxied to the Nest backend and is not rewritten to `index.html`.
