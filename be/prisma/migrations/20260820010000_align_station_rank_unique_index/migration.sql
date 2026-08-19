DROP INDEX IF EXISTS team_station_progress_station_rank_unique;

CREATE UNIQUE INDEX team_station_progress_station_id_station_rank_key
  ON team_station_progress (station_id, station_rank);
