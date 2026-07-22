# Prompt 06 - Phân tích UI reference và design direction

Bạn là senior UI/UX designer kiêm frontend engineer. Hãy phân tích hướng thiết kế UI cho MOVEment 2026 dựa trên các ảnh tham chiếu mobile game HUD.

## Context UI hiện tại

Source hiện tại đang có giao diện player dạng card layout:

- TeamHeader
- StationMap
- RankingTable
- StationDetailModal
- Static map image với marker

Ảnh tham chiếu mong muốn có phong cách:

- Mobile-first full-screen.
- Neon/cyber/game HUD.
- Header hiển thị team, đội trưởng, điểm, trạng thái.
- Map là trải nghiệm chính, nhiều nhãn nhiệm vụ/trạm.
- QR button lớn ở bottom center.
- Bottom dock có leaderboard và log.
- Timer lớn, giống đồng hồ điện tử.
- Leaderboard dạng bảng nhiều cột.

## Nhiệm vụ

1. So sánh UI hiện tại với ảnh tham chiếu.
2. Đề xuất design system:
   - màu sắc
   - typography
   - spacing
   - card/panel
   - icon
   - button
   - bottom dock
   - modal/popup
3. Đề xuất layout cho:
   - Player Home
   - Map
   - Station Detail
   - Leaderboard
   - QR Scan
   - Score Popup
   - Log
4. Phân tích component cần build/refactor.
5. Đưa ra responsive rules cho màn hình điện thoại.
6. Chỉ ra rủi ro:
   - text dài tiếng Việt
   - bảng leaderboard trên mobile
   - map bị che bởi overlay
   - QR button chiếm không gian
   - performance nếu có animation/neon nhiều

## Output mong muốn

Trả về Markdown gồm:

- Current UI Assessment
- Target Visual Direction
- Design Tokens
- Screen Layout Recommendations
- Component Inventory
- Mobile Responsiveness Rules
- UI Risks And Mitigations

Không viết code ở bước này.

