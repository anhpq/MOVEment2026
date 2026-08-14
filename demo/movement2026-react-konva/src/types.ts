export type StationStatus = 'playing' | 'completed' | 'unplayed' | 'locked';

export type Station = {
  id: string;
  label: string;
  points: number;
  status: StationStatus;
  x: number;
  y: number;
};
