# MOVEment 2026 - Team Login Data

## Vai trò của tài liệu

Tài liệu này là **Local/Test Data Reference** cho Team login của MOVEment 2026.

Nó ghi:

- local/test Team accounts;
- username/password mẫu;
- cách lấy Automatic URL QR Login đã được generate;
- seed behavior;
- session behavior;
- environment safety;
- Legacy data cần migration.

Tài liệu này không phải Source of Truth cho Business Rule.

Business Rule chính thức nằm tại:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

Automatic URL QR Login analysis nằm tại:

```text
docs/analysis/QR_LOGIN.md
```

QR payload format nằm tại:

```text
docs/analysis/QR_PAYLOADS.md
```

Exact username, password, raw token, UUID và sample ID trong local/test không phải Business Rule, trừ khi user chốt rõ một giá trị cụ thể.

---

# 1. Environment Scope

Các credential trong file này chỉ dùng cho:

```text
local
development
test
rehearsal database
```

Không dùng các credential mẫu này cho Production.

Production không được:

- seed password mẫu tự động;
- print raw Team QR token trong CI/CD log;
- commit raw token vào repository;
- dùng predictable Team QR token;
- dùng shared default password cho Team thật;
- tạo Team fixture mới khi thiếu `team01`...`team25`.

Ngoại lệ hẹp: Production seed được phép repair/overwrite chỉ trường `color` của existing seed-managed Team 01-25 theo username `team01`...`team25`; username thiếu được skip im lặng.

---

# 2. Local/Test Team Accounts

Sau khi chạy seed trong backend:

```powershell
npm.cmd --prefix be run seed
```

có thể dùng các account sau để test username/password login.

| Team | Username | Local/Test password | Automatic URL QR Login |
| --- | --- | --- | --- |
| Team 01 | `team01` | `team01` | Generated automatically |
| Team 02 | `team02` | `team02` | Generated automatically |
| Team 03 | `team03` | `team03` | Generated automatically |
| Team 04 | `team04` | `team04` | Generated automatically |
| Team 05 | `team05` | `team05` | Generated automatically |
| Team 06 | `team06` | `team06` | Generated automatically |
| Team 07 | `team07` | `team07` | Generated automatically |
| Team 08 | `team08` | `team08` | Generated automatically |
| Team 09 | `team09` | `team09` | Generated automatically |
| Team 10 | `team10` | `team10` | Generated automatically |
| Team 11 | `team11` | `team11` | Generated automatically |
| Team 12 | `team12` | `team12` | Generated automatically |
| Team 13 | `team13` | `team13` | Generated automatically |
| Team 14 | `team14` | `team14` | Generated automatically |
| Team 15 | `team15` | `team15` | Generated automatically |
| Team 16 | `team16` | `team16` | Generated automatically |
| Team 17 | `team17` | `team17` | Generated automatically |
| Team 18 | `team18` | `team18` | Generated automatically |
| Team 19 | `team19` | `team19` | Generated automatically |
| Team 20 | `team20` | `team20` | Generated automatically |
| Team 21 | `team21` | `team21` | Generated automatically |
| Team 22 | `team22` | `team22` | Generated automatically |
| Team 23 | `team23` | `team23` | Generated automatically |
| Team 24 | `team24` | `team24` | Generated automatically |
| Team 25 | `team25` | `team25` | Generated automatically |

Các account trên là test fixtures hiện tại.

Hệ thống không được hard-code giới hạn chỉ có 25 Team.

Team mới có thể được tạo thêm bằng seed, Admin UI hoặc backend API theo current project flow.

---

# 3. Password Login

Password login dùng:

```text
username
password
```

Ví dụ local/test:

```text
Username: team01
Password: team01
```

Password mẫu phải được hash theo password policy hiện tại của backend.

Không lưu plaintext password trong database.

Việc file này ghi plaintext password chỉ nhằm mục đích local/test handoff.

Production credential phải được provision bằng quy trình riêng.

---

# 4. Automatic URL QR Login

Mỗi Team phải có một active Automatic URL QR Login token.

Official QR payload:

```text
{FRONTEND_PUBLIC_URL}/qr-login?token={RAW_TEAM_QR_TOKEN}
```

Production pattern:

```text
https://heroes.nalth.top/qr-login?token=<GENERATED_RAW_TOKEN>
```

Local pattern:

