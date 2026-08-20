import {App} from "antd";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../../movement/i18n";
import {ensureAdminV2Resources} from "../../i18n/resources";
import {AdminV2TeamDetailPage} from "./AdminV2TeamDetailPage";

const api = vi.hoisted(() => ({
  getAdminTeamQrLoginTokens: vi.fn(), updateAdminTeam: vi.fn(),
}));
const data = vi.hoisted(() => ({getAdminV2TeamsList: vi.fn()}));

vi.mock("../../../movement/api", () => api);
vi.mock("./adminV2TeamsData", () => data);
vi.mock("qrcode", () => ({default: {toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,qr")}}));

const team = {id: 2, name: "Northern Lights", username: "north", captainName: "Minh", color: "#CC5522", totalPoints: 120, completedStations: 1, stationCount: 3, totalPlaySeconds: 3660, lastActivityAt: "2026-08-19T03:32:00.000Z", activityStatus: "PARTIALLY_COMPLETED" as const, qrStatus: "ACTIVE" as const};

function renderPage(path = "/admin-v2/teams/2") {
  return render(<App><MemoryRouter initialEntries={[path]}><Routes><Route path="/admin-v2/teams/:teamId/*" element={<AdminV2TeamDetailPage />} /></Routes></MemoryRouter></App>);
}

describe("AdminV2TeamDetailPage", () => {
  beforeEach(async () => {
    ensureAdminV2Resources();
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    await i18n.changeLanguage("en");
    data.getAdminV2TeamsList.mockResolvedValue({teams: [team], qrStatusUnavailable: false});
    api.getAdminTeamQrLoginTokens.mockResolvedValue([{id: 9, teamId: 2, loginUrl: "https://movement.test/qr-login?token=opaque", expiresAt: null, isActive: true, usageCount: 4, createdAt: "2026-08-19T03:00:00.000Z", lastUsedAt: null, status: "ACTIVE"}]);
    api.updateAdminTeam.mockResolvedValue({});
  });

  afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

  it("shows real Team identity, read-only progress, and a downloadable active QR", async () => {
    renderPage();

    expect(await screen.findByRole("heading", {name: "Northern Lights"})).toBeVisible();
    expect(screen.getByText("north")).toBeVisible();
    expect(screen.getByText("120")).toBeVisible();
    expect(screen.getByText("1/3")).toBeVisible();
    expect(screen.getByText("Used 4 times")).toBeVisible();
    expect(await screen.findByRole("button", {name: "Download PNG"}, {timeout: 4000})).toBeVisible();
  });

  it("omits a blank password when updating supported Team fields", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("heading", {name: "Northern Lights"});

    await user.click(screen.getByRole("button", {name: "Edit Team"}));
    const name = screen.getByLabelText("Team name");
    await user.clear(name);
    await user.type(name, "Aurora");
    await user.click(screen.getByRole("button", {name: "Save changes"}));

    await waitFor(() => expect(api.updateAdminTeam).toHaveBeenCalledWith("2", expect.objectContaining({name: "Aurora", username: "north", captainName: "Minh", teamColor: "#CC5522"})));
    expect(api.updateAdminTeam.mock.calls[0][1]).not.toHaveProperty("password");
  });

  it("keeps QR management read-only while not exposing the raw token", async () => {
    renderPage();
    expect((await screen.findAllByText("Team login QR")).length).toBeGreaterThan(0);

    expect(screen.getByRole("button", {name: "Download PNG"})).toBeVisible();
    expect(screen.queryByRole("button", {name: /Rotate|Revoke|Delete/})).not.toBeInTheDocument();
    expect(screen.queryByText("opaque")).not.toBeInTheDocument();
  });

  it("supports the direct edit URL", async () => {
    renderPage("/admin-v2/teams/2/edit");
    expect(await screen.findByRole("dialog", {name: "Edit Team"})).toBeVisible();
  });

  it("supports the direct QR URL", async () => {
    renderPage("/admin-v2/teams/2/qr");
    expect((await screen.findAllByText("Team login QR")).length).toBeGreaterThan(0);
    expect(document.querySelector(".admin-v2-team-detail__qr--focused")).toBeInTheDocument();
  });
});
