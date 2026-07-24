UPDATE "games"
SET "type" = CASE
  WHEN UPPER(TRIM("type")) = 'CIPHER' THEN 'CIPHER'
  WHEN "media_url" ~* '^https://(www\.)?(m\.)?(youtube\.com|youtu\.be)/' THEN 'ST'
  ELSE 'STANDARD'
END;

ALTER TABLE "games"
ADD CONSTRAINT "games_type_check"
CHECK ("type" IN ('CIPHER', 'ST', 'STANDARD'));
