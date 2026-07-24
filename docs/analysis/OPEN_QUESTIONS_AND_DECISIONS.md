# MOVEment 2026 - Decisions

## Source of Truth

> This document is the **Source of Truth** for all confirmed Business Rules of MOVEment 2026.

## Purpose

Every confirmed Business Rule, requirement, or product decision MUST be recorded here first.

Whenever a Business Rule changes:

1. Update this document first.
2. Update related analysis documents.
3. Update implementation prompts if necessary.
4. Update Source Code.
5. Verify implementation against this document.

---

## Decision History

This document stores only the latest confirmed Business Rules.

Historical implementation details belong in:

```text
BACKEND_AUDIT.md
```

Historical discussions must not remain here after a final decision has been confirmed.

---

## Document Priority

When multiple documentation files describe the same Feature, use this priority:

1. `OPEN_QUESTIONS_AND_DECISIONS.md`
2. `PROJECT_ANALYSIS_SPEC.md`
3. Feature-specific analysis documents
4. Codex Prompt files

`OPEN_QUESTIONS_AND_DECISIONS.md` always wins when documentation conflicts.

---

## Implementation Rules

Source Code represents the current implementation, but Source Code is not the Source of Truth for Business Rules.

Before changing implementation, Codex MUST:

1. Read this document.
2. Inspect the current Source Code.
3. Compare implementation with the confirmed Business Rules.
4. Report any meaningful conflict.
5. Follow this document when implementing the requested change.
6. Update related documentation after implementation.
7. Update `BACKEND_AUDIT.md` after implementation and verification.

Codex must not silently preserve an old behavior that conflicts with this document.

---

## General Notes

- `BACKEND_AUDIT.md` records technical implementation history.
- Prompt files describe implementation tasks.
- Prompt files are not the Source of Truth.
- Historical prompts may be used as references only.
- Every new Feature must have confirmed Business Rules before implementation.
- Exact generated QR tokens, passwords, UUIDs, hashes and sample IDs are not Business Rules.
- Example values shown in documentation are illustrative only.
- Generated data may use different values as long as it follows the required format, security policy and uniqueness rules.

---

# Quyết định đã chốt

## 1. Account và Session

| Chủ đề | Quyết định |
| --- | --- |
| Admin account | Admin đăng nhập bằng `username/password`. |
| Team account | Team có thể đăng nhập bằng `username/password` hoặc Team QR Login. |
| Role | Chỉ có `ADMIN` trong `UserRole`. Team sử dụng model và session riêng. |
| Staff | Không có account hoặc role Staff riêng. |
| Team active session | Mỗi Team chỉ có một active session tại một thời điểm. |
| Login mới | Khi Team đăng nhập trên thiết bị mới, session cũ của Team phải bị revoke. |
| QR login session | Login bằng QR và login bằng username/password sử dụng cùng một Team session policy. |
| Session validation | Backend là nơi enforce active session. Frontend không phải nguồn xác thực cuối cùng. |

---

## 2. Team QR Login

| Chủ đề | Quyết định |
| --- | --- |
| Team QR Login | Mỗi Team có một QR Login token riêng. |
| Automatic URL QR Login | Team QR nên sử dụng URL theo format `{FRONTEND_PUBLIC_URL}/qr-login?token={RAW_TEAM_QR_TOKEN}`. |
| QR Login flow | Quét QR → mở website → đọc token → gọi backend → tạo Team session → redirect vào ứng dụng. |
| QR Login payload | QR Login không được chứa username hoặc password. |
| QR Login token | Token phải là Opaque Random Token, không suy ra từ `teamId`, username hoặc dữ liệu nghiệp vụ. |
| Team creation | Khi tạo Team mới, backend tự động tạo Team QR Login token nếu request không cung cấp token hợp lệ. |
| Team seed | Khi seed Team mới, seed tự động tạo Team QR Login token theo cùng policy. |
| Missing token repair | Seed hoặc maintenance command phải có khả năng bổ sung token cho Team đang thiếu token. |
| Team QR rotation | Admin có thể rotate Team QR Login token. Token cũ phải bị revoke. |
| Team QR revocation | Admin có thể revoke Team QR Login token mà không cần xóa Team. |
| Admin raw token display | Backend lưu raw Team QR Login token cho token mới hoặc token được seed repair/rotate để Admin có thể xem và in lại QR Login dạng string/URL. |
| QR Login error | Nếu auto-login thất bại, frontend phải hiển thị lỗi rõ ràng và cho phép thử lại hoặc dùng login thủ công. |

