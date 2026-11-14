#!/usr/bin/env bash
# Stops only the processes launch.sh started and removes scratch state.
# Evidence in .verify/evidence/ is never touched.
set -uo pipefail
REPO="$(cd "$(dirname "$0")/../../../.." && pwd)"
RUN="$REPO/.verify/run"
[[ -f "$RUN/state.env" ]] || { echo "nothing to clean (no $RUN/state.env)"; exit 0; }
# shellcheck disable=SC1091
source "$RUN/state.env"

# launch.sh starts each server as its own process group, so this also stops the
# emulator's Java child and vite's node child.
for pid in $PREVIEW_PID $EMU_PID; do
  [[ -n "$pid" ]] || continue
  kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null
done
for _ in $(seq 1 15); do
  alive=0
  for pid in $PREVIEW_PID $EMU_PID; do [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null && alive=1; done
  (( alive )) || break
  sleep 1
done
for pid in $PREVIEW_PID $EMU_PID; do
  [[ -n "$pid" ]] && kill -KILL -- "-$pid" 2>/dev/null
done

rm -rf "$RUN"
echo "cleaned. evidence kept in $REPO/.verify/evidence/"
