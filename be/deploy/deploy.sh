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
export NODE_ENV=production
npm ci
npm run build

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart "${APP_NAME}" 2>/dev/null || pm2 start dist/main.js --name "${APP_NAME}" --cwd "$(pwd)"
  pm2 save
elif systemctl list-unit-files | grep -q "^${APP_NAME}.service"; then
  sudo systemctl restart "${APP_NAME}"
else
  echo "No process manager found. Install pm2 or systemd unit ${APP_NAME}.service"
  exit 1
fi