Exact raw token của từng Team được hệ thống tự động tạo.

Không hard-code token như:

```text
MV26-TEAM-01-LOGIN
MV26-TEAM-02-LOGIN
```

trừ khi đây chỉ là dữ liệu Legacy cần migration.

---

## 3. Station Flow

| Chủ đề | Quyết định |
| --- | --- |
| Station active | Chỉ Station đang active mới được tham gia game flow. |
| Station ban đầu | Mọi Station active khởi tạo trạng thái `AVAILABLE` cho mỗi Team. |
| Station tuần tự | Không bắt buộc khóa hoặc mở Station theo thứ tự. |
| Team active Station | Một Team chỉ được chơi một Station tại một thời điểm. |
| Cancel Station | Cancel đưa Team Station về `AVAILABLE` và áp dụng cooldown mặc định 5 phút. |
| Locked Station | `LOCKED` chỉ sử dụng khi Admin khóa Station hoặc Station bị giới hạn theo event time. |
| Station status | Không sử dụng `WAITING_SCORE`, `CANCELLED` hoặc `REOPENED` làm status chính thức của Team Station flow. |

---

## 4. Station QR

### 4.1 Station QR Policy

| Chủ đề | Quyết định |
| --- | --- |
| Số lượng QR | Mỗi Station có đúng 2 active QR token: một `CHECK_IN` và một `CHECK_OUT`. |
| Station creation | Khi tạo Station mới, backend phải tự động tạo cả `CHECK_IN` token và `CHECK_OUT` token. |
| Station seed | Khi seed Station mới, seed phải tự động tạo đủ 2 Station QR token. |
| Missing token repair | Seed hoặc maintenance command phải bổ sung token còn thiếu cho Station hiện có. |
| Token independence | Check-in token và Check-out token phải được generate độc lập, không suy ra được từ nhau. |
| Opaque token | Station QR không được chứa trực tiếp `stationId`, Station name hoặc dữ liệu có thể suy ra Station. |
| Token generation | Token phải được tạo bằng Cryptographically Secure Random Generator. |
| Token entropy | Random portion phải có tối thiểu 128 bits entropy. |
| Token uniqueness | Token phải unique trên toàn hệ thống. |
| Token lifecycle | Mỗi token hỗ trợ revoke và rotate độc lập. |
| Admin raw token display | Backend lưu raw Station QR token cho token mới hoặc token được seed repair/rotate để Admin có thể xem và in lại Check-in/Check-out QR dạng string. |
| Database mapping | Database là Source of Truth cho quan hệ giữa token, Station và purpose. |
| Backend validation | Backend lấy `stationId` và `purpose` từ token record trong database. |
| Purpose code | Purpose code trong payload chỉ hỗ trợ vận hành và debug; backend không được tin trực tiếp giá trị này. |

---

### 4.2 Station QR Format

Station QR sử dụng format:

```text
MV26-SQ1-<purposeCode>-<randomToken>
```

Trong đó:

```text
MV26
```

là Project identifier.

```text
SQ1
```

là Station QR Schema Version 1.

```text
I
```

đại diện trực quan cho `CHECK_IN`.

```text
O
```

đại diện trực quan cho `CHECK_OUT`.

```text
randomToken
```

là chuỗi ngẫu nhiên do hệ thống tự động generate.

Khuyến nghị sử dụng 26 ký tự Base32 được tạo từ ít nhất 128 bits random data.

Ví dụ minh họa:

```text
MV26-SQ1-I-7K3D9M2Q8W6R4T5YH1CFN8ZP6A
MV26-SQ1-O-4R8X2N7P5W9K3D6M1QZT7BVC9F
```

Các token trên chỉ là example.

Hệ thống có quyền tự tạo token khác hoàn toàn miễn đáp ứng:

- Đúng format.
- Đủ entropy.
- Unique.
- Không suy ra từ Station ID.
- Không suy ra từ token còn lại.

---

