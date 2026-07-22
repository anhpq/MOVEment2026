# Prompt 04 - Phân tích chức năng Admin

Bạn là senior full-stack developer. Hãy phân tích module Admin cho MOVEment 2026.

## Context

Ghi chú hiện tại:

- Admin cần đăng nhập, nhưng chưa rõ đăng nhập bằng gì.
- Admin có thể đổi điểm.
- Admin có thể reopen trạm bằng flag để team tham gia lại.
- Cần theo dõi log hoạt động.
- README có nhắc JWT, role ADMIN, station manager.

## Nhiệm vụ

1. Đề xuất mô hình đăng nhập admin:
   - username/password
   - JWT
   - role-based access control
2. Phân tích dashboard admin cần có những màn hình nào.
3. Phân tích chức năng:
   - xem danh sách team
   - xem tiến độ team theo trạm
   - sửa điểm
   - reopen trạm
   - khóa/mở trạm
   - xem log check-in/check-out
   - quản lý QR code nếu cần
4. Với mỗi chức năng, ghi rõ:
   - mục tiêu
   - dữ liệu hiển thị
   - thao tác
   - quyền truy cập
   - xác nhận trước khi lưu
   - audit log
   - API cần có
5. Chỉ ra rủi ro vận hành trong ngày diễn ra sự kiện.

## Output mong muốn

Trả về Markdown gồm:

- Admin Role Model
- Admin Screens
- Function Specifications
- Audit Log Requirements
- Operational Risks
- MVP Priority
- Open Questions

Không viết code ở bước này.

