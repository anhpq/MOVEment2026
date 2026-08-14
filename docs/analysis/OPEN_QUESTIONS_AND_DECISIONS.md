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

- 2026-08-15: Supersede giới hạn Leaderboard overlay của Team Gameplay V2 từ
  Top 5 + một dòng Team hiện tại có rank hiển thị giả `6`. Overlay `/team/v2`
  phải hiển thị toàn bộ Team từ response Leaderboard authoritative, giữ nguyên
  rank thật và thứ tự Backend; danh sách scroll nội bộ khi dài. Đồng thời tăng
  nhẹ typography thông tin trong overlay và đồng bộ Legend/Settings frame theo
  demo React/Konva mà không thay đổi Backend ranking, tie-break hoặc dữ liệu.

- 2026-08-13: Supersede Team Gameplay V2 presentation theo `demo/` v4. Konva
  map phủ toàn bộ `100dvh` và hiển thị xuyên dưới HUD; Header, score, legend và
  footer chỉ là overlay trong suốt/gradient nhẹ, không cắt viewport map và
  không chặn pan/pinch ở vùng trống. Chỉ native HUD controls nhận pointer
  events. Marker `Completed` hiện white/silver mờ nhưng vẫn tappable; marker
  Playing dùng gold double-heartbeat/radar, không lightning, dotted route hay
  sparkle. Settings, scanner, Team, Leaderboard, score entry và Station Detail
  dùng full-screen cyberpunk panels có safe-area và scroll nội bộ; flow, data,
  QR lifecycle và Business Rules không đổi.

- 2026-07-31: Tất cả overlay trong `/team/v2` dùng default background opacity
  `95%`. Opacity chỉ áp dụng cho backdrop và nền panel, không áp dụng lên DOM
  container chứa nội dung; chữ, icon và interactive controls luôn render ở
  opacity `100%`. Preference opacity cũ được reset một lần về default mới bằng
  versioned local-storage key; user vẫn có thể điều chỉnh slider và lưu giá trị
  mới sau đó.

- 2026-07-31: Settings overlay trong `/team/v2` dùng intrinsic content height,
  căn giữa viewport và chỉ giới hạn bằng available height để scroll khi cần;
  portrait không ép full-height. Leaderboard overlay chỉ hiển thị năm Team đầu
  theo response authoritative; nếu Team hiện tại không thuộc năm dòng đó thì
  append thành dòng thứ sáu và hiển thị rank `6` trong riêng V2 overlay. Không
  thay đổi Backend ranking hoặc dữ liệu Leaderboard gốc.

- 2026-08-03: Team Gameplay V2 trở thành giao diện mặc định sau Team username,
  Team QR và automatic URL QR Login. Team home/fallback redirect dùng
  `/team/v2`; V1 vẫn được giữ tại `/stations` và `/stations/map` và V2 Settings
  tiếp tục cung cấp lối quay lại V1 trong giai đoạn thử nghiệm.

- 2026-07-31: Team V2 Detail dùng intrinsic content height, căn giữa viewport và
  chỉ giới hạn bằng available height để scroll khi cần; không ép full-height trên
  điện thoại. Footer dùng copy ngắn `BXH` trong VI (`RANK` trong EN), QR CTA có
  đường kính gấp ba baseline cũ (`74px` thành `222px`), và chữ QR caption,
  Leaderboard, Team label có kích thước hiển thị tối thiểu `12px` kể cả khi
  footer responsive scale.

- 2026-07-31: Team V2 media/marker states: nút YouTube và Xem hình ảnh luôn hiện
  trong Detail; khi không có nội dung vẫn disabled nhưng dùng khung neon-muted
  đọc được. Marker `COMPLETED`/`Finished` không render trên map. Marker có
  authoritative `backendStatus === "LOCKED"` dùng silver-neon cho artwork,
  halo, label và connector.

- 2026-07-31: Marker `/team/v2` dùng reference Konva Bézier mới: design
  `640×620`, center `(320,248)`, tip anchor `(320,606)`, inner pin, outer ring
  radius `148`, và vòng neon green/mint/purple 360° không seam. Marker không có
  số bên trong; size vẫn clamp `32..64px` và Station code nằm trong label.

- 2026-07-31: Nhãn Station trên `/team/v2` luôn giữ code/tên trên đúng một dòng;
  nội dung dài dùng ellipsis trong khung hiện tại. Điểm tiếp tục nằm ở dòng
  riêng phía dưới; anchor, gap và label size không đổi.

