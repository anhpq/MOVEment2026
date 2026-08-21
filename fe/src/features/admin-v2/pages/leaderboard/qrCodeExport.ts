import QRCode from "qrcode";
import type {AdminQrCodeExportResponse} from "../../../movement/api";
import {getStationDisplayCode} from "../../../movement/utils";

const QR_SIZE = 1024;
const NOTE_BAND_HEIGHT = 128;
const IMAGE_WIDTH = 1120;
const IMAGE_HEIGHT = QR_SIZE + NOTE_BAND_HEIGHT;
const QR_X = (IMAGE_WIDTH - QR_SIZE) / 2;
const NOTE_FONT = '700 44px "Space Grotesk", Aptos, "Segoe UI", sans-serif';

export type QrCodeExportEntry = Readonly<{
  path: string;
  payload: string;
  note: string;
  notePosition: "TOP" | "BOTTOM";
  kind: "STATION" | "TEAM";
  entityId: string;
  purpose: "CHECK_IN" | "CHECK_OUT" | "LOGIN";
}>;

function fileSegment(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getQrCodeExportEntries(data: AdminQrCodeExportResponse): QrCodeExportEntry[] {
  const teams = data.teams.map<QrCodeExportEntry>(({teamId, loginUrl}) => {
    const number = String(teamId).padStart(2, "0");
    return {
      path: `teams/team-${number}-login.png`,
      payload: loginUrl,
      note: `TEAM ${number}`,
      notePosition: "BOTTOM",
      kind: "TEAM",
      entityId: String(teamId),
      purpose: "LOGIN",
    };
  });
  const stations = data.stations.map<QrCodeExportEntry>(({stationId, purpose, rawToken}) => {
    const displayCode = getStationDisplayCode(stationId);
    const purposeSlug = purpose === "CHECK_IN" ? "check-in" : "check-out";
    const purposeLabel = purpose === "CHECK_IN" ? "CHECK IN" : "CHECK OUT";
    return {
      path: `stations/station-${fileSegment(displayCode)}-${purposeSlug}.png`,
      payload: rawToken,
      note: `MÃ ${purposeLabel} - TRẠM ${displayCode}`,
      notePosition: "TOP",
      kind: "STATION",
      entityId: stationId,
      purpose,
    };
  });
  return [...stations, ...teams];
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function buildQrCodeManifest(entries: readonly QrCodeExportEntry[]) {
  const header = ["path", "kind", "entity_id", "purpose", "label"];
  const rows = entries.map((entry) => [
    entry.path,
    entry.kind,
    entry.entityId,
    entry.purpose,
    entry.note,
  ].map(escapeCsv).join(","));
  return `\uFEFF${header.join(",")}\n${rows.join("\n")}\n`;
}

async function renderQrPng(entry: QrCodeExportEntry) {
  if (document.fonts) {
    await document.fonts.load(NOTE_FONT);
  }
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, entry.payload, {
    errorCorrectionLevel: "M",
    margin: 4,
    width: QR_SIZE,
  });

  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("QR_EXPORT_CANVAS_UNAVAILABLE");

  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  const qrY = entry.notePosition === "TOP" ? NOTE_BAND_HEIGHT : 0;
  context.drawImage(qrCanvas, QR_X, qrY, QR_SIZE, QR_SIZE);
  context.fillStyle = "#08172B";
  context.font = NOTE_FONT;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const noteY = entry.notePosition === "TOP"
    ? NOTE_BAND_HEIGHT / 2
    : QR_SIZE + NOTE_BAND_HEIGHT / 2;
  context.fillText(entry.note, IMAGE_WIDTH / 2, noteY, IMAGE_WIDTH - 80);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("QR_EXPORT_PNG_FAILED"));
    }, "image/png");
  });
}

export async function downloadQrCodeZip(data: AdminQrCodeExportResponse) {
  const {default: JSZip} = await import("jszip");
  const zip = new JSZip();
  const entries = getQrCodeExportEntries(data);
  for (const entry of entries) {
    zip.file(entry.path, await renderQrPng(entry));
  }
  // The manifest helps operators verify the printed inventory without copying
  // any QR payload, URL, hash, or token material into a text file.
  zip.file("manifest.csv", buildQrCodeManifest(entries));
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {level: 6},
  });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = data.fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);

  return {
    total: entries.length,
    repaired: data.repaired.teamIds.length + data.repaired.stationTokens.length,
  };
}
