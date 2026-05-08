#!/usr/bin/env bash
# scripts/test-atom-setup.sh
#
# Regression test runner for the atom-setup wizard. Exercises everything
# that does not need a TTY: --version, --help, --bare, --dry-run, --resume,
# smart defaults, post-run file structure, fresh git history, idempotency.
#
# Run from anywhere — the script discovers the atom checkout from its own
# location. Exit code = number of failures (0 = all pass, suitable for CI).
#
# Usage:
#   scripts/test-atom-setup.sh              # run, leave logs in $SCRATCH
#   scripts/test-atom-setup.sh --keep       # keep test dirs after run
#
# Logs land in $SCRATCH/logs (default: /tmp/atom-wizard-tests/logs).

set -u

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ATOM=$(cd "$SCRIPT_DIR/.." && pwd)
SETUP="node $ATOM/bin/atom-setup/bin/atom-setup.js"
SCRATCH=${ATOM_TEST_SCRATCH:-/tmp/atom-wizard-tests}
LOG_DIR=$SCRATCH/logs
KEEP=0

for arg in "$@"; do
  case "$arg" in
    --keep) KEEP=1 ;;
    -h|--help)
      sed -n '2,15p' "$0" | sed 's|^# ||;s|^#||'
      exit 0
      ;;
  esac
done

PASS=0
FAIL=0
RESULTS=()

assert() {
  local desc="$1" ; shift
  if "$@" > /dev/null 2>&1; then
    PASS=$((PASS+1))
    RESULTS+=("  PASS  $desc")
  else
    FAIL=$((FAIL+1))
    RESULTS+=("  FAIL  $desc")
  fi
}

assert_not() {
  local desc="$1" ; shift
  if ! "$@" > /dev/null 2>&1; then
    PASS=$((PASS+1))
    RESULTS+=("  PASS  $desc")
  else
    FAIL=$((FAIL+1))
    RESULTS+=("  FAIL  $desc")
  fi
}

assert_grep() {
  local desc="$1" pattern="$2" file="$3"
  if grep -q "$pattern" "$file" 2>/dev/null; then
    PASS=$((PASS+1))
    RESULTS+=("  PASS  $desc")
  else
    FAIL=$((FAIL+1))
    RESULTS+=("  FAIL  $desc")
  fi
}

assert_not_grep() {
  local desc="$1" pattern="$2" file="$3"
  if ! grep -q "$pattern" "$file" 2>/dev/null; then
    PASS=$((PASS+1))
    RESULTS+=("  PASS  $desc")
  else
    FAIL=$((FAIL+1))
    RESULTS+=("  FAIL  $desc")
  fi
}

section() {
  echo ""
  echo "=== $1 ==="
}

