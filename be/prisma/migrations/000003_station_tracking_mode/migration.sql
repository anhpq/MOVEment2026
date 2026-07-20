CREATE TYPE "StationTrackingMode" AS ENUM ('SCORE', 'TIME', 'BOTH');

ALTER TABLE "stations"
  ADD COLUMN "tracking_mode" "StationTrackingMode" NOT NULL DEFAULT 'BOTH';
