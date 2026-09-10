#!/usr/bin/env bash
set -euo pipefail

# Cursor Cloud starts from a clean Linux image. Keep setup repository-owned,
# lockfile-driven, and fixture-only: no provider credentials or live AI calls
# are needed to work on this project.

readonly MIN_NODE_MAJOR=20
readonly MIN_NODE_MINOR_FOR_NODE_20=19
readonly MIN_NODE_MINOR_FOR_NODE_22=12

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "DecisionStressTest Cursor Cloud setup requires $1." >&2
    exit 1
  fi
}

require_command node
require_command npm

node_version="$(node --version)"
node_major="$(node -p 'process.versions.node.split(".")[0]')"
node_minor="$(node -p 'process.versions.node.split(".")[1]')"

# Match the supported runtime floor of the committed dependency graph:
# Node 20.19+, Node 22.12+, or a newer major.
if (( node_major < MIN_NODE_MAJOR )) ||
  (( node_major == 20 && node_minor < MIN_NODE_MINOR_FOR_NODE_20 )) ||
  (( node_major == 22 && node_minor < MIN_NODE_MINOR_FOR_NODE_22 )) ||
  (( node_major == 21 || node_major == 23 )); then
  echo "Unsupported Node.js runtime ${node_version}; use Node 20.19+, 22.12+, or a newer even major." >&2
  exit 1
fi

test -f package-lock.json
npm ci --no-audit --no-fund

# Setup checks use the deterministic mock provider and isolated SQLite paths
# outside the checkout so the local-safety doctor does not confuse test data
# with live repository state. Keep the path stable and private rather than in
# the system temp directory, which the doctor intentionally rejects.
# The browser dependency is installed explicitly so a later Cursor task can
# run the browser suite without falling back to a machine-local installation.
npx playwright install chromium
runtime_root="$(node -p 'require("node:os").homedir()')/.local/share/decision-stress-test-cursor-cloud"
mkdir -p "$runtime_root"
export AI_ENABLED=false
export AI_PROVIDER=mock
export APP_ENV=test
export DATA_DIR="${runtime_root}/app-data"
export DATABASE_PATH="${runtime_root}/test.sqlite"

# Keep installation deterministic and green in Cursor Cloud. The repository's
# release:check also includes an existing 8/9 browser E2E failure, while these
# gates exercise the static, unit, fixture-evaluation, and production-build
# paths that are currently passing. Chromium remains installed above for the
# follow-up browser-fix task.
npm run typecheck
npm run lint
npm test
npm run eval:fixtures
npm run build
