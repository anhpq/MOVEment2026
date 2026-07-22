ALTER TABLE "qr_tokens"
ADD COLUMN "revoked_at" TIMESTAMP(3),
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "schema_version" TEXT NOT NULL DEFAULT 'LEGACY';

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "station_id", "purpose"
      ORDER BY "created_at" DESC, "id" DESC
    ) AS row_number
  FROM "qr_tokens"
  WHERE "is_active" = true
)
UPDATE "qr_tokens"
SET "is_active" = false,
    "revoked_at" = COALESCE("revoked_at", CURRENT_TIMESTAMP),
    "updated_at" = CURRENT_TIMESTAMP
WHERE "id" IN (
  SELECT "id"
  FROM ranked
  WHERE row_number > 1
);

CREATE UNIQUE INDEX "qr_tokens_one_active_per_station_purpose"
ON "qr_tokens"("station_id", "purpose")
WHERE "is_active" = true;

ALTER TABLE "qr_tokens"
ADD CONSTRAINT "qr_tokens_active_not_revoked_check"
CHECK ("is_active" = false OR "revoked_at" IS NULL);
