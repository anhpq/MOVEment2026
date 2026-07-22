# MOVEment 2026 - Automatic URL QR Login

## Vai trò của tài liệu

Tài liệu này là **Feature Analysis** cho Automatic URL QR Login của Team.

Nó mô tả:

- QR Login URL format;
- Team QR token policy;
- token generation và storage;
- frontend `/qr-login` flow;
- Team session behavior;
- seed behavior;
- Admin rotate/revoke flow;
- Legacy compatibility;
- deployment và verification.

Business Rule chính thức nằm tại:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

Feature routing nằm tại:

```text
docs/analysis/FEATURE_INDEX.md
```

Implementation history nằm tại:

```text
docs/analysis/BACKEND_AUDIT.md
```

Nếu tài liệu này mâu thuẫn với `OPEN_QUESTIONS_AND_DECISIONS.md`, Source of Truth được ưu tiên.

---

# 1. Mục tiêu

Mỗi Team phải có một QR Login riêng.

Expected flow:

```text
Scan QR
→ mở frontend URL
→ frontend đọc token
→ frontend gọi backend
→ backend xác thực token
→ backend tạo Team session
→ frontend cập nhật auth state
→ redirect vào ứng dụng
```

User không cần nhập:

- username;
- password;
- Team code;
- raw token thủ công.

Manual username/password login có thể tiếp tục tồn tại cho đến khi user quyết định loại bỏ.

---

# 2. Phân biệt các loại QR

## Team QR Login

Dùng để authenticate Team.

Format:

```text
{FRONTEND_PUBLIC_URL}/qr-login?token={RAW_TEAM_QR_TOKEN}
```

## Station Check-in QR

Dùng để Check-in Station.

## Station Check-out QR

Dùng để Check-out Station.

Team QR Login và Station QR không được dùng chung token.

Không được dùng Station QR để đăng nhập.

Không được dùng Team QR Login để thực hiện Station action.

---

# 3. URL Format

QR Login phải chứa frontend URL:

```text
{FRONTEND_PUBLIC_URL}/qr-login?token={RAW_TEAM_QR_TOKEN}
```

Production example:

```text
https://heroes.nalth.top/qr-login?token=<GENERATED_RAW_TOKEN>
```

Local browser example:

```text
http://localhost:4173/qr-login?token=<GENERATED_RAW_TOKEN>
```

Vite dev example:

```text
http://localhost:5173/qr-login?token=<GENERATED_RAW_TOKEN>
```

Không dùng backend API URL trực tiếp trong QR.

Frontend chịu trách nhiệm:

1. hiển thị public route;
2. đọc token;
3. gọi backend;
4. cập nhật auth state;
5. redirect.

---

# 4. QR Payload Security

QR Login không được chứa:

- username;
- password;
- Team password;
- JWT access token;
- refresh token;
- database credential;
- raw database ID làm authentication secret;
- predictable Team code làm authentication secret;
- deterministic token sinh từ `teamId`.

Không sử dụng làm format chính thức:

```text
team01:team01
team01/team01
MV26-TEAM-01-LOGIN
```

Các format trên chỉ có thể tồn tại tạm thời dưới nhãn Legacy Compatibility.

---

# 5. Team QR Token Policy

## 5.1 Một active token cho mỗi Team

Mỗi Team có một active Automatic URL QR Login token tại một thời điểm.

Token phải:

- gắn với đúng Team;
- random;
- opaque;
- unique;
- revocable;
- rotatable;
- có thể expire hoặc giới hạn theo Event;
- không suy ra từ `teamId`;
- không chứa credential plaintext.

## 5.2 Reusable Controlled Token

Automatic URL QR Login token là **Reusable Controlled Token** trong thời gian còn hiệu lực.

Một lần login thành công không tự động consume token vĩnh viễn.

Token có thể dùng lại khi:

- Team cần đăng nhập lại;
- Team đổi thiết bị;
- browser bị logout;
- session cũ bị revoke;
- thiết bị gặp lỗi trong Event.

Mỗi lần login thành công vẫn phải áp dụng:

```text
One active session per Team
```

Login mới revoke active Team session cũ.