```text
http://localhost:4173/qr-login?token=<GENERATED_RAW_TOKEN>
```

Raw token:

- do hệ thống tự generate;
- random;
- opaque;
- unique;
- không suy ra từ Team number;
- không chứa username/password;
- không được hard-code trong file này.

---

# 5. Không lưu danh sách Raw Token trong Repository

File này không liệt kê raw QR token của từng Team.

Lý do:

- raw token là authentication credential;
- token có thể rotate;
- token có thể revoke;
- raw token không thể phục hồi từ hash;
- committed documentation không phải secret storage;
- screenshot hoặc Git history có thể làm lộ token.

Không thêm bảng như:

```text
Team 01 | MV26-TEAM-01-LOGIN
Team 02 | MV26-TEAM-02-LOGIN
```

Không thêm generated production URL thật vào Markdown.

---

# 6. Cách lấy QR Login URL trong Local/Test

Sau khi seed hoặc provision token, implementation phải cung cấp generated URL bằng một local-safe mechanism.

Preferred local-only output:

```text
.tester-logs/dev-qr-login-urls.txt
```

File output phải:

- nằm trong `.gitignore`;
- chỉ được tạo ngoài Production;
- không được commit;
- không được upload lên issue hoặc chat công khai;
- không chứa token đã revoke;
- ghi rõ thời điểm generate khi hữu ích.

Possible output format:

```text
Team: Team 01
Username: team01
QR URL: http://localhost:4173/qr-login?token=<GENERATED_RAW_TOKEN>
```

Đây chỉ là format minh họa.

Exact raw token do seed hoặc provisioning command tạo.

Nếu implementation chọn protected QR artifact hoặc encrypted token storage, Admin UI có thể cung cấp cách tải hoặc in QR theo security policy đã chốt.

---

# 7. Seed Behavior

## 7.1 Team Seed

Khi seed một Team ngoài Production:

1. kiểm tra Team theo stable unique key;
2. tạo Team nếu chưa tồn tại;
3. hash local/test password;
4. kiểm tra active Automatic URL QR Login token;
5. generate token nếu thiếu;
6. preserve token đang active;
7. không rotate token ngoài ý muốn;
8. ghi local QR URL vào local-only output khi token mới được tạo;
9. gán Team 01-25 vào 25 màu `#RRGGBB` unique theo seed palette cố định.

Khi seed Team trong Production:

1. nhận diện seed-managed Team 01-25 bằng username `team01`...`team25`;
2. nếu Team tồn tại, chỉ update `color` theo seed palette cố định;
3. nếu Team thiếu, skip im lặng và không tạo fixture mới;
4. không reset password, username, QR credential, raw token, hoặc local/test fixture data.

Seed palette hiện tại là fixture/current seed palette, không phải Business Rule ngoài yêu cầu unique/repair/stable. Palette thắng custom color: nếu Admin chỉnh màu Team 01-25, lần seed sau vẫn repair lại theo palette.

## 7.2 Idempotency

Chạy seed nhiều lần không được:

- tạo duplicate Team;
- tạo duplicate username;
- tạo duplicate active token;
- rotate QR đã in;
- đổi password ngoài explicit seed policy;
- ghi đè Production data ngoài ngoại lệ color-only repair cho existing seed-managed Team 01-25;
- tạo thêm token active không cần thiết.

## 7.3 Missing Token Repair

Seed hoặc maintenance command phải có khả năng:

```text
Team tồn tại nhưng thiếu active QR token
→ generate token
→ gắn đúng Team
→ ghi local output an toàn
```

Không yêu cầu user tự nghĩ raw token.

---

# 8. Team Creation sau này

Khi Admin hoặc Codex tạo Team mới, user chỉ cần cung cấp business data như:

- Team name;
- username;
- password hoặc password provisioning policy;
- active status;
- metadata cần thiết.

Backend phải tự động:

1. tạo Team;
2. generate Automatic URL QR Login token;
3. gắn token đúng Team;
4. đảm bảo token unique;
5. tạo QR URL hoặc QR artifact;
6. rollback nếu required token provisioning thất bại.

User không cần cung cấp:

- raw QR token;
- token fingerprint;
- token hash;
- QR URL secret.

---

# 9. Team Session Rule

Password login và QR Login dùng chung Team session policy:

```text
Mỗi Team chỉ có một active session tại một thời điểm.
```

