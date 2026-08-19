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
    team: {id: 1, name: "Đội Sao", username: "sao", captainName: "An", totalPoints: 0, totalPlaySeconds: 0, teamColor: "#456789"},
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

  afterEach(() => vi.clearAllMocks());

  it("renders real zero values, backend-derived progress, and QR status", async () => {
    renderTeams();

    expect(await screen.findByText("Đội Sao")).toBeVisible();
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
    expect(screen.queryByText("Đội Sao")).not.toBeInTheDocument();
    expect(screen.getByText("Northern Lights")).toBeVisible();

    await user.clear(screen.getByRole("searchbox", {name: "Search teams"}));
    await user.click(screen.getByLabelText("Filter by QR status"));
    await user.click(screen.getByText("QR login active", {selector: ".ant-select-item-option-content"}));
    expect(screen.getByText("Đội Sao")).toBeVisible();
    expect(screen.queryByText("Northern Lights")).not.toBeInTheDocument();
  });

  it("handles an authoritative empty list and a load error separately", async () => {
    api.getAdminProgressMatrix.mockResolvedValue(matrix([]));
    renderTeams();
    expect(await screen.findByText("No teams yet.")).toBeVisible();

    api.getAdminProgressMatrix.mockRejectedValue(new Error("offline"));
    renderTeams();
    expect(await screen.findByText("Unable to load Teams")).toBeVisible();
  });
});
