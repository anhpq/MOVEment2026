import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter} from "react-router-dom";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../../movement/i18n";
import {ensureAdminV2Resources} from "../../i18n/resources";
import {AdminV2StationsPage} from "./AdminV2StationsPage";

const api = vi.hoisted(() => ({getAdminProgressMatrix: vi.fn(), getAdminQrStatusSummary: vi.fn()}));
vi.mock("../../../movement/api", () => api);

const matrix = (stations: unknown[] = [
  {id: "ST010", name: "Trạm Mười", nameEn: "Station Ten", trackingMode: "BOTH", games: [{type: "STANDARD", maxPoints: 0}]},
  {id: "ST002", name: "Trạm Hai", nameEn: "", trackingMode: "TIME", games: [{type: "ST", maxPoints: 10}]},
]) => ({stations, rows: [
  {cells: [{status: "PLAYING"}, {status: "COMPLETED"}]},
  {cells: [{status: "CHECKED_IN"}, {status: "COMPLETED"}]},
]});

function renderStations() {
  return render(<MemoryRouter><AdminV2StationsPage /></MemoryRouter>);
}

describe("AdminV2StationsPage", () => {
  beforeEach(async () => {
    ensureAdminV2Resources();
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    await i18n.changeLanguage("en");
    api.getAdminProgressMatrix.mockResolvedValue(matrix());
    api.getAdminQrStatusSummary.mockResolvedValue({teams: [], stations: [
      {stationId: "ST010", activeCount: 2, status: "ACTIVE"},
      {stationId: "ST002", activeCount: 1, status: "REVOKED"},
    ]});
  });

  afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

  it("renders API fields, natural station order, real zero values, and QR status", async () => {
    renderStations();
    expect(await screen.findByText("Station Ten")).toBeVisible();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getByText("2")).toBeVisible();
    expect(screen.getByText("QR active")).toBeVisible();
    expect(screen.getByText("QR revoked")).toBeVisible();
    const identifiers = screen.getAllByText(/ST0(02|10)/).map((element) => element.textContent);
    expect(identifiers.indexOf("ST002")).toBeLessThan(identifiers.indexOf("ST010"));
    await i18n.changeLanguage("vi");
    expect(await screen.findByText("Trạm Mười")).toBeVisible();
  });

  it("filters by supported Station fields and falls back to the Vietnamese name per field", async () => {
    const user = userEvent.setup();
    renderStations();
    await screen.findByText("Station Ten");
    await user.type(screen.getByRole("searchbox", {name: "Search stations"}), "station ten");
    expect(screen.getByText("Station Ten")).toBeVisible();
    expect(screen.queryByText("Trạm Hai")).not.toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox", {name: "Search stations"}));
    await user.click(screen.getByLabelText("Filter by tracking mode"));
    await user.click(screen.getByText("TIME", {selector: ".ant-select-item-option-content"}));
    expect(screen.getByText("Trạm Hai")).toBeVisible();
    expect(screen.queryByText("Station Ten")).not.toBeInTheDocument();
  });

  it("separates an empty API response, an API failure, and QR-summary degradation", async () => {
    api.getAdminProgressMatrix.mockResolvedValue(matrix([]));
    renderStations();
    expect(await screen.findByText("No stations yet.")).toBeVisible();

    api.getAdminProgressMatrix.mockRejectedValue(new Error("offline"));
    renderStations();
    expect(await screen.findByText("Unable to load Stations")).toBeVisible();

    api.getAdminProgressMatrix.mockResolvedValue(matrix());
    api.getAdminQrStatusSummary.mockRejectedValue(new Error("qr unavailable"));
    renderStations();
    expect(await screen.findByText("QR status could not be loaded")).toBeVisible();
    expect(screen.getAllByText("QR unavailable").length).toBeGreaterThan(0);
  });
});
