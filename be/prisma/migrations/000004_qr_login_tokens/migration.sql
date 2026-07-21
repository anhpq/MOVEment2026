CREATE TABLE "qr_login_tokens" (
  "id" SERIAL PRIMARY KEY,
  "team_id" INTEGER NOT NULL REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "usage_count" INTEGER NOT NULL DEFAULT 0,
  "max_usage_count" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by_user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "last_used_at" TIMESTAMP(3)
);

CREATE UNIQUE INDEX "qr_login_tokens_token_hash_key" ON "qr_login_tokens"("token_hash");
CREATE INDEX "qr_login_tokens_team_id_idx" ON "qr_login_tokens"("team_id");
CREATE INDEX "qr_login_tokens_expires_at_idx" ON "qr_login_tokens"("expires_at");
