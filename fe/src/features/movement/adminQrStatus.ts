import type {AdminQrStatusSummaryResponse} from "./api";

export function buildAdminQrStatusRecords(
  summary: AdminQrStatusSummaryResponse,
  teamIds: readonly string[],
  stationIds: readonly string[],
) {
  const teamStatuses: Record<string, string> = Object.fromEntries(
    teamIds.map((teamId) => [teamId, "NONE"]),
  );
  const stationStatuses: Record<string, string> = Object.fromEntries(
    stationIds.map((stationId) => [stationId, "NONE"]),
  );

  for (const team of summary.teams) {
    const teamId = String(team.teamId);
    if (Object.hasOwn(teamStatuses, teamId)) {
      teamStatuses[teamId] = team.status;
    }
  }
  for (const station of summary.stations) {
    if (Object.hasOwn(stationStatuses, station.stationId)) {
      stationStatuses[station.stationId] = station.activeCount > 0
        ? `ACTIVE x${station.activeCount}`
        : station.status;
    }
  }

  return {teamStatuses, stationStatuses};
}
