# Admin V2 Parallel Layout Restructure Analysis & Execution Plan

## 1. Feature Context & Objectives

- **Feature Name**: Parallel Admin V2 Layout Restructure (`ADMIN_LAYOUT_RESTRUCTURE_V2`)
- **Goal**: Create a parallel `/admin/v2` interface with a reorganized 3-area layout (Vận hành, Quản lý, Cấu hình) while preserving Admin V1 routes and adding a seamless switcher button between V1 and V2.
- **Key Strategy**: Parallel implementation (similar to `Team Gameplay V2`). Admin V1 remains fully functional and untouched as fallback.
- **Constraints**:
  - Do NOT break or modify existing Admin V1 routes (`/admin/operations`, `/teams`, `/system-config`).
  - Add a toggle button in the Header to switch between Admin V1 and Admin V2.
  - Do NOT change underlying backend APIs, data contracts, or business rules.
  - Preserve all existing color palettes, theme variables, and branding.

---

## 2. Architecture & Design Decisions

### Parallel Routing Architecture

```text
Admin V1 Routes (Legacy - Intact):
- /teams                      (Team Selection & Progress)
- /admin/operations           (Operations & Dashboard)
- /system-config              (Station & Team Settings)

Admin V2 Routes (New Parallel Interface):
- /admin/v2                   (Default -> Redirects to /admin/v2/operations)
- /admin/v2/operations        (Area 1: Vận hành - Dashboard Metrics, Score Queue, Final Submissions, Activity Logs)
- /admin/v2/management        (Area 2: Quản lý - Team Hub, Station Management, QR Viewer/Downloader)
- /admin/v2/config            (Area 3: Cấu hình - Event Timing, Final Challenge Setup, Map Editor)
```

### Navigation & Header Switcher
- In `AppFrame.tsx`, when `session.role === "admin"`:
  - Add a visible toggle button in the header:
    - On Admin V1: **"⚡ Thử nghiệm Admin V2"** -> Navigates to `/admin/v2`.
    - On Admin V2: **"↩️ Về Admin V1"** -> Navigates to `/teams` (or previous V1 route).

---

## 3. Detailed Component Structure for Admin V2

### Area 1: VẬN HÀNH (Operations) — `/admin/v2/operations`
1. **Fixed Top Banner**:
   - Header with Live Operations status & Refresh button.
   - 4-metric overview Cards (Teams, Completed Stations, Score Queue, Active Sessions).
   - Prominent **Export Team Results (Excel)** button.
2. **Tabs Section**:
   - **Tab 1: Hàng đợi chấm điểm** (`Score Queue`).
   - **Tab 2: Bài nộp Final** (`Final Submissions`).
   - **Tab 3: Nhật ký hoạt động** (`Activity Logs`).

### Area 2: QUẢN LÝ (Management) — `/admin/v2/management`
1. **Tab 1: Quản lý Đội thi (`Teams`)**:
   - Integrated Team Cards with score, progress, and status.
   - Quick action buttons:
     - 👁️ **Xem tiến độ trạm** (Opens team stations progress modal/drawer).
     - ✏️ **Chỉnh sửa Đội**.
     - 🔳 **Mã QR Đội** (Modal preview & PNG download).
   - Top action: **+ Thêm Đội mới**.
2. **Tab 2: Quản lý Trạm game (`Stations`)**:
   - Station Cards with code (`01`..`17`), name, description.
   - Tracking mode inline selector (`BOTH`, `SCORE`, `TIME`).
   - Quick action buttons:
     - ✏️ **Chỉnh sửa Trạm**.
     - 🗑️ **Xóa Trạm**.
     - 🔳 **Mã QR Trạm** (Check-in & Check-out QRs preview/download).
   - Top action: **+ Thêm Trạm mới**.

### Area 3: CẤU HÌNH (System Config) — `/admin/v2/config`
1. **Tab 1: Thời gian Sự kiện (`Event Timing`)**:
   - Event end time, Final start time, timezone, lead time, 5-minute pre-Final warning alert.
2. **Tab 2: Thử thách Cuối (`Final Challenge`)**:
   - Title, Clue text, current keyword display, and keyword update input.
3. **Tab 3: Bản đồ Trạm (`Map Editor`)**:
   - Interactive `StationsMapPanel`.

---

## 4. Proposed File Changes

#### [MODIFY] [routes.tsx](file:///e:/Work/MOVEment2026/fe/src/features/movement/routes.tsx)
- Add protected routes for `/admin/v2`, `/admin/v2/operations`, `/admin/v2/management`, `/admin/v2/config`.

#### [MODIFY] [AppFrame.tsx](file:///e:/Work/MOVEment2026/fe/src/features/movement/layout/AppFrame.tsx)
- Add V1 <-> V2 toggle button in header for Admin users.
- Show Admin V2 specific bottom nav items when on `/admin/v2/*` routes.

#### [NEW] [AdminV2Page.tsx](file:///e:/Work/MOVEment2026/fe/src/features/movement/pages/adminV2/AdminV2Page.tsx)
- Container component managing the 3 sub-views (Operations, Management, Config).

#### [NEW] [AdminV2OperationsView.tsx](file:///e:/Work/MOVEment2026/fe/src/features/movement/pages/adminV2/AdminV2OperationsView.tsx)
- Live Operations metrics banner + [Queue, Submissions, Logs] tabs.

#### [NEW] [AdminV2ManagementView.tsx](file:///e:/Work/MOVEment2026/fe/src/features/movement/pages/adminV2/AdminV2ManagementView.tsx)
- Combined Team & Station management hub with integrated QR code modal preview/download.

#### [NEW] [AdminV2ConfigView.tsx](file:///e:/Work/MOVEment2026/fe/src/features/movement/pages/adminV2/AdminV2ConfigView.tsx)
- Event Timing, Final Challenge setup, and Map Editor tabs.

---

## 5. Verification Plan

- Run `npm run lint` & `npm run typecheck` in `fe/`.
- Run `npm run test` in `fe/`.
- Verify seamless switching between Admin V1 and Admin V2 via header toggle.
- Verify Admin V1 remains 100% functional without regressions.
