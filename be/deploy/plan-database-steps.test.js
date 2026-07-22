#!/usr/bin/env node

const assert = require('assert');
const { spawnSync } = require('child_process');
const path = require('path');

const script = path.join(__dirname, 'plan-database-steps.js');

function plan(files, force = false) {
  const result = spawnSync(process.execPath, [script, String(force)], {
    input: files.join('\n'),
    encoding: 'utf8',
  });

  assert.strictEqual(result.status, 0, result.stderr);

  return Object.fromEntries(
    result.stdout
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.split('='))
  );
}

function expect(files, expected, force = false) {
  assert.deepStrictEqual(plan(files, force), {
    DATABASE_CHANGES: expected.database,
    MIGRATION_CHANGES: expected.migration,
    SEED_CHANGES: expected.seed,
    RUN_MIGRATE: expected.migrate,
    RUN_SEED: expected.seedRun,
    RUN_DB_VERIFY: expected.verify,
  });
}

expect(['be/src/app.module.ts'], {
  database: 'false',
  migration: 'false',
  seed: 'false',
  migrate: 'false',
  seedRun: 'false',
  verify: 'false',
});

expect(['be/prisma/schema.prisma'], {
  database: 'true',
  migration: 'true',
  seed: 'false',
  migrate: 'true',
  seedRun: 'false',
  verify: 'true',
});

expect(['be/prisma/migrations/000009_example/migration.sql'], {
  database: 'true',
  migration: 'true',
  seed: 'false',
  migrate: 'true',
  seedRun: 'false',
  verify: 'true',
});

expect(['be/prisma/seed.ts'], {
  database: 'true',
  migration: 'false',
  seed: 'true',
  migrate: 'false',
  seedRun: 'true',
  verify: 'true',
});

expect(['be/prisma/migrations/000009_example/migration.sql', 'be/prisma/seed/setup.ts'], {
  database: 'true',
  migration: 'true',
  seed: 'true',
  migrate: 'true',
  seedRun: 'true',
  verify: 'true',
});

expect(['be/prisma/schema.prisma', 'be/src/app.module.ts'], {
  database: 'true',
  migration: 'true',
  seed: 'false',
  migrate: 'true',
  seedRun: 'false',
  verify: 'true',
});

expect(['be/src/app.module.ts'], {
  database: 'true',
  migration: 'true',
  seed: 'true',
  migrate: 'true',
  seedRun: 'true',
  verify: 'true',
}, true);

assert.strictEqual(plan(['be/src/app.module.ts']).DATABASE_CHANGES, 'false');

console.log('database deployment plan tests passed');
