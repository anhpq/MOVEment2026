-- Team QR credentials are reusable until explicitly revoked or rotated.
-- Preserve their existing opaque values while clearing legacy time expirations.
UPDATE "qr_login_tokens"
SET "expires_at" = NULL
WHERE "is_active" = true
  AND "revoked_at" IS NULL
  AND "consumed_at" IS NULL
  AND "expires_at" IS NOT NULL;

-- Apply the approved operational schedule to the singleton Production config.
UPDATE "event_config"
SET
  "event_end_time" = '11:30',
  "final_starts_at" = '11:45',
  "notify_before_minutes" = 20,
  "timezone" = 'Asia/Ho_Chi_Minh'
WHERE "id" = 1;
