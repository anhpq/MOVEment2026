ALTER TABLE "teams"
  ADD COLUMN "login_qr_hash" TEXT,
  ADD COLUMN "login_qr_fingerprint" TEXT;

ALTER TABLE "qr_tokens"
  ADD COLUMN "token_fingerprint" TEXT;

CREATE UNIQUE INDEX "teams_login_qr_fingerprint_key" ON "teams"("login_qr_fingerprint");
CREATE UNIQUE INDEX "qr_tokens_token_fingerprint_key" ON "qr_tokens"("token_fingerprint");
