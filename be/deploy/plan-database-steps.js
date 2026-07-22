#!/usr/bin/env node

const fs = require('fs');

const forceDatabaseSteps = process.argv[2] === 'true';
const input = fs.readFileSync(0, 'utf8');
const changedFiles = input
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const isMigrationChange = (file) =>
  file === 'be/prisma/schema.prisma' ||
  file.startsWith('be/prisma/migrations/') ||
  file === 'be/prisma/init.sql' ||
  file === 'be/prisma.config.ts' ||
  file === 'be/deploy/deploy.sh' ||
  file === 'be/deploy/plan-database-steps.js' ||
  file === 'be/package.json';

const isSeedChange = (file) =>
  file === 'be/prisma/seed.ts' ||
  file.startsWith('be/prisma/seed/') ||
  file === 'be/scripts/verify-seed.ts' ||
  file.startsWith('be/scripts/db-verify') ||
  file === 'be/deploy/deploy.sh' ||
  file === 'be/deploy/plan-database-steps.js' ||
  file === 'be/package.json';

const detectedMigrationChanges = changedFiles.some(isMigrationChange);
const detectedSeedChanges = changedFiles.some(isSeedChange);
const migrationChanges = forceDatabaseSteps || detectedMigrationChanges;
const seedChanges = forceDatabaseSteps || detectedSeedChanges;
const databaseChanges = migrationChanges || seedChanges;

const bool = (value) => (value ? 'true' : 'false');

console.log(`DATABASE_CHANGES=${bool(databaseChanges)}`);
console.log(`MIGRATION_CHANGES=${bool(migrationChanges)}`);
console.log(`SEED_CHANGES=${bool(seedChanges)}`);
console.log(`RUN_MIGRATE=${bool(migrationChanges)}`);
console.log(`RUN_SEED=${bool(seedChanges)}`);
console.log(`RUN_DB_VERIFY=${bool(databaseChanges)}`);
