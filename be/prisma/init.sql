CREATE TYPE "UserRole" AS ENUM ('ADMIN');
CREATE TYPE "TeamStatus" AS ENUM ('ACTIVE', 'LOCKED', 'FINISHED');
CREATE TYPE "ProgressStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'CHECKED_IN', 'PLAYING', 'COMPLETED');
CREATE TYPE "QrPurpose" AS ENUM ('CHECK_IN', 'CHECK_OUT');
CREATE TYPE "ActorType" AS ENUM ('TEAM', 'USER', 'SYSTEM');

CREATE TABLE "stations" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "map_x" DOUBLE PRECISION NOT NULL,
  "map_y" DOUBLE PRECISION NOT NULL,
  "latitude" NUMERIC(10, 7),
  "longitude" NUMERIC(10, 7),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "teams" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "username" TEXT NOT NULL UNIQUE,
  "captain_name" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "total_points" INTEGER NOT NULL DEFAULT 0,
  "max_possible_points" INTEGER NOT NULL DEFAULT 0,
  "total_play_seconds" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP(3),
  "status" "TeamStatus" NOT NULL DEFAULT 'ACTIVE',
  "color" TEXT,
  "active_session_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "team_sessions" (
  "id" TEXT PRIMARY KEY,
  "team_id" INTEGER NOT NULL REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "token_hash" TEXT NOT NULL,
  "device_label" TEXT,
  "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMP(3),
  "revoke_reason" TEXT
);

CREATE TABLE "games" (
  "id" SERIAL PRIMARY KEY,
  "station_id" TEXT NOT NULL REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "difficulty" INTEGER NOT NULL DEFAULT 1,
  "max_points" INTEGER NOT NULL DEFAULT 30,
  "clue_text" TEXT,
  "media_url" TEXT,
  "answer_hash" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "team_station_progress" (
  "id" SERIAL PRIMARY KEY,
  "team_id" INTEGER NOT NULL REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "station_id" TEXT NOT NULL REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "game_id" INTEGER NOT NULL REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" "ProgressStatus" NOT NULL DEFAULT 'LOCKED',
  "attempt_no" INTEGER NOT NULL DEFAULT 0,
  "checked_in_at" TIMESTAMP(3),
  "checked_out_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "reopened_at" TIMESTAMP(3),
  "next_check_in_allowed_at" TIMESTAMP(3),
  "score_achieved" INTEGER NOT NULL DEFAULT 0,
  "score_entered_by_user_id" INTEGER,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "team_station_progress_team_id_station_id_key" UNIQUE ("team_id", "station_id")
);

CREATE TABLE "score_events" (
  "id" SERIAL PRIMARY KEY,
  "team_id" INTEGER NOT NULL REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "progress_id" INTEGER REFERENCES "team_station_progress"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "station_id" TEXT REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "score_before" INTEGER NOT NULL,
  "score_after" INTEGER NOT NULL,
  "delta" INTEGER NOT NULL,
  "reason" TEXT,
  "created_by_user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "qr_tokens" (
  "id" SERIAL PRIMARY KEY,
  "station_id" TEXT NOT NULL REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "token_hash" TEXT NOT NULL,
  "token_fingerprint" TEXT UNIQUE,
  "purpose" "QrPurpose" NOT NULL,
  "schema_version" TEXT NOT NULL DEFAULT 'LEGACY',
  "expires_at" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "qr_tokens_active_not_revoked_check" CHECK ("is_active" = false OR "revoked_at" IS NULL)
);

CREATE TABLE "event_config" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "event_end_time" TEXT NOT NULL DEFAULT '11:30',
  "final_starts_at" TEXT NOT NULL DEFAULT '11:45',
  "notify_before_minutes" INTEGER NOT NULL DEFAULT 15,
  "cancel_cooldown_minutes" INTEGER NOT NULL DEFAULT 5,
  "scoring_code_hash" TEXT NOT NULL DEFAULT '$2b$10$Tn8oLEDmV3DOJjeKcFBz3.9UH/GFsatnF1wlmNfhWJP7dfTaSKwAO',
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  "updated_by_user_id" INTEGER,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "final_challenges" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "clue_text" TEXT NOT NULL,
  "answer_hash" TEXT NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "max_winners" INTEGER NOT NULL DEFAULT 10,
  "points_by_rank" JSONB NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "final_submissions" (
  "id" SERIAL PRIMARY KEY,
  "final_challenge_id" INTEGER NOT NULL REFERENCES "final_challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "team_id" INTEGER NOT NULL REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "answer_submitted" TEXT NOT NULL,
  "is_correct" BOOLEAN NOT NULL DEFAULT false,
  "winner_rank" INTEGER,
  "points_awarded" INTEGER NOT NULL DEFAULT 0,
  "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "score_event_id" INTEGER
);

CREATE TABLE "activity_logs" (
  "id" SERIAL PRIMARY KEY,
  "actor_type" "ActorType" NOT NULL,
  "actor_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "team_sessions_team_id_revoked_at_idx" ON "team_sessions"("team_id", "revoked_at");
CREATE INDEX "games_station_id_idx" ON "games"("station_id");
CREATE INDEX "team_station_progress_status_idx" ON "team_station_progress"("status");
CREATE INDEX "team_station_progress_checked_out_at_completed_at_idx" ON "team_station_progress"("checked_out_at", "completed_at");
CREATE INDEX "score_events_team_id_created_at_idx" ON "score_events"("team_id", "created_at");
CREATE INDEX "qr_tokens_station_id_purpose_idx" ON "qr_tokens"("station_id", "purpose");
CREATE UNIQUE INDEX "qr_tokens_one_active_per_station_purpose" ON "qr_tokens"("station_id", "purpose") WHERE "is_active" = true;
CREATE INDEX "final_submissions_final_challenge_id_is_correct_submitted_at_idx" ON "final_submissions"("final_challenge_id", "is_correct", "submitted_at");
CREATE UNIQUE INDEX "final_submissions_final_challenge_id_winner_rank_key" ON "final_submissions"("final_challenge_id", "winner_rank");
CREATE INDEX "activity_logs_action_created_at_idx" ON "activity_logs"("action", "created_at");
