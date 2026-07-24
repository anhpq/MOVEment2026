UPDATE "games"
SET "type" = 'STANDARD'
WHERE "type" = 'CIPHER';

ALTER TABLE "games"
DROP CONSTRAINT IF EXISTS "games_type_check";

ALTER TABLE "games"
ADD CONSTRAINT "games_type_check"
CHECK ("type" IN ('ST', 'STANDARD'));

ALTER TABLE "games"
DROP COLUMN "answer_hash";
