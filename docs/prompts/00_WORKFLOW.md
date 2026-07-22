# MOVEment 2026 - Documentation & Codex Workflow

## Vai trò của file này

Đây là **Workflow Index** dành cho Codex, Claude Code, ChatGPT và developer làm việc với repository MOVEment 2026.

File này quy định:

- phải đọc tài liệu theo thứ tự nào;
- cách xác định đúng Feature đang được thay đổi;
- khi nào sử dụng từng Prompt;
- khi nào cần cập nhật Business Rule;
- khi nào chỉ sửa Source Code;
- tài liệu nào phải đồng bộ sau khi hoàn tất;
- cách verify và báo cáo kết quả;
- giới hạn quyền Git của agent.

File này không chứa toàn bộ Business Rule và không thay thế Feature documentation.

Business Rule chính thức nằm tại:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

Feature routing nằm tại:

```text
docs/analysis/FEATURE_INDEX.md
```

---

# 1. Authority và Priority

Các loại chỉ dẫn trong repository có vai trò khác nhau và không được trộn lẫn.

## 1.1 Direct User Request

Yêu cầu trực tiếp hiện tại của user có priority cao nhất trong phạm vi task.

Nếu yêu cầu mới thay đổi Business Rule đã chốt:

1. Xác nhận đây là Business Rule change.
2. Cập nhật `OPEN_QUESTIONS_AND_DECISIONS.md`.
3. Cập nhật các tài liệu liên quan.
4. Sau đó mới thay đổi implementation.

Không được âm thầm sửa code theo yêu cầu mới nhưng để documentation giữ rule cũ.

---

## 1.2 `AGENTS.md`

```text
AGENTS.md
```

là Source of Truth cho **Agent Operational Instructions**, bao gồm:

- cách agent nhận và phân loại task;
- Graphify policy;
- cách đọc project;
- phạm vi chỉnh sửa;
- verification;
- Git autonomy;
- các hành động bị cấm.

`AGENTS.md` không thay thế Business Rule của sản phẩm.

---

## 1.3 Business Rule Source of Truth

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

là Source of Truth cho:

- confirmed Business Rules;
- product decisions;
- domain constraints;
- security policy đã chốt;
- behavior mong đợi của hệ thống.

Nếu một Prompt, analysis document hoặc Source Code mâu thuẫn với file này, agent phải báo conflict.

---

## 1.4 Feature Routing

```text
docs/analysis/FEATURE_INDEX.md
```

là tài liệu xác định:

- Feature thuộc phạm vi nào;
- phải đọc file nào;
- Prompt nào liên quan;
- sau khi thay đổi phải cập nhật tài liệu nào.

`FEATURE_INDEX.md` là navigation document, không phải nơi tự tạo Business Rule mới.

---

## 1.5 Project và Feature Analysis

```text
docs/analysis/PROJECT_ANALYSIS_SPEC.md
docs/analysis/QR_LOGIN.md
docs/analysis/QR_PAYLOADS.md
docs/analysis/IOS_SAFARI_QR_CAMERA_FIX.md
```

Các file này mô tả chi tiết flow, requirement, edge case, API expectation hoặc browser behavior.

Nếu chúng mâu thuẫn với `OPEN_QUESTIONS_AND_DECISIONS.md`, Business Rule Source of Truth được ưu tiên.

---

## 1.6 Audit và Backlog

