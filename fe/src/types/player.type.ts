// Team Types
export interface Team {
  team_id: number;
  team_name: string;
  passcode: string;
  total_points: number;
  start_time: string;
  stations_completed: number;
  color: string; // Màu riêng của mỗi đội
  rank: number;
}

// Station Types
export interface Station {
  id: string;
  name: string;
  game_type: string;
  points: number;
  youtubeUrl: string;
  clue_text: string;
  latitude: number;
  longitude: number;
  position: { x: number; y: number }; // Vị trí trên bản đồ 2D
}

// Team Station Progress
export interface TeamStationProgress {
  id: number;
  team_id: number;
  station_id: string;
  status: 'LOCKED' | 'UNLOCKED' | 'PLAYING' | 'COMPLETED';
  arrival_time: string | null;
  completion_time: string | null;
  score_achieved: number;
  attempts: number;
  last_played: string | null;
  cooldown_expires_at: string | null; // Cho unlock lại sau 30p
}

// Game State
export interface GameState {
  current_team: Team;
  stations_progress: Record<string, TeamStationProgress>;
  current_station: Station | null;
  is_playing_cipher: boolean;
  cipher_input: string;
  game_result: {
    is_correct: boolean;
    message: string;
  } | null;
}
