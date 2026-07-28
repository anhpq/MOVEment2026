# Prompt 05 - Phân tích database và API

Bạn là senior PostgreSQL/NestJS/TypeScript architect. Hãy thiết kế phân tích dữ liệu và API cho MOVEment 2026 dựa trên nghiệp vụ player, station QR flow và admin.

## Context kỹ thuật

- Frontend: React + TypeScript.
- Backend định hướng trong README: NestJS + JWT.
- Database: PostgreSQL.
- Cần quản lý team, station, game, progress, score, QR scan, log, admin.

## Nhiệm vụ

1. Đánh giá schema SQL hiện tại trong README và chỉ ra thiếu gì so với nghiệp vụ mới.
2. Đề xuất PostgreSQL schema tối thiểu cho MVP:
   - users
   - teams
   - stations
   - games
   - team_station_progress
   - score_events
   - qr_codes hoặc station_qr_tokens
   - activity_logs
3. Đề xuất enum/status cần có.
4. Định nghĩa quan hệ và constraints quan trọng.
5. Đề xuất API endpoints:
   - auth
   - player/team
   - map/stations
   - QR check-in/check-out
   - score submit
   - leaderboard
   - logs
   - admin edit/reopen
6. Với mỗi API, ghi:
   - method/path
   - role được gọi
   - request body
   - response body
   - validation
   - side effects
   - error responses
7. Đề xuất kiểu TypeScript dùng chung frontend/backend.

## Output mong muốn

Trả về Markdown gồm:

- Schema Gap Analysis
- Proposed Tables
- Enums
- API Contract
- TypeScript DTO Suggestions
- Security Notes
- Open Questions

Không viết migration/code ở bước này.

