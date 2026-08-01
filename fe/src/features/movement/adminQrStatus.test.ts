import {afterEach, describe, expect, it, vi} from "vitest";
import {
  getAdminQrStatusSummary,
  type AdminQrStatusSummaryResponse,
} from "./api";
import {buildAdminQrStatusRecords} from "./adminQrStatus";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SystemConfigPage QR status summary", () => {
  it("loads all QR statuses with one summary request", async () => {
    const summary: AdminQrStatusSummaryResponse = {
      teams: [{teamId: 1, status: "ACTIVE"}],
      stations: [
        {stationId: "ST001", activeCount: 2, status: "ACTIVE"},
      ],
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify(summary),
      {status: 200, headers: {"content-type": "application/json"}},
    ));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAdminQrStatusSummary()).resolves.toEqual(summary);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/admin/qr-status-summary");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({method: "GET"});
  });

  it("maps one summary response and defaults entities without tokens to NONE", () => {
    const summary: AdminQrStatusSummaryResponse = {
      teams: [
        {teamId: 1, status: "ACTIVE"},
        {teamId: 99, status: "ACTIVE"},
      ],
      stations: [
        {stationId: "ST001", activeCount: 2, status: "ACTIVE"},
        {stationId: "ST002", activeCount: 0, status: "REVOKED"},
        {stationId: "ST099", activeCount: 1, status: "ACTIVE"},
      ],
    };

    expect(buildAdminQrStatusRecords(
      summary,
      ["1", "2"],
      ["ST001", "ST002", "ST003"],
    )).toEqual({
      teamStatuses: {
        "1": "ACTIVE",
        "2": "NONE",
      },
      stationStatuses: {
        ST001: "ACTIVE x2",
        ST002: "REVOKED",
        ST003: "NONE",
      },
    });
  });
});
