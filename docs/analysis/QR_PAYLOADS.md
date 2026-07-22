# MOVEment 2026 - QR Payloads

## Vai trò của tài liệu

Tài liệu này định nghĩa các **QR payload family** được sử dụng trong MOVEment 2026.

Nó mô tả:

- Automatic URL Team QR Login;
- Station `CHECK_IN` QR;
- Station `CHECK_OUT` QR;
- payload classification;
- format validation;
- token generation;
- database mapping;
- Legacy compatibility;
- automatic provisioning;
- seed behavior;
- migration và verification.

Business Rule chính thức nằm tại:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

Automatic URL QR Login analysis nằm tại:

```text
docs/analysis/QR_LOGIN.md
```

QR Camera Scanning analysis nằm tại:

```text
docs/analysis/IOS_SAFARI_QR_CAMERA_FIX.md
```

Implementation history nằm tại:

```text
docs/analysis/BACKEND_AUDIT.md
```

Nếu tài liệu này mâu thuẫn với `OPEN_QUESTIONS_AND_DECISIONS.md`, Source of Truth được ưu tiên.

---

# 1. QR Payload Families

MOVEment 2026 có ba QR purpose chính:

| QR family | Mục đích |
| --- | --- |
| Automatic URL Team QR Login | Đăng nhập Team vào ứng dụng. |
| Station `CHECK_IN` QR | Bắt đầu Station cho Team đang đăng nhập. |
| Station `CHECK_OUT` QR | Kết thúc Station đang chơi. |

Ba loại QR này không được dùng thay thế cho nhau.

```text
Team QR Login != Station CHECK_IN != Station CHECK_OUT
```

Không được:

- dùng Station QR để đăng nhập Team;
- dùng Team QR Login để Check-in Station;
- dùng Check-in QR để Check-out;
- dùng Check-out QR để Check-in;
- dùng một raw token cho nhiều purpose.

---

# 2. Namespace và Versioning

## 2.1 Station QR

Station QR sử dụng namespace và schema version:

```text
MV26-SQ1
```

Trong đó:

```text
MV26 = MOVEment 2026 project namespace
SQ1  = Station QR schema version 1
```

## 2.2 Team QR Login

Automatic URL Team QR Login được nhận diện bởi trusted frontend URL và route:

```text
/qr-login
```

Token trong query string là Opaque Random Token.

Team QR không cần chứa `teamId`, username hoặc Team code để tự mô tả identity.

Backend xác định Team từ token record.

## 2.3 Future Versioning

Khi payload schema thay đổi không tương thích:

- tạo schema version mới;
- không âm thầm thay đổi meaning của format cũ;
- giữ parser compatibility có thời hạn nếu cần;
- ghi migration plan;
- không tái sử dụng token cũ cho schema mới.

Ví dụ future Station schema có thể dùng:

```text
MV26-SQ2-...
```

Không tạo `SQ2` nếu chưa có Business Rule hoặc technical need rõ ràng.

---

# 3. Automatic URL Team QR Login

## 3.1 Official Payload Format

```text
{FRONTEND_PUBLIC_URL}/qr-login?token={RAW_TEAM_QR_TOKEN}
```

Production example:

```text
https://heroes.nalth.top/qr-login?token=<GENERATED_RAW_TOKEN>
```

Local example:

```text
http://localhost:4173/qr-login?token=<GENERATED_RAW_TOKEN>
```

Các example chỉ minh họa.

Raw token thật do hệ thống tự generate.

## 3.2 Trusted URL Requirements

Team QR URL phải:

- dùng configured `FRONTEND_PUBLIC_URL`;
- dùng route `/qr-login`;
- dùng query parameter `token`;
- dùng HTTPS trong production;
- không trỏ trực tiếp vào backend API;
- không chứa username/password;
- không chứa JWT hoặc refresh token.

Frontend phải gọi backend thông qua API flow chính thức sau khi đọc token.

## 3.3 Raw Team Token

Raw Team token phải:

- random;
- opaque;
- unique;
- dùng Cryptographically Secure Random Generator;
- có tối thiểu 128 bits entropy;
- không suy ra từ `teamId`;
- không chứa username;
- không chứa password;
- không chứa Team display name;
- không chứa predictable sequence.

Recommended encoding:

```text
Base64URL
```

Example raw token:

```text
f4mJrR6uJ1dU9J5YQ2NqVvP2r4L8sB3xQ7kWcT9aH0E
```

Không hard-code example này.

## 3.4 Reusable Controlled Token

Team QR Login token là Reusable Controlled Token trong thời gian còn active.

Successful login không tự consume token vĩnh viễn.

