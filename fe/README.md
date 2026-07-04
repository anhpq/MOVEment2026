# MOVEment 2026 - Giao Diện Người Chơi (Player Interface)

## 📋 Mô Tả

Giao diện người chơi cho hệ thống trò chơi tại Suối Tiên - **MOVEment 2026**. Ứng dụng cho phép người chơi:
- Xem vị trí các trạm chơi trên bản đồ tương tác
- Theo dõi tiến độ cá nhân và xếp hạng đội
- Tương tác với các trạm (giải mã mật thư, quét QR, xem video)
- Quản lý thông tin đội và điểm số

## 🎮 Tính Năng Chính

### 1. **Bản Đồ Tương Tác (Station Map)**
- 📍 Hiển thị 10 trạm chơi trên bản đồ Suối Tiên
- 🎨 Mã màu theo trạng thái:
  - 🟢 **Xanh** - Hoàn thành (Completed)
  - 🟠 **Cam** - Đang chơi (Playing)
  - 🔵 **Xanh dương** - Mở khóa (Unlocked)
  - 🔴 **Đỏ** - Khóa (Locked)
- 🔍 **Zoom & Pan**: Phóng to/thu nhỏ và kéo bản đồ
  - Scroll chuột để zoom
  - Kéo chuột để di chuyển
  - Pinch gesture (mobile) để zoom
- 📱 Responsive design cho tất cả thiết bị

### 2. **Đầu Tiên Đội (Team Header)**
- 👥 Hiển thị thông tin đội hiện tại
- 🏆 Hạng và điểm số
- 📊 Thống kê: Số trạm hoàn thành, thời gian còn lại, tiến độ
- 🎨 Màu sắc riêng cho mỗi đội

### 3. **Bảng Xếp Hạng (Ranking Table)**
- 🥇 Top 5 đội dẫn đầu
- 👤 Đội hiện tại (nếu ngoài top 5)
- 📈 Hiển thị hạng, tên đội, và điểm số
- 🎯 Highlight đội người chơi

### 4. **Modal Chi Tiết Trạm (Station Detail Modal)**
- 📍 Tên trạm và loại trò chơi
- 📖 Gợi ý giải đố (Clue)
- 🎥 Video YouTube nhúng
- 🔐 Input mật thư (cho trạm mở khóa)
- 📱 Quét QR (cho trạm mở khóa)
- ⏱️ Thông tin cooldown (cho trạm hoàn thành)
- 🔘 Nút hành động theo trạng thái

## 🗂️ Cấu Trúc Thư Mục

```
frontend/
├── public/
│   ├── index.html              # HTML demo tĩnh
│   ├── images/
│   │   └── map/
│   │       ├── suoitien-map1.png    # Bản đồ chính
│   │       └── suoitien-map.png     # Bản đồ phụ
│   └── styles/
│       └── ...
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── TeamHeader.tsx        # Component đầu tiên đội
│   │   │   ├── TeamHeader.css
│   │   │   ├── RankingTable.tsx      # Component bảng xếp hạng
│   │   │   └── RankingTable.css
│   │   └── map/
│   │       ├── StationMap.tsx        # Component bản đồ tương tác
│   │       ├── StationMap.css
│   │       ├── StationDetailModal.tsx    # Component modal chi tiết
│   │       └── StationDetailModal.css
│   ├── pages/
│   │   └── player/
│   │       ├── PlayerPage.tsx        # Trang chính tập hợp tất cả
│   │       └── PlayerPage.css
│   ├── services/
│   │   └── dummyData.ts         # Dữ liệu giả lập
│   ├── types/
│   │   └── player.type.ts       # Type definitions
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── tsconfig.json
```

## 🔧 Công Nghệ

- **Frontend Framework**: React 18+ với TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (Responsive Design)
- **State Management**: React Hooks (useState, useRef, useEffect)
- **Map Image**: PNG static image với positioned markers

## 📦 Cài Đặt & Chạy

### Yêu Cầu
- Node.js 16+
- npm hoặc yarn

### Cài Đặt Dependencies
```bash
cd frontend
npm install
```