## 5.3 Không phải Permanent Secret

Reusable không có nghĩa là token tồn tại vĩnh viễn.

Token phải hỗ trợ:

- expiry hoặc Event validity;
- Admin revoke;
- Admin rotate;
- rate limiting;
- audit logging;
- active Team validation.

## 5.4 Rotation

Khi rotate:

1. generate token mới;
2. tạo secure token record mới;
3. revoke token cũ;
4. token cũ bị từ chối ngay;
5. tạo QR URL hoặc QR artifact mới;
6. không thay đổi username/password của Team.

## 5.5 Revocation

Admin có thể revoke QR token mà không cần xóa Team.

Sau revoke:

- QR cũ không đăng nhập được;
- Team vẫn tồn tại;
- Admin có thể generate token mới sau đó.

---

# 6. Automatic Token Provisioning

## Khi tạo Team mới

Backend phải:

1. tạo Team record;
2. generate secure random token;
3. kiểm tra uniqueness;
4. tạo token record;
5. tạo QR URL hoặc QR artifact;
6. commit trong cùng logical operation hoặc transaction.

Nếu không thể tạo required QR token:

- không được báo Team creation hoàn tất đầy đủ;
- operation phải rollback nếu QR token là invariant bắt buộc;
- API trả safe error rõ ràng.

User không cần tự nghĩ raw QR token.

## Missing Token Repair

Seed hoặc maintenance command phải:

1. tìm active Team đang thiếu active token;
2. generate token mới;
3. tạo token record;
4. không rotate Team đã có active token hợp lệ;
5. ghi local output an toàn khi cần.

Đổi Team name hoặc metadata không được tự rotate QR token.

---

# 7. Token Generation

Token phải được tạo bằng Cryptographically Secure Random Generator.

Ví dụ implementation:

```text
crypto.randomBytes(...)
```

Recommended raw token:

- Base64URL;
- tối thiểu 128 bits entropy;
- không có sequence;
- không chứa timestamp dễ đoán;
- không chứa `teamId`;
- không chứa username.

Example minh họa:

```text
f4mJrR6uJ1dU9J5YQ2NqVvP2r4L8sB3xQ7kWcT9aH0E
```

Không hard-code example vào seed hoặc production.

---

# 8. Token Storage Model

Recommended fields:

```text
id
team_id
token_fingerprint
token_hash
is_active
created_at
updated_at
expires_at
revoked_at
last_used_at
usage_count
created_by
revoked_by
```

## `token_fingerprint`

SHA-256 fingerprint hoặc lookup-safe digest dùng để tìm record nhanh.

Fingerprint phải unique.

## `token_hash`

Secure verification hash nếu implementation dùng fingerprint lookup và secondary verification.

## `expires_at`

Có thể null nếu Event validity được enforce bằng cơ chế khác.

## `last_used_at`

Ghi successful login gần nhất.

## `usage_count`

Dùng cho audit và abuse detection.

Không dùng `usage_count = 1` như one-time consume policy trừ khi Business Rule được thay đổi chính thức.

Không lưu raw token plaintext chỉ để tiện đọc lại.

---

# 9. Raw Token và Reprint Strategy

Nếu chỉ lưu hash, hệ thống không thể đọc lại raw token.

Để Admin có thể in lại cùng QR, chọn một trong các phương án sau.

## Option A — Encrypted Raw Token

Lưu raw token dưới dạng encrypted ciphertext.

Yêu cầu:

- encryption key nằm ngoài database;
- không commit key vào repository;
- API chỉ trả raw token cho Admin có quyền;
- audit access;
- không log plaintext.

## Option B — Protected QR Artifact

Tạo QR image hoặc artifact khi generate và lưu ở protected storage.

Database lưu reference đến artifact.

## Option C — One-time Display + Rotate to Reprint

Không lưu raw token hoặc artifact.

Raw token chỉ hiển thị một lần.

Nếu cần in lại:

```text
rotate token
→ tạo QR mới
→ revoke QR cũ
```

Implementation phải ghi rõ option đang sử dụng.

Không tuyên bố có thể retrieve raw token từ hash.