Token chỉ bị từ chối khi:

- không tồn tại;
- không active;
- bị revoke;
- hết hạn;
- ngoài Event validity;
- Team không active;
- request bị rate limit;
- token không qua verification.

Login mới vẫn revoke active Team session cũ theo one-active-session rule.

---

# 4. Station QR Format

## 4.1 Official Format

```text
MV26-SQ1-<purposeCode>-<randomToken>
```

Trong đó:

| Thành phần | Ý nghĩa |
| --- | --- |
| `MV26` | Project namespace. |
| `SQ1` | Station QR schema version 1. |
| `purposeCode` | Nhãn trực quan cho purpose. |
| `randomToken` | Opaque Random Token. |

## 4.2 Purpose Code

```text
I = CHECK_IN
O = CHECK_OUT
```

Examples:

```text
MV26-SQ1-I-7K3D9M2Q8W6R4T5YH1CFN8ZP6A
MV26-SQ1-O-4R8X2N7P5W9K3D6M1QZT7BVC9F
```

Examples chỉ minh họa.

Không dùng chúng làm token thật.

## 4.3 Backend Authority

Ký tự `I` hoặc `O` chỉ hỗ trợ:

- nhận diện vận hành;
- QR labeling;
- troubleshooting;
- safe user feedback.

Backend không được quyết định action chỉ dựa vào `purposeCode`.

Backend phải lấy từ token record:

```text
station_id
purpose
is_active
revoked_at
expires_at
```

Database mapping là Source of Truth cho Station và purpose.

## 4.4 Random Token

Station `randomToken` phải:

- được tạo bằng Cryptographically Secure Random Generator;
- có tối thiểu 128 bits entropy;
- unique trên toàn hệ thống;
- không suy ra từ `stationId`;
- không chứa Station code;
- không chứa Station name;
- không dùng timestamp làm secret;
- không có quan hệ dự đoán được với token còn lại.

Recommended encoding:

```text
Base32 hoặc Base64URL không có ký tự gây khó khi in/scan
```

Nếu dùng format example `MV26-SQ1-*`, Base32 uppercase được ưu tiên để QR text dễ vận hành.

---

# 5. Station QR Pair

Mỗi active Station có đúng hai active QR token:

```text
1 CHECK_IN token
1 CHECK_OUT token
```

Hai token phải:

- được generate độc lập;
- khác nhau;
- có fingerprint khác nhau;
- có purpose record khác nhau;
- có thể rotate độc lập;
- có thể revoke độc lập.

Không được tạo Check-out token bằng cách thay:

```text
I → O
```

trên Check-in token.

Không được dùng cùng random portion cho hai purpose.

Example không hợp lệ:

```text
MV26-SQ1-I-ABC123...
MV26-SQ1-O-ABC123...
```

---

# 6. Automatic Provisioning

## 6.1 Khi tạo Team

Hệ thống phải:

1. tạo Team;
2. generate Team QR Login token;
3. kiểm tra uniqueness;
4. tạo secure token record;
5. tạo Team QR URL hoặc QR artifact;
6. commit operation.

User không cần tự nhập raw Team token.

## 6.2 Khi tạo Station

Hệ thống phải:

1. tạo Station;
2. generate `CHECK_IN` token;
3. generate `CHECK_OUT` token;
4. kiểm tra uniqueness;
5. tạo hai token record;
6. gắn đúng `station_id`;
7. gắn đúng database `purpose`;
8. commit trong cùng transaction.

Nếu không tạo được đủ hai token:

- transaction phải rollback;
- Station không được ở trạng thái hoàn chỉnh;
- API phải trả safe error.

User chỉ cần nhập Station business data như:

- name;
- description;
- tracking mode;
- max score;
- active status;
- gameplay configuration.

User không cần nhập:

- raw QR token;
- token fingerprint;
- token hash;
- Check-in token;
- Check-out token.

---

# 7. Database Mapping

## 7.1 Team QR Token Record

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

## 7.2 Station QR Token Record

Recommended fields:

```text
id
station_id
purpose
token_fingerprint
token_hash
is_active
created_at
updated_at
expires_at
revoked_at
created_by
revoked_by
```

## 7.3 Fingerprint

Fingerprint dùng để:

- lookup nhanh;
- enforce uniqueness;
- tránh scan toàn bộ secure hashes.

Recommended:

```text
SHA-256(rawToken)
```

Fingerprint không phải raw token.

## 7.4 Secure Hash

Secure hash dùng để secondary verification khi architecture yêu cầu.

Không lưu raw token plaintext chỉ để lookup.

## 7.5 Raw Token Retrieval

Hash không thể được dùng để phục hồi raw token.

