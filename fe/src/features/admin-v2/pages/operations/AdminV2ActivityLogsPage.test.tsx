import {cleanup, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {App} from "antd";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../../movement/i18n";
import {ensureAdminV2Resources} from "../../i18n/resources";
import {AdminV2ActivityLogsPage} from "./AdminV2ActivityLogsPage";

const api = vi.hoisted(() => ({getAdminActivityLogs: vi.fn(), getAdminProgressMatrix: vi.fn()}));
vi.mock("../../../movement/api", () => api);

const logs = [
  {id: 11, actorType: "TEAM", actorId: "2", action: "CHECK_IN", entityType: "TEAM_STATION_PROGRESS", entityId: "88", metadata: {teamId: 2, stationId: "ST004", note: "Accepted", token: "must-not-render"}, createdAt: "2026-08-19T03:32:00.000Z", userId: null},
  {id: 10, actorType: "USER", actorId: "1", action: "UPDATE_STATION", entityType: "STATION", entityId: "ST004", metadata: {maxPoints: 30}, createdAt: "2026-08-19T03:30:00.000Z", userId: 1},
];
const matrix = {rows: [{team: {id: 2, name: "Team 02"}}], stations: [{id: "ST004", name: "Trạm Gió", nameEn: "Wind Station"}]};

function renderPage() { return render(<App><AdminV2ActivityLogsPage /></App>); }

describe("AdminV2ActivityLogsPage", () => {
  beforeEach(async () => { ensureAdminV2Resources(); await i18n.changeLanguage("en"); vi.stubGlobal("ResizeObserver", class {observe() {} unobserve() {} disconnect() {}}); api.getAdminActivityLogs.mockResolvedValue(logs); api.getAdminProgressMatrix.mockResolvedValue(matrix); });
  afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); });

  it("renders real log fields in authoritative API order with resolved targets", async () => {
    renderPage();
    expect(await screen.findByText("Station checked in")).toBeVisible();
    expect(screen.getAllByText("Team: Team 02 (2)").length).toBeGreaterThan(0);
    expect(screen.getByText("Showing 2 of 2 logs")).toBeVisible();
    expect(api.getAdminActivityLogs).toHaveBeenCalledTimes(1);
  });

  it("handles empty and error states distinctly", async () => {
    api.getAdminActivityLogs.mockResolvedValueOnce([]);
    const {unmount} = renderPage();
    expect(await screen.findByText("No activity logs yet.")).toBeVisible();
    unmount();
    api.getAdminActivityLogs.mockRejectedValueOnce(new Error("offline"));
    renderPage();
    expect(await screen.findByText("Unable to load Activity Logs")).toBeVisible();
  });

  it("searches only the loaded human-readable log fields", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Station checked in");
    await user.type(screen.getByRole("searchbox", {name: "Search activity logs"}), "Wind Station");
    expect(screen.getByText("Showing 1 of 2 logs")).toBeVisible();
    expect(document.querySelector(".ant-table-tbody")).toHaveTextContent("Station updated");
    expect(document.querySelector(".ant-table-tbody")).not.toHaveTextContent("Station checked in");
  });

  it("opens sanitized read-only details without edit or delete controls", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", {name: "View details: Station checked in"}));
    const drawer = screen.getByRole("dialog");
    expect(drawer).toHaveTextContent("Technical details");
    expect(drawer).toHaveTextContent("[redacted]");
    expect(drawer).not.toHaveTextContent("must-not-render");
    expect(screen.queryByRole("button", {name: /edit|delete/i})).not.toBeInTheDocument();
  });

  it("hides secondary columns at portrait width while preserving activity and details", async () => {
    Object.defineProperty(window, "matchMedia", {writable: true, value: vi.fn().mockReturnValue({matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn()})});
    renderPage();
    expect(await screen.findByText("Station checked in")).toBeVisible();
    expect(screen.queryByRole("columnheader", {name: "Actor"})).not.toBeInTheDocument();
    expect(screen.getByRole("button", {name: "View details: Station checked in"})).toBeVisible();
  });
});