- 2026-07-31: Supersede Team identity row trong HUD `/team/v2`: bỏ block
  `.team-v2-team` khỏi map header. Total score vẫn dùng dữ liệu hiện tại và luôn
  nằm chính giữa viewport ở mọi responsive mode; brand và Settings giữ nguyên.

- 2026-07-30: Supersede V2 bottom pill HUD: `/team/v2` dùng ba khu vực sci-fi
  độc lập gồm Bảng xếp hạng bên trái, QR CTA/pedestal nổi ở trung tâm, và Team
  cùng số Station hoàn thành bên phải. Hai rail cyan mảnh chỉ nối thị giác về
  QR; không tạo nền hoặc viền pill liên tục. Footer giữ copy VI/EN, state và
  scanner/Leaderboard behavior hiện có.
- 2026-07-30: V2 Station label neo duy nhất vào screen anchor của marker sau
  transform map. Label luôn phía trên marker, scale `0.85..1.15` và gap
  `4..8px` theo normalized zoom, không dùng viewport grid/collision placement
  hoặc thay đổi Station coordinates. Layer order là map, connector/label,
  marker, rồi fixed HUD.

- 2026-07-30: Chốt Station Detail riêng cho `/team/v2`: marker/label mở
  near-fullscreen overlay ngay trong map, không route qua Player Station Detail
  V1 và không dùng `?from=team-v2`. V2 Detail dùng presentation/gallery riêng,
  reuse data/mutation helpers, và giữ V2 scanner/score flow.
- 2026-07-29: Chốt visual reference HTML mới cho `/team/v2`: HUD dùng fixed cyan/green/pink/purple/gold palette, header có centered clipped brand và Team/score row, bottom HUD là pill panel với QR nổi ở giữa. Toàn bộ token vẫn route-local và không được nhận màu từ `Team.color` hoặc global theme.
- 2026-07-29 (visual badge đã được reference mới supersede): Chốt persistent scanner riêng cho `/team/v2`: camera auto-start, API rejection không tắt camera, manual token input xuất hiện sau lỗi, và duplicate token được re-arm khi rời frame ít nhất 600ms hoặc gặp token khác; V1/Login/shared scanner không đổi.
- 2026-07-29: Chốt `/team/v2` dùng fixed V2 palette riêng và không nhận màu từ `Team.color`, inherited `--team-*`, body Team theme, hoặc global Ant Design theme; các Team UI ngoài V2 tiếp tục dùng Team Color.
- 2026-07-28: Chốt Station Media Gallery: mỗi Station có tối đa 10 HTTPS image URL có thứ tự, Admin quản lý trong Station create/edit, Player xem qua gallery tại Station List/Map/Detail, và canonical Station hiện tại không được tự backfill ảnh.

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
| Session daily expiry | Mọi Admin và Team session hết hạn tại mốc `22:00 Asia/Ho_Chi_Minh` kế tiếp. Session được tạo trước `22:00` hết hạn lúc `22:00` cùng ngày; session được tạo đúng hoặc sau `22:00` hết hạn lúc `22:00` ngày hôm sau. |
| Session expiry authority | Backend phải ký access token theo đúng cutoff và trả `expiresAt` trong mọi login response. Frontend phải dùng chính `expiresAt` từ Backend, không tự tính TTL riêng, và tự clear local session tại cutoff kể cả khi tab đang mở. |
| Session expiry mode | Cutoff `22:00` là absolute expiry, không được kéo dài theo activity hoặc `lastSeenAt`. |
| Session validation | Backend là nơi enforce active session. Frontend không phải nguồn xác thực cuối cùng. |
| Team header identity | Với Team user, app header hiển thị tên Team hiện tại trong logout button thay cho label `User`; logout button vẫn hiển thị ở mọi environment cho đến khi có task release riêng để ẩn. |
| Admin header logout | Admin header giữ nguyên logout button với label `Admin` trong mọi environment. |

---

## 2. Team QR Login