Nếu cần reprint cùng QR, implementation phải dùng một trong các strategy:

- encrypted raw token;
- protected QR artifact;
- rotate token mới để reprint.

Strategy cụ thể phải được ghi rõ trong Feature implementation.

---

# 8. Payload Classification

Frontend hoặc shared parser có thể nhận decoded QR text từ camera hoặc manual input.

Classification order phải rõ ràng.

## 8.1 Automatic URL Team QR Login

Nhận diện khi:

- input parse được thành URL;
- origin hoặc allowed frontend host hợp lệ;
- pathname chính xác là `/qr-login`;
- có query parameter `token`.

Không tự gửi credential tới host lạ.

## 8.2 Station QR

Nhận diện bằng format cơ bản:

```text
^MV26-SQ1-[IO]-[A-Z2-7_-]+$
```

Regex thực tế phải phù hợp encoding được implementation chọn.

Format validation chỉ là bước đầu.

Token vẫn phải được backend lookup và verify.

## 8.3 Legacy Payload

Chỉ nhận diện khi Legacy Compatibility đang bật.

Legacy payload không được ưu tiên cao hơn official format.

## 8.4 Unknown Payload

Nếu không thuộc accepted family:

```text
Mã QR không đúng định dạng MOVEment 2026.
```

Không tự đoán payload purpose.

Không gửi unknown payload tới nhiều endpoint thử lần lượt.

---

# 9. Camera và Manual Input

Camera layer chỉ trả decoded text.

Camera layer không được:

- quyết định Team identity;
- quyết định Station identity;
- quyết định Check-in hoặc Check-out;
- bỏ qua backend validation;
- tự sửa token;
- tự convert Legacy token thành official token.

Manual input phải đi qua cùng:

- parser;
- format classification;
- API flow;
- backend validation;
- error mapping.

Không tạo validation yếu hơn cho manual input.

---

# 10. Format không được sử dụng

## 10.1 Predictable Team QR

Không tạo mới:

```text
MV26-TEAM-01-LOGIN
MV26-TEAM-02-LOGIN
MV26-TEAM-25-LOGIN
```

Lý do:

- lộ Team sequence;
- dễ đoán token Team khác;
- không đủ entropy;
- không phù hợp production authentication;
- khó quản lý compromise an toàn.

## 10.2 Credential QR

Không sử dụng:

```text
team01:team01
team01/team01
{"username":"team01","password":"team01"}
```

Lý do:

- lộ credential;
- QR photo trở thành password leak;
- không thể rotate QR độc lập với password;
- dễ bị lưu trong screenshot và log.

## 10.3 Predictable Station QR

Không tạo mới:

```text
MV26-STATION-ST002-CHECK_IN
MV26-STATION-ST002-CHECK_OUT
MV26-STATION-15-CHECK_IN
MV26-STATION-15-CHECK_OUT
MV26-STATION-0F-CHECK_IN
MV26-STATION-0F-CHECK_OUT
```

Lý do:

- lộ Station code hoặc ID;
- token khác có thể đoán được;
- Check-in và Check-out có quan hệ trực tiếp;
- không đủ entropy;
- hexadecimal chỉ là encoding, không phải encryption.

## 10.4 Encoded Database ID

Không dùng các encoding trực tiếp của `stationId` hoặc `teamId` làm secret:

```text
decimal
hexadecimal
Base64
zero-padded ID
reversed ID
hash không có secret với input dễ đoán
```

Encoding không tạo authentication security.

---

# 11. Legacy Compatibility

## 11.1 Legacy Team Token

Legacy format:

```text
MV26-TEAM-<teamNumber>-LOGIN
```

Legacy endpoint có thể là:

```http
POST /api/auth/team-qr-login
```

## 11.2 Legacy Station Token

Legacy format:

```text
MV26-STATION-<stationCode>-CHECK_IN
MV26-STATION-<stationCode>-CHECK_OUT
```

## 11.3 Legacy Status

Các Legacy format:

- có thể còn tồn tại trong current Source Code;
- có thể còn dùng trong rehearsal script;
- có thể còn xuất hiện trong old documentation;
- không phải official format cho data mới;
- không được gọi là secure production token;
- phải có migration plan.

## 11.4 Compatibility Rules

Nếu Legacy support còn bật:

1. đánh dấu code path là Legacy;
2. không generate Legacy token cho Team hoặc Station mới;
3. không dùng Legacy token trong production QR mới;
4. log usage bằng safe identifier, không log raw token;
5. giữ compatibility có thời hạn;
6. migrate printed QR;
7. disable Legacy sau khi user chấp thuận;
8. cập nhật tests và documentation.