---

# 10. Backend Endpoint

Expected endpoint:

```http
POST /api/auth/qr-login
```

Request:

```json
{
  "token": "<RAW_TEAM_QR_TOKEN>"
}
```

Backend phải:

1. validate input;
2. reject empty hoặc malformed token;
3. tính fingerprint;
4. lookup token record;
5. verify secure hash nếu có;
6. kiểm tra active;
7. kiểm tra chưa revoke;
8. kiểm tra chưa expire;
9. kiểm tra Team tồn tại và active;
10. enforce rate limiting;
11. tạo cùng Team session/JWT như normal Team login;
12. revoke Team session cũ;
13. cập nhật `last_used_at`;
14. tăng `usage_count`;
15. trả normalized auth response;
16. không log raw token.

Backend không được consume reusable token sau successful login.

---

# 11. Team Session Policy

QR Login và username/password login dùng chung session policy:

```text
Mỗi Team chỉ có một active session tại một thời điểm.
```

Khi Team QR Login thành công trên thiết bị mới:

1. backend tạo session mới;
2. backend revoke session cũ;
3. thiết bị cũ bị từ chối ở authenticated request tiếp theo;
4. QR token vẫn active nếu chưa expire hoặc revoke.

Phân biệt:

```text
QR token = credential để tạo session
Team session = authenticated runtime session
```

Session hết hạn không đồng nghĩa QR token bị revoke.

---

# 12. Frontend Public Route

Route:

```text
/qr-login?token=<RAW_TEAM_QR_TOKEN>
```

phải là public route.

Không được redirect sang `/login` trước khi validation hoàn tất.

Expected states:

```text
loading
success
error
```

## Loading

```text
Đang xác thực mã QR...
```

## Success

1. nhận auth response;
2. lưu session/JWT bằng existing auth flow;
3. load current Team;
4. redirect tới normal Team destination.

Expected destination hiện tại có thể là:

```text
/stations/map
```

Nếu normal Team destination đổi, QR Login phải dùng cùng destination.

## Error

Giữ user trên `/qr-login`.

Không silent redirect về `/login`.

Hiển thị error và cho phép:

- Thử lại;
- Quay về Login;
- dùng manual login nếu còn hỗ trợ.

---

# 13. URL Token Removal

Raw token không nên tồn tại lâu trong visible browser URL.

Frontend phải remove query token bằng router replace hoặc `history.replaceState` sau khi đã giữ token an toàn trong memory.

Expected visible URL:

```text
/qr-login
```

Không ghi raw token vào:

- production console;
- analytics URL;
- error breadcrumb;
- page title;
- screenshot automation;
- external referrer.

---

# 14. Duplicate Request Protection

Frontend phải chống duplicate request do:

- rerender;
- React Strict Mode;
- double effect;
- back/forward navigation;
- double-click;
- retry đồng thời.

Recommended guards:

```text
hasStartedRef
requestId
isSubmitting
```

Backend vẫn phải xử lý duplicate request an toàn.

Với reusable token, duplicate request không được làm session state hỏng hoặc tạo session churn không cần thiết.

---

# 15. Safe Error Mapping

## Missing Token

```text
Link đăng nhập không có token.
```

## Invalid Token

```text
Mã đăng nhập không hợp lệ.
```

## Expired Token

```text
Mã đăng nhập đã hết hạn.
```

## Revoked Token

```text
Mã đăng nhập đã bị thu hồi.
```

## Disabled Team

```text
Đội hiện không hoạt động.
```

## Rate Limited

```text
Có quá nhiều lần thử đăng nhập. Vui lòng chờ rồi thử lại.
```

## Network Error

```text
Không thể kết nối máy chủ.
```

## Unknown Error

```text
Không thể đăng nhập bằng mã QR.
```

Không hiển thị stack trace, SQL error, raw server HTML, token hash hoặc raw token.

---

# 16. Admin Token Management

Admin UI hoặc Admin API phải hỗ trợ:

- xem Team có active token hay không;
- generate token khi thiếu;
- rotate token;
- revoke token;
- xem created time;
- xem expiry;
- xem last used;
- xem usage count;
- tải hoặc copy QR URL theo storage strategy;
- tải QR image nếu Feature hỗ trợ.