| Chủ đề | Quyết định |
| --- | --- |
| Team QR Login | Mỗi Team có một QR Login token riêng. |
| Automatic URL QR Login | Team QR nên sử dụng URL theo format `{FRONTEND_PUBLIC_URL}/qr-login?token={RAW_TEAM_QR_TOKEN}`. |
| QR Login flow | Quét QR → mở website → đọc token → gọi backend → tạo Team session → redirect vào ứng dụng. |
| QR Login payload | QR Login không được chứa username hoặc password. |
| QR Login token | Token phải là Opaque Random Token, không suy ra từ `teamId`, username hoặc dữ liệu nghiệp vụ. |
| Team QR expiry | Team QR Login token không tự hết hạn theo thời gian. `expires_at` có thể `null`; token mới/active phải dùng `expiresAt: null`. Revoke và rotate là cơ chế vô hiệu hóa chính. |
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
| Cancel Station | Cancel đưa Team Station về `AVAILABLE`, xóa dữ liệu attempt dở dang và không áp dụng cooldown. |
| Chuyển Station | Check-in B khi A đang `CHECKED_IN` hoặc `PLAYING` và chưa Check-out sẽ đưa A về `AVAILABLE` không tính điểm/thời gian rồi bắt đầu B atomically. A được phép chơi lại. Station đã Check-out chờ score phải được hoàn thành trước khi vào B. |
| Locked Station | `LOCKED` chỉ sử dụng khi Admin khóa Station hoặc Station bị giới hạn theo event time. |
| Station status | Không sử dụng `WAITING_SCORE`, `CANCELLED` hoặc `REOPENED` làm status chính thức của Team Station flow. |

---

## 3.1 Station Localization

| Chủ đề | Quyết định |
| --- | --- |
| Canonical/default language | Tiếng Việt là canonical/default cho Station `name` và `description`. |
| English fields | Station lưu thêm `name_en` bắt buộc và `description_en` nullable để phục vụ UI tiếng Anh. |
| Player locale | Player Station APIs hỗ trợ `lang=vi\|en`; thiếu hoặc invalid `lang` fallback về `vi`. |
| Player response shape | Player vẫn nhận field `name` và `description`; Backend project giá trị theo locale thay vì trả raw bilingual fields. |
| EN fallback | Khi `name_en` rỗng, fallback field đó sang `name`; khi `description_en` null/rỗng, fallback field đó sang `description`. |
| Admin Station data | Admin Station responses/progress matrix trả đủ `name`, `description`, `nameEn`, `descriptionEn` để chỉnh sửa song ngữ. |
| Admin validation | Admin create Station yêu cầu `name` và `nameEn` không rỗng; `description` và `descriptionEn` optional. Admin update chỉ validate field được gửi và trim trước khi lưu. |
| Operational consumers | Excel export và Backend operational views tiếp tục dùng canonical tiếng Việt. Localized Admin Frontend display không thuộc nhóm này và được phép chọn field VI/EN theo locale. |
| Admin Frontend locale | Admin System Config dùng `nameEn`/`descriptionEn` khi locale là `en`, fallback từng field về `name`/`description`; locale `vi` dùng canonical VI. Không cần refetch khi đổi locale vì Admin progress matrix đã trả đủ bốn field. |
| Seed behavior | Canonical Station seed có EN provisional. Normal seed được phép cập nhật riêng `name_en`/`description_en` cho 17 Station canonical khi inventory gameplay còn hợp lệ, không reset progress/game/QR và không cần confirmation destructive replacement. |
| Out of scope | `Game.title` và `clueText` không được dịch trong scope này. |

---

## 3.2 Frontend Localization Display Rules

