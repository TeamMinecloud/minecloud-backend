#!/usr/bin/env bash
set -euo pipefail

TYPE="${1:-paper}"
VERSION="${2:-1.21.1}"
OUT="${3:-/data/downloads/paper.jar}"

mkdir -p "$(dirname "$OUT")"
TMP="$(mktemp)"

BUILD=$(curl -fsSL "https://api.papermc.io/v2/projects/paper/versions/${VERSION}" | grep -o '"builds":[^]]*' | grep -o '[0-9]\+' | tail -n1)

if [ -z "${BUILD:-}" ]; then
  echo "Could not resolve Paper build for ${VERSION}" >&2
  exit 1
fi

URL="https://api.papermc.io/v2/projects/paper/versions/${VERSION}/builds/${BUILD}/downloads/paper-${VERSION}-${BUILD}.jar"
echo "[get_jar] Downloading ${URL}"
curl -fSL "$URL" -o "$TMP"
mv "$TMP" "$OUT"
echo "[get_jar] Saved to $OUT"
