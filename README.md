# MOVEMENT 2026 - HỆ THỐNG TRÒ CHƠI TRẠM SỐ HÓA (SUỐI TIÊN)

Tài liệu này hướng dẫn chi tiết về cấu trúc dự án, thứ tự triển khai và các thành phần kỹ thuật cần thiết cho dự án **Movement 2026**.

---

## 1. TECH STACK (CÔNG NGHỆ SỬ DỤNG)

Dự án được xây dựng theo mô hình Fullstack TypeScript, đảm bảo tính đồng bộ và chặt chẽ về kiểu dữ liệu (Type-safe) giữa Frontend và Backend.

* **Frontend (Client-side):**
    * **Core:** React.js + TypeScript + Vite.
    * **UI Framework:** React Bootstrap (`react-bootstrap`).
    * **Giao tiếp API:** Axios (Cấu hình Interceptors để tự động đính kèm JWT Token vào Header).
    * **Quét QR:** `html5-qrcode`.
* **Backend (Server-side):**
    * **Runtime:** Node.js.
    * **Framework:** NestJS + TypeScript.
    * **Xác thực (Auth):** `Passport.js` + `@nestjs/jwt` (Bảo mật API bằng JSON Web Token).
    * **Bảo mật mật khẩu:** `bcrypt` (Để mã hóa mật khẩu Admin/Trưởng trạm).
    * **ORM:** Prisma (Hoặc TypeORM).
* **Database:**
    * PostgreSQL.

---

## 2. THỨ TỰ TRIỂN KHAI DỰ ÁN (ROADMAP)

### Bước 1: Khởi tạo & Thiết kế Database (PostgreSQL)
- Cài đặt PostgreSQL và Prisma.
- Thiết kế Schema cho: `Users` (Admin/Trưởng trạm), `Stations` (Trạm), `Teams` (Đội chơi), `Progress` (Lịch sử).

### Bước 2: Xây dựng Backend API & Xác thực JWT (NestJS)
- Khởi tạo dự án: `nest new backend` (chọn TypeScript).
- **Thiết lập AuthModule:**
  - Viết logic tạo JWT Token khi login thành công.
  - Tạo `JwtAuthGuard` để bảo vệ các API nhạy cảm (VD: Chỉ có JWT của Trưởng trạm mới được gọi API mở khóa trạm).
  - Tạo `RolesGuard` để phân quyền (Admin vs Station Manager vs Player).
- Tạo các Module dữ liệu: `StationsModule`, `TeamsModule`, `CheckinModule`.

### Bước 3: Phát triển Frontend (React TS + Bootstrap)
- Khởi tạo dự án Frontend và cài đặt Bootstrap.
- Xây dựng luồng Đăng nhập: 
  - Gọi API Login $\rightarrow$ Nhận JWT Token $\rightarrow$ Lưu vào `localStorage`.
  - Cấu hình Axios Interceptor để mọi request sau này đều có `Authorization: Bearer <token>`.
- Tích hợp Component Bản đồ (`MovementMap.tsx`) và gắn dữ liệu từ API.

### Bước 4: Xây dựng Giao diện Trưởng trạm & Admin
- Màn hình Trưởng trạm: Yêu cầu đăng nhập tài khoản riêng $\rightarrow$ Quét mã QR đội $\rightarrow$ Gọi API đính kèm JWT của Trưởng trạm để xác nhận.
- Màn hình Admin: Dashboard quản lý tổng và can thiệp realtime (Chỉ tài khoản role ADMIN mới truy cập được).

---

## 3. THIẾT KẾ DATABASE SCHEMA (BỔ SUNG QUẢN LÝ TÀI KHOẢN)

Dưới đây là cấu trúc bảng tĩnh, bổ sung thêm bảng `Users` để quản trị quyền bằng JWT:

```sql
-- 1. Bảng Tài khoản Quản trị & Trưởng trạm (Dùng để Login lấy JWT)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Đã mã hóa bằng bcrypt
    role VARCHAR(20) NOT NULL,           -- 'ADMIN' hoặc 'STATION_MANAGER'
    station_id VARCHAR(10)               -- Nếu là trưởng trạm, được gán quản lý trạm nào?
);

-- 2. Bảng lưu thông tin các Trạm chơi
CREATE TABLE stations (
    id VARCHAR(10) PRIMARY KEY, 
    name VARCHAR(255) NOT NULL,
    game_type VARCHAR(100),     
    points INT DEFAULT 0,       
    youtube_url VARCHAR(500),   
    clue_text TEXT,             
    latitude NUMERIC(10, 7),    
    longitude NUMERIC(10, 7)
);

-- 3. Bảng lưu thông tin các Đội chơi
CREATE TABLE teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) UNIQUE NOT NULL,
    passcode VARCHAR(50) NOT NULL,       -- Mật mã để đội đăng nhập lấy JWT
    total_points INT DEFAULT 0,
    start_time TIMESTAMP
);

-- 4. Bảng lưu lịch sử đi trạm của từng đội
CREATE TABLE team_station_progress (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(team_id),
    station_id VARCHAR(10) REFERENCES stations(id),
    status VARCHAR(20) DEFAULT 'LOCKED', 
    arrival_time TIMESTAMP,             
    completion_time TIMESTAMP,          
    score_achieved INT DEFAULT 0        
);