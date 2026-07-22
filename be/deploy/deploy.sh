#!/usr/bin/env bash
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/movement/app}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-develop}"
GIT_REPO_URL="${GIT_REPO_URL:-git@github.com:anhpq/MOVEment2026.git}"
APP_NAME="${APP_NAME:-movement-api}"
BASE_COMMIT="${BASE_COMMIT:-}"
TARGET_COMMIT="${TARGET_COMMIT:-}"
FORCE_DATABASE_STEPS="${FORCE_DATABASE_STEPS:-false}"
DEPLOY_MARKER_PATH="${DEPLOY_MARKER_PATH:-/opt/movement/deploy-markers/movement-api.commit}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:8080/api/docs}"

if [ "${FORCE_DATABASE_STEPS}" != "true" ] && [ "${FORCE_DATABASE_STEPS}" != "false" ]; then
  echo "FORCE_DATABASE_STEPS must be true or false."
  exit 1
fi

if [ ! -d "${DEPLOY_PATH}/.git" ]; then
  git clone --branch "${DEPLOY_BRANCH}" "${GIT_REPO_URL}" "${DEPLOY_PATH}"
fi

cd "${DEPLOY_PATH}"
git fetch origin
if [ -f .git/shallow ]; then
  git fetch --unshallow origin
fi

if [ -n "${TARGET_COMMIT}" ]; then
  RESOLVED_TARGET_COMMIT="$(git rev-parse --verify "${TARGET_COMMIT}^{commit}")"
else
  RESOLVED_TARGET_COMMIT="$(git rev-parse --verify "origin/${DEPLOY_BRANCH}^{commit}")"
fi

if ! git merge-base --is-ancestor "${RESOLVED_TARGET_COMMIT}" "origin/${DEPLOY_BRANCH}"; then
  echo "Target commit must be reachable from origin/${DEPLOY_BRANCH}."
  exit 1
fi

if [ -n "${BASE_COMMIT}" ]; then
  RESOLVED_BASE_COMMIT="$(git rev-parse --verify "${BASE_COMMIT}^{commit}")"
elif [ -f "${DEPLOY_MARKER_PATH}" ]; then
  DEPLOYED_MARKER_COMMIT="$(head -n 1 "${DEPLOY_MARKER_PATH}" | tr -d '[:space:]')"
  if [ -z "${DEPLOYED_MARKER_COMMIT}" ]; then
    echo "Deployment marker ${DEPLOY_MARKER_PATH} is empty. Provide base_commit explicitly."
    exit 1
  fi
  RESOLVED_BASE_COMMIT="$(git rev-parse --verify "${DEPLOYED_MARKER_COMMIT}^{commit}")"
else
  echo "Missing base commit and deployment marker ${DEPLOY_MARKER_PATH}."
  echo "Provide workflow input base_commit for the first conditional backend deploy."
  exit 1
fi

CHANGED_FILES="$(git diff --name-only "${RESOLVED_BASE_COMMIT}" "${RESOLVED_TARGET_COMMIT}" --)"
DATABASE_PLAN="$(printf '%s\n' "${CHANGED_FILES}" | node be/deploy/plan-database-steps.js "${FORCE_DATABASE_STEPS}")"
eval "${DATABASE_PLAN}"

echo "BASE_COMMIT=${RESOLVED_BASE_COMMIT}"
echo "TARGET_COMMIT=${RESOLVED_TARGET_COMMIT}"
echo "DATABASE_CHANGES=${DATABASE_CHANGES}"
echo "MIGRATION_CHANGES=${MIGRATION_CHANGES}"
echo "SEED_CHANGES=${SEED_CHANGES}"
echo "FORCE_DATABASE_STEPS=${FORCE_DATABASE_STEPS}"
echo "Database steps: migrate=${RUN_MIGRATE}, seed=${RUN_SEED}, db_verify=${RUN_DB_VERIFY}"

git checkout --detach "${RESOLVED_TARGET_COMMIT}"

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

if [ "${RUN_MIGRATE}" = "true" ]; then
  npm run prisma:deploy
else
  echo "Skipping prisma migrate deploy: no schema or migration change detected."
fi

if [ "${RUN_SEED}" = "true" ]; then
  npm run prisma:seed
else
  echo "Skipping Production seed: no seed change detected."
fi

if [ "${RUN_DB_VERIFY}" = "true" ]; then
  npm run db:verify
else
  echo "Skipping database verification: no database-related change detected."
fi

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

if [ "${RUN_DB_VERIFY}" = "true" ]; then
  npm run db:verify
fi

curl -fsS "${HEALTHCHECK_URL}" >/dev/null

mkdir -p "$(dirname "${DEPLOY_MARKER_PATH}")"
printf '%s\n' "${RESOLVED_TARGET_COMMIT}" > "${DEPLOY_MARKER_PATH}.tmp"
mv "${DEPLOY_MARKER_PATH}.tmp" "${DEPLOY_MARKER_PATH}"
echo "Updated deployment marker ${DEPLOY_MARKER_PATH}."
