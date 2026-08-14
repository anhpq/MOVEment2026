# MOVEment 2026 — React + TypeScript + Konva

Bản chuyển sang React TypeScript + `react-konva` cho phần bản đồ/marker.

## Layout quan trọng

App dùng CSS Grid 3 hàng:

```text
HEADER
MAIN (Konva canvas)
FOOTER
```

Header và footer **không dùng `position: absolute/fixed` đè lên main**. Main luôn nhận phần chiều cao còn lại bằng `minmax(0, 1fr)` nên canvas không bị che.

## Marker states

- `playing`: vàng + heartbeat 2 nhịp + aura/radar pulse.
- `unplayed`: cyan → violet.
- `completed`: trắng/xám, opacity nhẹ nhưng vẫn click được.
- `locked`: tối + khóa.

Không còn đường chấm nối các trạm và không có footer sparkle.

## Legend

Mặc định chỉ hiện nút `i CHÚ THÍCH`. Bấm mới bung bảng màu marker.

## Responsive

- Portrait: layout marker theo bản mobile.
- Landscape: chuyển sang layout marker ngang riêng.
- `ResizeObserver` resize Konva Stage theo đúng kích thước main.
- Shell dùng `100vh` fallback + `100dvh`, không ép minimum height nên không tràn viewport landscape thấp; các control giữ touch target tối thiểu `44px`.

## Chạy

```bash
npm install
npm run dev
```

## Build

```bash
npm ci
npm run build
```

`node_modules`, `dist`, logs, TypeScript build info và Vite config output được ignore. Chỉ source/config cùng `package-lock.json` được commit để build tái lập.

Score card chỉ hiển thị số điểm và `PTS`; accessible score context được giữ ở integration production.

Production build tách React và Konva thành vendor chunks riêng để tránh một bundle đơn lớn và tận dụng browser cache tốt hơn khi source demo thay đổi.

## File chính

- `src/Movement2026.tsx`: UI + Konva stage + marker + heartbeat.
- `src/movement2026.css`: header/footer/legend/layout responsive.
- `src/types.ts`: types của station.

## Tích hợp API

Dữ liệu station có thể thay mảng demo bằng API response. Tọa độ đang dùng dạng normalized `0..1` (`x`, `y`) để responsive theo canvas.
