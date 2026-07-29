import {DEFAULT_STATION_MAX_POINTS} from "./constants";
import {STATUS_ORDER} from "./constants";
import type {
  AuthAccount,
  LocalDatabase,
  LocalDatabaseSeed,
  SqlTeam,
  SqlTeamStationProgress,
  SqlUser,
  StationDefinition,
  Team,
  TeamStation,
} from "./types";

function createSeededStations(
  team: Team,
  definitions: StationDefinition[],
) {
  return definitions.map((station) => ({
      id: `${team.id}-${station.id}`,
      name: station.name,
      description: station.description,
      status: "New" as const,
      durationMinutes: station.durationMinutes ?? 0,
      trackingMode: station.trackingMode ?? "BOTH",
      youtubeUrl: station.youtubeUrl,
      imageUrls: station.imageUrls ?? [],
      score: 0,
      startTime: null,
      endTime: null,
      teamId: team.id,
      stationId: station.id,
    }));
}

export function createInitialTeamStations(
  teams: Team[] = [],
  definitions: StationDefinition[] = [],
) {
  return teams.reduce<Record<string, TeamStation[]>>(
    (accumulator, team) => {
      accumulator[team.id] = createSeededStations(team, definitions);
      return accumulator;
    },
    {},
  );
}

export function getStationEffectiveMaxPoints(
  station: Pick<TeamStation, "trackingMode" | "maxPoints">,
) {
  return station.trackingMode === "TIME" ? 10 : station.maxPoints ?? DEFAULT_STATION_MAX_POINTS;
}

export function getStationDisplayCode(stationId: string) {
  const canonicalMatch = /^ST0(0[1-9]|1[0-8])$/.exec(stationId);
  return canonicalMatch ? canonicalMatch[1] : stationId;
}