Expected route aliases có thể là:

```http
POST /api/admin/teams/:teamId/qr-login
POST /api/admin/teams/:teamId/qr-login/rotate
DELETE /api/admin/teams/:teamId/qr-login
```

Admin endpoint phải:

- require authenticated Admin;
- enforce authorization;
- audit action;
- không log raw token;
- chỉ trả raw token khi thực sự tạo token mới hoặc storage strategy cho phép retrieve an toàn.

---

# 17. Seed Behavior

## Local/Test Seed

Local/test seed phải:

1. tạo Team example data;
2. kiểm tra active QR token;
3. generate token nếu thiếu;
4. preserve active token khi chạy lại;
5. không rotate printed token ngoài ý muốn;
6. ghi generated raw URL vào local-only output khi cần;
7. không commit raw token output.

Possible local output:

```text
.tester-logs/dev-qr-login-urls.txt
```

File phải nằm trong `.gitignore`.

## Idempotency

Chạy seed nhiều lần không được:

- tạo duplicate Team;
- tạo duplicate active QR token;
- rotate token đang active;
- làm invalid QR đã in;
- tăng token inventory không kiểm soát;
- overwrite production data.

## Production Safety

Production seed không được:

- generate và print raw token vào CI/CD log;
- dùng local Team credentials;
- dùng deterministic token;
- tự rotate token đã phát hành;
- tạo test Team ngoài explicit production setup.

Production QR generation phải thông qua authenticated Admin hoặc controlled provisioning process.

---

# 18. Local Browser Test

Example:

```env
FRONTEND_PUBLIC_URL=http://localhost:4173
```

Generated URL:

```text
http://localhost:4173/qr-login?token=<GENERATED_RAW_TOKEN>
```

Test:

1. start backend;
2. start frontend;
3. seed local data;
4. lấy generated local URL;
5. mở URL;
6. xác nhận `/qr-login` không redirect sớm;
7. xác nhận backend request;
8. xác nhận login thành công;
9. xác nhận redirect;
10. mở lại cùng QR URL;
11. xác nhận reusable token vẫn login được;
12. xác nhận session trước bị replace.

---

# 19. Physical Phone LAN Test

Phone mở `localhost` sẽ trỏ về chính phone.

Dùng LAN IPv4 của development computer.

Example:

```env
FRONTEND_PUBLIC_URL=http://192.168.1.100:4173
```

Generated URL:

```text
http://192.168.1.100:4173/qr-login?token=<GENERATED_RAW_TOKEN>
```

Yêu cầu:

- phone và computer cùng network;
- frontend bind `0.0.0.0`;
- firewall cho phép frontend port;
- backend hoặc proxy có thể truy cập.

LAN HTTP có thể dùng test URL navigation và login flow.

Camera scanner trên phone có thể cần HTTPS.

---

# 20. Production Deployment

Production:

```env
FRONTEND_PUBLIC_URL=https://heroes.nalth.top
```

Nginx hoặc reverse proxy phải:

1. giữ `/api/` cho backend;
2. giữ SPA fallback cho frontend;
3. không rewrite `/api/` thành `index.html`;
4. support direct `/qr-login`;
5. support refresh `/qr-login`;
6. preserve HTTPS;
7. không tạo mixed-content request.

Example:

```nginx
location ^~ /api/ {
    proxy_pass http://movement_api;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

Phải verify active production config, không chỉ repository template.

---

# 21. Legacy Compatibility

Legacy format có thể tồn tại:

```text
MV26-TEAM-01-LOGIN
```

Legacy endpoint có thể tồn tại:

```http
POST /api/auth/team-qr-login
```

Legacy flow phải được đánh dấu:

```text
Legacy Compatibility
```

Không gọi Legacy predictable token là Automatic URL QR Login chính thức.

Migration strategy:

1. giữ Legacy endpoint tạm thời nếu rehearsal cần;
2. generate secure URL token cho mỗi Team;
3. phát hành QR mới;
4. theo dõi Legacy usage;
5. disable Legacy format sau migration;
6. xóa predictable token support khi user chấp thuận.

---

# 22. Known Implementation Gap

Implementation audit trước đây ghi nhận Automatic URL QR token đang bị consume theo one-time policy.

Confirmed Business Rule hiện tại yêu cầu:

- mỗi Team có một active QR Login token;
- token hỗ trợ rotate/revoke;
- Team creation và seed tự động provision token;
- Team có thể dùng QR để đăng nhập lại;
- login mới revoke Team session cũ.

Do đó one-time consume behavior là **Implementation Gap** cần audit và migrate sang Reusable Controlled Token.

Không thay đổi database hoặc Source Code chỉ bằng việc sửa tài liệu này.

Implementation task phải dùng:

```text
docs/prompts/10_CODEX_QR_AUTO_LOGIN_AND_SEED_TOKENS_PROMPT.md
```

và phải:

1. inspect current schema;
2. inspect consumed-token logic;
3. report migration impact;
4. preserve security;
5. update tests;
6. update audit và backlog.

---

# 23. Verification Matrix

## Backend

- [ ] Valid reusable token login.
- [ ] Same token login lại khi active.
- [ ] New login revokes old Team session.
- [ ] Invalid token rejected.
- [ ] Revoked token rejected.
- [ ] Expired token rejected.
- [ ] Inactive Team rejected.
- [ ] Raw token not logged.
- [ ] Rate limit enforced.
- [ ] `usage_count` increments.
- [ ] `last_used_at` updates.
- [ ] Rotate invalidates old token.
- [ ] Revoke invalidates token.
- [ ] Missing token repair creates token.
- [ ] Team creation provisions token.

## Frontend

- [ ] `/qr-login` is public.
- [ ] Token read once.
- [ ] Token removed from visible URL.
- [ ] Duplicate request prevented.
- [ ] Auth state stored.
- [ ] Current Team loaded.
- [ ] Success redirects.
- [ ] Failure stays on `/qr-login`.
- [ ] Safe Vietnamese error displayed.

## Seed

- [ ] Local seed creates missing token.
- [ ] Second run does not rotate token.
- [ ] Second run does not duplicate active token.
- [ ] Production seed does not print raw token.
- [ ] Local token output ignored by Git.

## Deployment

- [ ] Direct `/qr-login` works.
- [ ] Refresh `/qr-login` works.
- [ ] `/api/` reaches backend.
- [ ] HTTPS works.
- [ ] No mixed content.
- [ ] Token does not leak into external logs or referrer.

---

# 24. Acceptance Criteria

Feature hoàn tất khi:

- [ ] Mỗi active Team có một active Automatic URL QR Login token.
- [ ] Team mới tự động có token.
- [ ] Seed bổ sung token còn thiếu.
- [ ] QR dùng frontend URL.
- [ ] Token random, opaque và không predictable.
- [ ] QR không chứa username/password.
- [ ] Token reusable trong thời gian còn active.
- [ ] Successful login không consume token.
- [ ] Token hỗ trợ revoke và rotate.
- [ ] Token hỗ trợ expiry hoặc Event validity.
- [ ] Login mới revoke session cũ.
- [ ] `/qr-login` là public route.
- [ ] Token bị xóa khỏi visible URL.
- [ ] Frontend không gửi duplicate request.
- [ ] Backend không log raw token.
- [ ] Seed idempotent.
- [ ] Production seed không output raw secret.
- [ ] Legacy format được đánh dấu hoặc migration hoàn tất.
- [ ] Backend tests pass.
- [ ] Frontend build pass.
- [ ] Production route smoke test pass.
- [ ] Documentation được đồng bộ.

---

# 25. Documentation Update Rules

Sau khi QR Login behavior thay đổi, cập nhật:

```text
docs/analysis/QR_LOGIN.md
docs/analysis/QR_PAYLOADS.md
docs/analysis/TEAM_LOGIN_DATA.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

Chỉ cập nhật:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

khi Business Rule thay đổi.

Cập nhật `FEATURE_INDEX.md` chỉ khi routing thay đổi.

Không đưa raw production token vào documentation.
