#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-tunnel}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

show_usage() {
  cat <<'USAGE'
usage: ./script/build_and_run.sh [mode]

Modes:
  start, run, tunnel       Start Expo with tunnel transport for shared QR access
  lan                      Start Expo on the local network
  local                    Start Expo bound to localhost only
  android                  Start Expo tunnel and open Android
  ios                      Start Expo tunnel and open iOS
  web                      Start Expo web
  dev-client               Start Expo in development-client mode
  export-web               Export the web build locally
  doctor                   Run Expo diagnostics
  help                     Show this help
USAGE
}

resolve_expo_cmd() {
  if [[ -n "${EXPO_CLI:-}" ]]; then
    # shellcheck disable=SC2206
    EXPO_CMD=(${EXPO_CLI})
    return
  fi

  if [[ -f pnpm-lock.yaml ]] && command -v pnpm >/dev/null 2>&1; then
    EXPO_CMD=(pnpm exec expo)
  elif [[ -f yarn.lock ]] && command -v yarn >/dev/null 2>&1; then
    EXPO_CMD=(yarn expo)
  elif { [[ -f bun.lock ]] || [[ -f bun.lockb ]]; } && command -v bun >/dev/null 2>&1; then
    EXPO_CMD=(bunx expo)
  else
    EXPO_CMD=(npx expo)
  fi
}

resolve_expo_cmd

case "$MODE" in
  start|run|tunnel|--tunnel)
    exec "${EXPO_CMD[@]}" start --tunnel --clear
    ;;
  lan|--lan)
    exec "${EXPO_CMD[@]}" start --lan
    ;;
  local|--local|localhost|--localhost)
    exec "${EXPO_CMD[@]}" start --localhost
    ;;
  android|--android)
    exec "${EXPO_CMD[@]}" start --android --tunnel --clear
    ;;
  ios|--ios)
    exec "${EXPO_CMD[@]}" start --ios --tunnel --clear
    ;;
  web|--web)
    exec npm run web
    ;;
  dev-client|--dev-client)
    exec "${EXPO_CMD[@]}" start --dev-client --tunnel --clear
    ;;
  export-web|--export-web)
    exec "${EXPO_CMD[@]}" export --platform web
    ;;
  doctor|--doctor)
    exec npx expo-doctor
    ;;
  help|--help|-h)
    show_usage
    ;;
  *)
    show_usage >&2
    exit 2
    ;;
esac