| Chủ đề | Quyết định |
| --- | --- |
| Frontend copy | Frontend-owned visible copy phải hỗ trợ VI/EN, bao gồm label, button, placeholder, validation, toast, modal, status, loading/empty/error state, tooltip và ARIA text. |
| Brand | `MOVEment 2026` giữ nguyên ở mọi ngôn ngữ. |
| Preserved values | Station ID, Team ID, username, token, URL, QR payload, enum/API values, `Game.title` và `clueText` không tự dịch trong Frontend. |
| Language control | Language switch hiển thị cờ bằng text/emoji `🇻🇳 VI` và `🇬🇧 EN`; không cần thêm image asset. |
| Final terminology | Menu có thể giữ label ngắn `Final`; heading đầy đủ là `Thử thách cuối cùng` trong VI và `Final Challenge` trong EN. Từ `cipher/mật mã` chỉ dùng khi nói về đáp án/mật mã thực tế. |
| Final icon | UI Final dùng biểu tượng cờ cho navigation và heading; icon cúp thành công giữ nguyên. |
| Station ordering | Danh sách Station có trạng thái sắp theo `In Progress` → `New` → `Finished`; trong từng nhóm sắp tự nhiên tăng dần theo `stationId`. Danh sách/dropdown Station không có status sắp theo Station ID. |
| Team display name | Localization tên Team là display-layer only. Tên raw dạng `Team NN` hoặc `Đội NN` hiển thị là `Đội NN` trong VI và `Team NN` trong EN; custom Team name giữ nguyên. Không đổi database, API hoặc seed. |
| API error UI | Frontend không hiển thị raw Backend error message cho user; UI dùng fallback localized theo action/status, nhưng vẫn giữ error code/sentinel nội bộ để phân nhánh logic. |

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
| `BOTH` | Ghi nhận thời gian thật từ Check-in đến accepted Check-out QR scan, sau đó yêu cầu nhập điểm. |
| `TIME` | Ghi nhận thời gian thật từ Check-in đến accepted Check-out QR scan, tự động complete với score bằng `10`, không mở popup nhập điểm. |
| `SCORE` | Lưu `checkedOutAt` theo accepted Check-out QR scan nhưng không cộng duration vào kết quả; sau Check-out yêu cầu nhập điểm. |
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
| TIME effective score/max | `TIME` Station luôn award `10` điểm khi Check-out thành công và effective max score là `10`, độc lập với `game.maxPoints` đang lưu. |
| Score validation | Điểm không được âm và không vượt quá effective max score của Station. |
| Validation authority | Backend là nguồn xác thực cuối cùng. |
| Frontend validation | Frontend validation chỉ hỗ trợ UX. |
| Duplicate submission | Không tạo duplicate score hoặc duplicate completion do double-click, retry mạng hoặc nhiều tab. |

---

## 7. Event Time và Final Challenge

| Final keyword | `EVERY MOVE COUNTS`; so sánh không phân biệt hoa/thường, `trim()` hai đầu và giữ nguyên whitespace bên trong. |
| Final points | Top 10 nhận lần lượt `40, 30, 25, 22, 20, 18, 16, 14, 12, 10`; hạng 11+ nhận `0`. |

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
| Final keyword | Keyword là `EVERY MOVE COUNTS`. |
| Final answer storage | Final Challenge lưu keyword đã normalize dạng plain text trong cột tương thích `answerHash`; không hash keyword Final. |
| Keyword normalization | Frontend và backend trim khoảng trắng đầu/cuối rồi so sánh uppercase. Whitespace giữa các từ được giữ nguyên, không collapse/replace/normalize. |
| Final scoring | Backend tự chấm và xác định rank theo lần nhập đúng đầu tiên được database ghi nhận. |
| Final points | Top 10 lần lượt nhận `40, 30, 25, 22, 20, 18, 16, 14, 12, 10` điểm. |
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

