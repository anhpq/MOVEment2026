ALTER TABLE games ALTER COLUMN max_points DROP NOT NULL;
ALTER TABLE team_station_progress ADD COLUMN station_rank INTEGER;

ALTER TABLE games ADD CONSTRAINT games_max_points_null_only_st007
  CHECK (max_points IS NOT NULL OR station_id = 'ST007');
ALTER TABLE team_station_progress ADD CONSTRAINT team_station_progress_station_rank_range
  CHECK (station_rank IS NULL OR station_rank BETWEEN 1 AND 25);
CREATE UNIQUE INDEX team_station_progress_station_rank_unique
  ON team_station_progress (station_id, station_rank)
  WHERE station_rank IS NOT NULL;

UPDATE games
SET max_points = CASE station_id
  WHEN 'ST001' THEN 20 WHEN 'ST002' THEN 20 WHEN 'ST003' THEN 36
  WHEN 'ST004' THEN 15 WHEN 'ST005' THEN 105 WHEN 'ST006' THEN 20
  WHEN 'ST007' THEN NULL WHEN 'ST008' THEN 36 WHEN 'ST009' THEN 25
  WHEN 'ST010' THEN 15 WHEN 'ST011' THEN 20 WHEN 'ST012' THEN 40
  WHEN 'ST013' THEN 36 WHEN 'ST014' THEN 10 WHEN 'ST015' THEN 30
  WHEN 'ST016' THEN 30 WHEN 'ST017' THEN 20 ELSE max_points END
WHERE station_id BETWEEN 'ST001' AND 'ST017';
UPDATE stations SET tracking_mode = 'TIME' WHERE id = 'ST009';
UPDATE teams SET max_possible_points = 1785;
