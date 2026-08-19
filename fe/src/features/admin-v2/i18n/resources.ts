import i18n from "../../movement/i18n";

const adminV2Resources = {
  vi: {
    adminV2: {
      brand: "MOVEMENT 2026",
      console: "Admin Console",
      navigationLabel: "Điều hướng Admin V2",
      skipToContent: "Bỏ qua đến nội dung chính",
      nav: {
        dashboard: "Tổng quan",
        teams: "Quản lý đội",
        stations: "Trạm",
        leaderboard: "Bảng xếp hạng",
        operations: "Vận hành",
        settings: "Cài đặt",
        more: "Thêm",
        moreMenu: "Mở thêm điều hướng Admin",
        scoreQueue: "Hàng đợi điểm",
        eventControl: "Điều phối sự kiện",
        finalChallenge: "Thử thách cuối cùng",
        activityLogs: "Nhật ký hoạt động",
      },
      header: {
        pageContext: "Khu vực quản trị",
        deployment: "Bản dựng: {{value}}",
        deploymentUnknown: "Bản dựng: không rõ",
        account: "Tài khoản quản trị: {{username}}",
        accountMenu: "Mở menu tài khoản quản trị",
        logout: "Đăng xuất",
      },
      foundation: {
        ready: "Nền tảng Admin V2 đã sẵn sàng",
        dashboardDescription: "Khung điều hướng và workspace cho Admin V2 đã sẵn sàng. Dữ liệu tổng quan sẽ được triển khai ở Phase 2.",
        plannedDescription: "Module này sẽ được triển khai trong một Phase Admin V2 tiếp theo.",
        plannedLabel: "Đã lên kế hoạch",
      },
      dashboard: {
        title: "Tổng quan sự kiện",
        subtitle: "Theo dõi tình hình và thực hiện thao tác vận hành tiếp theo.",
        refresh: "Làm mới", retry: "Thử lại",
        partialData: "Một số dữ liệu Dashboard chưa tải được",
        partialDataDescription: "Dữ liệu đã tải thành công vẫn được hiển thị. Hãy thử lại để cập nhật phần còn lại.",
        loadSectionError: "Không thể tải dữ liệu cho phần này.", eventOverview: "Tổng quan sự kiện",
        openEventControl: "Mở điều phối sự kiện", stationCloseTime: "Đóng Check-in Trạm", finalStartTime: "Bắt đầu Final",
        eventState: {stationsOpen: "Đang mở Check-in Trạm", finalNotice: "Final sắp bắt đầu", stationsClosed: "Đã đóng Check-in Trạm", finalStarted: "Final đã bắt đầu"},
        needsAttention: "Cần chú ý", noAttention: "Chưa có việc cần xử lý ngay.", review: "Xem xử lý",
        attention: {
          pendingScores: "{{count}} điểm đang chờ xử lý", pendingScoresDescription: "Mở Hàng đợi điểm để hoàn tất chấm điểm.",
          timing: "Mốc đóng Trạm chưa cách Final 5 phút", timingDescription: "Kiểm tra lại cấu hình thời gian sự kiện.",
          finalSubmissions: "{{count}} lượt nộp Final", finalSubmissionsDescription: "Mở Final Challenge để xem danh sách lượt nộp.",
        },
        keyMetrics: "Chỉ số chính",
        metrics: {teams: "Đội", stations: "Trạm", activeTeams: "Đội đang hoạt động", completedAttempts: "Lượt Trạm hoàn tất", pendingScores: "Điểm chờ xử lý", finalSubmissions: "Lượt nộp Final"},
        quickActions: "Thao tác nhanh",
        actions: {teams: "Đội", stations: "Trạm", scoreQueue: "Hàng đợi điểm", stationMap: "Bản đồ Trạm", eventControl: "Điều phối sự kiện", finalChallenge: "Final Challenge"},
        recentActivity: "Hoạt động gần đây", viewAll: "Xem tất cả", noRecentActivity: "Chưa có hoạt động gần đây",
        activity: {
          at: "{{time}}", checkIn: "Đã Check-in Trạm", checkOut: "Đã Check-out Trạm", scoreSubmitted: "Đã nhập điểm", scoreUpdated: "Đã cập nhật điểm", scoreReopened: "Đã mở lại điểm",
          eventConfigUpdated: "Đã cập nhật cấu hình sự kiện", finalSubmitted: "Đã nộp Final", finalConfigUpdated: "Đã cập nhật cấu hình Final", teamCreated: "Đã tạo Đội", teamUpdated: "Đã cập nhật Đội", teamDeleted: "Đã xóa Đội", stationCreated: "Đã tạo Trạm", stationUpdated: "Đã cập nhật Trạm", stationDeleted: "Đã xóa Trạm", unknown: "Hoạt động: {{action}}",
        },
      },
      teams: {
        title: "Đội",
        count: "{{count}} đội", loadingCount: "Đang tải số lượng đội…",
        refresh: "Làm mới", retry: "Thử lại",
        error: "Không thể tải danh sách đội", errorDescription: "Hãy thử lại để tải dữ liệu quản lý đội mới nhất.",
        qrUnavailable: "Chưa thể tải trạng thái QR", qrUnavailableDescription: "Danh sách đội vẫn hiển thị; trạng thái QR hiện không khả dụng.",
        searchLabel: "Tìm kiếm đội", searchPlaceholder: "Tìm theo đội, đội trưởng hoặc username",
        activityFilter: "Lọc theo tiến độ", qrFilter: "Lọc theo trạng thái QR",
        allActivities: "Tất cả tiến độ", allQrStatuses: "Tất cả trạng thái QR",
        columns: {team: "Đội", captain: "Đội trưởng / Username", score: "Điểm", stationsCompleted: "Trạm hoàn thành", status: "Trạng thái", time: "Tổng thời gian / Hoạt động gần nhất", actions: "Thao tác"},
        activity: {IN_PROGRESS: "Đang chơi", COMPLETED: "Hoàn thành tất cả", NO_ACTIVITY: "Chưa có hoạt động"},
        qr: {ACTIVE: "QR đăng nhập hoạt động", NONE: "Chưa có QR đăng nhập", UNAVAILABLE: "QR chưa khả dụng"},
        duration: {hoursMinutes: "{{hours}} giờ {{minutes}} phút", minutes: "{{minutes}} phút"},
        lastActivity: "Gần nhất: {{time}}", noActivity: "Chưa có hoạt động", notAvailable: "Không có",
        empty: "Chưa có đội nào.", noMatches: "Không có đội phù hợp.",
        actions: {openFor: "Mở thao tác cho {{team}}", viewDetails: "Xem chi tiết đội", phaseFourHint: "Team Detail sẽ được triển khai ở Phase 4."},
      },
      notFound: {
        title: "Không tìm thấy trang Admin V2",
        description: "Đường dẫn này không thuộc namespace Admin V2.",
        backToDashboard: "Về Tổng quan",
      },
    },
  },
  en: {
    adminV2: {
      brand: "MOVEMENT 2026",
      console: "Admin Console",
      navigationLabel: "Admin V2 navigation",
      skipToContent: "Skip to main content",
      nav: {
        dashboard: "Dashboard",
        teams: "Teams",
        stations: "Stations",
        leaderboard: "Leaderboard",
        operations: "Operations",
        settings: "Settings",
        more: "More",
        moreMenu: "Open more Admin navigation",
        scoreQueue: "Score Queue",
        eventControl: "Event Control",
        finalChallenge: "Final Challenge",
        activityLogs: "Activity Logs",
      },
      header: {
        pageContext: "Administration workspace",
        deployment: "Build: {{value}}",
        deploymentUnknown: "Build: unknown",
        account: "Admin account: {{username}}",
        accountMenu: "Open admin account menu",
        logout: "Log out",
      },
      foundation: {
        ready: "Admin V2 foundation ready",
        dashboardDescription: "The Admin V2 navigation and workspace foundation is ready. Dashboard data will be implemented in Phase 2.",
        plannedDescription: "This module will be implemented in a later Admin V2 phase.",
        plannedLabel: "Planned",
      },
      dashboard: {
        title: "Event dashboard",
        subtitle: "Monitor live operations and take the next action.",
        refresh: "Refresh", retry: "Retry",
        partialData: "Some Dashboard data could not be loaded",
        partialDataDescription: "Successfully loaded data remains visible. Retry to refresh the unavailable data.",
        loadSectionError: "This section could not be loaded.", eventOverview: "Event overview",
        openEventControl: "Open Event Control", stationCloseTime: "Station check-in closes", finalStartTime: "Final starts",
        eventState: {stationsOpen: "Station check-in open", finalNotice: "Final approaching", stationsClosed: "Station check-in closed", finalStarted: "Final started"},
        needsAttention: "Needs attention", noAttention: "Nothing needs immediate action.", review: "Review",
        attention: {
          pendingScores: "{{count}} scores are pending", pendingScoresDescription: "Open Score Queue to complete scoring.",
          timing: "Station closing is not five minutes before Final", timingDescription: "Review the event timing configuration.",
          finalSubmissions: "{{count}} Final submissions", finalSubmissionsDescription: "Open Final Challenge to view submitted entries.",
        },
        keyMetrics: "Key metrics",
        metrics: {teams: "Teams", stations: "Stations", activeTeams: "Active Teams", completedAttempts: "Completed Station attempts", pendingScores: "Pending Scores", finalSubmissions: "Final Submissions"},
        quickActions: "Quick actions",
        actions: {teams: "Teams", stations: "Stations", scoreQueue: "Score Queue", stationMap: "Station Map", eventControl: "Event Control", finalChallenge: "Final Challenge"},
        recentActivity: "Recent activity", viewAll: "View all", noRecentActivity: "No recent activity",
        activity: {
          at: "{{time}}", checkIn: "Station checked in", checkOut: "Station checked out", scoreSubmitted: "Score submitted", scoreUpdated: "Score updated", scoreReopened: "Score reopened",
          eventConfigUpdated: "Event configuration updated", finalSubmitted: "Final submitted", finalConfigUpdated: "Final configuration updated", teamCreated: "Team created", teamUpdated: "Team updated", teamDeleted: "Team deleted", stationCreated: "Station created", stationUpdated: "Station updated", stationDeleted: "Station deleted", unknown: "Activity: {{action}}",
        },
      },
      teams: {
        title: "Teams",
        count: "{{count}} teams", loadingCount: "Loading team count…",
        refresh: "Refresh", retry: "Retry",
        error: "Unable to load Teams", errorDescription: "Retry to load the latest Team management data.",
        qrUnavailable: "QR status could not be loaded", qrUnavailableDescription: "The Team list remains available, but QR status is currently unavailable.",
        searchLabel: "Search teams", searchPlaceholder: "Search team, captain, or username",
        activityFilter: "Filter by activity", qrFilter: "Filter by QR status",
        allActivities: "All activity", allQrStatuses: "All QR statuses",
        columns: {team: "Team", captain: "Captain / Username", score: "Score", stationsCompleted: "Stations Completed", status: "Status", time: "Total Time / Last Activity", actions: "Actions"},
        activity: {IN_PROGRESS: "In progress", COMPLETED: "All stations completed", NO_ACTIVITY: "No activity"},
        qr: {ACTIVE: "QR login active", NONE: "No QR login", UNAVAILABLE: "QR unavailable"},
        duration: {hoursMinutes: "{{hours}}h {{minutes}}m", minutes: "{{minutes}}m"},
        lastActivity: "Last: {{time}}", noActivity: "No activity", notAvailable: "Not available",
        empty: "No teams yet.", noMatches: "No matching teams.",
        actions: {openFor: "Open actions for {{team}}", viewDetails: "View team details", phaseFourHint: "Team Detail will be implemented in Phase 4."},
      },
      notFound: {
        title: "Admin V2 page not found",
        description: "This path is not part of the Admin V2 namespace.",
        backToDashboard: "Back to Dashboard",
      },
    },
  },
} as const;

let registered = false;

export function ensureAdminV2Resources() {
  if (registered) {
    return;
  }

  for (const language of ["vi", "en"] as const) {
    i18n.addResourceBundle(language, "translation", adminV2Resources[language], true, false);
  }

  registered = true;
}