Player Station list, Station map drawer và Station detail có thể hiển thị live
`Playing Teams` aggregate theo Station. API chỉ được trả `stationId` và
`playingTeamCount`, không lộ Team identity.

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
| Station tracking mode header | Mỗi Station column header phải hiển thị tracking mode sau tên Station: `SCORE` → `[Score only]`, `TIME` → `[Time only]`, `BOTH` → `[Both time and score]`. |
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
| Seed palette | Seed-managed Team 01-25 phải có 25 màu `#RRGGBB` unique theo palette cố định, nhận diện bằng username `team01`...`team25`. |
| Seed repair | Mỗi lần seed được phép repair/overwrite `Team.color` của seed-managed Team 01-25 theo palette cố định; palette thắng custom color Admin đã chỉnh. |
| Team-facing UI | Team UI dùng scoped Team Color vars từ Team hiện tại, không mutate global `:root` hoặc global Ant Design theme. |
| Team Gameplay V2 palette | `/team/v2` là ngoại lệ có fixed reference palette riêng: accent/active cyan `#2FE4F0`, cyan-soft `#7DF3F9`, score/completed green `#4DFF8A`, selected pink `#FF3FD8`, secondary QR purple `#B06BFF`, leaderboard gold `#FFC94D`, background ink `#030C14`, text `#EAFCFF`, muted text `#9FD4D9`, và panel `rgba(3,14,20,0.82)`. Route này không được derive hoặc ghi đè HUD/marker/control colors từ `Team.color`, `--team-primary`, body Team theme, hoặc global Ant Design theme. Team Color vẫn áp dụng cho các Team UI ngoài V2. |
| Team Gameplay V2 HUD layout | Header V2 dùng clipped brand tab ở top-center và Settings ở top-right; Fullscreen nằm trong Settings. Settings cũng có control xoay ngang: browser hỗ trợ sẽ lock landscape sau khi thử fullscreen, browser/API không hỗ trợ (bao gồm Safari phù hợp) hiển thị hướng dẫn xoay thiết bị thủ công, không báo thành công giả. Không hiển thị Team identity block trên map HUD và luôn đặt total score ở chính giữa viewport. Fullscreen dùng browser Fullscreen API với Safari `webkit*` fallback; iPhone Safari không hỗ trợ fullscreen DOM phải hướng dẫn mở từ Home Screen ở standalone mode. Bottom HUD dùng ba vùng sci-fi độc lập: Leaderboard ở trái, QR CTA/pedestal nổi giữa, Team/progress ở phải, chỉ nối bằng rail cyan mảnh. Giữ product copy, safe-area, accessibility và gameplay behavior hiện có. |
| Team Gameplay V2 QR badge | QR CTA trung tâm của `/team/v2` dùng inline SVG/CSS theo reference với static conic ring pink `#FF3FD8` → purple `#B06BFF` → cyan `#2FE4F0`, dark core và light QR glyph. SVG badge dùng toàn bộ diện tích control với `translateY(-5px)` ở mọi breakpoint; không có idle animation. |
| Team Gameplay V2 scanner | Scanner riêng của V2 auto-start camera. API rejection giữ camera/preview mở, hiển thị safe localized error và mở manual token input. Token vừa lỗi không được gửi lặp; chỉ re-arm khi QR rời frame liên tục ít nhất 600ms hoặc detector thấy token khác. Success/close/unmount phải cleanup camera tracks và decode callbacks. V1, Login và shared `QrTokenInput` giữ nguyên behavior. |
| Team Gameplay V2 Station Detail | Marker/label trong `/team/v2` mở near-fullscreen Station Detail overlay riêng mà không đổi URL hoặc route qua `/stations/:stationId`. Overlay hiển thị localized Station content, stats, live timer, media và action theo trạng thái; dùng V2-owned presentation/gallery và reuse shared data/API/mutation helpers. Không dùng `?from=team-v2`. |
| Team Gameplay V2 Detail actions | `Available` mở V2 scanner để bắt đầu; `In Progress` có Complete và Cancel; `Finished` chỉ xem kết quả/media. Check-in, completion và cancel success đóng Detail về map V2. API rejection giữ V2 scanner mở theo scanner rule hiện hành. |
| Team Gameplay V2 media/marker states | Detail luôn hiển thị nút YouTube và Xem hình ảnh; nút thiếu nội dung vẫn disabled nhưng phải đọc được bằng neon-muted styling. Map không render marker/label/connector của Station `COMPLETED`/`Finished`. Marker có `backendStatus === "LOCKED"` dùng silver-neon cho artwork, halo, label và connector. |
| Team Gameplay V2 active QR context | Khi Team có Station `In Progress`, caption dưới QR hiển thị localized active status cùng Station code/name. Camera chỉ mở khi user bấm QR/Detail scan action; QR success/close/unmount cleanup scanner như hiện hành. |
| Primary buttons | Trong Team context, enabled `primary` buttons dùng gradient theo Team Color và luôn dùng chữ/icon trắng `#FFFFFF`; disabled, danger, default và non-button accent/status/map colors giữ semantics/style hiện tại. |
| Team Gameplay V2 buttons | Primary controls bên trong `/team/v2` dùng fixed V2 HUD accent/gradient thay vì Team Color. Danger/default/disabled semantics vẫn giữ nguyên. |
| Overlays | AntD `Modal`, `Drawer`, và `modal.confirm()` trong Team context được theme primary button bằng Team Color qua runtime scoped/body vars; QR info modal sau create/update Team có thể giữ default/current overlay style. |
| Admin Team list | `/teams` là multi-Team context: shell/header/nav giữ default; từng Team card dùng scoped color riêng. |
| Admin Team context | Single-Team Admin routes như `/system-config/teams/:teamId`, `/teams/:teamId/stations`, `/teams/:teamId/stations/:stationId` có thể theme shell/header/nav theo Team Color của Team đang xem. |
| Admin create preview | `/system-config/teams/new` không có saved Team context; preview chỉ dùng Team Color khi input HEX hợp lệ, còn empty/invalid giữ default/Admin style. |
| Out of scope | Không thêm Admin map route, không đổi Team/user `/stations/map`, không đổi Admin action behavior của `StationsMapPanel`, không đổi global Ant Design theme, không lưu gradient trong DB. |

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

