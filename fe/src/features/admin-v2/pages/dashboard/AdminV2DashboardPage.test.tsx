import {render, screen, within} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../../movement/i18n";
import {ensureAdminV2Resources} from "../../i18n/resources";
import {AdminV2DashboardPage} from "./AdminV2DashboardPage";

const api = vi.hoisted(() => ({
  getAdminDashboard: vi.fn(),
  getAdminScoreQueue: vi.fn(),
  getAdminFinalSubmissions: vi.fn(),
}));

vi.mock("../../../movement/api", () => api);

const dashboard = (overrides: Record<string, unknown> = {}) => ({
  teamCount: 12,
  stationCount: 8,
  completedCount: 24,
  activePlayingCount: 3,
  eventConfig: {
    eventEndTime: "11:30",
    finalStartsAt: "11:45",
    timezone: "Asia/Ho_Chi_Minh",
    notifyBeforeMinutes: 15,
    secondsUntilFinal: 3_600,
    isPastEventEnd: false,
    isPastFinalStart: false,
  },
  latestLogs: [],
  ...overrides,
});

function renderDashboard() {
  return render(<MemoryRouter><AdminV2DashboardPage /></MemoryRouter>);
}

describe("AdminV2DashboardPage", () => {
  beforeEach(async () => {
    ensureAdminV2Resources();
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    await i18n.changeLanguage("en");
    api.getAdminDashboard.mockResolvedValue(dashboard());
    api.getAdminScoreQueue.mockResolvedValue([]);
    api.getAdminFinalSubmissions.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders authoritative real zero values after loading", async () => {
    api.getAdminDashboard.mockResolvedValue(dashboard({teamCount: 0, stationCount: 0, completedCount: 0, activePlayingCount: 0}));

    renderDashboard();

    expect(await screen.findByText("Nothing needs immediate action.")).toBeVisible();
    expect(screen.getAllByText("0")).toHaveLength(6);
    expect(screen.getByText("Completed Station attempts")).toBeVisible();
  });

  it("surfaces only data-supported attention conditions and their owner routes", async () => {
    api.getAdminDashboard.mockResolvedValue(dashboard({eventConfig: {...dashboard().eventConfig, eventEndTime: "11:40"}}));
    api.getAdminScoreQueue.mockResolvedValue([{id: 1}, {id: 2}]);
    api.getAdminFinalSubmissions.mockResolvedValue([{id: 1}]);

    renderDashboard();

    expect(await screen.findByText("2 scores are pending")).toBeVisible();
    expect(screen.getByText("Station closing is not fifteen minutes before Final")).toBeVisible();
    expect(screen.getByText("1 Final submissions")).toBeVisible();
    const attention = screen.getByText("Needs attention").closest(".ant-card") as HTMLElement;
    expect(within(attention).getAllByRole("link", {name: "Review"})[0]).toHaveAttribute("href", "/admin-v2/operations/score-queue");
  });

  it("keeps successfully loaded data visible when one source fails", async () => {
    api.getAdminScoreQueue.mockRejectedValue(new Error("offline"));
    api.getAdminFinalSubmissions.mockResolvedValue([{id: 1}, {id: 2}]);

    renderDashboard();

    expect(await screen.findByText("Some Dashboard data could not be loaded")).toBeVisible();
    expect(screen.getByText("12")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
  });

  it("shows human-readable recent activity and routes every quick action", async () => {
    api.getAdminDashboard.mockResolvedValue(dashboard({latestLogs: [{id: "1", action: "EVENT_CONFIG_UPDATED", createdAt: "2026-08-19T04:30:00.000Z"}]}));

    renderDashboard();

    expect(await screen.findByText("Event configuration updated")).toBeVisible();
    expect(screen.getByRole("link", {name: /View all/})).toHaveAttribute("href", "/admin-v2/operations/activity-logs");
    expect(screen.getByRole("link", {name: /Station Map/})).toHaveAttribute("href", "/admin-v2/stations/map");
    expect(screen.getByRole("link", {name: /Final Challenge/})).toHaveAttribute("href", "/admin-v2/operations/final-challenge");
  });
});
