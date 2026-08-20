import {App as AntdApp} from "antd";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter} from "react-router-dom";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../../movement/i18n";
import {ensureAdminV2Resources} from "../../i18n/resources";
import {AdminV2StationMapPage} from "./AdminV2StationMapPage";

const api = vi.hoisted(() => ({updateAdminStation: vi.fn()}));
const data = vi.hoisted(() => ({getAdminV2StationsList: vi.fn()}));
vi.mock("../../../movement/api", () => api);
vi.mock("./adminV2StationsData", async (importOriginal) => ({...(await importOriginal<typeof import("./adminV2StationsData")>()), ...data}));

const stations = [
  {id: "ST001", name: "Trạm Một", nameEn: "Station One", trackingMode: "BOTH", gameType: "ST", maxPoints: 10, playingTeamCount: 0, qrStatus: "ACTIVE", activeQrCount: 2, mapX: 20, mapY: 30},
  {id: "ST002", name: "Trạm Hai", nameEn: "Station Two", trackingMode: "TIME", gameType: "STANDARD", maxPoints: 20, playingTeamCount: 1, qrStatus: "ACTIVE", activeQrCount: 2, mapX: 80, mapY: 70},
] as const;

function renderMap() {
  return render(<AntdApp><MemoryRouter><AdminV2StationMapPage /></MemoryRouter></AntdApp>);
}

describe("AdminV2StationMapPage", () => {
  beforeEach(async () => {
    ensureAdminV2Resources(); await i18n.changeLanguage("en");
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    data.getAdminV2StationsList.mockResolvedValue({stations, qrStatusUnavailable: false});
    api.updateAdminStation.mockResolvedValue({});
  });
  afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

  it("renders marker positions from the existing percentage coordinates", async () => {
    renderMap();
    const marker = await screen.findByRole("button", {name: "Select Station 01 marker"});
    expect(marker).toHaveStyle({left: "20%", top: "30%"});
    expect(screen.getByRole("button", {name: "Select Station 02 marker"})).toHaveStyle({left: "80%", top: "70%"});
  });

  it("selects a Station from a marker and keeps its info panel in sync", async () => {
    const user = userEvent.setup(); renderMap();
    await user.click(await screen.findByRole("button", {name: "Select Station 02 marker"}));
    expect(screen.getByRole("heading", {name: "02 · Station Two"})).toBeVisible();
    expect(screen.getByText("Coordinates: X 80.00% · Y 70.00%")).toBeVisible();
  });

  it("keeps a clicked map position as a draft until explicit save", async () => {
    const user = userEvent.setup(); const {container} = renderMap();
    await screen.findByRole("button", {name: "Select Station 01 marker"});
    const canvas = container.querySelector(".admin-v2-station-map__canvas") as HTMLDivElement;
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({x: 0, y: 0, top: 0, left: 0, right: 400, bottom: 200, width: 400, height: 200, toJSON: () => ({})});
    fireEvent.click(canvas, {clientX: 100, clientY: 50});
    expect(api.updateAdminStation).not.toHaveBeenCalled();
    expect(screen.getByText("Coordinates pending save")).toBeVisible();
    expect(screen.getByText("Coordinates: X 25.00% · Y 25.00%")).toBeVisible();
    await user.click(screen.getByRole("button", {name: "Save position"}));
    await waitFor(() => expect(api.updateAdminStation).toHaveBeenCalledWith("ST001", {mapX: 25, mapY: 25}));
  });
});
