#!/usr/bin/env bash
# Usage: launch.sh [--local]
#   default  Build against Firebase emulators (Auth 9099, Firestore 8080) and serve it.
#   --local  Build with no Firebase config (the app's "Local Mode") and serve it. No emulators.
# Env: PORT (preview port, default 4173).
set -euo pipefail
set -m

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$SKILL_DIR/../../.." && pwd)"
RUN="$REPO/.verify/run"
PORT="${PORT:-4173}"
MODE=emulator
[[ "${1:-}" == "--local" ]] && MODE=local

if [[ -f "$RUN/state.env" ]]; then
  echo "refusing: $RUN/state.env exists. Run cleanup.sh first, or doctor.sh to inspect it." >&2
  exit 1
fi

busy=()
for p in "$PORT" $([[ $MODE == emulator ]] && echo 9099 8080); do
  lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1 && busy+=("$p")
done
if (( ${#busy[@]} )); then
  echo "refusing: port(s) ${busy[*]} already in use by a process this run did not start." >&2
  exit 1
fi

[[ -d "$SKILL_DIR/node_modules/playwright" ]] || (cd "$SKILL_DIR" && npm install --silent && npx playwright install chromium)
(cd "$REPO" && npm ls --depth=0 >/dev/null 2>&1) || (cd "$REPO" && npm install --silent)

mkdir -p "$RUN"
: > "$RUN/emulators.log"; : > "$RUN/preview.log"

trap 'echo "build failed. Last lines of $RUN/build.log:" >&2; tail -20 "$RUN/build.log" >&2; rm -rf "$RUN"' ERR
# Shell env beats .env.local in Vite, so every key is set here to keep real
# Firebase credentials out of verification builds.
BLANK=(VITE_FIREBASE_API_KEY= VITE_FIREBASE_AUTH_DOMAIN= VITE_FIREBASE_PROJECT_ID=
  VITE_USE_FIREBASE_EMULATORS=)
if [[ $MODE == emulator ]]; then
  (cd "$REPO" && env -i PATH="$PATH" HOME="$HOME" "${BLANK[@]}" \
    VITE_FIREBASE_API_KEY=fake-key VITE_FIREBASE_AUTH_DOMAIN=localhost \
    VITE_FIREBASE_PROJECT_ID=demo-fbt \
    VITE_USE_FIREBASE_EMULATORS=true \
    npx vite build --outDir "$RUN/dist" --emptyOutDir --mode verify >"$RUN/build.log" 2>&1)
else
  (cd "$REPO" && env -i PATH="$PATH" HOME="$HOME" "${BLANK[@]}" \
    npx vite build --outDir "$RUN/dist" --emptyOutDir --mode verify >"$RUN/build.log" 2>&1)
fi

trap - ERR
EMU_PID=""
if [[ $MODE == emulator ]]; then
  cp "$REPO/firestore.rules" "$RUN/firestore.rules"
  cat > "$RUN/firebase.json" <<'JSON'
{
  "emulators": {
    "auth": { "host": "127.0.0.1", "port": 9099 },
    "firestore": { "host": "127.0.0.1", "port": 8080 },
    "ui": { "enabled": false },
    "singleProjectMode": true
  },
  "firestore": { "rules": "firestore.rules" }
}
JSON
  (cd "$RUN" && exec "$SKILL_DIR/node_modules/.bin/firebase" emulators:start --only auth,firestore --project demo-fbt) >"$RUN/emulators.log" 2>&1 &
  EMU_PID=$!
fi
(cd "$REPO" && exec "$REPO/node_modules/.bin/vite" preview --outDir "$RUN/dist" --port "$PORT" --strictPort --host 127.0.0.1) >"$RUN/preview.log" 2>&1 &
PREVIEW_PID=$!

cat > "$RUN/state.env" <<EOF
MODE=$MODE
PORT=$PORT
URL=http://127.0.0.1:$PORT/
EMU_PID=$EMU_PID
PREVIEW_PID=$PREVIEW_PID
BUILD_REV=$(cd "$REPO" && git rev-parse --short HEAD)$(cd "$REPO" && git diff --quiet HEAD -- src index.html vite.config.ts || echo -dirty)
EOF

for _ in $(seq 1 60); do
  ok=1
  curl -sf "http://127.0.0.1:$PORT/manifest.webmanifest" >/dev/null || ok=0
  if [[ $MODE == emulator ]]; then
    curl -sf http://127.0.0.1:9099/ | grep -q '"ready": true' || ok=0
    [[ "$(curl -sf http://127.0.0.1:8080/ || true)" == Ok* ]] || ok=0
  fi
  if (( ok )); then
    echo "ready: $MODE build at http://127.0.0.1:$PORT/ (state in $RUN/state.env)"
    exit 0
  fi
  sleep 2
done
echo "not ready after 120s. See $RUN/emulators.log and $RUN/preview.log, then run cleanup.sh." >&2
exit 1