export function compareStationIds(left: string, right: string) {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function compareTeamStations(
  left: Pick<TeamStation, "status" | "stationId">,
  right: Pick<TeamStation, "status" | "stationId">,
) {
  return (
    STATUS_ORDER[left.status] - STATUS_ORDER[right.status] ||
    compareStationIds(left.stationId, right.stationId)
  );
}

export function getLocalizedTeamName(teamName: string, language: "vi" | "en") {
  const match = /^(?:Team|Đội)\s*(\d{1,3})$/i.exec(teamName.trim());
  if (!match) {
    return teamName;
  }

  const number = match[1].padStart(2, "0");
  return language === "en" ? `Team ${number}` : `Đội ${number}`;
}

export const DEFAULT_DATABASE: LocalDatabase = {
  dataSessionKey: null,
  activeTeamId: "",
  teams: [],
  authAccounts: [],
  stationDefinitions: [],
  teamStations: createInitialTeamStations(),
};

function toInternalTeamId(teamId: number) {
  return `TEAM${String(teamId).padStart(2, "0")}`;
}

function normalizeSqlUsers(users?: SqlUser[]) {
  if (!users?.length) {
    return null;
  }

  return users.map<AuthAccount>((user) => ({
    username: user.username,
    password: user.password_hash,
    role: "admin",
  }));
}

function normalizeSqlStations(seed?: LocalDatabaseSeed) {
  if (!seed?.stations?.length) {
    return null;
  }

  return seed.stations;
}

function normalizeSqlTeams(seed?: LocalDatabaseSeed) {
  if (!seed?.teams?.length) {
    return null;
  }

  const firstTeam = seed.teams[0] as Team | SqlTeam;
  if (!("team_id" in firstTeam)) {
    return null;
  }

  const rawTeams = seed.teams as unknown as SqlTeam[];

  return rawTeams.map<Team>((team) => {
    const normalizedName = team.team_name.trim();
    // Keep username aligned with database team_id/passcode convention (team01).
    const username = `team${String(team.team_id).padStart(2, "0")}`;

    return {
      id: toInternalTeamId(team.team_id),
      name: normalizedName,
      username,
      password: team.passcode,
      score: team.total_points,
      finish: 0,
      totalTimeMinutes: 0,
    };
  });
}

function mapSqlProgressStatus(
  status: SqlTeamStationProgress["status"],
): TeamStation["status"] {
  switch (status) {
    case "COMPLETED":
      return "Finished";
    case "IN_PROGRESS":
      return "In Progress";
    default:
      return "New";
  }
}

function buildTeamStationsFromSqlProgress(
  teams: Team[],
  definitions: StationDefinition[],
  progress?: SqlTeamStationProgress[],
) {
  const baseline = teams.reduce<Record<string, TeamStation[]>>((acc, team) => {
    acc[team.id] = definitions.map((station) => ({
      ...station,
      id: `${team.id}-${station.id}`,
      status: "New",
      durationMinutes: station.durationMinutes ?? 0,
      trackingMode: station.trackingMode ?? "BOTH",
      imageUrls: station.imageUrls ?? [],
      score: 0,
      startTime: null,
      endTime: null,
      teamId: team.id,
      stationId: station.id,
    }));

    return acc;
  }, {});

  if (!progress?.length) {
    return baseline;
  }

  return progress.reduce<Record<string, TeamStation[]>>((acc, item) => {
    const teamId = toInternalTeamId(item.team_id);
    const teamStations = acc[teamId];
    if (!teamStations) {
      return acc;
    }

    acc[teamId] = teamStations.map((station) => {
      if (station.stationId !== item.station_id) {
        return station;
      }

      return {
        ...station,
        status: mapSqlProgressStatus(item.status),
        score: item.score_achieved,
        startTime: item.arrival_time,
        endTime: item.completion_time,
      };
    });

    return acc;
  }, baseline);
}

function normalizeAuthAccounts(accounts?: AuthAccount[]) {
  return accounts?.length ? accounts : DEFAULT_DATABASE.authAccounts;
}

function computeTeamStats(team: Team, teamStations: TeamStation[]) {
  const completedStations = teamStations.filter(
    (station) => station.status === "Finished",
  );

  return {
    ...team,
    finish: completedStations.length,
  };
}

export function syncTeamsWithStations(
  teams: Team[],
  teamStations: Record<string, TeamStation[]>,
) {
  return teams.map((team) =>
    computeTeamStats(team, teamStations[team.id] ?? []),
  );
}

export function normalizeDatabaseSeed(seed?: LocalDatabaseSeed): LocalDatabase {
  const sqlStationDefinitions = normalizeSqlStations(seed);
  const sqlTeams = normalizeSqlTeams(seed);
  const sqlAuthAccounts = normalizeSqlUsers(seed?.users);
  const stationDefinitions =
    sqlStationDefinitions ??
    (seed?.stationDefinitions?.length ?
      seed.stationDefinitions
    : DEFAULT_DATABASE.stationDefinitions);
  const seedTeams = seed?.teams?.length ? seed.teams : DEFAULT_DATABASE.teams;
  const baseTeams = sqlTeams ?? seedTeams;
  const authAccounts =
    sqlAuthAccounts ?? normalizeAuthAccounts(seed?.authAccounts);

  let teamStations: Record<string, TeamStation[]>;
  if (seed?.teamStations && Object.keys(seed.teamStations).length > 0) {
    teamStations = seed.teamStations;
  } else if (seed?.team_station_progress) {
    teamStations = buildTeamStationsFromSqlProgress(
      baseTeams,
      stationDefinitions,
      seed.team_station_progress,
    );
  } else {
    teamStations = createInitialTeamStations(baseTeams, stationDefinitions);
  }

  const teams = syncTeamsWithStations(baseTeams, teamStations);
  const activeTeamId =
    teams.some((team) => team.id === seed?.activeTeamId) ?
      (seed?.activeTeamId as string)
    : (teams[0]?.id ?? DEFAULT_DATABASE.activeTeamId);

  return {
    dataSessionKey: seed?.dataSessionKey ?? null,
    activeTeamId,
    stationDefinitions,
    teams,
    authAccounts,
    teamStations,
  };
}

export function formatDateTime(value: string | null, language: "vi" | "en" = "vi") {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function formatDurationFromMs(durationMs: number) {
  const safeDuration = Math.max(0, Math.floor(durationMs / 1000));
  const hours = String(Math.floor(safeDuration / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((safeDuration % 3600) / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(safeDuration % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function getStationCooldownRemainingSeconds(
  station: Pick<TeamStation, "nextCheckInAllowedAt">,
  nowMs = Date.now(),
) {
  if (!station.nextCheckInAllowedAt) {
    return 0;
  }

  const nextAllowedMs = new Date(station.nextCheckInAllowedAt).getTime();
  if (!Number.isFinite(nextAllowedMs)) {
    return 0;
  }

  return Math.max(0, Math.ceil((nextAllowedMs - nowMs) / 1000));
}

export function formatCooldownRemaining(seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const remainderSeconds = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainderSeconds}`;
}

export function getDisabledReason(
  station: TeamStation,
  activeStation: TeamStation | undefined,
  nowMs = Date.now(),
  translate?: (key: string, options?: Record<string, unknown>) => string,
) {
  const t = translate ?? ((key: string, options?: Record<string, unknown>) => {
    switch (key) {
      case "errors.stationClosed":
        return "Station đã đóng";
      case "errors.stationCompleted":
        return "Station has already been completed";
      case "errors.tryAgainIn":
        return `Try again in ${String(options?.time ?? "")}`;
      case "errors.activeStation":
        return `There is an active station ${String(options?.station ?? "")} in progress`;
      default:
        return key;
    }
  });

  if (station.backendStatus === "LOCKED") {
    return t("errors.stationClosed");
  }

  if (station.status === "Finished") {
    return t("errors.stationCompleted");
  }

  const cooldownRemaining = getStationCooldownRemainingSeconds(station, nowMs);
  if (cooldownRemaining > 0) {
    return t("errors.tryAgainIn", {
      time: formatCooldownRemaining(cooldownRemaining),
    });
  }

  if (activeStation && activeStation.stationId !== station.stationId) {
    return t("errors.activeStation", {station: activeStation.name});
  }

  return null;
}

export function getStationStatusColor(status: TeamStation["status"]) {
  switch (status) {
    case "Finished":
      return "green";
    case "In Progress":
      return "orange";
    default:
      return "blue";
  }
}
