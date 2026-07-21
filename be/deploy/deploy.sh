#!/usr/bin/env bash
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/movement/app}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-develop}"
GIT_REPO_URL="${GIT_REPO_URL:-git@github.com:anhpq/MOVEment2026.git}"
APP_NAME="${APP_NAME:-movement-api}"

if [ ! -d "${DEPLOY_PATH}/.git" ]; then
  git clone --branch "${DEPLOY_BRANCH}" "${GIT_REPO_URL}" "${DEPLOY_PATH}"
fi

cd "${DEPLOY_PATH}"
git fetch origin
git checkout "${DEPLOY_BRANCH}"
git reset --hard "origin/${DEPLOY_BRANCH}"

cd be

if [ ! -f .env ]; then
  echo "Missing ${DEPLOY_PATH}/be/.env"
  echo "Create it from be/deploy/.env.example. Deploy never overwrites this file."
  exit 1
fi

# Host be/.env is the source of truth for NODE_ENV, SCORING_CODE, secrets, etc.
# Do not force NODE_ENV=production here — that would override the host file via pm2 --update-env.
set -a
# shellcheck disable=SC1091
source .env
set +a

# nest CLI lives in devDependencies; include them for build even when NODE_ENV=production
if [ -f package-lock.json ]; then
  npm ci --include=dev
else
  npm install
fi

npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run db:verify
npm run build

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart "${APP_NAME}" --update-env 2>/dev/null || pm2 start dist/main.js --name "${APP_NAME}" --cwd "$(pwd)"
  pm2 save
elif systemctl list-unit-files | grep -q "^${APP_NAME}.service"; then
  sudo systemctl restart "${APP_NAME}"
else
  echo "No process manager found. Install pm2 or systemd unit ${APP_NAME}.service"
  exit 1
fi

npm run db:verify
