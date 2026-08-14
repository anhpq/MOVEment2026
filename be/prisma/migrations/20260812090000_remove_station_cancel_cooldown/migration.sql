ALTER TABLE "event_config"
ALTER COLUMN "cancel_cooldown_minutes" SET DEFAULT 0;

UPDATE "event_config"
SET "cancel_cooldown_minutes" = 0;

UPDATE "team_station_progress"
SET "next_check_in_allowed_at" = NULL
WHERE "next_check_in_allowed_at" IS NOT NULL;
