import {App as AntdApp} from "antd";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../../movement/i18n";
import {ensureAdminV2Resources} from "../../i18n/resources";
import {AdminV2StationDetailPage} from "./AdminV2StationDetailPage";

const api = vi.hoisted(() => ({getAdminProgressMatrix: vi.fn(), getAdminStationQrTokens: vi.fn(), updateAdminStation: vi.fn()}));
vi.mock("../../../movement/api", () => api);
vi.mock("qrcode", () => ({default: {toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,qr")}}));

const matrix = {stations: [{id: "ST002", name: "Trạm Hai", nameEn: "Station Two", description: "Mô tả", descriptionEn: "Description", mapX: 25, mapY: 75, trackingMode: "BOTH", imageUrls: ["https://example.com/one.png"], games: [{type: "ST", maxPoints: 10, mediaUrl: "https://youtube.com/watch?v=two"}]}], rows: [{cells: [{status: "PLAYING"}]}, {cells: [{status: "COMPLETED"}]}]};

function renderDetail(path = "/admin-v2/stations/ST002") {
  return render(<AntdApp><MemoryRouter initialEntries={[path]}><Routes><Route path="/admin-v2/stations/:stationId/*" element={<AdminV2StationDetailPage />} /></Routes></MemoryRouter></AntdApp>);
}

describe("AdminV2StationDetailPage", () => {
  beforeEach(async () => {
    ensureAdminV2Resources(); await i18n.changeLanguage("en");
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    api.getAdminProgressMatrix.mockResolvedValue(matrix);
    api.getAdminStationQrTokens.mockResolvedValue([{id: 1, stationId: "ST002", purpose: "CHECK_IN", rawToken: "check-in-secret", schemaVersion: "v1", isActive: true, expiresAt: null, createdAt: "2026-08-19T00:00:00.000Z", status: "ACTIVE"}, {id: 2, stationId: "ST002", purpose: "CHECK_OUT", rawToken: "check-out-secret", schemaVersion: "v1", isActive: true, expiresAt: null, createdAt: "2026-08-19T00:00:00.000Z", status: "ACTIVE"}]);
    api.updateAdminStation.mockResolvedValue({});
  });
  afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

  it("shows the existing CHECK-IN and CHECK-OUT QR pair without token lifecycle actions", async () => {
    renderDetail();
    expect(await screen.findByText("Station Two")).toBeVisible();
    expect(screen.getByText("CHECK-IN")).toBeVisible();
    expect(screen.getByText("CHECK-OUT")).toBeVisible();
    expect(await screen.findAllByText("Download PNG")).toHaveLength(2);
    expect(screen.queryByText(/rotate|revoke/i)).not.toBeInTheDocument();
    expect(screen.queryByText("check-in-secret")).not.toBeInTheDocument();
  });

  it("edits supported Station configuration without changing its ID or QR tokens", async () => {
    const user = userEvent.setup();
    renderDetail("/admin-v2/stations/ST002/edit");
    await screen.findAllByText("Edit Station");
    expect(screen.getByDisplayValue("ST002")).toBeDisabled();
    const vietnameseName = screen.getByLabelText("Vietnamese name");
    await user.clear(vietnameseName); await user.type(vietnameseName, "Trạm Mới");
    await user.click(screen.getByRole("button", {name: "Save changes"}));
    await waitFor(() => expect(api.updateAdminStation).toHaveBeenCalledWith("ST002", expect.objectContaining({name: "Trạm Mới", nameEn: "Station Two", mapX: 25, mapY: 75, gameType: "ST", maxPoints: 10})));
    expect(api.updateAdminStation.mock.calls[0][1]).not.toHaveProperty("checkInQrToken");
    expect(api.updateAdminStation.mock.calls[0][1]).not.toHaveProperty("checkOutQrToken");
  });

  it("shows the unknown ST007 reference exactly as ???", async () => {
    api.getAdminProgressMatrix.mockResolvedValueOnce({
      stations: [{...matrix.stations[0], id: "ST007", games: [{...matrix.stations[0].games[0], maxPoints: null}]}],
      rows: [],
    });
    api.getAdminStationQrTokens.mockResolvedValueOnce([]);

    renderDetail("/admin-v2/stations/ST007");

    expect(await screen.findByText("???")).toBeVisible();
  });
});
