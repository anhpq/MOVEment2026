# MOVEment 2026 UI v3

Bản HTML/CSS + React bám theo mockup cyberpunk đã chốt.

## Thay đổi chính
- Bỏ tia sét ở marker đang chơi.
- Font: **Oxanium** cho title/số/marker; **Space Grotesk** cho tiếng Việt.
- Legend màu marker đặt ngay dưới tổng điểm; portrait tự wrap 2×2, landscape hiển thị 1×4.
- Marker đồng size, thon hơn.
- `playing`: vàng + heartbeat nhẹ.
- `completed`: trắng/xám mờ nhẹ nhưng vẫn click.
- `unplayed`: cyan/blue/purple.
- `locked`: xám tối + khóa.
- Footer giữ BXH / QUÉT MÃ / ĐỘI CỦA TÔI và style cyberpunk.
- Có dotted route lines như mockup.
- `reference.png` là mockup tham chiếu.

## File
- `index.html` chạy trực tiếp.
- `styles.css` dùng chung HTML và React.
- `Movement2026.jsx` component React.
- `reference.png` ảnh tham chiếu.


## v4 changes
- Marker đang chơi có double-heartbeat rõ hơn + aura/radar pulse.
- Bỏ toàn bộ dotted route lines giữa các trạm.
- Bỏ `footer-sparkle`.
- Chú thích thu gọn thành nút `i CHÚ THÍCH`; chỉ bung legend khi bấm.
