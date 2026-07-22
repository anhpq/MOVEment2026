ALTER TABLE "qr_login_tokens"
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT false;

-- Preserve only the newest still-valid, never-consumed token per Team as reusable.
WITH ranked_tokens AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "team_id"
      ORDER BY "created_at" DESC, "id" DESC
    ) AS "position"
  FROM "qr_login_tokens"
  WHERE
    "consumed_at" IS NULL
    AND "revoked_at" IS NULL
    AND "expires_at" > CURRENT_TIMESTAMP
)
UPDATE "qr_login_tokens" AS token
SET "is_active" = true
FROM ranked_tokens
WHERE token."id" = ranked_tokens."id" AND ranked_tokens."position" = 1;

ALTER TABLE "qr_login_tokens"
ALTER COLUMN "is_active" SET DEFAULT true;

ALTER TABLE "qr_login_tokens"
ADD CONSTRAINT "qr_login_tokens_usage_count_nonnegative"
CHECK ("usage_count" >= 0),
ADD CONSTRAINT "qr_login_tokens_active_not_revoked"
CHECK (NOT "is_active" OR "revoked_at" IS NULL);

CREATE UNIQUE INDEX "qr_login_tokens_one_active_per_team"
ON "qr_login_tokens"("team_id")
WHERE "is_active" = true;
