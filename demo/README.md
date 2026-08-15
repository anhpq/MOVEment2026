# MOVEment 2026 visual references

`Movement2026.jsx`, `styles.css` và `index.html` là reference v4 lịch sử dùng khi port Team V2 vào production.

Reference chạy độc lập bằng React + TypeScript + Konva nằm tại:

```text
demo/movement2026-react-konva/
```

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
- `movement2026-react-konva/` là reference có thể build/chạy độc lập; generated output và dependencies không được commit.

## File
- `index.html` chạy trực tiếp.
- `styles.css` dùng chung HTML và React.
- `Movement2026.jsx` component React.
- `movement2026-react-konva/package-lock.json` khóa dependency cho build tái lập.

`reference.png` cũ đã được thay thế bởi reference React/Konva thực thi được.


## v4 changes
- Marker đang chơi có double-heartbeat rõ hơn + aura/radar pulse.
- Bỏ toàn bộ dotted route lines giữa các trạm.
- Bỏ `footer-sparkle`.
- Chú thích thu gọn thành nút `i CHÚ THÍCH`; chỉ bung legend khi bấm.