### 4.3 Format không được sử dụng

Không sử dụng:

```text
MV26-STATION-15-CHECK_IN
MV26-STATION-15-CHECK_OUT
MV26-STATION-0F-CHECK_IN
MV26-STATION-0F-CHECK_OUT
MV26-STATION-0015-IN
MV26-STATION-0015-OUT
```

Không sử dụng decimal, hexadecimal, Base64 hoặc bất kỳ encoding trực tiếp nào của `stationId`.

Hexadecimal chỉ là encoding, không phải encryption.

---

### 4.4 Automatic Token Provisioning

Khi tạo một Station mới, backend phải thực hiện trong cùng transaction:

1. Tạo Station record.
2. Generate một random `CHECK_IN` token.
3. Generate một random `CHECK_OUT` token.
4. Kiểm tra cả hai token unique.
5. Tạo hai Station QR token record.
6. Commit toàn bộ transaction.

Nếu không tạo được đủ hai token:

- Không được tạo Station ở trạng thái hoàn chỉnh.
- Transaction phải rollback.
- API phải trả lỗi rõ ràng.

Request tạo Station không bắt buộc Admin phải tự nhập QR token.

Backend chịu trách nhiệm generate token mặc định.

---

### 4.5 Station QR Token Model

Mỗi Station QR token record tối thiểu có:

```text
id
station_id
purpose
token_fingerprint
token_hash
is_active
created_at
updated_at
revoked_at
expires_at
```

Trong đó:

- `station_id`: ID thật của Station trong database.
- `purpose`: `CHECK_IN` hoặc `CHECK_OUT`.
- `token_fingerprint`: SHA-256 fingerprint dùng để lookup.
- `token_hash`: secure hash dùng để verify nếu implementation yêu cầu.
- `is_active`: token hiện có hiệu lực hay không.
- `revoked_at`: thời điểm token bị revoke.
- `expires_at`: có thể null nếu token không tự hết hạn.

Nếu Admin cần tải lại hoặc in lại cùng một QR sau này, implementation phải sử dụng một trong hai phương án đã được bảo vệ:

1. Lưu raw token dưới dạng encrypted ciphertext.
2. Lưu QR artifact an toàn sau khi generate.

Không lưu raw token dưới dạng plaintext trong database.

Nếu implementation không lưu encrypted token hoặc QR artifact, raw token chỉ hiển thị một lần và việc in lại phải rotate token mới.

---

### 4.6 Station QR Validation Flow

Khi nhận Station QR token, backend phải:

1. Validate format cơ bản.
2. Tính SHA-256 fingerprint từ raw token.
3. Lookup token record bằng fingerprint.
4. Verify secure hash nếu implementation sử dụng hash verification.
5. Kiểm tra token đang active.
6. Kiểm tra token chưa bị revoke.
7. Kiểm tra token chưa hết hạn.
8. Lấy `station_id` từ database record.
9. Lấy `purpose` từ database record.
10. Kiểm tra Station tồn tại và đang active.
11. Kiểm tra Event Config.
12. Kiểm tra trạng thái hiện tại của Team.
13. Thực hiện Check-in hoặc Check-out theo `purpose` trong database.

Backend không được quyết định Check-in hoặc Check-out chỉ dựa vào ký tự `I` hoặc `O` trong payload.

---

### 4.7 Station QR Rotation

Admin có thể rotate riêng:

- Check-in QR.
- Check-out QR.

Khi rotate:

1. Generate token mới.
2. Tạo hoặc update token record mới.
3. Revoke token cũ.
4. Token cũ phải bị từ chối ngay lập tức.
5. Token còn lại của Station không bị ảnh hưởng.

Rotate Check-in không được tự rotate Check-out.

Rotate Check-out không được tự rotate Check-in.

---

## 5. Station Tracking Mode

| Chủ đề | Quyết định |
| --- | --- |
| Tracking mode | Mỗi Station có `tracking_mode` trong database. |
| Supported values | `SCORE`, `TIME`, `BOTH`. |
| `BOTH` | Ghi nhận thời gian thật từ Check-in đến Check-out, sau đó yêu cầu nhập điểm. |
| `TIME` | Ghi nhận thời gian thật, tự động complete với score bằng `0`, không mở popup nhập điểm. |
| `SCORE` | Không cộng duration vào kết quả; sau Check-out yêu cầu nhập điểm. |
| Default mode | Nếu không được chỉ định rõ, implementation phải sử dụng default được cấu hình trong hệ thống, không hard-code rải rác. |

