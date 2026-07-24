import {getAdminProgressMatrix} from "./api";
import type {LocalDatabaseSeed, TeamStation} from "./types";

function displayStatus(
  status: NonNullable<TeamStation["backendStatus"]>,
): TeamStation["status"] {
  if (status === "COMPLETED") return "Finished";
  if (status === "CHECKED_IN" || status === "PLAYING") return "In Progress";
  return "New";
}

export async function fetchAdminDatabase(): Promise<LocalDatabaseSeed> {
  const matrix = await getAdminProgressMatrix();
  const firstTeamId = matrix.rows[0] ? String(matrix.rows[0].team.id) : "";

  return {
    activeTeamId: firstTeamId,
    teams: matrix.rows.map(({team, cells}) => ({
      id: String(team.id),
      name: team.name,
      username: team.username,
      password: "",
      captainName: team.captainName,
      teamColor: team.teamColor ?? team.color ?? null,
      score: team.totalPoints,
      finish: cells.filter((cell) => cell?.status === "COMPLETED").length,
      totalTimeMinutes: Math.round(team.totalPlaySeconds / 60),
    })),
    stationDefinitions: matrix.stations.map((station) => ({
      id: station.id,
      name: station.name,
      description: station.description,
      markerX: station.mapX,
      markerY: station.mapY,
      durationMinutes: 0,
      trackingMode: station.trackingMode,
      youtubeUrl: station.games?.[0]?.mediaUrl ?? null,
      gameType: station.games?.[0]?.type,
      maxPoints: station.games?.[0]?.maxPoints,
    })),
    teamStations: Object.fromEntries(matrix.rows.map(({team, cells}) => {
      const teamId = String(team.id);
      return [teamId, matrix.stations.map((station, index) => {
        const cell = cells[index];
        const backendStatus = cell?.status ?? "LOCKED";
        return {
          id: `${teamId}-${station.id}`,
          teamId,
          stationId: station.id,
          name: station.name,
          description: station.description,
          durationMinutes: 0,
          trackingMode: station.trackingMode,
          youtubeUrl: station.games?.[0]?.mediaUrl ?? null,
          gameType: station.games?.[0]?.type,
          status: displayStatus(backendStatus),
          backendStatus,
          progressId: cell?.progressId,
          maxPoints: cell?.maxPoints ?? 0,
          score: cell?.scoreAchieved ?? 0,
          startTime: cell?.checkedInAt ?? null,
          endTime: cell?.completedAt ?? cell?.checkedOutAt ?? null,
        };
      })];
    })),
  };
}