Production phải sử dụng quy trình tạo dữ liệu riêng, ngoại trừ các phạm vi hẹp đã chốt:

1. Final Challenge seed-managed record được phép create/update canonical values đến hết `2026-08-21 23:59:59 Asia/Ho_Chi_Minh` và ngừng overwrite từ `2026-08-22 00:00:00 Asia/Ho_Chi_Minh`.
2. Existing seed-managed Team 01-25 được nhận diện bằng username ổn định `team01`...`team25` được phép repair/overwrite chỉ trường `color` theo palette cố định.
3. Canonical Station inventory được phép tạo trên Production trống. Nếu Production đã có Station data không khớp canonical inventory, seed chỉ được replace toàn bộ Station/game/scoring state khi `CONFIRM_REPLACE_ALL_PROD_STATIONS=YES`; nếu thiếu confirmation phải dừng và hướng dẫn dùng `stations:sync`.
4. Khi canonical Station inventory gameplay đã khớp, Production seed được phép cập nhật riêng `name_en` và `description_en` cho 17 Station canonical để sửa bản dịch EN provisional, không reset progress/game/QR và không cần `CONFIRM_REPLACE_ALL_PROD_STATIONS=YES`.

Production seed không được tạo Team fixture mới khi thiếu `team01`...`team25`; missing seed-managed Team trong Production được skip im lặng cho scope color repair.

Production seed không được reset password, username, Team QR credential, raw token, hoặc local/test fixture data cho seed-managed Teams.

Seed command phải có Environment Guard rõ ràng.

Nếu environment không xác định hoặc không an toàn, seed phải dừng và báo lỗi thay vì tự chạy.

---

### 10.6 Canonical Station Inventory

Canonical active Station inventory hiện tại có đúng `17` Station, `17` active Game, Team `maxPossiblePoints = 300`, đúng `4` Game Type `ST`, đúng `13` Game Type `STANDARD`, và đúng `34` active Station QR token (`CHECK_IN` + `CHECK_OUT` cho mỗi Station). Tổng các `games.max_points` theo danh sách hiện tại là dữ liệu cấu hình Station, không được dùng làm validation cứng cho `maxPossiblePoints`.

Station technical ID vẫn là `ST001`...`ST017` cho database, API, route, React key, select value và QR mapping. UI danh sách Station và map hiển thị display code rút gọn `01`...`17` cho các Station canonical tương ứng và hỗ trợ sẵn `ST018` hiển thị là `18` nếu xuất hiện sau này. ID không canonical khác như `ST047` hoặc `ST15A` giữ nguyên khi hiển thị.

| ID | Name | Game Type | Max Score |
| --- | --- | --- | --- |
| `ST001` | Thủy Lộ Ký Ức | `ST` | 10 |
| `ST002` | Ngự Ảnh Tái Hiện | `ST` | 10 |
| `ST003` | Vạn Vật Ghi Tâm | `ST` | 12 |
| `ST004` | Thiên Địa Chao Đảo | `ST` | 10 |
| `ST005` | Phi Thuyền Xuyên Không | `STANDARD` | 10 |
| `ST006` | Tâm Đầu Ý Lon | `STANDARD` | 20 |
| `ST007` | Vòng Quay Công Lý | `STANDARD` | 50 |
| `ST008` | Song Tâm Dẫn Ngọc | `STANDARD` | 50 |
| `ST009` | Ba Tiêu Cuồng Phong | `STANDARD` | 25 |
| `ST010` | Bách Thú Quy Hội | `STANDARD` | 10 |
| `ST011` | Mê Trận Đồng Tâm | `STANDARD` | 10 |
| `ST012` | Trụ Vững Càn Khôn | `STANDARD` | 15 |
| `ST013` | Liên Hoàn Thần Chưởng | `STANDARD` | 15 |
| `ST014` | Hỏa Nhãn Kim Tinh | `STANDARD` | 10 |
| `ST015` | Tam Sao Thất Vậy | `STANDARD` | 10 |
| `ST016` | Vạn Ly Trường Thành | `STANDARD` | 10 |
| `ST017` | Nhất Nhịp Đồng Tâm | `STANDARD` | 10 |

