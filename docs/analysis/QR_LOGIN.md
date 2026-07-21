# QR Login

## URL Format

QR login codes contain the frontend website URL only:

```text
{FRONTEND_PUBLIC_URL}/qr-login?token={RAW_QR_LOGIN_TOKEN}
```

The QR code must not contain backend API URLs, usernames, passwords, team passwords, JWTs, refresh tokens, database credentials, or predictable team IDs as the authentication secret.

`FRONTEND_PUBLIC_URL` is normalized, so both `https://heroes.nalth.top` and `https://heroes.nalth.top/` generate:

```text
https://heroes.nalth.top/qr-login?token=<GENERATED_RAW_TOKEN>
```

## Local Browser Test

The repo tester frontend runs on port `4173` and proxies `/api` to the backend on port `3000`.

```env
FRONTEND_PUBLIC_URL=http://localhost:4173
```

Generated local browser QR URL:

```text
http://localhost:4173/qr-login?token=<GENERATED_RAW_TOKEN>
```

If running Vite dev directly, the default frontend port is `5173`; set `FRONTEND_PUBLIC_URL=http://localhost:5173`.

## Physical Phone LAN Test

A phone scanning `localhost` will point at the phone itself, not the development computer. Use the computer LAN IPv4 address.

On Windows, run:

```powershell
ipconfig
```

Find the active Wi-Fi or Ethernet adapter and use its `IPv4 Address`.

Example only:

```env
FRONTEND_PUBLIC_URL=http://192.168.1.100:4173
```

Generated LAN QR URL:

```text
http://192.168.1.100:4173/qr-login?token=<GENERATED_RAW_TOKEN>
```

For LAN testing:

- Start the frontend with host binding `0.0.0.0`.
- Ensure the backend listens on `0.0.0.0` when directly accessed, or let Vite preview proxy same-origin `/api` to the local backend.
- Keep the phone and development computer on the same network.
- Allow the frontend/backend ports through the firewall.

## Production

Production QR content must use HTTPS:

```env
FRONTEND_PUBLIC_URL=https://heroes.nalth.top
```

Generated production QR URL:

```text
https://heroes.nalth.top/qr-login?token=<GENERATED_RAW_TOKEN>
```

The production frontend should call the API through same-origin `/api`. Nginx must keep `/api/` as a backend proxy and use SPA fallback for frontend routes:

```nginx
location ^~ /api/ {
    proxy_pass http://movement_api;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

## Token Storage

QR login tokens are random Base64URL values generated with Node crypto. The raw token is returned only when a QR URL is created. The database stores only `tokenHash`.

The `qr_login_tokens` table associates a token with one team:

- `team_id`
- `token_hash`
- `expires_at`
- `consumed_at`
- `revoked_at`
- `usage_count`
- `max_usage_count`

Current policy is one-time use by default. Successful login consumes the token atomically before issuing the normal team session/JWT.

## Seed Behavior

Development seed creates missing QR login tokens for seeded teams when:

```env
NODE_ENV != production
SEED_QR_LOGIN_TOKENS is not false
```

Seed writes newly generated raw QR URLs to:

```text
.tester-logs/dev-qr-login-urls.txt
```

This file is development-only and ignored by Git. Do not commit raw QR tokens.

Repeated seed runs preserve existing active QR login tokens and do not rotate printed QR codes. If a token already exists, seed cannot re-display the raw token because only the hash is stored.

Production deploy runs seed with `NODE_ENV=production`; it does not generate or print QR login secrets.

## Team 1 Development QR

For a clean local database:

```powershell
npm.cmd --prefix be run prisma:deploy
npm.cmd --prefix be run seed
```

Then open:

```text
.tester-logs/dev-qr-login-urls.txt
```

Find `Username: team01`. The QR URL shown there is the Team 1 development QR URL.

## Regenerate Or Revoke

Production QR generation should use authenticated Admin actions.

Generate or rotate:

```http
POST /api/admin/teams/:teamId/qr-login
POST /api/admin/teams/:teamId/qr-login/rotate
```

Revoke current active token:

```http
DELETE /api/admin/teams/:teamId/qr-login
```

The Admin System Config team list also exposes Generate QR, QR status, and Revoke QR controls.

## Manual Test

1. Generate a QR URL from Admin or development seed.
2. Open `/qr-login?token=<GENERATED_RAW_TOKEN>`.
3. Confirm the browser URL is changed to `/qr-login` without the token.
4. Confirm the frontend calls `POST /api/auth/qr-login`.
5. Confirm successful login redirects to `/stations/map`.
6. Refresh `/qr-login` directly and confirm the SPA route does not 404.
7. Try the same token again and confirm it is rejected as already used.