---

## 6. Station Scoring

| Chủ đề | Quyết định |
| --- | --- |
| Người nhập điểm | Điểm được nhập trên thiết bị đang đăng nhập Team account. |
| Staff role | Không có Staff role riêng. |
| Score submission authorization | Team account được phép gửi điểm sau Check-out mà không cần scoring confirmation code. |
| Removed mechanism | Hệ thống không còn scoring confirmation code, `SCORING_CODE` configuration hoặc secure hash tương ứng. |
| Admin score correction | Admin chỉ được correction khi progress đã `COMPLETED`, nhằm điều chỉnh sai sót sau hoàn thành. Correction chỉ thay đổi điểm của progress và tổng điểm Team theo phần chênh lệch; không thay đổi status, `checkedInAt`, `checkedOutAt` hoặc `completedAt`. `reason` không rỗng luôn bắt buộc. |
| Default max score | Nếu Station không cấu hình riêng thì max score mặc định là `30`. |
| Score validation | Điểm không được âm và không vượt quá max score của Station. |
| Validation authority | Backend là nguồn xác thực cuối cùng. |
| Frontend validation | Frontend validation chỉ hỗ trợ UX. |
| Duplicate submission | Không tạo duplicate score hoặc duplicate completion do double-click, retry mạng hoặc nhiều tab. |

---

## 7. Event Time và Final Challenge

| Chủ đề | Quyết định |
| --- | --- |
| Event Config | Event start time và end time được quản lý trong Admin Event Config. |
| Hard-coded time | Không hard-code `11:30`, `11:45` hoặc giờ cố định trong Business Rule. |
| Final opening | Final Challenge mở theo `finalStartsAt` hiện tại trong Admin Event Config. |
| Event end time | `eventEndTime` là thời gian đóng Station mới, không phải thời gian mở Final. |
| Station mới sau end time | Team không được bắt đầu Station mới sau Event end time. |
| Station đang chơi | Team đã Check-in trước Event end time được phép hoàn thành Station hiện tại. |
| Điều kiện vào Final | Team không bắt buộc phải hoàn thành tất cả Station. |
| Active Station | Team đang chơi Station phải hoàn thành Station đó trước khi vào Final. |
| Final keyword | Keyword là `DISANVANHOA2026`. |
| Final answer storage | Final Challenge lưu keyword đã normalize dạng plain text trong cột tương thích `answerHash`; không hash keyword Final. |
| Keyword normalization | Frontend và backend đều trim và normalize keyword thành uppercase. |
| Final scoring | Backend tự chấm và xác định rank theo lần nhập đúng đầu tiên được database ghi nhận. |
| Final points | Hạng 1 nhận 10 điểm, hạng 2 nhận 9 điểm, tiếp tục đến hạng 10 nhận 1 điểm. |
| Sau hạng 10 | Từ hạng 11 trở đi nhận 0 điểm Final. |
| Multiple attempts | Team được phép nhập nhiều lần cho đến khi đúng hoặc Event kết thúc. |
| Wrong answer cooldown | Cooldown tăng từ 1 giây đến tối đa 10 giây theo số lần nhập sai. |
| Cooldown enforcement | Backend phải enforce cooldown. |
| Duplicate protection | Một Team không được nhận Final rank hoặc bonus nhiều hơn một lần. |

---

## 8. Leaderboard

Leaderboard xếp hạng tất cả Team chưa bị xóa cứng trong database, bao gồm `ACTIVE`, `LOCKED` và `FINISHED` nếu tồn tại.

Leaderboard sắp xếp theo:

1. `Total Score` giảm dần, nguồn là `team.totalPoints`.
2. Nếu hòa điểm, `Total Play Time` tăng dần, nguồn là `team.totalPlaySeconds`.
3. Nếu tiếp tục hòa, `Total Stations Completed` giảm dần.
4. Nếu tiếp tục hòa, `Final Submitted At` tăng dần, `null` xếp sau.
5. Nếu tiếp tục hòa, `Team Code` tăng dần, trong hệ thống hiện tại là `Team.id` số tăng dần.

