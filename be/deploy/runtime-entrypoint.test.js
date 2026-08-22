const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(backendRoot, '..');
const expectedEntrypoint = 'dist/src/main.js';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(backendRoot, 'package.json'), 'utf8'),
);
const deployScript = fs.readFileSync(path.join(__dirname, 'deploy.sh'), 'utf8');
const systemdService = fs.readFileSync(
  path.join(__dirname, 'movement-api.service'),
  'utf8',
);
const backendWorkflow = fs.readFileSync(
  path.join(repositoryRoot, '.github', 'workflows', 'be-deploy.yml'),
  'utf8',
);

assert.equal(packageJson.scripts['start:prod'], `node ${expectedEntrypoint}`);
assert.match(
  deployScript,
  /BACKEND_ENTRYPOINT="\$\{BACKEND_ENTRYPOINT:-dist\/src\/main\.js\}"/,
);
assert.match(deployScript, /pm2 delete "\$\{APP_NAME\}"/);
assert.match(
  deployScript,
  /pm2 start "\$\{BACKEND_ENTRYPOINT\}" --name "\$\{APP_NAME\}"/,
);
assert.match(systemdService, /ExecStart=\/usr\/bin\/node dist\/src\/main\.js/);
assert.match(backendWorkflow, /^\s{2}workflow_dispatch:/m);
assert.doesNotMatch(backendWorkflow, /^\s{2}push:/m);
assert.match(backendWorkflow, /BACKUP_CONFIRMED/);
assert.match(backendWorkflow, /SKIP_BACKUP_USER_APPROVED/);
assert.match(backendWorkflow, /deploy-backend/);

console.log('Backend deployment entrypoint and manual workflow invariants passed.');
