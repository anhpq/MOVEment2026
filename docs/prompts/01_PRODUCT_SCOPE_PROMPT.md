# Prompt 01 - Phân tích phạm vi sản phẩm

Bạn là senior product analyst kiêm senior React/TypeScript/PostgreSQL developer. Hãy phân tích sản phẩm MOVEment 2026 dựa trên README, source hiện tại và ghi chú sau:

```text
- trang chủ: số điểm / tổng điểm, tên team
- map
- detail: màn hình quét mã của từng chặng/trạm: check in, check out, cancel
- setting của người dùng còn chưa rõ
- danh sách trò chơi có thể hiển thị độ khó bằng số sao
- chức năng: check in, check out, cancel
- khi hoàn thành, scan QR kết thúc, hiển thị popup nhập số điểm
- đếm thời gian ở client
- tech stack: React, TypeScript, PostgreSQL
- admin: đăng nhập bằng gì chưa rõ
- admin có thể đổi điểm, reopen trạm bằng flag để team tham gia lại
```

## Nhiệm vụ

1. Xác định mục tiêu chính của app.
2. Xác định actor/role:
   - Player/team
   - Admin
   - Station manager nếu cần
3. Định nghĩa thuật ngữ:
   - Team
   - Station/trạm/chặng
   - Game/trò chơi
   - Check-in
   - Check-out
   - Cancel
   - Reopen
   - Score/total score
   - Timer
4. Tách rõ phạm vi MVP và phạm vi sau MVP.
5. Liệt kê các câu hỏi còn mở cần hỏi client/team.

## Output mong muốn

Trả về Markdown gồm:

- Product Summary
- User Roles
- Core Concepts
- MVP Scope
- Out Of Scope For Now
- Open Questions
- Risk Notes

Không viết code ở bước này.

