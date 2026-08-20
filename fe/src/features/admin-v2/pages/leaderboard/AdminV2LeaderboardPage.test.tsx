import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter} from "react-router-dom";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../../movement/i18n";
import {ensureAdminV2Resources} from "../../i18n/resources";
import {AdminV2LeaderboardPage} from "./AdminV2LeaderboardPage";

const api = vi.hoisted(() => ({getLeaderboard: vi.fn()}));
vi.mock("../../../movement/api", () => api);

const rows = [
  {rank: 1, teamId: 7, teamName: "Team 7", totalPoints: 120, completedStations: 4, totalPlaySeconds: 2400},
  {rank: 2, teamId: 8, teamName: "Đội 8", totalPoints: 120, completedStations: 4, totalPlaySeconds: 2400},
  {rank: 3, teamId: 9, teamName: "Team 9", totalPoints: 0, completedStations: 0, totalPlaySeconds: 0},
];

function renderPage() {
  return render(<MemoryRouter><AdminV2LeaderboardPage /></MemoryRouter>);
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
});
