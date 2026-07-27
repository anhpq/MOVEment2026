ALTER TABLE "stations" ADD COLUMN "name_en" TEXT;
ALTER TABLE "stations" ADD COLUMN "description_en" TEXT;

UPDATE "stations"
SET "name_en" = CASE "id"
  WHEN 'ST001' THEN 'Memory Waterway'
  WHEN 'ST002' THEN 'Imperial Reflection'
  WHEN 'ST003' THEN 'Mindful Relics'
  WHEN 'ST004' THEN 'Tilting Heaven and Earth'
  WHEN 'ST005' THEN 'Time-Skipping Vessel'
  WHEN 'ST006' THEN 'Can-to-Can Connection'
  WHEN 'ST007' THEN 'Wheel of Justice'
  WHEN 'ST008' THEN 'Twin Hearts, Guided Gem'
  WHEN 'ST009' THEN 'Plantain Fan Storm'
  WHEN 'ST010' THEN 'Gathering of Beasts'
  WHEN 'ST011' THEN 'Maze of One Heart'
  WHEN 'ST012' THEN 'Pillar of Balance'
  WHEN 'ST013' THEN 'Chain of Divine Palms'
  WHEN 'ST014' THEN 'Golden-Eyed Focus'
  WHEN 'ST015' THEN 'Three Stars Astray'
  WHEN 'ST016' THEN 'Great Wall of Many Miles'
  WHEN 'ST017' THEN 'One Beat, One Heart'
  ELSE "name"
END,
"description_en" = CASE "id"
  WHEN 'ST001' THEN 'A gentle stream leads the way toward something nearly forgotten.'
  WHEN 'ST002' THEN 'Inside the palace, an old silhouette waits for its return.'
  WHEN 'ST003' THEN 'Countless objects pass in a blink, testing what the mind can keep.'
  WHEN 'ST004' THEN 'When heaven and earth tilt, steady hearts must hold their ground.'
  WHEN 'ST005' THEN 'Beyond the familiar orbit, a strange journey waits to begin.'
  WHEN 'ST006' THEN 'Across scattered colors, teams search for a shared signal.'
  WHEN 'ST007' THEN 'When the wheel speaks, the verdict belongs to the team that stays sharp.'
  WHEN 'ST008' THEN 'A wavering gem needs two steady hearts to guide it home.'
  WHEN 'ST009' THEN 'When the plantain fan wakes, every move must survive the storm.'
  WHEN 'ST010' THEN 'Among many sounds, teams must find one another.'
  WHEN 'ST011' THEN 'Inside the tangled maze, only shared direction opens the way out.'
  WHEN 'ST012' THEN 'As balance shifts, the challenge is to remain standing firm.'
  WHEN 'ST013' THEN 'One missed beat can break the whole chain.'
  WHEN 'ST014' THEN 'The difference hides where hurried eyes often pass over it.'
  WHEN 'ST015' THEN 'The truth may not remain as whole as it first appeared.'
  WHEN 'ST016' THEN 'From small pieces, teams build something worthy of a wonder.'
  WHEN 'ST017' THEN 'When every step follows one rhythm, the path ahead appears.'
  ELSE "description"
END
WHERE "name_en" IS NULL;

UPDATE "stations"
SET "name_en" = "name"
WHERE "name_en" IS NULL OR BTRIM("name_en") = '';

ALTER TABLE "stations" ALTER COLUMN "name_en" SET NOT NULL;