```text
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

Vai trò:

- `BACKEND_AUDIT.md`: ghi implementation history, verification result, operational finding và technical handoff.
- `IMPLEMENTATION_BACKLOG.md`: ghi remaining work, gap, risk, priority và acceptance item chưa hoàn tất.

Hai file này không được dùng để tự ghi đè Business Rule.

---

## 1.7 Prompt Files

```text
docs/prompts/*.md
```

Prompt là repeatable execution checklist.

Prompt:

- hướng dẫn agent thực hiện một loại task;
- không phải Source of Truth;
- không được override Business Rule;
- chỉ cập nhật khi workflow hoặc checklist lặp lại thay đổi;
- không cần sửa sau mỗi bugfix nhỏ.

---

## 1.8 Source Code

Source Code là current implementation.

Agent luôn phải inspect Source Code trước khi sửa.

Tuy nhiên current implementation có thể:

- chưa hoàn chỉnh;
- stale;
- sai Business Rule;
- khác với documentation;
- chứa Legacy behavior.

Không được mặc định rằng code hiện tại luôn đúng chỉ vì nó đang chạy.

---

# 2. Mandatory Start Workflow

Trước mọi implementation task có ý nghĩa, agent phải thực hiện theo thứ tự:

1. Đọc `AGENTS.md`.
2. Đọc `docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md`.
3. Đọc `docs/analysis/FEATURE_INDEX.md`.
4. Xác định Feature và scope của task.
5. Đọc các Feature documents được liệt kê trong `FEATURE_INDEX.md`.
6. Đọc `PROJECT_ANALYSIS_SPEC.md` nếu task ảnh hưởng shared flow hoặc nhiều Feature.
7. Đọc `BACKEND_AUDIT.md` và `IMPLEMENTATION_BACKLOG.md` khi cần biết current status.
8. Chọn Prompt nhỏ nhất phù hợp với task.
9. Inspect current Source Code.
10. So sánh Business Rule, documentation và implementation.
11. Báo conflict có ảnh hưởng trước khi thay đổi code.
12. Thực hiện thay đổi nhỏ nhất đáp ứng đúng task.
13. Verify theo mức độ rủi ro.
14. Cập nhật tài liệu liên quan.
15. Tạo local commit nếu task hoàn tất, verify thành công và phù hợp Git Policy.
16. Báo cáo kết quả theo Completion Report.

Không cần đọc toàn bộ repository hoặc toàn bộ thư mục `docs/` cho mọi task nhỏ.

---

# 3. Task Classification

Trước khi làm việc, phải phân loại task vào một trong các nhóm dưới đây.

## 3.1 Business Rule Change

Ví dụ:

- đổi cách tính điểm Final;
- đổi thời điểm Final mở;
- thay đổi max score policy;
- thay đổi active session policy;
- thay đổi QR token lifecycle;
- thêm điều kiện mới cho Station flow.

Workflow:

1. Cập nhật `OPEN_QUESTIONS_AND_DECISIONS.md` trước.
2. Cập nhật Feature analysis liên quan.
3. Cập nhật Prompt nếu repeatable workflow thay đổi.
4. Thay đổi Source Code.
5. Thêm hoặc cập nhật test.
6. Verify.
7. Cập nhật `BACKEND_AUDIT.md`.
8. Cập nhật `IMPLEMENTATION_BACKLOG.md`.
9. Cập nhật `FEATURE_INDEX.md` nếu xuất hiện Feature hoặc route tài liệu mới.

---

## 3.2 Implementation Fix

Ví dụ:

- QR auto-login không redirect;
- backend không enforce max score;
- tạo Station mới nhưng thiếu QR token;
- Final bị duplicate rank;
- iPhone không decode được QR;
- session cũ không bị revoke.

Workflow:

1. Xác nhận Business Rule hiện tại.
2. Inspect implementation.
3. Tìm root cause.
4. Sửa phạm vi nhỏ nhất.
5. Thêm hoặc cập nhật test.
6. Verify.
7. Cập nhật `BACKEND_AUDIT.md`.
8. Cập nhật backlog status.
9. Không sửa Source of Truth nếu Business Rule không thay đổi.

---

## 3.3 Documentation Reconciliation

Ví dụ:

- hai file mô tả QR format khác nhau;
- tài liệu cũ còn `Station Manager`;
- tài liệu cũ còn fixed Final time;
- Prompt dùng path không đúng;
- một Feature chưa được thêm vào `FEATURE_INDEX.md`.

Workflow:

1. Không sửa Source Code nếu user chỉ yêu cầu documentation.
2. Lấy `OPEN_QUESTIONS_AND_DECISIONS.md` làm chuẩn.
3. Liệt kê conflict.
4. Đồng bộ tài liệu liên quan.
5. Ghi unresolved implementation gap vào `IMPLEMENTATION_BACKLOG.md`.
6. Review diff.
7. Không tuyên bố implementation đã đúng nếu chưa inspect hoặc verify code.

---

## 3.4 Analysis hoặc Audit

Ví dụ:

- phân tích complete QR flow;
- review backend architecture;
- inventory seed data;
- kiểm tra security risk;
- truy vết Feature qua nhiều module.

Workflow:

1. Đọc Business Rule và Feature Index.
2. Dùng Graphify nếu task đủ rộng và Graphify có ích.
3. Inspect code, config, migration, seed và deployment liên quan.
4. Phân biệt rõ:
   - Confirmed;
   - Observed;
   - Inferred;
   - Unknown;
   - Recommended.
5. Không sửa code nếu user chỉ yêu cầu audit.
6. Ghi gap vào audit hoặc backlog khi được yêu cầu.

---

## 3.5 Refactor

Ví dụ:

- gom token generation vào shared service;
- loại bỏ duplicate validation;
- cải thiện transaction boundary;
- đổi cấu trúc module nhưng giữ behavior.

Workflow:

1. Xác nhận không có Business Rule change.
2. Xác định behavior cần giữ nguyên.
3. Inspect dependency và call site.
4. Thực hiện refactor có phạm vi rõ.
5. Chạy regression verification.
6. Cập nhật `BACKEND_AUDIT.md` nếu architecture thay đổi đáng kể.
7. Không sửa Business Rule chỉ vì đổi cấu trúc code.

---

## 3.6 New Feature

Workflow:

1. Chốt Business Rule trong `OPEN_QUESTIONS_AND_DECISIONS.md`.
2. Thêm Feature vào `FEATURE_INDEX.md`.
3. Tạo hoặc cập nhật Feature analysis document nếu cần.
4. Cập nhật `PROJECT_ANALYSIS_SPEC.md` nếu ảnh hưởng shared flow.
5. Thêm backlog và Acceptance Criteria.
6. Chỉ tạo Prompt riêng nếu Feature đủ lớn hoặc cần workflow lặp lại.
7. Implement.
8. Verify.
9. Đồng bộ audit và backlog.

Không bắt đầu bằng việc viết một Master Prompt lớn khi Feature chưa có Business Rule rõ ràng.

---

# 4. Prompt Selection Strategy

## Nguyên tắc chính

Luôn sử dụng **Prompt nhỏ nhất đủ để hoàn thành task**.

Không chạy Master Prompt chỉ vì nó tồn tại.

Không chạy các Prompt `01` đến `12` theo thứ tự cho mọi task.

Không đưa nhiều Prompt chồng lấn vào cùng một lần chạy nếu một Feature Prompt đã đủ.

---

# 5. Prompt Catalog

## 5.1 Foundation Analysis Prompts

Các Prompt `01` đến `07` chủ yếu dùng để xây dựng hoặc tái phân tích product documentation.

### `01_PRODUCT_SCOPE_PROMPT.md`

```text
docs/prompts/01_PRODUCT_SCOPE_PROMPT.md
```

Dùng khi:

- scope sản phẩm chưa rõ;
- actor hoặc role thay đổi;
- cần chốt terminology;
- cần phân tích lại mục tiêu và boundary của hệ thống.

Không dùng cho bugfix nhỏ.

---

### `02_PLAYER_SCREENS_PROMPT.md`

```text
docs/prompts/02_PLAYER_SCREENS_PROMPT.md
```

Dùng khi:

- thiết kế hoặc phân tích Player screens;
- thay đổi Home, Map, Station Detail, QR, Leaderboard hoặc Settings;
- cần xác định state, API, action và error UX cho màn hình.

---

### `03_STATION_QR_FLOW_PROMPT.md`

```text
docs/prompts/03_STATION_QR_FLOW_PROMPT.md
```

Dùng khi:

- phân tích Station check-in/check-out flow;
- thay đổi cancel, cooldown, timer hoặc completion flow;
- cần rà soát QR interaction toàn diện.

Prompt này có thể chứa Legacy assumption.

Luôn đối chiếu với `OPEN_QUESTIONS_AND_DECISIONS.md` trước khi áp dụng.

---

### `04_ADMIN_FUNCTIONS_PROMPT.md`

```text
docs/prompts/04_ADMIN_FUNCTIONS_PROMPT.md
```

Dùng khi:

- phân tích Admin functions;
- thêm hoặc thay đổi Team management;
- thêm hoặc thay đổi Station management;
- thay đổi scoring administration, logs hoặc Event Config.

Không tự thêm Staff hoặc Station Manager role nếu Source of Truth không cho phép.

---

### `05_DATABASE_API_PROMPT.md`

```text
docs/prompts/05_DATABASE_API_PROMPT.md
```

Dùng khi:

- thiết kế hoặc thay đổi database schema;
- thiết kế API contract;
- thay đổi transaction, constraint hoặc index;
- thay đổi permission và validation boundary.

---

### `06_UI_REFERENCE_PROMPT.md`

```text
docs/prompts/06_UI_REFERENCE_PROMPT.md
```

Dùng khi:

- phân tích UI reference;
- định nghĩa visual direction;
- làm responsive/mobile-first UI;
- thay đổi design system hoặc interaction pattern.

Không dùng để quyết định Business Rule.

---

### `07_ACCEPTANCE_BACKLOG_PROMPT.md`

```text
docs/prompts/07_ACCEPTANCE_BACKLOG_PROMPT.md
```

Dùng khi:

- tạo hoặc cập nhật Acceptance Criteria;
- chia backlog;
- xác định P0/P1/P2;
- ghi risk, dependency và unresolved question.

---

## 5.2 Synchronization Prompt

### `08_IMPLEMENTATION_SYNC_PROMPT.md`

```text
docs/prompts/08_IMPLEMENTATION_SYNC_PROMPT.md
```

Dùng sau một đợt implementation hoặc verification có thay đổi đáng kể.

Mục tiêu:

- đồng bộ analysis với implementation đã verify;
- cập nhật backlog;
- cập nhật audit;
- cập nhật decision nếu Business Rule đã thay đổi;
- cập nhật account/seed/runbook data khi cần.

Không dùng Prompt này để tự phát minh Business Rule.

---

## 5.3 Master Execution Prompt

### `09_CODEX_MASTER_EXECUTION_PROMPT.md`

```text
docs/prompts/09_CODEX_MASTER_EXECUTION_PROMPT.md
```

Chỉ sử dụng khi user yêu cầu rõ một đợt execution rộng bao gồm nhiều Feature, ví dụ:

- QR Login;
- Final Challenge;
- Station Scoring;
- documentation synchronization;
- cross-feature verification.

Không chạy Master Prompt cho:

- một bug nhỏ;
- một Feature duy nhất;
- documentation-only fix;
- một thay đổi UI đơn lẻ;
- một migration nhỏ;
- một test failure riêng.

Khi chạy Master Prompt:

1. Chia thành phase.
2. Verify từng Feature trước khi chuyển phase.
3. Không gộp conflict của nhiều Feature thành assumption.
4. Không tạo một commit lớn nếu có thể tách thành các commit an toàn.
5. Dừng và báo khi gặp Business Rule chưa chốt.

---

## 5.4 Feature Execution Prompts

### `10_CODEX_QR_AUTO_LOGIN_AND_SEED_TOKENS_PROMPT.md`

```text
docs/prompts/10_CODEX_QR_AUTO_LOGIN_AND_SEED_TOKENS_PROMPT.md
```

Dùng cho:

- Automatic URL QR Login;
- `/qr-login?token=...`;
- Team QR token generation;
- seed token;
- missing token repair;
- token rotate/revoke;
- routing và redirect;
- deployment checks liên quan QR Login.

Phải phân biệt:

- Legacy Team QR Login;
- Automatic URL QR Login;
- Station QR.

Không được dùng Team QR Prompt để tự thay đổi Station QR behavior nếu task không yêu cầu.

---

### `11_CODEX_FINAL_GAME_KEYWORD_AND_SCORING_PROMPT.md`

```text
docs/prompts/11_CODEX_FINAL_GAME_KEYWORD_AND_SCORING_PROMPT.md
```

Dùng cho:

- Final keyword;
- uppercase normalization;
- backend validation;
- wrong-answer cooldown;
- first-correct ranking;
- Final points;
- duplicate protection;
- Event Config integration của Final.

---

### `12_CODEX_STATION_SCORE_ENTRY_LIMITS_PROMPT.md`

```text
docs/prompts/12_CODEX_STATION_SCORE_ENTRY_LIMITS_PROMPT.md
```

Dùng cho:

- score popup sau Check-out;
- `SCORE`, `TIME`, `BOTH`;
- max score;
- default max score;
- scoring code;
- backend validation;
- duplicate score/completion protection.

---

# 6. Feature-to-Prompt Routing

| Feature | Primary Prompt |
| --- | --- |
| Product scope và terminology | `01_PRODUCT_SCOPE_PROMPT.md` |
| Player screens | `02_PLAYER_SCREENS_PROMPT.md` |
| Station QR flow analysis | `03_STATION_QR_FLOW_PROMPT.md` |
| Admin functions | `04_ADMIN_FUNCTIONS_PROMPT.md` |
| Database và API design | `05_DATABASE_API_PROMPT.md` |
| UI reference | `06_UI_REFERENCE_PROMPT.md` |
| Acceptance và backlog | `07_ACCEPTANCE_BACKLOG_PROMPT.md` |
| Documentation sync sau implementation | `08_IMPLEMENTATION_SYNC_PROMPT.md` |
| Multi-Feature execution | `09_CODEX_MASTER_EXECUTION_PROMPT.md` |
| Automatic URL QR Login và Team QR seed | `10_CODEX_QR_AUTO_LOGIN_AND_SEED_TOKENS_PROMPT.md` |
| Final Challenge | `11_CODEX_FINAL_GAME_KEYWORD_AND_SCORING_PROMPT.md` |
| Station scoring và score limits | `12_CODEX_STATION_SCORE_ENTRY_LIMITS_PROMPT.md` |

Chi tiết Required Reading và Must Update nằm trong:

```text
docs/analysis/FEATURE_INDEX.md
```

---

# 7. Graphify Workflow

Graphify là advisory tool.

Graphify không được override:

- direct user request;
- `AGENTS.md`;
- Business Rule Source of Truth;
- security rule;
- architecture decision đã chốt;
- current verified Source Code behavior.

## Nên dùng Graphify khi

- task ảnh hưởng nhiều module;
- cần dependency tracing;
- cần architecture overview;
- cần tìm call path;
- refactor phạm vi rộng;
- cần hiểu relationship giữa controller, service, repository, schema và frontend.

## Có thể bỏ qua Graphify khi

- sửa documentation;
- thay đổi một file nhỏ;
- bug đã có file và root cause rõ;
- thay text/UI nhỏ;
- Graphify output stale hoặc không liên quan;
- user yêu cầu không dùng.

## Nếu Graphify không khả dụng

1. Không dừng task chỉ vì thiếu Graphify.
2. Inspect code bằng search và đọc file trực tiếp.
3. Báo rõ Graphify không chạy được nếu nó có ý nghĩa với task.
4. Không tuyên bố đã update graph nếu command chưa chạy thành công.

---

# 8. Source Code Editing Rules

Khi sửa code:

- giữ framework và pattern hiện có nếu không có lý do rõ để thay đổi;
- giữ module boundary hiện tại;
- không refactor ngoài scope;
- không revert thay đổi của user;
- không sửa generated file thủ công nếu có generator chính thức;
- không hard-code secret, raw production token hoặc exposed credential;
- không hard-code fixed Event time nếu Event Config là Source of Truth;
- không tạo predictable QR token từ Team ID hoặc Station ID;
- không quyết định Station QR purpose chỉ từ ký tự hiển thị trong payload;
- dùng transaction khi một operation phải tạo nhiều record nguyên tử;
- backend phải enforce security và domain validation;
- frontend validation chỉ hỗ trợ UX;
- error message cho user không được lộ stack trace hoặc secret.

---

# 9. Generated Data và Seed Workflow

Example data được phép tự generate khi user không chốt giá trị cụ thể.

Agent có thể tự tạo:

- Team name;
- username/password local;
- Station name;
- description;
- tracking mode sample;
- max score sample;
- UUID;
- Team QR token;
- Station Check-in token;
- Station Check-out token.

Generated data phải:

- đúng schema;
- đúng format;
- unique;
- idempotent khi seed chạy lại;
- an toàn cho local/test;
- không được tự động dùng cho Production;
- được ghi lại trong seed documentation hoặc command output khi user cần sử dụng.

## Khi tạo Team mới

Hệ thống phải tự động:

1. Tạo Team.
2. Tạo Team QR Login token.
3. Gắn token đúng Team.
4. Đảm bảo token unique.
5. Cho phép revoke hoặc rotate.

## Khi tạo Station mới

Hệ thống phải tự động:

1. Tạo Station.
2. Tạo `CHECK_IN` QR token.
3. Tạo `CHECK_OUT` QR token.
4. Gắn hai token đúng Station và đúng purpose.
5. Rollback nếu không thể tạo đủ hai token.
6. Cho phép hiển thị hoặc tạo QR artifact để in.

User không cần tự nghĩ raw QR token.

---

# 10. Verification Matrix

Verification phải tương xứng với risk.

| Loại thay đổi | Verification tối thiểu |
| --- | --- |
| Documentation-only | Review diff, path, heading, link và conflict. |
| UI text hoặc style nhỏ | Typecheck/lint liên quan và kiểm tra màn hình nếu có thể. |
| Frontend flow | Unit/component test phù hợp, typecheck, build và manual flow khi cần. |
| Backend validation | Unit/integration test liên quan và kiểm tra error case. |
| Database schema | Migration validation, constraint/index review và seed test. |
| Authentication hoặc token | Positive, invalid, revoked, expired, duplicate và session-revoke cases. |
| Station QR | Check-in, Check-out, wrong purpose, revoked token, duplicate scan và active Station constraints. |
| Final ranking | Concurrent correct submission, duplicate request, rank uniqueness và points. |
| Seed | Chạy seed ít nhất hai lần để kiểm tra idempotency khi môi trường cho phép. |
| Cross-module change | Backend test, frontend verification và end-to-end smoke flow phù hợp. |

Không được ghi "tests passed" nếu test chưa chạy.

Nếu không chạy được verification:

1. Nêu command dự định chạy.
2. Nêu lý do không chạy được.
3. Nêu phần nào vẫn chưa được verify.
4. Không che giấu risk.

---

# 11. Documentation Synchronization

Sau khi implementation hoàn tất, chỉ cập nhật file thực sự bị ảnh hưởng.

## Luôn cân nhắc

```text
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

## Chỉ cập nhật khi Business Rule thay đổi

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

## Cập nhật khi shared project behavior thay đổi

```text
docs/analysis/PROJECT_ANALYSIS_SPEC.md
```

## Cập nhật khi Feature routing thay đổi

```text
docs/analysis/FEATURE_INDEX.md
```

## Cập nhật khi Team login hoặc seed credentials thay đổi

```text
docs/analysis/TEAM_LOGIN_DATA.md
```

## Cập nhật khi QR Login flow thay đổi

```text
docs/analysis/QR_LOGIN.md
docs/analysis/QR_PAYLOADS.md
```

## Cập nhật khi iOS camera behavior thay đổi

```text
docs/analysis/IOS_SAFARI_QR_CAMERA_FIX.md
```

## Cập nhật Prompt khi

- repeatable workflow thay đổi;
- checklist thiếu bước quan trọng;
- Prompt reference path sai;
- Prompt chứa Legacy assumption có thể gây implementation sai.

Không sửa Prompt chỉ để phản ánh từng tên file code vừa thay đổi trong một bugfix nhỏ.

---

# 12. Git Workflow

Codex được phép tạo local commit khi:

- task đã hoàn tất;
- thay đổi chỉ thuộc scope;
- verification phù hợp đã chạy;
- tài liệu liên quan đã được cập nhật;
- không có known failure bị che giấu.

Trước khi commit:

1. Chạy `git status`.
2. Review diff.
3. Chỉ stage file thuộc task.
4. Không stage secret, local environment file hoặc unrelated change.
5. Dùng commit title rõ ràng.
6. Dùng commit body dạng bullet khi cần mô tả chi tiết.

Không được tự động:

- push;
- deploy;
- mở Pull Request;
- force push;
- reset;
- rewrite history;
- xóa branch;
- chạy destructive Git command.

Các hành động trên cần explicit user request.

---

# 13. Required Completion Report

Sau mỗi task, agent phải báo cáo theo format:

```text
1. Task classification
2. Feature và scope đã xử lý
3. Business Rules đã áp dụng
4. Conflicts đã phát hiện
5. Source Code files đã thay đổi
6. Documentation files đã thay đổi
7. Migration hoặc seed đã thay đổi
8. Tests và verification đã thực hiện
9. Verification chưa thực hiện được
10. Remaining risks hoặc backlog
11. Local commit đã tạo
12. Những việc không thực hiện: push, deploy, destructive Git actions
```

Báo cáo phải phân biệt rõ:

- completed;
- partially completed;
- not verified;
- blocked;
- out of scope.

---

# 14. Known Conflict Checklist

Trước khi làm Feature liên quan, kiểm tra các conflict đã biết:

- Legacy Team QR token và Automatic URL QR Login;
- one-time token và reusable/revocable/rotatable token;
- predictable QR chứa ID và Opaque Random Token;
- fixed Final time và Event Config end time;
- Staff hoặc Station Manager Legacy reference và no-Staff-role rule;
- Prompt path tương đối sai working directory;
- Source Code behavior cũ và Business Rule mới;
- seed hard-code token và automatic secure token generation.

Không được tự đoán cách reconcile.

Dùng `OPEN_QUESTIONS_AND_DECISIONS.md` làm chuẩn và ghi gap còn lại vào backlog.

---

# 15. Fast Path cho Task Nhỏ

Với task nhỏ, agent có thể dùng Fast Path:

1. Đọc `AGENTS.md`.
2. Đọc `OPEN_QUESTIONS_AND_DECISIONS.md`.
3. Tìm Feature trong `FEATURE_INDEX.md`.
4. Đọc đúng Feature document.
5. Inspect đúng Source Code files.
6. Sửa phạm vi nhỏ.
7. Verify.
8. Cập nhật audit/backlog nếu cần.
9. Báo cáo.

Không cần:

- đọc toàn bộ docs;
- chạy Master Prompt;
- chạy Graphify;
- tạo analysis document mới;
- sửa mọi Prompt.

---

# 16. Definition of Done

Task chỉ được xem là Done khi:

- behavior đáp ứng direct user request;
- không vi phạm confirmed Business Rule;
- conflict có ảnh hưởng đã được báo;
- implementation có phạm vi đúng;
- relevant tests hoặc verification đã chạy;
- documentation cần thiết đã đồng bộ;
- không đưa secret vào source hoặc documentation;
- không có unrelated change bị commit;
- remaining risk đã được ghi rõ;
- final report phản ánh đúng những gì thực sự đã làm.

Nếu một điều kiện không thể hoàn tất, task phải được báo là partial hoặc blocked, không được báo Done hoàn toàn.