Khi Team login thành công trên thiết bị mới:

1. backend tạo session mới;
2. backend revoke session cũ;
3. thiết bị cũ nhận authentication failure hoặc `SESSION_REPLACED` ở request tiếp theo;
4. thiết bị cũ phải reload hoặc login lại.

QR token và Team session là hai object khác nhau.

Successful login không tự revoke reusable QR token.

---

# 10. Reusable Token Rule

Automatic URL QR Login token là Reusable Controlled Token trong thời gian còn active.

Same token có thể được dùng lại để đăng nhập Team.

Token bị từ chối khi:

- invalid;
- revoked;
- expired;
- ngoài Event validity;
- Team inactive;
- request bị rate limit.

Admin phải có khả năng:

- generate khi thiếu;
- rotate;
- revoke;
- xem status;
- tạo hoặc tải QR artifact theo storage strategy.

---

# 11. Legacy Login Data

Các format sau là Legacy:

```text
MV26-TEAM-01-LOGIN
MV26-TEAM-02-LOGIN
team01:team01
team01/team01
{"username":"team01","password":"team01"}
```

Legacy format:

- có thể còn tồn tại trong Source Code hoặc rehearsal scripts;
- không phải official format cho QR mới;
- không được generate cho Team mới;
- không được gọi là secure Production QR;
- phải được migrate hoặc loại bỏ sau compatibility window.

Official format mới là:

```text
{FRONTEND_PUBLIC_URL}/qr-login?token={RAW_TEAM_QR_TOKEN}
```

---

# 12. Current Implementation Gap

Historical implementation đã từng:

- seed predictable token như `MV26-TEAM-01-LOGIN`;
- dùng Legacy token-only endpoint;
- tạo Automatic URL token theo one-time consumption policy.

Confirmed documentation hiện yêu cầu:

- random Opaque Token;
- một active token cho mỗi Team;
- reusable controlled token;
- automatic provisioning;
- rotate/revoke;
- one-active-session policy.

Do đó Source Code, migration, seed, test và smoke scripts phải được audit trước khi đánh dấu Feature hoàn tất.

Implementation task sử dụng:

```text
docs/prompts/10_CODEX_QR_AUTO_LOGIN_AND_SEED_TOKENS_PROMPT.md
```

Việc replace file này không đồng nghĩa implementation đã được sửa.

---

# 13. Local/Test Verification

Sau khi implementation được cập nhật:

## Password Login

- [ ] `team01/team01` login thành công.
- [ ] Một Team khác login thành công.
- [ ] Password sai bị từ chối.
- [ ] Password database không lưu plaintext.

## QR Login

- [ ] Mỗi seeded Team có active token.
- [ ] QR URL dùng frontend `/qr-login`.
- [ ] Token random và opaque.
- [ ] Same QR login lại được khi token active.
- [ ] Login mới revoke session cũ.
- [ ] Revoked token bị từ chối.
- [ ] Rotated token cũ bị từ chối.
- [ ] Token mới hoạt động.
- [ ] Raw token không xuất hiện trong Git-tracked file.

## Seed

- [ ] Seed lần một hoàn tất.
- [ ] Seed lần hai không duplicate Team.
- [ ] Seed lần hai không duplicate active token.
- [ ] Seed lần hai không rotate token.
- [ ] Missing-token repair hoạt động.
- [ ] Production guard không output raw token.

---

# 14. Production Safety Checklist

- [ ] Không dùng `team01/team01` trong Production.
- [ ] Không có predictable Team QR token.
- [ ] Không có raw token trong repository.
- [ ] Không có raw token trong CI/CD log.
- [ ] `FRONTEND_PUBLIC_URL` dùng HTTPS.
- [ ] Admin action được authorization.
- [ ] Token revoke/rotate được audit.
- [ ] Token có expiry hoặc Event validity.
- [ ] Rate limiting được enforce.
- [ ] Team inactive không login được.
- [ ] Session replacement được enforce.

---

# 15. Documentation Update Rules

Khi Team account, password fixture, seed hoặc QR token inventory thay đổi, cập nhật:

```text
docs/analysis/TEAM_LOGIN_DATA.md
docs/analysis/QR_LOGIN.md
docs/analysis/QR_PAYLOADS.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

Chỉ cập nhật:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

khi Business Rule thay đổi.

Không ghi raw Production token vào documentation.
