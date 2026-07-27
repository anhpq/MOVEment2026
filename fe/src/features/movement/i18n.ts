import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import type {SupportedLanguage} from "./types";

export const LANGUAGE_STORAGE_KEY = "movement-language";
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["vi", "en"];

export const translationResources = {
  vi: {
    translation: {
      language: {
        vi: "VI",
        en: "EN",
      },
      nav: {
        teams: "Đội",
        rank: "BXH",
        ops: "Vận hành",
        setting: "Cấu hình",
        stations: "Trạm",
        final: "Final",
        map: "Bản đồ",
      },
      auth: {
        username: "Tên đăng nhập",
        password: "Mật khẩu",
        login: "Đăng nhập",
        or: "HOẶC",
        scanQr: "Quét QR login",
        pasteQr: "Dán QR",
        stopScanner: "Dừng quét",
        loginSuccess: "Đăng nhập thành công",
        qrLoginSuccess: "Đăng nhập QR thành công",
        invalidCredentials: "Tên đăng nhập hoặc mật khẩu không đúng",
        invalidQr: "QR phải chứa link đăng nhập hoặc Team QR token hợp lệ",
        pastePrompt: "Dán Team QR login token",
        bootstrapRetry: "Đăng nhập thành công. Dữ liệu sẽ được thử lại ở màn hình kế tiếp.",
        cameraUnsupported: "Trình duyệt này không hỗ trợ quét QR bằng camera. Hãy dùng Dán QR hoặc mở site qua HTTPS.",
        cameraStartFailed: "Không thể mở camera",
        qrScanFailed: "Không thể quét QR",
      },
      qrLogin: {
        loading: "Đang xác thực mã QR...",
        missingTitle: "Liên kết QR không hợp lệ.",
        missingDescription: "Liên kết này thiếu mã xác thực QR.",
        conflictTitle: "Bạn đang đăng nhập.",
        conflictDescription: "Hãy đăng xuất tài khoản hiện tại trước khi dùng mã QR của đội khác.",
        back: "Quay lại",
        retry: "Thử lại",
        login: "Về trang đăng nhập",
        consumedTitle: "Mã QR cũ không còn hiệu lực.",
        consumedDescription: "Vui lòng liên hệ ban tổ chức để nhận mã QR hiện tại.",
        revokedTitle: "Mã QR đã bị thu hồi.",
        revokedDescription: "Vui lòng liên hệ ban tổ chức để nhận mã QR mới.",
        inactiveTitle: "Tài khoản đội không hoạt động.",
        inactiveDescription: "Vui lòng liên hệ ban tổ chức để kiểm tra trạng thái đội.",
        rateLimitedTitle: "Thử quá nhiều lần.",
        rateLimitedDescription: "Vui lòng chờ một lúc rồi thử lại.",
        invalidTitle: "Mã QR không hợp lệ.",
        invalidDescription: "Vui lòng kiểm tra lại mã QR hoặc liên hệ ban tổ chức.",
        genericTitle: "Không thể xác thực mã QR.",
        genericDescription: "Vui lòng kiểm tra kết nối mạng rồi thử lại.",
      },
      stationEditor: {
        editTitle: "Sửa Station",
        createTitle: "Tạo Station",
        viSection: "Tiếng Việt",
        enSection: "English",
        idRequired: "Vui lòng nhập ID Station",
        nameVi: "Tên VI",
        nameEn: "Tên EN",
        descriptionVi: "Mô tả VI",
        descriptionEn: "Mô tả EN",
        nameViRequired: "Vui lòng nhập tên VI",
        nameEnRequired: "Vui lòng nhập tên EN",
        duplicateId: "Station ID đã tồn tại. Vui lòng chọn ID khác.",
        updateConfirmTitle: "Cập nhật Station?",
        createConfirmTitle: "Tạo Station mới?",
        syncConfirm: "Danh sách Station của tất cả đội sẽ được đồng bộ theo thay đổi này.",
        confirm: "Xác nhận",
        cancel: "Hủy",
        trackingMode: "Cách tính",
        trackingModeHelp: "Score: không tính thời gian; Time: QR start/end ghi thời gian; Both: ghi thời gian và cho nhập điểm",
        trackingModeRequired: "Vui lòng chọn cách tính Station",
        both: "Thời gian và điểm",
        scoreOnly: "Chỉ điểm",
        timeOnly: "Chỉ thời gian",
        youtube: "YouTube Video URL",
        youtubeRequired: "Station ST cần YouTube URL",
        validUrl: "Vui lòng nhập URL hợp lệ",
        mapX: "Map X (%)",
        mapY: "Map Y (%)",
        gameType: "Game Type",
        maxPoints: "Max Points",
        checkInQr: "Check-in QR token",
        checkOutQr: "Check-out QR token",
        keepQrHelp: "Để trống để giữ token hiện tại. Nhập token mới để thay thế.",
        updateButton: "Cập nhật Station",
        createButton: "Tạo Station",
        updated: "Đã cập nhật Station",
        created: "Đã tạo Station mới",
        oneTimeQr: "Station QR dùng một lần",
        saveQr: "Hãy lưu hoặc tải QR ngay. Vì bảo mật, token không thể xem lại.",
        downloadPng: "Tải PNG",
      },
      stationData: {
        refreshFailed: "Không tải được dữ liệu Station theo ngôn ngữ mới. Đang giữ dữ liệu hiện tại.",
      },
    },
  },
  en: {
    translation: {
      language: {
        vi: "VI",
        en: "EN",
      },
      nav: {
        teams: "Teams",
        rank: "Rank",
        ops: "Ops",
        setting: "Settings",
        stations: "Stations",
        final: "Final",
        map: "Map",
      },
      auth: {
        username: "Username",
        password: "Password",
        login: "Login",
        or: "OR",
        scanQr: "Scan QR login",
        pasteQr: "Paste QR",
        stopScanner: "Stop scanner",
        loginSuccess: "Login successful",
        qrLoginSuccess: "QR login successful",
        invalidCredentials: "Invalid username or password",
        invalidQr: "QR code must contain a valid login URL or team QR token",
        pastePrompt: "Paste the team QR login token",
        bootstrapRetry: "Login succeeded. Player data will retry on the next screen.",
        cameraUnsupported: "This browser does not support camera QR scanning. Use Paste QR or open the site over HTTPS.",
        cameraStartFailed: "Unable to start camera",
        qrScanFailed: "Unable to scan QR code",
      },
      qrLogin: {
        loading: "Verifying QR code...",
        missingTitle: "Invalid QR link.",
        missingDescription: "This link is missing its QR token.",
        conflictTitle: "You are already signed in.",
        conflictDescription: "Sign out before using another team's QR code.",
        back: "Back",
        retry: "Retry",
        login: "Go to login",
        consumedTitle: "This old QR code is no longer valid.",
        consumedDescription: "Please contact the organizers for the current QR code.",
        revokedTitle: "This QR code has been revoked.",
        revokedDescription: "Please contact the organizers for a new QR code.",
        inactiveTitle: "This team account is inactive.",
        inactiveDescription: "Please contact the organizers to check the team status.",
        rateLimitedTitle: "Too many attempts.",
        rateLimitedDescription: "Please wait a moment and try again.",
        invalidTitle: "Invalid QR code.",
        invalidDescription: "Please check the QR code or contact the organizers.",
        genericTitle: "Unable to verify this QR code.",
        genericDescription: "Please check your network connection and try again.",
      },
      stationEditor: {
        editTitle: "Edit Station",
        createTitle: "Create Station",
        viSection: "Vietnamese",
        enSection: "English",
        idRequired: "Please enter an ID for the station",
        nameVi: "VI Name",
        nameEn: "EN Name",
        descriptionVi: "VI Description",
        descriptionEn: "EN Description",
        nameViRequired: "Please enter the Vietnamese station name",
        nameEnRequired: "Please enter the English station name",
        duplicateId: "Station ID already exists. Please choose a different ID.",
        updateConfirmTitle: "Update Station?",
        createConfirmTitle: "Create New Station?",
        syncConfirm: "The station list for all teams will be synchronized with this change.",
        confirm: "Confirm",
        cancel: "Cancel",
        trackingMode: "Tracking Mode",
        trackingModeHelp: "Score: no duration; Time: QR start/end record duration; Both: record duration and allow points",
        trackingModeRequired: "Please choose how this station is counted",
        both: "Both time and score",
        scoreOnly: "Score only",
        timeOnly: "Time only",
        youtube: "YouTube Video URL",
        youtubeRequired: "ST stations require a YouTube URL",
        validUrl: "Please enter a valid URL",
        mapX: "Map X (%)",
        mapY: "Map Y (%)",
        gameType: "Game Type",
        maxPoints: "Max Points",
        checkInQr: "Check-in QR token",
        checkOutQr: "Check-out QR token",
        keepQrHelp: "Leave empty to keep the current token. Enter a new token to replace it.",
        updateButton: "Update Station Info",
        createButton: "Create Station",
        updated: "Station updated successfully",
        created: "New station created successfully",
        oneTimeQr: "One-time Station QR",
        saveQr: "Save or download this QR now. For security, the token cannot be viewed again.",
        downloadPng: "Download PNG",
      },
      stationData: {
        refreshFailed: "Could not load station data for the new language. Keeping the current data.",
      },
    },
  },
} as const;

export function normalizeLanguage(value: unknown): SupportedLanguage {
  return value === "en" ? "en" : "vi";
}

export function readStoredLanguage(): SupportedLanguage {
  if (typeof window === "undefined") {
    return "vi";
  }
  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

i18n.use(initReactI18next).init({
  resources: translationResources,
  lng: readStoredLanguage(),
  fallbackLng: "vi",
  interpolation: {escapeValue: false},
});

document.documentElement.lang = i18n.language;

i18n.on("languageChanged", (language) => {
  const normalized = normalizeLanguage(language);
  document.documentElement.lang = normalized;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  }
});

export default i18n;
