import {create} from "zustand";
import {
  normalizeDatabaseSeed,
  syncTeamsWithStations,
  DEFAULT_DATABASE,
} from "./utils";
import type {
  MovementStore,
  Session,
  StationFormValues,
  Team,
  TeamStation,
} from "./types";

const SESSION_STORAGE_KEY = "movement-session";
const ACTIVE_TEAM_STORAGE_KEY = "movement-active-team";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function readPersistedSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (!value) {
      return null;
    }

    const session = JSON.parse(value) as Session;
    if (!session.expiresAt) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function persistSession(session: Session | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({...session, expiresAt}),
  );
}

function readPersistedActiveTeamId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_TEAM_STORAGE_KEY);
}

function persistActiveTeamId(teamId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, teamId);
}

const initialSession = readPersistedSession();
const initialActiveTeamId =
  initialSession?.teamId ??
  readPersistedActiveTeamId() ??
  DEFAULT_DATABASE.activeTeamId;

function createNewTeamStation(
  teamId: string,
  stationId: string,
  name: string,
  durationMinutes = 0,
  trackingMode: TeamStation["trackingMode"] = "BOTH",
): TeamStation {
  return {
    id: `${teamId}-${stationId}`,
    name,
    status: "New",
    durationMinutes,
    trackingMode,
    score: 0,
    startTime: null,
    endTime: null,
    teamId,
    stationId,
  };
}

function updateTeamStationCollection(
  teamStations: Record<string, TeamStation[]>,
  teamId: string,
  updater: (stations: TeamStation[]) => TeamStation[],
) {
  return {
    ...teamStations,
    [teamId]: updater(teamStations[teamId] ?? []),
  };
}

function mapTeamStations(
  teamStations: Record<string, TeamStation[]>,
  mapper: (teamId: string, stations: TeamStation[]) => TeamStation[],
) {
  return Object.fromEntries(
    Object.entries(teamStations).map(([teamId, stations]) => [
      teamId,
      mapper(teamId, stations),
    ]),
  );
}

function createStoreState(
  teams: Team[],
  teamStations: Record<string, TeamStation[]>,
) {
  return {
    teamStations,
    teams: syncTeamsWithStations(teams, teamStations),
  };
}

function updateStationFields(
  stations: TeamStation[],
  stationId: string,
  updater: (station: TeamStation) => TeamStation,
) {
  return stations.map((station) =>
    station.stationId === stationId ? updater(station) : station,
  );
}

function replaceTeamIdInStations(stations: TeamStation[], nextTeamId: string) {
  return stations.map((station) => ({
    ...station,
    teamId: nextTeamId,
    id: `${nextTeamId}-${station.stationId}`,
  }));
}

function upsertStationDefinition(
  teamId: string,
  stations: TeamStation[],
  values: StationFormValues,
  targetStationId: string,
) {
  const hasStation = stations.some(
    (station) => station.stationId === targetStationId,
  );

  if (!hasStation) {
    return [
      ...stations,
      createNewTeamStation(
        teamId,
        values.id,
        values.name,
        values.durationMinutes,
        values.trackingMode,
      ),
    ];
  }

  return stations.map((station) => {
    if (station.stationId !== targetStationId) {
      return station;
    }

    return {
      ...station,
      name: values.name,
      description: values.description,
      durationMinutes: values.durationMinutes,
      trackingMode: values.trackingMode,
      stationId: values.id,
      id: `${teamId}-${values.id}`,
    };
  });
}

function createStartedStation(station: TeamStation, now: string): TeamStation {
  return {
    ...station,
    status: "In Progress",
    startTime: now,
    endTime: null,
    score: 0,
  };
}

function createFinishedStation(
  station: TeamStation,
  now: string,
  score: number,
): TeamStation {
  return {
    ...station,
    status: "Finished",
    score,
    startTime: station.startTime ?? now,
    endTime: now,
  };
}

function createResetStation(station: TeamStation): TeamStation {
  return {
    ...station,
    status: "New",
    score: 0,
    startTime: null,
    endTime: null,
  };
}

