import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter} from "react-router-dom";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../../movement/i18n";
import {ensureAdminV2Resources} from "../../i18n/resources";
import {AdminV2TeamsPage} from "./AdminV2TeamsPage";

const api = vi.hoisted(() => ({
  getAdminProgressMatrix: vi.fn(),
  getAdminQrStatusSummary: vi.fn(),
}));

vi.mock("../../../movement/api", () => api);

const matrix = (rows: unknown[] = [
  {
    team: {id: 1, name: "Đội 3", username: "sao", captainName: "An", totalPoints: 0, totalPlaySeconds: 0, teamColor: "#456789"},
    cells: [{status: "PLAYING", scoreAchieved: 0, checkedInAt: "2026-08-19T04:30:00.000Z", checkedOutAt: null, completedAt: null}],
  },
  {
    team: {id: 2, name: "Northern Lights", username: "north", captainName: "Minh", totalPoints: 120, totalPlaySeconds: 3660, color: "#CC5522"},
    cells: [{status: "COMPLETED", scoreAchieved: 120, checkedInAt: null, checkedOutAt: "2026-08-19T03:30:00.000Z", completedAt: "2026-08-19T03:32:00.000Z"}],
  },
]) => ({stations: [{id: "station-1"}], rows});

function renderTeams() {
  return render(<MemoryRouter><AdminV2TeamsPage /></MemoryRouter>);
}

describe("AdminV2TeamsPage", () => {
  beforeEach(async () => {
    ensureAdminV2Resources();
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
    await i18n.changeLanguage("en");
    api.getAdminProgressMatrix.mockResolvedValue(matrix());
    api.getAdminQrStatusSummary.mockResolvedValue({teams: [{teamId: 1, status: "ACTIVE"}, {teamId: 2, status: "NONE"}], stations: []});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders real zero values, backend-derived progress, and QR status", async () => {
    renderTeams();

    expect(await screen.findByText("Team 03")).toBeVisible();
    expect(screen.getByText("0")).toBeVisible();
    expect(screen.getByText("In progress")).toBeVisible();
    expect(screen.getByText("QR login active")).toBeVisible();
    expect(screen.getByText("All stations completed")).toBeVisible();
    expect(screen.getByText("No QR login")).toBeVisible();
  });

  it("filters client-side with real supported fields", async () => {
    const user = userEvent.setup();
    renderTeams();

    await screen.findByText("Northern Lights");
    await user.type(screen.getByRole("searchbox", {name: "Search teams"}), "northern");
    expect(screen.queryByText("Team 03")).not.toBeInTheDocument();
    expect(screen.getByText("Northern Lights")).toBeVisible();

    await user.clear(screen.getByRole("searchbox", {name: "Search teams"}));
    await user.click(screen.getByLabelText("Filter by QR status"));
    await user.click(screen.getByText("QR login active", {selector: ".ant-select-item-option-content"}));
    expect(screen.getByText("Team 03")).toBeVisible();
    expect(screen.queryByText("Northern Lights")).not.toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox", {name: "Search teams"}));
    await user.type(screen.getByRole("searchbox", {name: "Search teams"}), "team 03");
    expect(screen.getByText("Team 03")).toBeVisible();
  });

  it("handles an authoritative empty list and a load error separately", async () => {
    api.getAdminProgressMatrix.mockResolvedValue(matrix([]));
    renderTeams();
    expect(await screen.findByText("No teams yet.")).toBeVisible();

    api.getAdminProgressMatrix.mockRejectedValue(new Error("offline"));
    renderTeams();
    expect(await screen.findByText("Unable to load Teams")).toBeVisible();
  });

  it("keeps partially completed Teams distinct from no activity and localizes seed-style names", async () => {
    api.getAdminProgressMatrix.mockResolvedValue({
      stations: [{id: "station-1"}, {id: "station-2"}],
      rows: [{
        team: {id: 3, name: "Team 7", username: "seven", captainName: "Lan", totalPoints: 20, totalPlaySeconds: 300, teamColor: null},
        cells: [{status: "COMPLETED", scoreAchieved: 20, checkedInAt: null, checkedOutAt: null, completedAt: "2026-08-19T03:32:00.000Z"}, null],
      }],
    });
    renderTeams();

    expect(await screen.findByText("Team 07")).toBeVisible();
    expect(screen.getByText("Partially completed")).toBeVisible();

    await i18n.changeLanguage("vi");
    expect(await screen.findByText("Đội 07")).toBeVisible();
  });

  it("removes fixed Table columns on the narrow mobile layout", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const {container} = renderTeams();

    await screen.findByText("Team 03");
    expect(container.querySelector(".ant-table-cell-fix-left")).not.toBeInTheDocument();
    expect(container.querySelector(".ant-table-cell-fix-right")).not.toBeInTheDocument();
  });
});
