---
type: "query"
date: "2026-07-28T02:24:40.793157+00:00"
question: "be và fe cần thống nhất, session sẽ hết vào 10 giờ tối; mỗi ngày, login 22:00 hôm nay hết hạn 22:00 hôm sau"
contributor: "graphify"
outcome: "useful"
source_nodes: ["auth.service.ts", "auth.module.ts", "store.ts", "api.ts", "apiClient.ts", "MovementProviders.tsx", "LoginPage.tsx", "QrLoginPage.tsx"]
---

# Q: be và fe cần thống nhất, session sẽ hết vào 10 giờ tối; mỗi ngày, login 22:00 hôm nay hết hạn 22:00 hôm sau

## Answer

Expanded from graph vocab: [authentication, auth, session, login, jwt, expires, expired, persist, persisted, store, time, timezone]. Implemented one Backend-authoritative next-daily 22:00 Asia/Ho_Chi_Minh cutoff for Admin and Team sessions. Login before 22:00 expires at 22:00 the same day; login exactly at or after 22:00 expires at 22:00 the next day. Backend uses the same instant for JWT exp and response expiresAt. Frontend persists that expiresAt without its former 24-hour TTL and globally clears local auth state at the cutoff. Removed tracked JWT_EXPIRES_IN=12h runtime configuration. Verification: Backend 148/148 tests, BE/FE lint and builds, Docker Compose config all passed.

## Outcome

- Signal: useful

## Source Nodes

- auth.service.ts
- auth.module.ts
- store.ts
- api.ts
- apiClient.ts
- MovementProviders.tsx
- LoginPage.tsx
- QrLoginPage.tsx