Backend là nguồn xác thực cuối cùng cho Leaderboard.

---

## 9. Team Results Excel Export

| Chủ đề | Quyết định |
| --- | --- |
| Export scope | Admin Team Results Excel export bao gồm tất cả Team chưa bị xóa cứng. |
| Station scope | Chỉ Station đang active được tạo column group và được tính vào completed/computed score. |
| Worksheet | File Team Results mới có một worksheet, mỗi Team đúng một row. |
| Base columns | `Team Code`, `Team Name`, `Captain Name`, `Username`, `Total Stations Completed`, `Total Play Time`, `Total Score`, `Computed Score`, `Rank`, `Final Submitted At`, `Final Rank`, `Final Bonus Score`. |
| Team Code | `Team Code = Team.id`; không thêm cột `Team ID` riêng vì trùng dữ liệu. |
| Excluded columns | Không export `Team Color`, `Team Status`, `Total Stations`, hoặc `Final Challenge Status`. |
| Station columns | Mỗi Station active chỉ có `Check-in`, `Check-out`, `Score`; không có per-Station `Status` hoặc `Duration`. |
| Duplicate Station name | Dùng `Station.name`; tên trùng được suffix theo thứ tự deterministic, ví dụ `Station (#02)`. |
| Total Play Time | Dùng `team.totalPlaySeconds` để hiển thị tie-break ranking; export không tự repair/recompute field này. |
| Total Score | Ranking dùng `team.totalPoints`; export không tự repair/recompute field này. |
| Computed Score | Cột reconciliation riêng: active completed Station scores + correct Final bonus; không dùng để rank. |
| Incomplete Station attempt | `PLAYING`, `CHECKED_IN`, hoặc đã Check-out chờ score được export blank Check-in/Check-out, Score `0`, không tính completed/computed totals. |
| `SCORE` duration | `SCORE` Station không đóng góp play duration; khi cần biểu diễn duration thì là `00:00:00`. |
| Final export | Chỉ correct Final submission được xem là submitted Final result. Không có correct submission, kể cả wrong-only attempts, export blank submitted/rank và bonus `0`. |
| Excel format | Dùng numeric Excel cells/formats: datetime `dd/mm/yyyy hh:mm:ss`, duration `[h]:mm:ss`, hiển thị theo `Asia/Ho_Chi_Minh`. |
| Security | New Team Results workbook không được chứa raw QR token, token hash/fingerprint, password, session token, scoring code, Final answer text hoặc secrets. |

---

## 10. Team Color

| Chủ đề | Quyết định |
| --- | --- |
| Storage | Reuse `Team.color`; không thêm DB field hoặc migration cho task này. |
| Canonical API field | Public API dùng `teamColor` là canonical field và tạm giữ `color` làm backward-compatible alias. |
| Excel | Team Color chỉ dùng cho UI theming, không export trong Team Results Excel. |
| Admin input | Admin create/update chỉ chấp nhận `#RRGGBB` hoặc `null`. Invalid input trả `400`. |
| Clear behavior | `null` clear stored color; missing `teamColor` khi update nghĩa là không đổi. |
| Alias conflict | Nếu request có cả `teamColor` và `color` nhưng normalize ra khác nhau, backend trả `400`; nếu giống nhau thì accept. |
| Fallback | UI dùng fallback `#FF765C` khi color null/missing/legacy invalid. |
| Team-facing UI | Team UI dùng scoped Team Color vars từ Team hiện tại, không mutate global `:root` hoặc global Ant Design theme. |
| Admin Team list | `/teams` là multi-Team context: shell/header/nav giữ default; từng Team card dùng scoped color riêng. |
| Admin Team context | Single-Team Admin routes như `/system-config/teams/:teamId`, `/teams/:teamId/stations`, `/teams/:teamId/stations/:stationId` có thể theme shell/header/nav theo Team Color của Team đang xem. |
| Out of scope | Không thêm Admin map route, không đổi Team/user `/stations/map`, không đổi Admin action behavior của `StationsMapPanel`. |

---

## 11. QR Camera Scanning

