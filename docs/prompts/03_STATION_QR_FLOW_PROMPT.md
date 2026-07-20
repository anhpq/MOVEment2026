# Prompt 03 - Phân tích flow trạm, QR và timer

Bạn là senior business analyst kiêm backend engineer. Hãy phân tích chi tiết nghiệp vụ check-in, check-out, cancel và nhập điểm cho từng trạm/chặng.

## Context nghiệp vụ

- Team chọn hoặc đi tới một trạm trên map.
- Team scan QR để check in.
- Mỗi team có 1 QR login riêng, unique, không dùng chung với QR trạm; login team phải giữ rule một active device session cho mỗi team.
- Mỗi station có 2 QR riêng và unique: QR bắt đầu/check-in và QR kết thúc/check-out.
- Mỗi station cần cấu hình cách tính kết quả: `SCORE`, `TIME`, hoặc `BOTH`, lưu DB và chỉnh được trong admin UI.
- Nếu station có tính thời gian và điểm (`BOTH`), QR start/end ghi nhận đúng thời gian quét thực tế rồi tiếp tục flow nhập điểm.
- Nếu station chỉ tính thời gian (`TIME`), QR end tự complete station với score 0 và cộng duration, không mở flow nhập điểm.
- Nếu station chỉ tính điểm (`SCORE`), vẫn dùng QR start/end nhưng backend đặt thời gian end bằng thời gian start để không cộng duration.
- Team có thể cancel nếu chưa hoàn thành.
- Khi hoàn thành, team scan QR kết thúc.
- Sau scan QR kết thúc, hiện popup nhập điểm.
- Admin có thể đổi điểm sau đó.
- Admin có thể reopen trạm bằng flag để team tham gia lại.
- Timer dự kiến đếm ở client, nhưng cần đánh giá rủi ro gian lận và đồng bộ.

## Nhiệm vụ

1. Vẽ state machine cho tiến trình team tại một trạm.
2. Định nghĩa các trạng thái đề xuất, ví dụ:
   - LOCKED
   - AVAILABLE
   - CHECKED_IN
   - PLAYING
   - WAITING_SCORE
   - COMPLETED
   - CANCELLED
   - REOPENED
3. Phân tích từng action:
   - check in
   - check out
   - cancel
   - submit score
   - admin edit score
   - admin reopen station
4. Với mỗi action, xác định:
   - actor
   - precondition
   - input
   - validation
   - database update
   - log/audit event
   - response UI
   - error cases
5. Đề xuất cách xử lý timer:
   - client-only
   - server authoritative timestamp
   - hybrid
   - rủi ro và khuyến nghị

## Output mong muốn

Trả về Markdown gồm:

- Station Progress State Machine
- Action Specifications
- Timer Recommendation
- Data Fields Needed
- Edge Cases
- Open Questions

Không viết code ở bước này.

