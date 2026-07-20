# Workflow phân tích MOVEment 2026

Mục tiêu của bộ prompt này là biến các ghi chú ban đầu trong `Note` và định hướng trong `README.md` thành tài liệu phân tích đủ rõ để thiết kế UI, database, API và backlog phát triển.

## Cách sử dụng

Đi lần lượt theo thứ tự file. Mỗi file là một prompt độc lập có thể đưa cho AI hoặc dùng như checklist khi làm việc nhóm.

1. `01_PRODUCT_SCOPE_PROMPT.md`
   - Chốt bối cảnh sản phẩm, vai trò người dùng, mục tiêu trò chơi, thuật ngữ.
2. `02_PLAYER_SCREENS_PROMPT.md`
   - Phân tích chi tiết các màn hình người chơi: trang chủ, map, detail trạm, QR, leaderboard, settings.
3. `03_STATION_QR_FLOW_PROMPT.md`
   - Chốt flow check-in, check-out, cancel, nhập điểm, reopen, timer.
4. `04_ADMIN_FUNCTIONS_PROMPT.md`
   - Phân tích admin: đăng nhập, quản lý team/trạm/điểm, reopen trạm, log.
5. `05_DATABASE_API_PROMPT.md`
   - Chuyển nghiệp vụ sang PostgreSQL schema, API contract, quyền truy cập.
6. `06_UI_REFERENCE_PROMPT.md`
   - Phân tích style UI dựa trên ảnh tham chiếu: neon mobile HUD, map, QR dock, leaderboard.
7. `07_ACCEPTANCE_BACKLOG_PROMPT.md`
   - Tạo backlog, mức ưu tiên, tiêu chí nghiệm thu, rủi ro còn mở.
8. `08_IMPLEMENTATION_SYNC_PROMPT.md`
   - Dùng sau mỗi đợt code/verify để cập nhật analysis docs, backlog, audit, decision và login/runbook data.

## Quy tắc phân tích

- Luôn phân biệt rõ: đã chắc chắn, đang giả định, cần hỏi lại.
- Nếu có mâu thuẫn giữa `README.md`, source hiện tại và `Note`, ghi rõ mâu thuẫn thay vì tự lấp.
- Trước khi code, cập nhật tài liệu hoặc verify, xem nhanh `docs/analysis/` để lấy trạng thái mới nhất và dùng prompt liên quan như checklist.
- Sau khi code, seed, smoke test hoặc thay đổi quyết định, cập nhật file analysis tương ứng. Không để audit/backlog/decision lệch với source hiện tại.
- Chỉ cập nhật `docs/prompts/` khi quy trình làm việc hoặc checklist lặp lại thay đổi; không cập nhật prompt chỉ vì một bugfix nhỏ.
- Ưu tiên thiết kế theo mobile-first vì ảnh tham chiếu là giao diện điện thoại.
- Với mỗi màn hình, cần có: mục tiêu, dữ liệu hiển thị, hành động, trạng thái lỗi, quyền truy cập, API cần dùng.
- Với mỗi chức năng, cần có: actor, precondition, main flow, alternate flow, side effect, audit/log.

## Input nền tảng

Tóm tắt từ `Note`:

- Player home cần hiển thị tên team, số điểm, tổng điểm.
- Cần màn hình map.
- Detail từng chặng/trạm cần hỗ trợ quét mã, check in, check out, cancel.
- Settings người dùng còn chưa rõ.
- Danh sách trò chơi có thể cần hiển thị độ khó bằng sao.
- Khi hoàn thành, scan QR kết thúc và hiện popup nhập điểm.
- Timer dự kiến đếm ở client.
- Tech stack định hướng: React, TypeScript, PostgreSQL.
- Admin còn mở: đăng nhập bằng gì, chức năng đổi điểm, reopen trạm bằng flag để team có thể tham gia lại.