| Chủ đề | Quyết định |
| --- | --- |
| Secure Context | Camera scanning chỉ hoạt động trong HTTPS hoặc localhost secure context. |
| Camera API | Frontend sử dụng `navigator.mediaDevices.getUserMedia`. |
| Preferred decoder | Ưu tiên native `BarcodeDetector` khi được browser hỗ trợ. |
| iOS fallback | Fallback sang `jsQR` canvas-frame decoding cho Safari và Chrome trên iOS. |
| Manual fallback | Luôn có manual paste hoặc token entry khi camera không hoạt động. |
| Permission error | Frontend phải hiển thị lỗi permission rõ ràng và có hướng dẫn retry. |

---

## 12. Generated Data và Seed Data

### 10.1 General Policy

Exact example data không thuộc Source of Truth.

Codex được phép tự động tạo example data cho local và test, miễn đáp ứng:

- Đúng schema.
- Đúng format.
- Unique.
- Dễ nhận biết khi test.
- Không chứa production secrets.
- Không làm thay đổi Business Rules.
- Không tạo dữ liệu mâu thuẫn với Feature flow.

---

### 10.2 Seed Scope

Local và test seed phải có đủ dữ liệu để kiểm tra Core Flow:

- Admin account.
- Team accounts.
- Team QR Login tokens.
- Stations.
- Station Check-in tokens.
- Station Check-out tokens.
- Event Config.
- Team Station states nếu cần.
- Final Challenge configuration nếu cần.

Codex có quyền lựa chọn:

- Tên Team mẫu.
- Username/password mẫu.
- Tên Station mẫu.
- Station description mẫu.
- Tracking mode mẫu.
- Max score mẫu.
- Raw token values.
- UUID hoặc database-generated ID.
- Số lượng record hợp lý cho việc test.

Các giá trị cụ thể phải được ghi lại trong tài liệu seed hoặc output sau khi seed chạy.

---

### 10.3 Seed Idempotency

Seed phải idempotent.

Chạy seed nhiều lần không được:

- Tạo duplicate Admin.
- Tạo duplicate Team.
- Tạo duplicate username.
- Tạo duplicate Station.
- Tạo duplicate QR token.
- Tạo thêm token active không cần thiết.
- Ghi đè dữ liệu production.
- Làm mất token đang được sử dụng nếu không có yêu cầu rotate.

Seed phải kiểm tra record hiện có trước khi tạo mới.

---

### 10.4 Automatic Seed Token Generation

Khi seed Team:

1. Tạo Team nếu chưa tồn tại.
2. Kiểm tra Team QR Login token.
3. Generate token nếu Team chưa có active token.

Khi seed Station:

1. Tạo Station nếu chưa tồn tại.
2. Kiểm tra active Check-in token.
3. Generate Check-in token nếu đang thiếu.
4. Kiểm tra active Check-out token.
5. Generate Check-out token nếu đang thiếu.

Token được generate tự động theo đúng policy.

Không cần hard-code toàn bộ raw token trong seed source code.

---

### 10.5 Environment Safety

Local/test credentials và raw tokens không được tự động seed vào Production.

Production phải sử dụng quy trình tạo dữ liệu riêng, ngoại trừ Final Challenge seed-managed record được phép create/update canonical values đến hết `2026-08-21 23:59:59 Asia/Ho_Chi_Minh` và ngừng overwrite từ `2026-08-22 00:00:00 Asia/Ho_Chi_Minh`.

Seed command phải có Environment Guard rõ ràng.

Nếu environment không xác định hoặc không an toàn, seed phải dừng và báo lỗi thay vì tự chạy.

---

## 13. Tạo Entity mới sau này

Khi Admin hoặc Codex tạo một Team mới:

1. Tạo Team.
2. Tự động generate Team QR Login token.
3. Tạo Team session-ready state.
4. Trả về kết quả rõ ràng.

Khi Admin hoặc Codex tạo một Station mới:

1. Tạo Station.
2. Tự động generate Check-in QR token.
3. Tự động generate Check-out QR token.
4. Gắn token đúng Station.
5. Gắn đúng purpose trong database.
6. Không yêu cầu user tự nghĩ raw token.
7. Cho phép tải hoặc hiển thị QR để in.
8. Rollback nếu không thể tạo đủ token.

