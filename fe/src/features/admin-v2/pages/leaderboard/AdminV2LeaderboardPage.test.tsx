import {render, screen, waitFor} from "@testing-library/react";
import {App as AntdApp} from "antd";
import userEvent from "@testing-library/user-event";
import {MemoryRouter} from "react-router-dom";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../../movement/i18n";
import {ensureAdminV2Resources} from "../../i18n/resources";
import {AdminV2LeaderboardPage} from "./AdminV2LeaderboardPage";

const api = vi.hoisted(() => ({
  downloadAdminTeamResults: vi.fn(),
  getLeaderboard: vi.fn(),
  prepareAdminQrCodeExport: vi.fn(),
}));
const qrExport = vi.hoisted(() => ({downloadQrCodeZip: vi.fn()}));
vi.mock("../../../movement/api", () => api);
vi.mock("./qrCodeExport", () => qrExport);

const rows = [
  {rank: 1, teamId: 7, teamName: "Team 7", totalPoints: 120, completedStations: 4, totalPlaySeconds: 2400},
  {rank: 2, teamId: 8, teamName: "Đội 8", totalPoints: 120, completedStations: 4, totalPlaySeconds: 2400},
  {rank: 3, teamId: 9, teamName: "Team 9", totalPoints: 0, completedStations: 0, totalPlaySeconds: 0},
];

function renderPage() {
  return render(<AntdApp><MemoryRouter><AdminV2LeaderboardPage /></MemoryRouter></AntdApp>);
}

describe("AdminV2LeaderboardPage", () => {
  beforeEach(async () => {
    ensureAdminV2Resources();
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
    await i18n.changeLanguage("en");
    api.getLeaderboard.mockResolvedValue(rows);
    api.downloadAdminTeamResults.mockResolvedValue(undefined);
    api.prepareAdminQrCodeExport.mockResolvedValue({
      fileName: "movement-2026-qr-codes.zip",
      generatedAt: "2026-08-20T00:00:00.000Z",
      teams: [],
      stations: [],
      repaired: {teamIds: [], stationTokens: []},
    });
    qrExport.downloadQrCodeZip.mockResolvedValue({total: 59, repaired: 0});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders authoritative ranks without recalculating tied rows and preserves zero values", async () => {
    renderPage();

    expect(await screen.findByText("1st")).toBeVisible();
    expect(screen.getByRole("columnheader", {name: "Total time"})).toBeVisible();
    expect(screen.getByText("2nd")).toBeVisible();
    expect(screen.getByText("3rd")).toBeVisible();
    expect(screen.getAllByText("120")).toHaveLength(2);
    expect(screen.getAllByText("0")).toHaveLength(2);
    expect(screen.getByText("0m")).toBeVisible();
    expect(screen.getByRole("link", {name: /Team 07/})).toHaveAttribute("href", "/admin-v2/teams/7");
  });

  it("keeps the authoritative empty and error states distinct", async () => {
    api.getLeaderboard.mockResolvedValueOnce([]);
    const {unmount} = renderPage();
    expect(await screen.findByText("No teams ranked yet.")).toBeVisible();

    unmount();
    api.getLeaderboard.mockRejectedValueOnce(new Error("offline"));
    renderPage();
    expect(await screen.findByText("Unable to load Leaderboard")).toBeVisible();
  });

  it("searches supported team fields and removes the secondary time column on narrow layouts", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn()}));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Team 07");
    expect(screen.queryByText("Total time")).not.toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", {name: "Search leaderboard"}), "team 09");
    expect(screen.queryByText("Team 07")).not.toBeInTheDocument();
    expect(screen.getByText("Team 09")).toBeVisible();
  });

  it("downloads Team Results Excel and the complete QR ZIP from the page header", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", {name: "Export Excel"}));
    expect(api.downloadAdminTeamResults).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", {name: "Export all QR codes"}));
    await waitFor(() => expect(api.prepareAdminQrCodeExport).toHaveBeenCalledTimes(1));
    expect(qrExport.downloadQrCodeZip).toHaveBeenCalledWith(
      expect.objectContaining({fileName: "movement-2026-qr-codes.zip"}),
    );
  });
});
