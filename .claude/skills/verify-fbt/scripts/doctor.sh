#!/usr/bin/env bash
# Read-only. Exit 0 only if the instance this skill launched is worth driving.
set -uo pipefail
REPO="$(cd "$(dirname "$0")/../../../.." && pwd)"
RUN="$REPO/.verify/run"
fail=0
check() { if eval "$2" >/dev/null 2>&1; then echo "ok    $1"; else echo "FAIL  $1"; fail=1; fi; }

if [[ ! -f "$RUN/state.env" ]]; then
  echo "FAIL  no instance launched by this skill ($RUN/state.env missing). Run launch.sh."
  exit 1
fi
# shellcheck disable=SC1091
source "$RUN/state.env"
echo "mode=$MODE url=$URL build=$BUILD_REV"

check "preview process alive (pid $PREVIEW_PID)" "kill -0 $PREVIEW_PID"
check "port $PORT owned by our preview process" "lsof -nP -a -iTCP:$PORT -sTCP:LISTEN -g $PREVIEW_PID"
check "manifest served" "curl -sf ${URL}manifest.webmanifest | grep -q '\"display\":\"standalone\"'"
check "service worker served" "curl -sf ${URL}sw.js | grep -q precache"
if [[ $MODE == emulator ]]; then
  check "emulator process alive (pid $EMU_PID)" "kill -0 $EMU_PID"
  check "auth emulator ready on 9099" "curl -sf http://127.0.0.1:9099/ | grep -q '\"ready\": true'"
  check "firestore emulator ready on 8080" "curl -sf http://127.0.0.1:8080/ | grep -q Ok"
  check "build points at emulators" "grep -rq '127.0.0.1:9099' $RUN/dist/assets"
fi
exit $fail
