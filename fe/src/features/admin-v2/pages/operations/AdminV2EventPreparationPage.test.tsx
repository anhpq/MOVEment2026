import {App as AntdApp} from "antd";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../../movement/i18n";
import {ensureAdminV2Resources} from "../../i18n/resources";
import {
  AdminV2EventPreparationPage,
  isEventPreparationResetAvailable,
} from "./AdminV2EventPreparationPage";

const api = vi.hoisted(() => ({
  getAdminEventPreparation: vi.fn(),
  resetAdminGameplay: vi.fn(),
  rotateAdminEventPreparationQr: vi.fn(),
}));
vi.mock("../../../movement/api", () => api);

function status(overrides: Record<string, unknown> = {}) {
  return {
    serverNow: "2026-08-21T00:00:00.000Z",
    resetCutoff: "2026-08-26T23:00:00.000Z",
    resetEnabled: true,
    inventory: {
      teams: 25,
      activeStations: 17,
      activeGames: 17,
      activeTeamQrTokens: 25,
      activeStationQrTokens: 34,
      eventConfigRows: 1,
      activeFinalChallenges: 1,
      ready: true,
      issues: [],
    },
    ...overrides,
  };
}

function renderPage() {
  return render(<AntdApp><AdminV2EventPreparationPage /></AntdApp>);
}

describe("AdminV2EventPreparationPage", () => {
  beforeEach(async () => {
    ensureAdminV2Resources();
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    await i18n.changeLanguage("en");
    api.getAdminEventPreparation.mockResolvedValue(status());
    api.rotateAdminEventPreparationQr.mockResolvedValue({teams: 25, stations: 17, teamQrTokens: 25, stationQrTokens: 34, revokedTeamSessions: 3});
    api.resetAdminGameplay.mockResolvedValue({teams: 25, progressRows: 425, teamSessions: 0, scoreEvents: 0, finalSubmissions: 0, activityLogs: 0});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows the authoritative QR inventory and requires typed confirmation for bulk rotation", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole("heading", {name: "Event Preparation"})).toBeVisible();
    expect(screen.getAllByText("25")).toHaveLength(2);
    expect(screen.getByText("34")).toBeVisible();
    await user.click(screen.getByRole("button", {name: /Create new QR/}));
    const confirm = screen.getByRole("textbox", {name: "Confirmation phrase"});
    const submit = screen.getAllByRole("button", {name: /Create new QR/})[1];
    expect(submit).toBeDisabled();
    await user.type(confirm, "RESET MOVEMENT2026 GAMEPLAY");
    await user.click(screen.getByRole("checkbox", {name: "I confirmed a backup before continuing."}));
    await user.click(submit);

    await waitFor(() => expect(api.rotateAdminEventPreparationQr).toHaveBeenCalledWith("RESET MOVEMENT2026 GAMEPLAY", true));
  });

  it("disables the rehearsal reset when the server reports the cutoff is closed", async () => {
    api.getAdminEventPreparation.mockResolvedValueOnce(status({resetEnabled: false}));
    renderPage();

    expect(await screen.findByText("Rehearsal reset is locked")).toBeVisible();
    expect(screen.getByRole("button", {name: /Reset rehearsal/})).toBeDisabled();
  });

  it("uses elapsed time from the server response to close reset at the cutoff", () => {
    const serverNow = Date.parse("2026-08-26T22:59:59.000Z");
    const preparationStatus = status({serverNow: new Date(serverNow).toISOString()});

    expect(isEventPreparationResetAvailable(preparationStatus, 1_000, 1_999)).toBe(true);
    expect(isEventPreparationResetAvailable(preparationStatus, 1_000, 2_000)).toBe(false);
  });
});
