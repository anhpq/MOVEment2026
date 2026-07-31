DO $$
BEGIN
  IF EXISTS (
    SELECT "team_id"
    FROM "team_station_progress"
    WHERE "status" IN ('CHECKED_IN', 'PLAYING')
    GROUP BY "team_id"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot enforce one active station per Team: duplicate CHECKED_IN/PLAYING rows exist. Resolve the duplicate rows explicitly before retrying this migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX "team_station_progress_one_active_station_per_team_key"
ON "team_station_progress" ("team_id")
WHERE "status" IN ('CHECKED_IN', 'PLAYING');
