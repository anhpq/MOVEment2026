# Prompt 02 - Phân tích màn hình Player

Bạn là senior UX/product engineer. Hãy phân tích chi tiết các màn hình dành cho người chơi/team của MOVEment 2026.

## Context

Player app cần có:

- Trang chủ: tên team, số điểm, tổng điểm, trạng thái đang chơi.
- Map: bản đồ Suối Tiên, các trạm/chặng, trạng thái từng trạm.
- Detail trạm: thông tin game, độ khó, điểm tối đa, trạng thái check-in/check-out/cancel.
- QR flow: quét QR bắt đầu và QR kết thúc.
- Popup nhập điểm sau khi scan QR kết thúc.
- Leaderboard/bảng xếp hạng.
- Log hoạt động.
- Settings người dùng còn chưa rõ.

Ảnh tham chiếu định hướng UI:

- Màn hình mobile full-screen, neon game HUD.
- Header có team, đội trưởng, điểm, trạng thái.
- Map có nhãn trạm/game/task overlay.
- Bottom dock có QR ở giữa, nút bảng xếp hạng, nút log.
- Leaderboard hiển thị rank, team, đội trưởng, điểm, trò cuối cùng, tổng thời gian.

## Nhiệm vụ

Với từng màn hình, hãy phân tích:

1. Mục tiêu màn hình.
2. Dữ liệu cần hiển thị.
3. Hành động người dùng có thể bấm.
4. Component UI chính.
5. Trạng thái:
   - loading
   - empty
   - error
   - locked
   - playing
   - completed
6. API/data cần dùng.
7. Điều hướng sang màn hình khác.
8. Quy tắc responsive mobile-first.

## Danh sách màn hình cần phân tích

- Player Home / Current Game Dashboard
- Map Overview
- Station Detail
- QR Scan Start
- QR Scan End
- Score Input Popup
- Leaderboard
- Activity Log
- Settings

## Output mong muốn

Trả về Markdown theo format:

```md
## Screen: <Tên màn hình>

### Purpose

### Data

### Actions

### UI Components

### States

### API/Data Dependencies

### Navigation

### Notes/Open Questions
```

Không viết code ở bước này.