prepare() {
  local target="$1"
  rm -rf "$target"
  cp -R "$ATOM" "$target"
  rm -rf "$target"/bin/*/node_modules
  rm -f "$target"/.atom-setup-state.json
}

mkdir -p "$LOG_DIR"

# Pre-flight: atom-setup deps must be installed
if [ ! -d "$ATOM/bin/atom-setup/node_modules" ]; then
  echo "atom-setup dependencies missing. Installing..."
  (cd "$ATOM/bin/atom-setup" && npm install --silent) || {
    echo "Failed to install atom-setup deps; aborting."
    exit 99
  }
fi

# =============================================================
section "Test 1: pre-flight detection runs and --version works"
# =============================================================

$SETUP --version > "$LOG_DIR/t1-version.log" 2>&1
assert "1.1 atom-setup --version exits 0" test $? -eq 0
assert_grep "1.2 prints 0.1.3" "0.1.3" "$LOG_DIR/t1-version.log"

$SETUP --help > "$LOG_DIR/t1-help.log" 2>&1
assert_grep "1.3 --help mentions --bare" "\\-\\-bare" "$LOG_DIR/t1-help.log"
assert_grep "1.4 --help mentions --minimal" "\\-\\-minimal" "$LOG_DIR/t1-help.log"
assert_grep "1.5 --help mentions --resume" "\\-\\-resume" "$LOG_DIR/t1-help.log"
assert_grep "1.6 --help mentions --dry-run" "\\-\\-dry-run" "$LOG_DIR/t1-help.log"

# =============================================================
section "Test 2: --bare --yes against a fresh atom clone"
# =============================================================

T2=$SCRATCH/test-2-bare
prepare "$T2"
$SETUP --bare --target "$T2" --yes > "$LOG_DIR/t2-bare.log" 2>&1

assert_grep "2.1 pre-flight section appears in output" "Pre-flight" "$LOG_DIR/t2-bare.log"
assert_grep "2.2 git detected" "git " "$LOG_DIR/t2-bare.log"
assert_grep "2.3 node detected" "node " "$LOG_DIR/t2-bare.log"
assert_grep "2.4 bare-mode banner shown" "Bare mode" "$LOG_DIR/t2-bare.log"
assert_grep "2.5 outro shows 'is ready'" "is ready" "$LOG_DIR/t2-bare.log"

assert "2.6 AGENTS.md at root" test -f "$T2/AGENTS.md"
assert "2.7 CLAUDE.md (forwarder) at root" test -f "$T2/CLAUDE.md"
assert "2.8 GEMINI.md (forwarder) at root" test -f "$T2/GEMINI.md"
assert "2.9 .cursorrules at root" test -f "$T2/.cursorrules"
assert "2.10 .github/copilot-instructions.md at root" test -f "$T2/.github/copilot-instructions.md"
assert "2.11 LICENSE written" test -f "$T2/LICENSE"
assert_grep "2.12 LICENSE is MIT" "MIT License" "$T2/LICENSE"
assert_grep "2.13 LICENSE has 2026 year" "2026" "$T2/LICENSE"
assert "2.14 .gitignore at root" test -f "$T2/.gitignore"
assert "2.15 package.json at root" test -f "$T2/package.json"
assert "2.16 .claude/skills/ promoted" test -d "$T2/.claude/skills"
assert "2.17 .claude/skills/nucleus exists" test -d "$T2/.claude/skills/nucleus"

assert_grep "2.18 AGENTS.md is scaffold's (Tooling section)" "## Tooling" "$T2/AGENTS.md"
assert_not_grep "2.19 AGENTS.md is NOT atom's own" "Mode 3 — Build atom features" "$T2/AGENTS.md"

assert_not "2.20 bin/ removed" test -d "$T2/bin"
assert_not "2.21 scripts/ removed" test -d "$T2/scripts"
assert_not "2.22 extras/ removed" test -d "$T2/extras"
assert_not "2.23 scaffold/ removed (was promoted)" test -d "$T2/scaffold"
assert_not "2.24 docs/planning/ removed" test -d "$T2/docs/planning"
assert_not "2.25 CONTRIBUTING.md (atom's) removed" test -f "$T2/CONTRIBUTING.md"
assert_not "2.26 INSTALL.md (atom's) removed" test -f "$T2/INSTALL.md"
assert_not "2.27 ./atom-setup (atom's bootstrap script) removed" test -f "$T2/atom-setup"
assert_not "2.28 CHANGELOG.md (atom's) removed" test -f "$T2/CHANGELOG.md"
assert_not "2.29 CODE_OF_CONDUCT.md (atom's) removed" test -f "$T2/CODE_OF_CONDUCT.md"
assert_not "2.30 SECURITY.md (atom's) removed" test -f "$T2/SECURITY.md"

COMMITS=$(cd "$T2" && git log --oneline 2>/dev/null | wc -l | tr -d ' ')
if [ "$COMMITS" = "1" ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  2.31 exactly one commit on main")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  2.31 expected 1 commit; got $COMMITS")
fi

assert_grep "2.32 commit message shows project name" "test-2-bare" "$LOG_DIR/t2-bare.log"

BRANCH=$(cd "$T2" && git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ "$BRANCH" = "main" ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  2.33 default branch is 'main'")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  2.33 default branch is '$BRANCH', expected 'main'")
fi

# =============================================================
section "Test 3: --bare --dry-run --yes makes no changes"
# =============================================================

T3=$SCRATCH/test-3-dryrun
prepare "$T3"
SUM_BEFORE=$(find "$T3" -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | wc -l | tr -d ' ')
$SETUP --bare --target "$T3" --dry-run --yes > "$LOG_DIR/t3-dryrun.log" 2>&1
SUM_AFTER=$(find "$T3" -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | wc -l | tr -d ' ')

assert_grep "3.1 dry-run banner shown" "dry-run" "$LOG_DIR/t3-dryrun.log"
assert_grep "3.2 dry-run output prefixed" "(dry-run)" "$LOG_DIR/t3-dryrun.log"
if [ "$SUM_BEFORE" = "$SUM_AFTER" ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  3.3 file count unchanged ($SUM_BEFORE)")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  3.3 file count changed: $SUM_BEFORE → $SUM_AFTER")
fi
assert "3.4 atom source dirs intact (bin/)" test -d "$T3/bin"
assert "3.5 atom source dirs intact (scaffold/)" test -d "$T3/scaffold"
assert "3.6 atom source dirs intact (extras/)" test -d "$T3/extras"

# =============================================================
section "Test 4: --resume picks up from a partial state file"
# =============================================================

T4=$SCRATCH/test-4-resume
prepare "$T4"
cat > "$T4/.atom-setup-state.json" <<'EOF'
{
  "version": 1,
  "startedAt": "2026-05-05T00:00:00Z",
  "completedSections": [
    "project", "stack", "nucleus", "memory", "workflow",
    "docker", "license", "cicd", "constitution", "git"
  ],
  "answers": {
    "projectName": "resumed-project",
    "description": "Picked up from state",
    "visibility": "public",
    "multiAgent": false,
    "stack": "nextjs",
    "deployTarget": "railway",
    "nucleusEnabled": true,
    "nucleusCaptureMode": "claude-managed",
    "mem0": true,
    "multica": false,
    "chromeDevtools": false,
    "specKit": false,
    "gsd": false,
    "modelRace": true,
    "dockerTier": "compose",
    "license": "MIT",
    "author": "Test User",
    "email": "test@test.local",
    "year": 2026,
    "autoDeploy": true,
    "constitution": false,
    "gitInit": true,
    "gitRemote": null,
    "gitPush": false
  }
}
EOF

$SETUP --resume --target "$T4" --yes > "$LOG_DIR/t4-resume.log" 2>&1

assert_grep "4.1 resume banner shown" "Resuming from" "$LOG_DIR/t4-resume.log"
assert_grep "4.2 outro shows project name from state" "resumed-project" "$LOG_DIR/t4-resume.log"
assert "4.3 Dockerfile copied (from nextjs preset)" test -f "$T4/Dockerfile"
assert "4.4 docker-compose.yml copied (compose tier)" test -f "$T4/docker-compose.yml"
assert "4.5 docker-compose.full.yml copied (compose tier)" test -f "$T4/docker-compose.full.yml"
assert "4.6 .dockerignore copied" test -f "$T4/.dockerignore"
assert_grep "4.7 Dockerfile is Next.js-tuned" "next.config\|standalone\|NEXT_TELEMETRY\|NEXT_PUBLIC" "$T4/Dockerfile"
assert_grep "4.8 LICENSE shows author from state" "Test User" "$T4/LICENSE"

# =============================================================
section "Test 5: smart defaults pick up cwd, git config"
# =============================================================

T5=$SCRATCH/test-5-defaults
prepare "$T5"
$SETUP --bare --target "$T5" --yes > "$LOG_DIR/t5-defaults.log" 2>&1

assert_grep "5.1 project name defaulted to cwd basename" "test-5-defaults" "$LOG_DIR/t5-defaults.log"
GIT_NAME=$(git config user.name 2>/dev/null || echo "")
if [ -n "$GIT_NAME" ]; then
  assert_grep "5.2 LICENSE author from git config ($GIT_NAME)" "$GIT_NAME" "$T5/LICENSE"
else
  RESULTS+=("  SKIP  5.2 LICENSE author from git config (git config user.name unset)")
fi

# =============================================================
section "Test 6: state file is gitignored"
# =============================================================

T6=$SCRATCH/test-6-gitignore
prepare "$T6"
assert_grep "6.1 .atom-setup-state.json is in .gitignore" "atom-setup-state" "$T6/.gitignore"

# =============================================================
section "Test 7: writer is idempotent — re-running succeeds"
# =============================================================

T7=$SCRATCH/test-7-idempotent
prepare "$T7"
$SETUP --bare --target "$T7" --yes > "$LOG_DIR/t7a.log" 2>&1
$SETUP --bare --target "$T7" --yes > "$LOG_DIR/t7b.log" 2>&1
RC=$?
if [ "$RC" = "0" ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  7.1 re-run does not error")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  7.1 re-run errored (exit $RC)")
fi

# =============================================================
# Stack preset smoke tests (one resume run per preset).
# Each writes a state file pinning the preset, runs the wizard,
# then asserts the preset's signature files landed at root.
# =============================================================

run_preset_test() {
  local name="$1"      # e.g. "8: python-fastapi"
  local id="$2"        # e.g. "python-fastapi"
  local stack="$3"     # e.g. "python-fastapi"
  local docker="$4"    # e.g. "dockerfile" or "none"
  shift 4
  # Remaining args are "label::test-expression" pairs handled below.

  section "Test $name preset (--resume)"
  local TDIR="$SCRATCH/test-$id"
  prepare "$TDIR"
  cat > "$TDIR/.atom-setup-state.json" <<EOF
{
  "version": 1,
  "startedAt": "2026-05-08T00:00:00Z",
  "completedSections": [
    "project", "stack", "nucleus", "memory", "workflow",
    "docker", "license", "cicd", "constitution", "git"
  ],
  "answers": {
    "projectName": "preset-$id",
    "description": "Preset smoke test",
    "visibility": "public",
    "multiAgent": false,
    "stack": "$stack",
    "deployTarget": "railway",
    "nucleusEnabled": false,
    "mem0": false, "multica": false, "chromeDevtools": false,
    "specKit": false, "gsd": false, "modelRace": false,
    "dockerTier": "$docker",
    "license": "MIT",
    "author": "Preset Tester",
    "email": "preset@test.local",
    "year": 2026,
    "autoDeploy": false,
    "constitution": false,
    "gitInit": true,
    "gitRemote": null,
    "gitPush": false
  }
}
EOF
  $SETUP --resume --target "$TDIR" --yes > "$LOG_DIR/t-$id.log" 2>&1
}

run_preset_test "8: python-fastapi" "python-fastapi" "python-fastapi" "dockerfile"
T="$SCRATCH/test-python-fastapi"
assert "8.1 pyproject.toml at root" test -f "$T/pyproject.toml"
assert "8.2 app/main.py at root" test -f "$T/app/main.py"
assert "8.3 Dockerfile is python-tuned (preset, not generic)" grep -q "python:" "$T/Dockerfile"
assert_grep "8.4 healthz route in app/main.py" "/healthz" "$T/app/main.py"
assert "8.5 .env.example at root" test -f "$T/.env.example"
assert "8.6 DEPLOY.md at root" test -f "$T/DEPLOY.md"
assert "8.7 seed learning copied (pydantic-v2)" test -f "$T/learnings/pydantic-v2-over-v1.md"
assert "8.8 README has project name (placeholder substituted)" \
  grep -q "preset-python-fastapi" "$T/README.md"
assert_grep "8.9 README has preset Quick Start (uvicorn)" "uvicorn" "$T/README.md"
assert "8.10 README.snippet.md was consumed (deleted)" test ! -f "$T/README.snippet.md"

run_preset_test "9: rust-axum" "rust-axum" "rust-axum" "dockerfile"
T="$SCRATCH/test-rust-axum"
assert "9.1 Cargo.toml at root" test -f "$T/Cargo.toml"
assert "9.2 src/main.rs at root" test -f "$T/src/main.rs"
assert "9.3 Dockerfile uses cargo-chef" grep -q "cargo-chef\|chef" "$T/Dockerfile"
assert_grep "9.4 healthz route in main.rs" "/healthz" "$T/src/main.rs"
assert "9.5 seed learning copied (cargo-chef)" test -f "$T/learnings/cargo-chef-for-docker.md"

run_preset_test "10: swift-vapor" "swift-vapor" "swift-vapor" "dockerfile"
T="$SCRATCH/test-swift-vapor"
assert "10.1 Package.swift at root" test -f "$T/Package.swift"
assert "10.2 Sources/App/configure.swift" test -f "$T/Sources/App/configure.swift"
assert "10.3 Dockerfile is swift-tuned" grep -q "swift:" "$T/Dockerfile"
assert_grep "10.4 healthz route in configure.swift" "healthz" "$T/Sources/App/configure.swift"
assert "10.5 seed learning copied (static-link)" test -f "$T/learnings/static-link-on-linux.md"

run_preset_test "11: go-cobra" "go-cobra" "go-cobra" "none"
T="$SCRATCH/test-go-cobra"
assert "11.1 go.mod at root" test -f "$T/go.mod"
assert "11.2 main.go at root" test -f "$T/main.go"
assert "11.3 cmd/root.go at root" test -f "$T/cmd/root.go"
assert "11.4 .goreleaser.yaml at root" test -f "$T/.goreleaser.yaml"
assert "11.5 no Dockerfile (go-cobra is none-tier)" test ! -f "$T/Dockerfile"
assert "11.6 seed learning copied (goreleaser)" test -f "$T/learnings/goreleaser-for-distribution.md"

run_preset_test "12: ts-library" "ts-library" "ts-library" "none"
T="$SCRATCH/test-ts-library"
assert "12.1 package.json at root" test -f "$T/package.json"
assert "12.2 tsup.config.ts at root" test -f "$T/tsup.config.ts"
assert "12.3 src/index.ts at root" test -f "$T/src/index.ts"
assert "12.4 src/index.test.ts at root" test -f "$T/src/index.test.ts"
assert "12.5 no Dockerfile (ts-library is none-tier)" test ! -f "$T/Dockerfile"
assert_grep "12.6 package.json has dual ESM/CJS exports" "\"import\"" "$T/package.json"
assert "12.7 seed learning copied (dual ESM/CJS)" test -f "$T/learnings/dual-esm-cjs-with-tsup.md"

# =============================================================
section "Test 13: docker-tier copy skips files preset already provides"
# =============================================================

# python-fastapi ships its own Dockerfile + .dockerignore. With docker
# tier 'dockerfile', the writer must NOT overwrite them with the
# generic extras/docker/ versions. Compare bytes against preset source.

T13="$SCRATCH/test-python-fastapi"
PRESET_DOCKERFILE="$ATOM/extras/web/python-fastapi/Dockerfile"
if [ -f "$T13/Dockerfile" ] && [ -f "$PRESET_DOCKERFILE" ]; then
  if cmp -s "$T13/Dockerfile" "$PRESET_DOCKERFILE"; then
    PASS=$((PASS+1))
    RESULTS+=("  PASS  13.1 python-fastapi Dockerfile is the preset's, not the generic")
  else
    FAIL=$((FAIL+1))
    RESULTS+=("  FAIL  13.1 python-fastapi Dockerfile was overwritten by docker-tier copy")
  fi
fi
# Workflow file IS unique to the docker tier; it should land.
assert "13.2 docker.yml workflow added (preset didn't provide it)" \
  test -f "$T13/.github/workflows/docker.yml"

# =============================================================
# Report
# =============================================================

echo ""
echo "=========================================="
echo "  Results: $PASS passed / $FAIL failed"
echo "=========================================="
echo ""
for line in "${RESULTS[@]}"; do
  echo "$line"
done
echo ""

if [ "$KEEP" = "0" ]; then
  rm -rf "$SCRATCH"/test-*
  echo "Cleaned test dirs (use --keep to retain)."
else
  echo "Test dirs kept in $SCRATCH (--keep set)."
fi

echo "Logs in: $LOG_DIR"
echo ""
exit $FAIL
