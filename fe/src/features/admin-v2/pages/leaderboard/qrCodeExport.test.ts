import {describe, expect, it} from "vitest";
import type {AdminQrCodeExportResponse} from "../../../movement/api";
import {buildQrCodeManifest, getQrCodeExportEntries} from "./qrCodeExport";

describe("getQrCodeExportEntries", () => {
  it("builds deterministic Station and Team PNG entries with notes in the requested position", () => {
    const data: AdminQrCodeExportResponse = {
      fileName: "movement-2026-qr-codes.zip",
      generatedAt: "2026-08-20T00:00:00.000Z",
      teams: [{teamId: 3, loginUrl: "https://movement.example/qr-login?token=team-secret"}],
      stations: [
        {stationId: "ST001", purpose: "CHECK_IN", rawToken: "check-in-secret"},
        {stationId: "ST001", purpose: "CHECK_OUT", rawToken: "check-out-secret"},
      ],
      repaired: {teamIds: [], stationTokens: []},
    };

    expect(getQrCodeExportEntries(data)).toEqual([
      {
        path: "stations/station-01-check-in.png",
        payload: "check-in-secret",
        note: "MÃ CHECK IN - TRẠM 01",
        notePosition: "TOP",
        kind: "STATION",
        entityId: "ST001",
        purpose: "CHECK_IN",
      },
      {
        path: "stations/station-01-check-out.png",
        payload: "check-out-secret",
        note: "MÃ CHECK OUT - TRẠM 01",
        notePosition: "TOP",
        kind: "STATION",
        entityId: "ST001",
        purpose: "CHECK_OUT",
      },
      {
        path: "teams/team-03-login.png",
        payload: "https://movement.example/qr-login?token=team-secret",
        note: "TEAM 03",
        notePosition: "BOTTOM",
        kind: "TEAM",
        entityId: "3",
        purpose: "LOGIN",
      },
    ]);
  });

  it("creates a printable manifest without QR payloads or raw token material", () => {
    const entries = getQrCodeExportEntries({
      fileName: "movement-2026-qr-codes.zip",
      generatedAt: "2026-08-20T00:00:00.000Z",
      teams: [{teamId: 3, loginUrl: "https://movement.example/qr-login?token=team-secret"}],
      stations: [{stationId: "ST001", purpose: "CHECK_IN", rawToken: "check-in-secret"}],
      repaired: {teamIds: [], stationTokens: []},
    });

    const manifest = buildQrCodeManifest(entries);

    expect(manifest).toContain('"stations/station-01-check-in.png","STATION","ST001","CHECK_IN"');
    expect(manifest).toContain('"teams/team-03-login.png","TEAM","3","LOGIN"');
    expect(manifest).not.toContain("check-in-secret");
    expect(manifest).not.toContain("team-secret");
  });
});
