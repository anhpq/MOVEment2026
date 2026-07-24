export type Role = "user" | "admin";

export type StationStatus = "New" | "In Progress" | "Finished";
export type StationTrackingMode = "SCORE" | "TIME" | "BOTH";
export type GameType = "ST" | "STANDARD";

export type Session = {
  username: string;
  role: Role;
  teamId: string | null;
  accessToken?: string;
  expiresAt?: string;
};

export type AuthAccount = {
  username: string;
  password: string;
  role: Role;
};

export type Team = {
  id: string;
  name: string;
  username: string;
  password: string;
  score: number;
  finish: number;
  totalTimeMinutes: number;
  captainName?: string;
  teamColor?: string | null;
};

export type StationDefinition = {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes?: number;
  youtubeUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  markerX?: number | null;
  markerY?: number | null;
  trackingMode?: StationTrackingMode;
  gameType?: GameType;
  maxPoints?: number;
};

export type TeamStation = {
  id: string;
  name: string;
  status: StationStatus;
  description?: string | null;
  durationMinutes: number;
  trackingMode: StationTrackingMode;
  youtubeUrl?: string | null;
  score: number;
  startTime: string | null;
  endTime: string | null;
  teamId: string;
  stationId: string;
  progressId?: number;
  maxPoints?: number;
  backendStatus?: "LOCKED" | "AVAILABLE" | "CHECKED_IN" | "PLAYING" | "COMPLETED";
  gameType?: GameType;
};

export type StationFormValues = {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  trackingMode: StationTrackingMode;
  markerX?: number;
  markerY?: number;
  gameType?: GameType;
  maxPoints?: number;
  youtubeUrl?: string | null;
  checkInQrToken?: string;
  checkOutQrToken?: string;
};

export type TeamFormValues = {
  id: string;
  name: string;
  username: string;
  password: string;
  score: number;
  finish: number;
  totalTimeMinutes: number;
  captainName?: string;
  teamColor?: string | null;
  qrToken?: string;
};

export type SqlUser = {
  id: number;
  username: string;
  password_hash: string;
};

export type SqlStation = {
  id: string;
  name: string;
  game_type: string | null;
  description: string | null;
  points: number;
  youtubeUrl: string | null;
  clue_text: string | null;
  latitude: number | null;
  longitude: number | null;
  position: {
    x: number | null;
    y: number | null;
  };
};

export type SqlTeam = {
  team_id: number;
  team_name: string;
  passcode: string;
  total_points: number;
  start_time: string | null;
};

export type SqlProgressStatus = "LOCKED" | "IN_PROGRESS" | "COMPLETED";

export type SqlTeamStationProgress = {
  id: number;
  team_id: number;
  station_id: string;
  status: SqlProgressStatus;
  arrival_time: string | null;
  completion_time: string | null;
  score_achieved: number;
};

export type LocalDatabaseSeed = {
  activeTeamId?: string;
  teams?: Team[];
  authAccounts?: AuthAccount[];
  stationDefinitions?: StationDefinition[];
  teamStations?: Record<string, TeamStation[]>;
  users?: SqlUser[];
  stations?: SqlStation[];
  team_station_progress?: SqlTeamStationProgress[];
};

export type LocalDatabase = {
  activeTeamId: string;
  teams: Team[];
  authAccounts: AuthAccount[];
  stationDefinitions: StationDefinition[];
  teamStations: Record<string, TeamStation[]>;
};

export type MovementStore = {
  session: Session | null;
  activeTeamId: string;
  teams: Team[];
  authAccounts: AuthAccount[];
  stationDefinitions: StationDefinition[];
  teamStations: Record<string, TeamStation[]>;
  loadDatabase: (seed: LocalDatabaseSeed) => void;
  login: (session: Session) => void;
  logout: () => void;
  setActiveTeam: (teamId: string) => void;
  startStation: (teamId: string, stationId: string) => void;
  finishStation: (teamId: string, stationId: string, score: number) => void;
  resetStation: (teamId: string, stationId: string) => void;
  patchTeamStation: (
    teamId: string,
    stationId: string,
    patch: Partial<TeamStation>,
  ) => void;
  deleteStationDefinition: (stationId: string) => void;
  saveStationDefinition: (
    values: StationFormValues,
    editingId?: string,
  ) => void;
  updateStationMarker: (
    stationId: string,
    patch: Pick<StationDefinition, "markerX" | "markerY">,
  ) => void;
  deleteTeam: (teamId: string) => void;
  saveTeam: (values: TeamFormValues, editingId?: string) => void;
};
