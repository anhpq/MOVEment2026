# Nginx Frontend Deploy

Use this when `heroes.nalth.top` is served by Nginx on the ECS host.

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
