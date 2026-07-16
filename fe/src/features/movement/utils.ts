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

function toIsoFromNow(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

function createSeededStations(
  team: Team,
  definitions: StationDefinition[],
  index: number,
) {
  return definitions.map((station, stationIndex) => {
    let status: TeamStation["status"] = "New";
    let score = 0;
    let startTime: string | null = null;
    let endTime: string | null = null;

    if (stationIndex < team.finish) {
      status = "Finish";
      score = 70 + stationIndex * 20 + (index % 3) * 5;
      startTime = toIsoFromNow(120 + stationIndex * 18 + index * 5);
      endTime = toIsoFromNow(95 + stationIndex * 16 + index * 4);
    }

    if (team.id === "TEAM01" && stationIndex === 1) {
      status = "New";
      score = 0;
      startTime = null;
      endTime = null;
    }

    return {
      id: `${team.id}-${station.id}`,
      name: station.name,
      description: station.description,
      status,
      durationMinutes: station.durationMinutes ?? 0,
      youtubeUrl: station.youtubeUrl,
      score,
      startTime,
      endTime,
      teamId: team.id,
      stationId: station.id,
    };
  });
}

export function createInitialTeamStations(
  teams: Team[] = [],
  definitions: StationDefinition[] = [],
) {
  return teams.reduce<Record<string, TeamStation[]>>(
    (accumulator, team, index) => {
      accumulator[team.id] = createSeededStations(team, definitions, index);
      return accumulator;
    },
    {},
  );
}

export const DEFAULT_DATABASE: LocalDatabase = {
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
      return "Finish";
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
    (station) => station.status === "Finish",
  );
  const score = completedStations.reduce(
    (total, station) => total + station.score,
    0,
  );
  const totalTimeMinutes = completedStations.reduce((total, station) => {
    if (!station.startTime || !station.endTime) {
      return total;
    }

    const duration =
      new Date(station.endTime).getTime() -
      new Date(station.startTime).getTime();
    return total + Math.max(1, Math.round(duration / 60_000));
  }, 0);

  return {
    ...team,
    score,
    finish: completedStations.length,
    totalTimeMinutes,
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
    activeTeamId,
    stationDefinitions,
    teams,
    authAccounts,
    teamStations,
  };
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
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

export function getDisabledReason(
  station: TeamStation,
  activeStation: TeamStation | undefined,
) {
  if (station.status === "Finish") {
    return "Station has already been completed";
  }

  if (activeStation && activeStation.stationId !== station.stationId) {
    return `There is an active station ${activeStation.name} in progress`;
  }

  return null;
}

export function getStationStatusColor(status: TeamStation["status"]) {
  switch (status) {
    case "Finish":
      return "green";
    case "In Progress":
      return "orange";
    default:
      return "blue";
  }
}