function createPatchedStation(
  station: TeamStation,
  patch: Partial<TeamStation>,
): TeamStation {
  return {
    ...station,
    ...patch,
  };
}

function removeStationFromTeam(stations: TeamStation[], stationId: string) {
  return stations.filter((station) => station.stationId !== stationId);
}

function buildTeamStationsWithUpdatedStation(
  teamStations: Record<string, TeamStation[]>,
  teamId: string,
  stationId: string,
  updater: (station: TeamStation) => TeamStation,
) {
  return updateTeamStationCollection(teamStations, teamId, (stations) =>
    updateStationFields(stations, stationId, updater),
  );
}

function buildStartedTeamStations(
  teamStations: Record<string, TeamStation[]>,
  teamId: string,
  stationId: string,
  now: string,
) {
  return buildTeamStationsWithUpdatedStation(
    teamStations,
    teamId,
    stationId,
    (station) => createStartedStation(station, now),
  );
}

function buildFinishedTeamStations(
  teamStations: Record<string, TeamStation[]>,
  teamId: string,
  stationId: string,
  now: string,
  score: number,
) {
  return buildTeamStationsWithUpdatedStation(
    teamStations,
    teamId,
    stationId,
    (station) => createFinishedStation(station, now, score),
  );
}

function buildResetTeamStations(
  teamStations: Record<string, TeamStation[]>,
  teamId: string,
  stationId: string,
) {
  return buildTeamStationsWithUpdatedStation(
    teamStations,
    teamId,
    stationId,
    createResetStation,
  );
}

function buildPatchedTeamStations(
  teamStations: Record<string, TeamStation[]>,
  teamId: string,
  stationId: string,
  patch: Partial<TeamStation>,
) {
  return buildTeamStationsWithUpdatedStation(
    teamStations,
    teamId,
    stationId,
    (station) => createPatchedStation(station, patch),
  );
}

function buildTeamStationsWithoutStation(
  teamStations: Record<string, TeamStation[]>,
  stationId: string,
) {
  return mapTeamStations(teamStations, (_teamId, stations) =>
    removeStationFromTeam(stations, stationId),
  );
}