Do đó, khi user thêm Station mới theo ý mình, hệ thống phải tự tạo QR đúng format và đúng security policy.

User chỉ cần cung cấp các thông tin nghiệp vụ như:

- Station name.
- Description.
- Tracking mode.
- Max score.
- Active status.
- Các cấu hình gameplay cần thiết.

User không cần tự cung cấp:

- Station QR raw token.
- Token fingerprint.
- Token hash.
- Check-in token.
- Check-out token.

---

## 13.1 Station Game Type

Station Game Type chỉ có hai giá trị:

```text
ST
STANDARD
```

Business Rules:

- `ST` dùng cho Station được Business chỉ định có YouTube video để Team xem trước hoặc trong khi chơi.
- `STANDARD` dùng cho Station thông thường và không cho phép xem video, kể cả khi còn lưu media URL.
- Danh sách Station của Team/User luôn hiển thị hành động `Watch Video` để giữ bố cục card đồng nhất; hành động này phải disabled trừ khi Station có `gameType = ST` và YouTube URL hợp lệ.
- Admin không xem video từ danh sách Station của Team; card Admin không hiển thị `Watch Video` và chỉ cung cấp hành động `View & Edit`.
- Danh sách Station `ST` hiện tại là `ST003`, `ST004`, `ST010`, và `ST047`.
- Các Station không thuộc danh sách trên phải dùng `STANDARD`, kể cả khi còn lưu YouTube URL.
- Khi chuyển dữ liệu Legacy, mọi `CIPHER` phải chuyển thành `STANDARD`; chỉ bốn Station được chỉ định giữ hoặc chuyển thành `ST`; các Game còn lại chuyển thành `STANDARD`.
- Station không còn luồng nhập hoặc kiểm tra cipher answer. Final Challenge là tính năng độc lập và không bị ảnh hưởng bởi thay đổi này.
- Admin phải chọn Game Type từ danh sách cố định, không nhập free text.
- Backend và database là authority cho tập giá trị Game Type hợp lệ.

---

## 13.2 Admin Team Station Navigation

- Admin navigation không hiển thị menu `Stations` độc lập.
- Admin không thuộc Team nào; giao diện Admin không được hiển thị `Current team`, `Your team`, hoặc đánh dấu một Team là Team của Admin.
- Sau khi đăng nhập, Admin đi tới danh sách Teams.
- Admin chỉ mở danh sách Station/progress trong ngữ cảnh một Team bằng cách chọn Team đó.
- Route danh sách và chi tiết Station của Admin phải giữ Team ID để back/navigation không làm mất Team đang xem.
- Player vẫn sử dụng menu và route Station riêng theo Player flow.
- Các page header vận hành như Teams, Leaderboard và Operations dùng layout compact, ưu tiên title/action và không cần subtitle mô tả hiển nhiên.

---

## 14. Git Policy

| Chủ đề | Quyết định |
| --- | --- |
| Local commit | Codex được phép tạo local Git commit sau khi hoàn tất và verify task. |
| Commit title | Commit title phải rõ ràng. |
| Commit detail | Commit detail sử dụng bullet points. |
| Push | Không tự push nếu user chưa yêu cầu. |
| Deploy | Không tự deploy nếu user chưa yêu cầu. |
| History rewrite | Không force push, reset hoặc rewrite history nếu chưa được yêu cầu rõ. |

---

## Historical Input

Các tài liệu hoặc Prompt cũ có đề cập:

- `passcode`
- `Station Manager`
- Staff account
- Station QR chứa `stationId`
- Station QR sử dụng decimal hoặc hexadecimal ID
- Predictable QR token
- Hard-coded Final time
- One-time flow không còn phù hợp
- Username/password nằm trong QR

chỉ được xem là historical analysis input.

Chúng không được ưu tiên cao hơn file này.

Nếu phát hiện conflict, Codex phải:

1. Báo rõ conflict.
2. Nêu Business Rule đúng từ file này.
3. Không tự ý giữ behavior cũ.
4. Cập nhật related analysis documents.
5. Cập nhật implementation prompt nếu cần.
6. Cập nhật Source Code.
7. Verify behavior.
8. Cập nhật `BACKEND_AUDIT.md`.
