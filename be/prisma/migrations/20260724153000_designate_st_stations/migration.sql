UPDATE "games"
SET "type" = CASE
  WHEN "station_id" IN ('ST003', 'ST004', 'ST010', 'ST047') THEN 'ST'
  ELSE 'STANDARD'
END
WHERE "type" <> 'CIPHER';