export const useMovementStore = create<MovementStore>((set) => ({
  session: initialSession,
  ...DEFAULT_DATABASE,
  activeTeamId: initialActiveTeamId,
  loadDatabase: (seed) => {
    set((state) => {
      const normalized = normalizeDatabaseSeed(seed);
      const persistedTeamId =
        state.session?.teamId ?? readPersistedActiveTeamId();
      const activeTeamId =
        normalized.teams.some((team) => team.id === persistedTeamId) ?
          (persistedTeamId as string)
        : normalized.activeTeamId;

      persistActiveTeamId(activeTeamId);

      return {
        ...normalized,
        activeTeamId,
        session: state.session,
      };
    });
  },
  login: (session) => {
    persistSession(session);

    set((state) => {
      const activeTeamId = session.teamId ?? state.activeTeamId;
      persistActiveTeamId(activeTeamId);

      return {
        session,
        activeTeamId,
      };
    });
  },
  logout: () => {
    persistSession(null);
    set((state) => {
      const activeTeamId = state.teams[0]?.id ?? DEFAULT_DATABASE.activeTeamId;
      persistActiveTeamId(activeTeamId);

      return {session: null, activeTeamId};
    });
  },
  setActiveTeam: (teamId) => {
    persistActiveTeamId(teamId);
    set({activeTeamId: teamId});
  },
  startStation: (teamId, stationId) => {
    const now = new Date().toISOString();

    set((state) => {
      const nextTeamStations = buildStartedTeamStations(
        state.teamStations,
        teamId,
        stationId,
        now,
      );

      return createStoreState(state.teams, nextTeamStations);
    });
  },
  finishStation: (teamId, stationId, score) => {
    const now = new Date().toISOString();

    set((state) => {
      const nextTeamStations = buildFinishedTeamStations(
        state.teamStations,
        teamId,
        stationId,
        now,
        score,
      );

      return createStoreState(state.teams, nextTeamStations);
    });
  },
  resetStation: (teamId, stationId) => {
    set((state) => {
      const nextTeamStations = buildResetTeamStations(
        state.teamStations,
        teamId,
        stationId,
      );

      return createStoreState(state.teams, nextTeamStations);
    });
  },
  patchTeamStation: (teamId, stationId, patch) => {
    set((state) => {
      const nextTeamStations = buildPatchedTeamStations(
        state.teamStations,
        teamId,
        stationId,
        patch,
      );

      return createStoreState(state.teams, nextTeamStations);
    });
  },
  deleteStationDefinition: (stationId) => {
    set((state) => {
      const stationDefinitions = state.stationDefinitions.filter(
        (station) => station.id !== stationId,
      );
      const nextTeamStations = buildTeamStationsWithoutStation(
        state.teamStations,
        stationId,
      );

      return {
        stationDefinitions,
        ...createStoreState(state.teams, nextTeamStations),
      };
    });
  },
  saveStationDefinition: (values, editingId) => {
    set((state) => {
      const exists = state.stationDefinitions.some(
        (station) => station.id === values.id && station.id !== editingId,
      );

      if (exists) {
        return state;
      }

      const stationDefinitions =
        editingId ?
          state.stationDefinitions.map((station) =>
            station.id === editingId ? {...station, ...values} : station,
          )
        : [...state.stationDefinitions, values];

      const targetStationId = editingId ?? values.id;
      const nextTeamStations = mapTeamStations(
        state.teamStations,
        (teamId, stations) =>
          upsertStationDefinition(teamId, stations, values, targetStationId),
      );

      return {
        stationDefinitions,
        ...createStoreState(state.teams, nextTeamStations),
      };
    });
  },
  updateStationMarker: (stationId, patch) => {
    set((state) => ({
      stationDefinitions: state.stationDefinitions.map((station) =>
        station.id === stationId ? {...station, ...patch} : station,
      ),
    }));
  },
  deleteTeam: (teamId) => {
    set((state) => {
      const teams = state.teams.filter((team) => team.id !== teamId);
      const nextTeamStations = Object.fromEntries(
        Object.entries(state.teamStations).filter(
          ([currentTeamId]) => currentTeamId !== teamId,
        ),
      );
      const activeTeamId =
        state.activeTeamId === teamId ?
          (teams[0]?.id ?? "")
        : state.activeTeamId;
      const session = state.session?.teamId === teamId ? null : state.session;

      persistActiveTeamId(activeTeamId);
      persistSession(session);

      return {
        teams,
        teamStations: nextTeamStations,
        activeTeamId,
        session,
      };
    });
  },
  saveTeam: (values, editingId) => {
    set((state) => {
      const duplicate = state.teams.some(
        (team) => team.id === values.id && team.id !== editingId,
      );

      if (duplicate) {
        return state;
      }

      if (editingId) {
        const teams = state.teams.map((team) =>
          team.id === editingId ? values : team,
        );
        const nextTeamStations = Object.fromEntries(
          Object.entries(state.teamStations)
            .filter(([teamId]) => teamId !== editingId)
            .concat([
              [
                values.id,
                replaceTeamIdInStations(
                  state.teamStations[editingId] ?? [],
                  values.id,
                ),
              ],
            ]),
        );
        const activeTeamId =
          state.activeTeamId === editingId ? values.id : state.activeTeamId;
        const session =
          state.session?.teamId === editingId ?
            {...state.session, username: values.username, teamId: values.id}
          : state.session;

        persistActiveTeamId(activeTeamId);
        persistSession(session);

        return {
          activeTeamId,
          session,
          ...createStoreState(teams, nextTeamStations),
        };
      }

      const teams = [...state.teams, values];
      const nextTeamStations = {
        ...state.teamStations,
        [values.id]: state.stationDefinitions.map((station) =>
          createNewTeamStation(
            values.id,
            station.id,
            station.name,
            station.durationMinutes ?? 0,
            station.trackingMode ?? "BOTH",
          ),
        ),
      };

      return {
        activeTeamId: state.activeTeamId,
        ...createStoreState(teams, nextTeamStations),
      };
    });
  },
}));
