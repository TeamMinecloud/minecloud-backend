#!/usr/bin/env bash
set -euo pipefail

echo "[start] DATA_DIR=${DATA_DIR:-/data}"
echo "[start] SERVERS_DIR=${SERVERS_DIR:-/data/servers}"
echo "[start] DOWNLOAD_DIR=${DOWNLOAD_DIR:-/data/downloads}"
echo "[start] JOB_QUEUE=${JOB_QUEUE:-mc_jobs}"

mkdir -p "${DATA_DIR}" "${SERVERS_DIR}" "${DOWNLOAD_DIR}"

exec npm start
