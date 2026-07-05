#!/usr/bin/env bash
set -euo pipefail

DIST_PATH="${DIST_PATH:-dist}"
OBS_BUCKET="${OBS_BUCKET:-movement}"
HUAWEI_REGION="${HUAWEI_REGION:-ap-southeast-3}"

if [ ! -d "${DIST_PATH}" ]; then
  echo "Build output not found at ${DIST_PATH}. Run 'npm run build:prod' in fe/ first."
  exit 1
fi

if [ -z "${HUAWEI_ACCESS_KEY:-}" ] || [ -z "${HUAWEI_SECRET_KEY:-}" ]; then
  echo "Set HUAWEI_ACCESS_KEY and HUAWEI_SECRET_KEY before running this script."
  exit 1
fi

if ! command -v obsutil >/dev/null 2>&1; then
  echo "Install obsutil: https://support.huaweicloud.com/intl/en-us/utiltg-obs/obs_11_0003.html"
  exit 1
fi

obsutil config -i="${HUAWEI_ACCESS_KEY}" \
  -k="${HUAWEI_SECRET_KEY}" \
  -e="https://obs.${HUAWEI_REGION}.myhuaweicloud.com"

obsutil sync "${DIST_PATH}/" "obs://${OBS_BUCKET}/" -f -acl=public-read -exclude=.git*

obsutil cp "${DIST_PATH}/index.html" "obs://${OBS_BUCKET}/index.html" \
  -f -acl=public-read -sc=cache-control:no-cache,no-store,must-revalidate

echo "Deployed to obs://${OBS_BUCKET}/ (${HUAWEI_REGION})"
