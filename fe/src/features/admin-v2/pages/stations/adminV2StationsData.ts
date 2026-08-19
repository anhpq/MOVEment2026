import {getAdminProgressMatrix, getAdminQrStatusSummary} from "../../../movement/api";
import type {GameType, StationTrackingMode} from "../../../movement/types";
import {compareStationIds} from "../../../movement/utils";

export type AdminV2StationQrStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "INACTIVE" | "UNAVAILABLE";

export type AdminV2StationListItem = Readonly<{
  id: string;
  name: string;
  nameEn: string;
  trackingMode: StationTrackingMode;
  gameType: GameType | null;
  maxPoints: number | null;
  playingTeamCount: number;
  qrStatus: AdminV2StationQrStatus;
  activeQrCount: number | null;
  mapX: number | null;
  mapY: number | null;
}>;

export type AdminV2StationsListResult = Readonly<{
  stations: readonly AdminV2StationListItem[];
  qrStatusUnavailable: boolean;
}>;

export async function getAdminV2StationsList(): Promise<AdminV2StationsListResult> {
  const [matrix, qrSummary] = await Promise.all([
    getAdminProgressMatrix(),
    getAdminQrStatusSummary().catch(() => null),
  ]);
  const qrByStationId = new Map<string, {activeCount: number; status: Exclude<AdminV2StationQrStatus, "UNAVAILABLE">}>(qrSummary?.stations.map((item) => [item.stationId, item]));

  return {
    stations: matrix.stations.map((station, index) => {
      const qr = qrByStationId.get(station.id);
      const qrStatus: AdminV2StationQrStatus = qrSummary === null ? "UNAVAILABLE" : (qr?.status ?? "INACTIVE");
      return {
        id: station.id,
        name: station.name,
        nameEn: station.nameEn,
        trackingMode: station.trackingMode,
        gameType: station.games?.[0]?.type ?? null,
        maxPoints: station.games?.[0]?.maxPoints ?? null,
        playingTeamCount: matrix.rows.filter((row) => {
          const status = row.cells[index]?.status;
          return status === "CHECKED_IN" || status === "PLAYING";
        }).length,
        qrStatus,
        activeQrCount: qrSummary === null ? null : qr?.activeCount ?? 0,
        mapX: station.mapX,
        mapY: station.mapY,
      };
    }).sort((left, right) => compareStationIds(left.id, right.id)),
    qrStatusUnavailable: qrSummary === null,
  };
}