---

# 12. Migration Strategy

## Phase 1 — Inventory

Inventory:

- Team có Legacy token;
- Team có Automatic URL token;
- Station có Legacy token;
- Station có `SQ1` token pair;
- printed QR đang được sử dụng;
- seed và smoke script phụ thuộc Legacy token;
- frontend parser còn chấp nhận format nào.

## Phase 2 — Provision New Tokens

- generate Automatic URL token cho Team thiếu token;
- generate `SQ1-I` và `SQ1-O` cho Station thiếu token;
- preserve active secure token khi chạy lại;
- không rotate ngoài ý muốn.

## Phase 3 — Reissue QR

- tạo Team QR URL mới;
- tạo Station Check-in QR mới;
- tạo Station Check-out QR mới;
- label rõ Station và purpose bên ngoài QR image;
- kiểm tra QR scan trước khi in hàng loạt.

## Phase 4 — Compatibility Window

- giữ Legacy parser tạm thời;
- theo dõi usage;
- update rehearsal scripts;
- update test fixtures;
- không tạo Legacy data mới.

## Phase 5 — Disable Legacy

- disable Legacy frontend parser;
- disable Legacy backend endpoint hoặc token lookup;
- xóa Legacy seed generation;
- update backlog và audit;
- giữ migration history.

---

# 13. QR Artifact Labeling

Raw token không chứa Station name hoặc Team name.

Để vận hành dễ dàng, QR image hoặc printed card phải có label bên ngoài QR.

## Team QR Label

Có thể hiển thị:

```text
MOVEment 2026
Team 01
Đăng nhập đội
```

## Station Check-in Label

Có thể hiển thị:

```text
MOVEment 2026
<Station Name>
CHECK IN
```

## Station Check-out Label

Có thể hiển thị:

```text
MOVEment 2026
<Station Name>
CHECK OUT
```

Label không thay thế backend token mapping.

Không in raw token dưới QR nếu không cần thiết.

Nếu in token text để manual fallback, phải hiểu rằng bất kỳ ai chụp được token đều có thể sử dụng nó trong thời gian còn active.

---

# 14. Rotation và Revocation

## Team Token

Rotate Team token:

1. generate token mới;
2. revoke token cũ;
3. tạo QR URL/artifact mới;
4. QR cũ bị từ chối;
5. Team session policy không thay đổi.

## Station Token

Có thể rotate độc lập:

```text
CHECK_IN only
CHECK_OUT only
```

Rotate Check-in không được tự rotate Check-out.

Rotate Check-out không được tự rotate Check-in.

## Compromise Response

Nếu QR bị lộ:

1. revoke token;
2. generate token mới;
3. reissue QR;
4. review audit log;
5. kiểm tra abnormal usage;
6. không đổi entity ID chỉ để xử lý token leak.

---

# 15. Seed Rules

Local/test seed phải:

- idempotent;
- generate token khi thiếu;
- preserve active secure token;
- không tạo duplicate active token;
- không rotate mỗi lần chạy;
- output raw token chỉ ở local-only artifact khi cần;
- không commit raw token artifact;
- không tự generate production secret.

Khi seed Team:

```text
Team exists?
→ active Team token exists?
→ if missing, generate
```

Khi seed Station:

```text
Station exists?
→ active CHECK_IN token exists?
→ if missing, generate
→ active CHECK_OUT token exists?
→ if missing, generate
```

Exact token value không thuộc Source of Truth.

Codex được tự generate token đúng policy.

---

# 16. API Validation Flow

## 16.1 Team QR Login

Backend:

1. nhận raw token;
2. validate input;
3. tính fingerprint;
4. lookup token record;
5. verify secure hash nếu có;
6. kiểm tra active/revoked/expired;
7. kiểm tra Team active;
8. enforce rate limit;
9. tạo Team session;
10. revoke session cũ;
11. update usage metadata;
12. trả safe response.

## 16.2 Station QR

Backend:

1. nhận raw payload/token;
2. validate format cơ bản;
3. tính fingerprint;
4. lookup token record;
5. verify secure hash nếu có;
6. kiểm tra active/revoked/expired;
7. lấy `station_id` từ database;
8. lấy `purpose` từ database;
9. kiểm tra Station active;
10. kiểm tra Event Config;
11. kiểm tra Team state;
12. thực hiện Check-in hoặc Check-out;
13. chống duplicate action.

Không quyết định Station action chỉ bằng `I` hoặc `O`.

---

# 17. Safe Errors

## Unknown Format

```text
Mã QR không đúng định dạng MOVEment 2026.
```

## Invalid Token

```text
Mã QR không hợp lệ.
```

