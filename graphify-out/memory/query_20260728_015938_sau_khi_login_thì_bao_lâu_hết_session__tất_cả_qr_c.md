---
type: "query"
date: "2026-07-28T01:59:38.687313+00:00"
question: "Sau khi login thì bao lâu hết session? Tất cả QR có hết hạn hay không? Frontend build failed exit code 2 vì sao?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["auth.module.ts", "auth.service.ts", "jwt-auth.guard.ts", "store.ts", "player.service.ts", "admin.service.ts"]
---

# Q: Sau khi login thì bao lâu hết session? Tất cả QR có hết hạn hay không? Frontend build failed exit code 2 vì sao?

## Answer

Expanded from graph vocab: [authentication, auth, session, login, jwt, refresh, token, qrcode, expires, expired, revoke, revoked]. Backend JWT uses current/default JWT_EXPIRES_IN=12h and is fixed, not sliding; frontend persists local session for 24h, creating a 12h stale-client mismatch. Team QR Login is non-expiring by time and is invalidated by revoke/rotate/inactive Team. Newly generated Station QR uses expiresAt null, while Station QR validation rejects a non-null past expiresAt. Frontend build exit code 2 is caused by i18next and react-i18next being declared in package.json/package-lock.json but absent from fe/node_modules; tester-run only checks jsqr plus vite/tsc, so it can skip npm ci on a stale install.

## Outcome

- Signal: useful

## Source Nodes

- auth.module.ts
- auth.service.ts
- jwt-auth.guard.ts
- store.ts
- player.service.ts
- admin.service.ts