### Chạy Development Server
```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

### Build Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📊 Dữ Liệu

### Dummy Data (dummyData.ts)
- **20 Đội**: Dragon Squad, Phoenix Rising, Tiger Force, Eagle Eyes, Leopard Knights, v.v.
- **10 Trạm**: ST002, ST047, ST017, ST15A, ST029, ST003-ST006, ST010
- **Trạng Thái Trạm**: LOCKED, UNLOCKED, PLAYING, COMPLETED

### Đội Hiện Tại
- **Tên**: Savage Hunters
- **Hạng**: 6
- **Điểm**: 220
- **Trạm Hoàn Thành**: 3/10
- **Màu Sắc**: #228B22 (Xanh lá cây)

### Tiến Độ Trạm
- **ST002, ST047**: COMPLETED (Xanh) + cooldown 30 phút
- **ST017, ST15A**: UNLOCKED (Xanh dương)
- **ST029**: PLAYING (Cam)
- **Còn lại**: LOCKED (Đỏ)

## 🎯 TypeScript Interfaces

### Team
```typescript
interface Team {
  team_id: number;
  team_name: string;
  passcode: string;
  total_points: number;
  start_time: string;
  stations_completed: number;
  color: string;
  rank: number;
}
```

### Station
```typescript
interface Station {
  id: string;
  name: string;
  game_type: string;
  points: number;
  youtube_url: string;
  clue_text: string;
  latitude: number;
  longitude: number;
  position: { x: number; y: number }; // Percentage-based (%)
}
```

### TeamStationProgress
```typescript
interface TeamStationProgress {
  id: number;
  team_id: number;
  station_id: string;
  status: 'LOCKED' | 'UNLOCKED' | 'PLAYING' | 'COMPLETED';
  arrival_time: string | null;
  completion_time: string | null;
  score_achieved: number;
  attempts: number;
  last_played: string | null;
  cooldown_expires_at: string | null;
}
```

## 🎨 Màu Sắc & Styling

### Trạng Thái Marker
| Trạng Thái | Mã Màu | RGB |
|-----------|--------|-----|
| Hoàn thành | #4caf50 | Xanh lá cây |
| Đang chơi | #ff9800 | Cam |
| Mở khóa | #2196f3 | Xanh dương |
| Khóa | #f44336 | Đỏ |

### Đội
- Dragon Squad: #FF6B6B (Đỏ nhạt)
- Phoenix Rising: #FFA500 (Cam)
- Tiger Force: #FFD700 (Vàng)
- Eagle Eyes: #4169E1 (Xanh hoàng gia)
- Leopard Knights: #FF1493 (Hồng sâu)
- Savage Hunters: #228B22 (Xanh lá cây sẫm)

## 🚀 Hướng Phát Triển

### Component Props

**TeamHeader**
```typescript
<TeamHeader 
  team={currentTeam} 
  stations={stations}
  progress={progressData}
/>
```

**StationMap**
```typescript
<StationMap 
  stations={stations}
  progress={progressData}
  onStationClick={(station) => handleClick(station)}
/>
```

**RankingTable**
```typescript
<RankingTable 
  teams={allTeams}
  currentTeamId={6}
/>
```

**StationDetailModal**
```typescript
<StationDetailModal
  isOpen={isModalOpen}
  station={selectedStation}
  progress={stationProgress}
  onClose={() => setIsModalOpen(false)}
  onPlayGame={() => handlePlayGame()}
  onScanQR={() => handleScanQR()}
/>
```

### Event Handlers

- `handleStationClick`: Mở modal khi click marker
- `handleCloseModal`: Đóng modal
- `handlePlayGame`: Bắt đầu chơi trò chơi
- `handleScanQR`: Quét mã QR
- `zoomMap`: Phóng to/thu nhỏ bản đồ
- `resetMap`: Khôi phục bản đồ về trạng thái ban đầu
- `panMap`: Di chuyển bản đồ

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 480px
- **Tablet**: 480px - 768px
- **Desktop**: > 768px

### Điều Chỉnh Responsive
- Map container: 500px (desktop) → 350px (mobile)
- Marker size: 45px → 40px (mobile)
- Legend: Giảm font size và padding (mobile)
- Modal: Full screen trên mobile, 90% width trên desktop

## 🔗 API Integration (Tương Lai)

Thay thế `dummyData.ts` bằng API calls:
```typescript
// Lấy thông tin đội
GET /api/teams/:teamId

// Lấy danh sách trạm
GET /api/stations

// Lấy tiến độ
GET /api/teams/:teamId/progress

// Cập nhật trạng thái
POST /api/teams/:teamId/stations/:stationId/play
POST /api/teams/:teamId/stations/:stationId/submit-cipher
```

## 📝 HTML Demo

File `public/index.html` cung cấp:
- 🎨 Demo tĩnh của giao diện
- ⚡ Zoom & pan functionality test
- 📱 Responsive layout preview
- 🔍 Hữu ích để QA/preview trước khi build React

Mở `public/index.html` trực tiếp trên trình duyệt để xem preview.

## 🐛 Troubleshooting

### Bản đồ không hiển thị?
- Kiểm tra đường dẫn image: `/images/map/suoitien-map1.png`
- Đảm bảo file tồn tại trong `public/images/map/`
- Xóa cache và reload

### Marker không click được?
- Kiểm tra z-index (nên > 10)
- Đảm bảo không bị cover bởi element khác
- Kiểm tra event handler binding

### Zoom không hoạt động?
- Kiểm tra browser console có error không
- Đảm bảo JavaScript event listeners được attach
- Test mouse wheel và touch events riêng lẻ

## 📞 Liên Hệ & Support

Để báo cáo bug hoặc đề xuất tính năng, vui lòng liên hệ với team phát triển.

---

**Last Updated**: 2026-06-20  
**Version**: 1.0.0  
**Status**: Development ✅