## Revoked Token

```text
Mã QR đã bị thu hồi.
```

## Expired Token

```text
Mã QR đã hết hạn.
```

## Wrong Station Purpose

```text
Mã QR không phù hợp với thao tác hiện tại.
```

## Inactive Station

```text
Trạm hiện không hoạt động.
```

## Inactive Team

```text
Đội hiện không hoạt động.
```

Không hiển thị:

- raw token;
- token hash;
- stack trace;
- SQL error;
- database ID không cần thiết.

---

# 18. Verification Matrix

## Team QR

- [ ] Official payload là frontend URL.
- [ ] URL dùng `/qr-login`.
- [ ] Token random và opaque.
- [ ] Token không chứa Team ID hoặc credential.
- [ ] Same token login lại được khi active.
- [ ] Revoke làm QR cũ thất bại.
- [ ] Rotate làm QR cũ thất bại và QR mới hoạt động.
- [ ] Login mới revoke Team session cũ.
- [ ] Team mới tự có token.
- [ ] Seed repair tạo token còn thiếu.

## Station QR

- [ ] Format là `MV26-SQ1-I-<randomToken>`.
- [ ] Format là `MV26-SQ1-O-<randomToken>`.
- [ ] Hai token được generate độc lập.
- [ ] Token không chứa Station ID/code.
- [ ] Database quyết định purpose.
- [ ] Wrong-purpose request bị từ chối.
- [ ] Revoke token có hiệu lực ngay.
- [ ] Rotate từng purpose độc lập.
- [ ] Station mới tự có đủ hai token.
- [ ] Transaction rollback nếu thiếu token.

## Parser

- [ ] Team URL được classify đúng.
- [ ] Station token được classify đúng.
- [ ] Unknown payload không bị đoán.
- [ ] Manual input dùng cùng parser.
- [ ] Legacy format chỉ hoạt động khi compatibility bật.
- [ ] Không gửi raw token tới host lạ.

## Seed

- [ ] Seed lần một tạo data còn thiếu.
- [ ] Seed lần hai không duplicate.
- [ ] Seed lần hai không rotate ngoài ý muốn.
- [ ] Production seed không log raw token.
- [ ] Local raw token artifact bị Git ignore.

---

# 19. Known Implementation Gaps

Current historical implementation và documentation từng sử dụng:

```text
MV26-TEAM-01-LOGIN
MV26-STATION-ST002-CHECK_IN
MV26-STATION-ST002-CHECK_OUT
```

Các format này không phù hợp confirmed token policy mới.

Do đó cần audit Source Code để xác định:

- Legacy parser còn ở đâu;
- Legacy endpoint còn ở đâu;
- seed còn generate predictable token không;
- smoke scripts còn hard-code Legacy token không;
- database schema có hỗ trợ secure token lifecycle không;
- Station creation có tự provision hai token không;
- Admin có rotate/revoke flow không.

Việc thay tài liệu này không đồng nghĩa implementation đã được migrate.

Implementation gap phải được ghi vào:

```text
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

Implementation history sau khi sửa phải được ghi vào:

```text
docs/analysis/BACKEND_AUDIT.md
```

---

# 20. Acceptance Criteria

QR Payload Feature được coi là hoàn tất khi:

- [ ] Team QR dùng Automatic URL format.
- [ ] Team token random, opaque và reusable có kiểm soát.
- [ ] Team mới tự có token.
- [ ] Station QR dùng `MV26-SQ1-I/O-<randomToken>`.
- [ ] Station token không chứa Station ID/code.
- [ ] Station mới tự có hai token.
- [ ] Database mapping quyết định Station và purpose.
- [ ] Token support revoke và rotate.
- [ ] Seed idempotent.
- [ ] Production không log raw token.
- [ ] QR parser phân biệt đúng từng family.
- [ ] Manual input dùng cùng validation.
- [ ] Legacy formats không được generate cho entity mới.
- [ ] Legacy migration hoặc compatibility plan được ghi rõ.
- [ ] Backend tests pass.
- [ ] Frontend build pass.
- [ ] QR scan smoke pass.
- [ ] Documentation được đồng bộ.

---

# 21. Documentation Update Rules

Sau khi QR payload hoặc token format thay đổi, cập nhật:

```text
docs/analysis/QR_PAYLOADS.md
docs/analysis/QR_LOGIN.md
docs/analysis/TEAM_LOGIN_DATA.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

Chỉ cập nhật:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

khi Business Rule thay đổi.

Cập nhật:

```text
docs/analysis/FEATURE_INDEX.md
```

chỉ khi Feature routing thay đổi.

Không đưa raw production token vào documentation.