Canonical designated `ST` set là `ST001`, `ST002`, `ST003`, và `ST004`; mọi Station còn lại là `STANDARD`.

Input `gameType: null`, `undefined`, `standard`, hoặc `STANDARD` normalize thành DB/API `STANDARD`; input `ST` giữ nguyên `ST`; mọi giá trị khác phải fail-fast.

`mapX` và `mapY` hiện là deterministic implementation placeholders theo thứ tự canonical cho đến khi có tọa độ map thật; chúng không phải Business Rule về vị trí thực tế.

Gameplay reset phục vụ rehearsal phải dry-run mặc định. Khi chạy destructive
execute, mọi target đều cần `RESET_GAMEPLAY_CONFIRM="RESET MOVEMENT2026 GAMEPLAY"`;
Production-like target cần thêm `RESET_GAMEPLAY_BACKUP_CONFIRMED="BACKUP_CONFIRMED"`.
Reset phải giữ Team/User identity, vô hiệu hóa session cũ, tạo đúng một active
Team QR non-expiring cho mỗi Team, khôi phục 17 Station canonical và verify
invariant trong transaction.

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
- Danh sách Station `ST` hiện tại là `ST001` Thủy Lộ Ký Ức, `ST002` Ngự Ảnh Tái Hiện, `ST003` Vạn Vật Ghi Tâm, và `ST004` Thiên Địa Chao Đảo.
- Các Station không thuộc danh sách trên phải dùng `STANDARD`, kể cả khi còn lưu YouTube URL.
- Khi chuyển dữ liệu Legacy, mọi `CIPHER` phải chuyển thành `STANDARD`; chỉ bốn Station canonical được chỉ định giữ hoặc chuyển thành `ST`; các Game còn lại chuyển thành `STANDARD`.
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

## 13.3 Station Media Gallery

| Chủ đề | Quyết định |
| --- | --- |
| Ownership | Gallery thuộc `Station`, không phụ thuộc `Game Type`. |
| Số lượng | Mỗi Station có tối đa `10` ảnh. |
| Dữ liệu | Mỗi ảnh chỉ lưu HTTPS URL và thứ tự; không lưu caption. |
| URL policy | Backend trim, chỉ chấp nhận `https://`, tối đa 2048 ký tự, reject URL rỗng hoặc trùng sau normalize và không fetch URL từ server. |
| Admin create | Thiếu `imageUrls` tạo gallery rỗng. |
| Admin update | Thiếu `imageUrls` giữ nguyên; `imageUrls: []` xóa gallery; mảng mới replace gallery atomically theo đúng thứ tự. |
| Player response | Player và Admin Station response trả `imageUrls: string[]` theo thứ tự, không expose database image ID. |
| Player visibility | `View Images` luôn hiện tại Station List, Map drawer và Station Detail; disabled khi gallery rỗng và không phụ thuộc `ST`/`STANDARD`. |
| Viewer | Player xem ảnh trong app bằng preview overlay có chuyển ảnh, zoom và đóng. |
| Existing inventory | 17 Station canonical hiện tại giữ gallery rỗng cho tới khi Admin cấu hình; seed/migration không đoán hoặc tự backfill URL. |
| Server-side fetch | Backend không tải hoặc probe URL ảnh để tránh SSRF; lỗi ảnh được xử lý tại Frontend. |

Player action layout:

- Station List và Map drawer hiển thị `Watch Video | View Images` ở hàng trên.
- Action full-width ở hàng dưới giữ Team primary style và icon Play.
- Station `In Progress` hiển thị `In Progress` thay cho `Play` nhưng vẫn mở Station Detail.
- Player Station Detail V1 giữ `Complete` để mở QR Check-out và `Cancel` là
  action riêng. Team Gameplay V2 dùng Detail overlay riêng với cùng capability,
  V2 scanner/score flow và state-aware actions.
- Admin Team Station action `View & Edit` và các Admin flow ngoài Station Editor không thay đổi.

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
