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
section "Test 13a: constitution generation when opted in"
# =============================================================

T13A=$SCRATCH/test-13a-constitution
prepare "$T13A"
cat > "$T13A/.atom-setup-state.json" <<'EOF'
{
  "version": 1,
  "startedAt": "2026-05-09T00:00:00Z",
  "completedSections": [
    "project", "stack", "nucleus", "memory", "workflow",
    "docker", "license", "cicd", "constitution", "git"
  ],
  "answers": {
    "projectName": "constitutional",
    "description": "A test project that opts into the constitution",
    "visibility": "public",
    "multiAgent": true,
    "stack": "rust-axum",
    "deployTarget": "fly",
    "nucleusEnabled": false,
    "mem0": false, "multica": false, "chromeDevtools": false,
    "specKit": false, "gsd": false, "modelRace": false,
    "dockerTier": "none",
    "license": "MIT",
    "author": "Constitution Tester",
    "email": "ct@test.local",
    "year": 2026,
    "autoDeploy": false,
    "constitution": true,
    "gitInit": true,
    "gitRemote": null,
    "gitPush": false
  }
}
EOF
$SETUP --resume --target "$T13A" --yes > "$LOG_DIR/t13a-constitution.log" 2>&1

assert "13a.1 CONSTITUTION.md at root" test -f "$T13A/CONSTITUTION.md"
assert_grep "13a.2 project name in title" "constitutional" "$T13A/CONSTITUTION.md"
assert_grep "13a.3 description in subtitle" "test project that opts" "$T13A/CONSTITUTION.md"
assert_grep "13a.4 stack-specific runtime (Rust)" "Rust 1.85" "$T13A/CONSTITUTION.md"
assert_grep "13a.5 stack-specific framework (Axum)" "Axum 0.7" "$T13A/CONSTITUTION.md"
assert_grep "13a.6 deploy target labeled (Fly.io)" "Fly.io" "$T13A/CONSTITUTION.md"
assert_grep "13a.7 multi-agent matrix has more than one row" "Backend\|Frontend" "$T13A/CONSTITUTION.md"
assert_grep "13a.8 stack-specific principle hint (Rust)" "unwrap\|tracing" "$T13A/CONSTITUTION.md"
assert_grep "13a.9 versioning policy section present" "v0.1.0\|version bump\|Major\|Minor" "$T13A/CONSTITUTION.md"
assert_grep "13a.10 cheatsheet points at CONSTITUTION.md (not the old TODO)" \
  "Refine CONSTITUTION.md\|atom scaffolded" "$LOG_DIR/t13a-constitution.log"

# =============================================================
section "Test 13b: no constitution when user said no"
# =============================================================

T13B=$SCRATCH/test-13b-no-constitution
prepare "$T13B"
cat > "$T13B/.atom-setup-state.json" <<'EOF'
{
  "version": 1,
  "startedAt": "2026-05-09T00:00:00Z",
  "completedSections": [
    "project", "stack", "nucleus", "memory", "workflow",
    "docker", "license", "cicd", "constitution", "git"
  ],
  "answers": {
    "projectName": "no-constitution",
    "description": "A test project that opts out",
    "visibility": "private",
    "multiAgent": false,
    "stack": "ts-library",
    "deployTarget": "none",
    "nucleusEnabled": false,
    "mem0": false, "multica": false, "chromeDevtools": false,
    "specKit": false, "gsd": false, "modelRace": false,
    "dockerTier": "none",
    "license": "MIT",
    "author": "Test User",
    "email": "test@test.local",
    "year": 2026,
    "autoDeploy": false,
    "constitution": false,
    "gitInit": true,
    "gitRemote": null,
    "gitPush": false
  }
}
EOF
$SETUP --resume --target "$T13B" --yes > "$LOG_DIR/t13b-no-constitution.log" 2>&1

assert "13b.1 no CONSTITUTION.md when constitution=false" test ! -f "$T13B/CONSTITUTION.md"

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
section "Test 14: \`atom-setup new <name>\` scaffolds from ATOM_SOURCE_DIR"
# =============================================================
#
# Item #9: separates "atom source" from "the project being bootstrapped."
# `new` mode reads scaffold/extras from $ATOM_SOURCE_DIR and writes into a
# fresh target dir at $PWD/<name>/. The source must be byte-identical
# before and after.

T14_SRC=$SCRATCH/test-14-source
T14_PARENT=$SCRATCH/test-14-parent
T14_FAKE_HOME=$SCRATCH/test-14-fake-home
rm -rf "$T14_SRC" "$T14_PARENT" "$T14_FAKE_HOME"
cp -R "$ATOM" "$T14_SRC"
mkdir -p "$T14_PARENT" "$T14_FAKE_HOME"

# Hash the source BEFORE running the wizard. Excludes node_modules and
# .git so we don't trip on caches the test apparatus might disturb.
HASH_BEFORE=$(find "$T14_SRC" -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -exec md5 -q {} \; | sort | md5 -q)

(
  cd "$T14_PARENT" && \
  ATOM_SOURCE_DIR="$T14_SRC" \
  ATOM_HOME="$T14_FAKE_HOME/.atom" \
  node "$T14_SRC/bin/atom-setup/bin/atom-setup.js" new my-new-project --bare --yes
) > "$LOG_DIR/t14-new.log" 2>&1
RC=$?
if [ "$RC" = "0" ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  14.1 atom-setup new exits 0")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  14.1 atom-setup new exited $RC")
fi

HASH_AFTER=$(find "$T14_SRC" -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -exec md5 -q {} \; | sort | md5 -q)
if [ "$HASH_BEFORE" = "$HASH_AFTER" ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  14.2 ATOM_SOURCE_DIR is byte-identical before and after")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  14.2 ATOM_SOURCE_DIR was modified during \`new\`")
fi

T14_PROJ="$T14_PARENT/my-new-project"
assert "14.3 target directory created at \$PARENT/my-new-project" test -d "$T14_PROJ"
assert "14.4 AGENTS.md scaffolded into target" test -f "$T14_PROJ/AGENTS.md"
assert "14.5 CLAUDE.md scaffolded into target" test -f "$T14_PROJ/CLAUDE.md"
assert "14.6 .gitignore scaffolded into target" test -f "$T14_PROJ/.gitignore"
assert "14.7 LICENSE written" test -f "$T14_PROJ/LICENSE"
assert "14.8 .github/copilot-instructions.md scaffolded" test -f "$T14_PROJ/.github/copilot-instructions.md"

# atom-maintenance source files should NOT have been copied into target.
assert_not "14.9 bin/ NOT in target (never copied)" test -d "$T14_PROJ/bin"
assert_not "14.10 scaffold/ NOT in target (never copied)" test -d "$T14_PROJ/scaffold"
assert_not "14.11 extras/ NOT in target (never copied)" test -d "$T14_PROJ/extras"
assert_not "14.12 scripts/ NOT in target (never copied)" test -d "$T14_PROJ/scripts"
assert_not "14.13 docs/planning/ NOT in target" test -d "$T14_PROJ/docs/planning"

assert_grep "14.14 intro uses 'new · <name>' label" "new . my-new-project" "$LOG_DIR/t14-new.log"
assert_grep "14.15 outro shows the chosen project name" "my-new-project is ready" "$LOG_DIR/t14-new.log"

# Fresh git history at target.
COMMITS=$(cd "$T14_PROJ" && git log --oneline 2>/dev/null | wc -l | tr -d ' ')
if [ "$COMMITS" = "1" ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  14.16 exactly one commit on main in target")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  14.16 expected 1 commit in target; got $COMMITS")
fi
assert_grep "14.17 initial commit names the project" "my-new-project" "$LOG_DIR/t14-new.log"

# =============================================================
section "Test 15: \`new\` refuses when target dir already exists and is non-empty"
# =============================================================

T15_PARENT=$SCRATCH/test-15-parent
T15_FAKE_HOME=$SCRATCH/test-15-fake-home
rm -rf "$T15_PARENT" "$T15_FAKE_HOME"
mkdir -p "$T15_PARENT/already-here" "$T15_FAKE_HOME"
echo "hello" > "$T15_PARENT/already-here/keep-me.txt"

(
  cd "$T15_PARENT" && \
  ATOM_SOURCE_DIR="$T14_SRC" \
  ATOM_HOME="$T15_FAKE_HOME/.atom" \
  node "$T14_SRC/bin/atom-setup/bin/atom-setup.js" new already-here --bare --yes
) > "$LOG_DIR/t15-collision.log" 2>&1
RC=$?
if [ "$RC" != "0" ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  15.1 \`new\` exits non-zero when target exists and is non-empty")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  15.1 \`new\` should have refused but exited 0")
fi
assert_grep "15.2 refusal message names the conflicting directory" "already-here" "$LOG_DIR/t15-collision.log"
assert "15.3 pre-existing file at target preserved" test -f "$T15_PARENT/already-here/keep-me.txt"

# =============================================================
section "Test 16: \`new\` refuses when ATOM_SOURCE_DIR is missing or empty"
# =============================================================

T16_PARENT=$SCRATCH/test-16-parent
T16_FAKE_HOME=$SCRATCH/test-16-fake-home
T16_BAD_SOURCE=$SCRATCH/test-16-no-source
rm -rf "$T16_PARENT" "$T16_FAKE_HOME" "$T16_BAD_SOURCE"
mkdir -p "$T16_PARENT" "$T16_FAKE_HOME" "$T16_BAD_SOURCE"
# Bad source: dir exists but has no scaffold/ or extras/.

(
  cd "$T16_PARENT" && \
  ATOM_SOURCE_DIR="$T16_BAD_SOURCE" \
  ATOM_HOME="$T16_FAKE_HOME/.atom" \
  node "$ATOM/bin/atom-setup/bin/atom-setup.js" new doomed --bare --yes
) > "$LOG_DIR/t16-no-source.log" 2>&1
RC=$?
if [ "$RC" != "0" ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  16.1 \`new\` exits non-zero when ATOM_SOURCE_DIR is not an atom checkout")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  16.1 \`new\` should have refused but exited 0")
fi
assert_grep "16.2 message points the user at install hint" "atom source not found" "$LOG_DIR/t16-no-source.log"
assert_not "16.3 no target directory was created on the failed run" test -d "$T16_PARENT/doomed"

# =============================================================
section "Test 18: \`atom migrate-install\` (one-shot 0.1.x → ~/.atom/atom/)"
# =============================================================
#
# Item #8: migrate-install clones fresh to $ATOM_HOME/atom/ and re-links
# globals. We exercise dry-run + refusal paths here (deterministic and
# fast). The full clone+install round-trip is gated by ATOM_TEST_SLOW=1
# below; we run it when explicitly requested.

T18_HOME=$SCRATCH/test-18-fake-home
T18_TARGET="$T18_HOME/.atom/atom"
rm -rf "$T18_HOME"
mkdir -p "$T18_HOME/.atom"

# 18a: dry-run prints the plan and writes nothing.
ATOM_HOME="$T18_HOME/.atom" \
  ATOM_GIT_URL="$ATOM" \
  node "$ATOM/bin/atom/bin/atom.js" migrate-install --dry-run > "$LOG_DIR/t18a-dryrun.log" 2>&1
RC=$?
if [ "$RC" = "0" ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  18.1 migrate-install --dry-run exits 0")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  18.1 migrate-install --dry-run exited $RC")
fi
assert_grep "18.2 dry-run plan mentions git clone target" "$T18_TARGET" "$LOG_DIR/t18a-dryrun.log"
assert_grep "18.3 dry-run plan mentions npm install" "npm install" "$LOG_DIR/t18a-dryrun.log"
assert_not "18.4 dry-run did not create $T18_TARGET" test -e "$T18_TARGET"

# 18b: refuse when target already exists.
mkdir -p "$T18_TARGET"
echo "existing" > "$T18_TARGET/marker.txt"
ATOM_HOME="$T18_HOME/.atom" \
  ATOM_GIT_URL="$ATOM" \
  node "$ATOM/bin/atom/bin/atom.js" migrate-install --yes > "$LOG_DIR/t18b-refuse.log" 2>&1
RC=$?
if [ "$RC" != "0" ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  18.5 migrate-install refuses when target exists")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  18.5 migrate-install should have refused but exited 0")
fi
assert_grep "18.6 refusal mentions existing dir" "already exists" "$LOG_DIR/t18b-refuse.log"
assert "18.7 pre-existing marker preserved" test -f "$T18_TARGET/marker.txt"
rm -rf "$T18_TARGET"

# 18c: \`atom --help\` advertises migrate-install.
node "$ATOM/bin/atom/bin/atom.js" --help > "$LOG_DIR/t18c-help.log" 2>&1
assert_grep "18.8 atom --help advertises migrate-install" "atom migrate-install" "$LOG_DIR/t18c-help.log"

# 18d: full clone+install. Skipped by default since it runs 5 npm
# installs against the global prefix; set ATOM_TEST_SLOW=1 to opt in.
if [ "${ATOM_TEST_SLOW:-0}" = "1" ]; then
  T18D_HOME=$SCRATCH/test-18d-fake-home
  T18D_PREFIX=$SCRATCH/test-18d-npm-prefix
  rm -rf "$T18D_HOME" "$T18D_PREFIX"
  mkdir -p "$T18D_HOME/.atom" "$T18D_PREFIX"
  ATOM_HOME="$T18D_HOME/.atom" \
    NPM_CONFIG_PREFIX="$T18D_PREFIX" \
    ATOM_GIT_URL="$ATOM" \
    node "$ATOM/bin/atom/bin/atom.js" migrate-install --yes > "$LOG_DIR/t18d-full.log" 2>&1
  RC=$?
  if [ "$RC" = "0" ]; then
    PASS=$((PASS+1))
    RESULTS+=("  PASS  18.9 full migrate-install round-trip exits 0")
  else
    FAIL=$((FAIL+1))
    RESULTS+=("  FAIL  18.9 full migrate-install round-trip exited $RC (see t18d-full.log)")
  fi
  assert "18.10 ~/.atom/atom/ populated by clone" test -f "$T18D_HOME/.atom/atom/VERSION"
  assert "18.11 atom global installed in scratch prefix" test -x "$T18D_PREFIX/bin/atom"
  assert "18.12 atom-setup global installed" test -x "$T18D_PREFIX/bin/atom-setup"
  assert "18.13 nucleus global installed" test -x "$T18D_PREFIX/bin/nucleus"
  assert "18.14 learnings global installed" test -x "$T18D_PREFIX/bin/learnings"
  assert "18.15 model-race global installed" test -x "$T18D_PREFIX/bin/model-race"
fi

# =============================================================
section "Test 17: legacy in-place mode prints deprecation notice"
# =============================================================

T17=$SCRATCH/test-17-deprecation
prepare "$T17"
$SETUP --bare --target "$T17" --yes > "$LOG_DIR/t17-legacy.log" 2>&1
assert_grep "17.1 deprecation notice fires in in-place mode" "Deprecated" "$LOG_DIR/t17-legacy.log"
assert_grep "17.2 notice points at \`atom-setup new\`" "atom-setup new" "$LOG_DIR/t17-legacy.log"
# Legacy must still produce a working project.
assert "17.3 legacy in-place still scaffolds AGENTS.md" test -f "$T17/AGENTS.md"
assert_not "17.4 legacy in-place still removes scaffold/" test -d "$T17/scaffold"

# =============================================================
section "Test 19: install.sh curl one-liner"
# =============================================================
#
# Item #10: install.sh clones to $ATOM_HOME/atom/ and installs every CLI
# globally. Idempotent: re-running on an existing install short-circuits.
# Heavy (clones + 5 npm installs), so gated behind ATOM_TEST_SLOW=1 like
# the migrate-install full round-trip. Fast checks (banner, shebang,
# bytecode-ish smoke) run by default.

# 19a: file is present, executable, and looks like the installer we wrote.
assert "19.1 install.sh exists at repo root" test -f "$ATOM/install.sh"
assert "19.2 install.sh is executable" test -x "$ATOM/install.sh"
assert_grep "19.3 install.sh has bash shebang" "^#!/usr/bin/env bash" "$ATOM/install.sh"
assert_grep "19.4 install.sh targets \$ATOM_HOME/atom" 'TARGET=.*ATOM_HOME_DIR.*atom' "$ATOM/install.sh"
assert_grep "19.5 install.sh installs all 5 CLIs" "atom atom-setup nucleus learnings model-race" "$ATOM/install.sh"
assert_grep "19.6 install.sh refuses to clobber existing install" "already installed" "$ATOM/install.sh"

if [ "${ATOM_TEST_SLOW:-0}" = "1" ]; then
  T19_HOME=$SCRATCH/test-19-fake-home
  T19_PREFIX=$SCRATCH/test-19-npm-prefix
  rm -rf "$T19_HOME" "$T19_PREFIX"
  mkdir -p "$T19_HOME/.atom" "$T19_PREFIX"

  # First run: fresh install.
  ATOM_HOME="$T19_HOME/.atom" \
    NPM_CONFIG_PREFIX="$T19_PREFIX" \
    ATOM_GIT_URL="$ATOM" \
    PATH="$T19_PREFIX/bin:$PATH" \
    bash "$ATOM/install.sh" > "$LOG_DIR/t19a-install.log" 2>&1
  RC=$?
  if [ "$RC" = "0" ]; then
    PASS=$((PASS+1))
    RESULTS+=("  PASS  19.7 install.sh fresh run exits 0")
  else
    FAIL=$((FAIL+1))
    RESULTS+=("  FAIL  19.7 install.sh fresh run exited $RC (see t19a-install.log)")
  fi
  assert "19.8 ~/.atom/atom/ populated by clone" test -f "$T19_HOME/.atom/atom/VERSION"
  assert "19.9 atom global installed in scratch prefix" test -x "$T19_PREFIX/bin/atom"
  assert "19.10 atom-setup global installed" test -x "$T19_PREFIX/bin/atom-setup"
  assert_grep "19.11 success message mentions \`atom-setup new\`" "atom-setup new" "$LOG_DIR/t19a-install.log"

  # Second run: idempotency. Should short-circuit and not re-clone.
  ATOM_HOME="$T19_HOME/.atom" \
    NPM_CONFIG_PREFIX="$T19_PREFIX" \
    ATOM_GIT_URL="$ATOM" \
    PATH="$T19_PREFIX/bin:$PATH" \
    bash "$ATOM/install.sh" > "$LOG_DIR/t19b-rerun.log" 2>&1
  RC=$?
  if [ "$RC" = "0" ]; then
    PASS=$((PASS+1))
    RESULTS+=("  PASS  19.12 install.sh idempotent re-run exits 0")
  else
    FAIL=$((FAIL+1))
    RESULTS+=("  FAIL  19.12 install.sh idempotent re-run exited $RC")
  fi
  assert_grep "19.13 idempotent re-run says \`already installed\`" "already installed" "$LOG_DIR/t19b-rerun.log"
  assert_grep "19.14 idempotent re-run recommends \`atom upgrade\`" "atom upgrade" "$LOG_DIR/t19b-rerun.log"
fi

# =============================================================
section "Test 20: bin/atom-update-check + snooze + inlined client"
# =============================================================
#
# Item #11: lazy update-check that polls upstream VERSION, prints a
# notice on the next CLI invocation, snoozable 24h/48h/7d. State at
# ~/.atom/state/update-check.json. Inlined client logic lives in five
# byte-identical copies (one per CLI); the worker handles network +
# snooze in one place.

# 20a: the five inlined client copies are byte-identical to the canonical.
UCC_CANON="$ATOM/bin/atom-update-check/src/client.js"
UCC_HASH=$(md5 -q "$UCC_CANON")
DRIFT=()
for cli in atom atom-setup nucleus learnings model-race; do
  c="$ATOM/bin/$cli/src/lib/update-check-client.js"
  if [ ! -f "$c" ]; then
    DRIFT+=("$cli (file missing)")
    continue
  fi
  H=$(md5 -q "$c")
  if [ "$H" != "$UCC_HASH" ]; then
    DRIFT+=("$cli")
  fi
done
if [ ${#DRIFT[@]} -eq 0 ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  20.1 all 5 inlined update-check-client.js copies match canonical")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  20.1 update-check client drift in: ${DRIFT[*]} (resync from bin/atom-update-check/src/client.js)")
fi

# 20b: tick writes the state file with lastChecked + latestVersion.
T20_HOME=$SCRATCH/test-20-state
T20_INSTALL=$SCRATCH/test-20-install
rm -rf "$T20_HOME" "$T20_INSTALL"
mkdir -p "$T20_HOME" "$T20_INSTALL"
echo "0.2.0" > "$T20_INSTALL/VERSION"
echo "0.2.5" > "$T20_HOME/upstream"

ATOM_STATE_DIR="$T20_HOME/state" \
  ATOM_INSTALL="$T20_INSTALL" \
  ATOM_VERSION_FILE="$T20_HOME/upstream" \
  node "$ATOM/bin/atom-update-check/bin/atom-update-check.js" tick > "$LOG_DIR/t20b-tick.log" 2>&1
RC=$?
if [ "$RC" = "0" ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  20.2 atom-update-check tick exits 0")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  20.2 tick exited $RC")
fi
assert "20.3 state file written by tick" test -f "$T20_HOME/state/update-check.json"
assert_grep "20.4 state has latestVersion from upstream" "0.2.5" "$T20_HOME/state/update-check.json"
assert_grep "20.5 state has lastChecked timestamp" "lastChecked" "$T20_HOME/state/update-check.json"

# 20c: inlined client prints notice when upstream is newer.
ATOM_STATE_DIR="$T20_HOME/state" \
  ATOM_INSTALL="$T20_INSTALL" \
  node "$ATOM/bin/atom/bin/atom.js" --version > "$LOG_DIR/t20c-notice.log" 2>&1
assert_grep "20.6 inlined client prints upgrade notice (atom CLI)" "0.2.5 is available" "$LOG_DIR/t20c-notice.log"
assert_grep "20.7 notice mentions \`atom upgrade --snooze\`" "snooze: \\\`atom upgrade --snooze 7d\\\`" "$LOG_DIR/t20c-notice.log"

# 20d: second invocation within 24h does NOT re-print the notice.
ATOM_STATE_DIR="$T20_HOME/state" \
  ATOM_INSTALL="$T20_INSTALL" \
  node "$ATOM/bin/atom/bin/atom.js" --version > "$LOG_DIR/t20d-quiet.log" 2>&1
assert_not_grep "20.8 second invocation suppresses repeat notice (debounce 24h)" "is available" "$LOG_DIR/t20d-quiet.log"

# 20e: ATOM_UPDATE_CHECK_DISABLED kill-switch silences the notice.
T20E_STATE=$SCRATCH/test-20e-state
rm -rf "$T20E_STATE"
mkdir -p "$T20E_STATE"
cat > "$T20E_STATE/update-check.json" <<EOF
{ "lastChecked": "2026-05-14T00:00:00.000Z", "latestVersion": "0.99.99" }
EOF
ATOM_UPDATE_CHECK_DISABLED=1 \
  ATOM_STATE_DIR="$T20E_STATE" \
  ATOM_INSTALL="$T20_INSTALL" \
  node "$ATOM/bin/atom/bin/atom.js" --version > "$LOG_DIR/t20e-killswitch.log" 2>&1
assert_not_grep "20.9 ATOM_UPDATE_CHECK_DISABLED suppresses notice entirely" "0.99.99" "$LOG_DIR/t20e-killswitch.log"

# 20f: snooze 7d sets snoozeUntil and clears lastNotified.
T20F_STATE=$SCRATCH/test-20f-state
rm -rf "$T20F_STATE"
mkdir -p "$T20F_STATE"
cat > "$T20F_STATE/update-check.json" <<EOF
{ "lastNotified": "2026-05-14T00:00:00.000Z", "latestVersion": "0.2.5" }
EOF
ATOM_STATE_DIR="$T20F_STATE" \
  node "$ATOM/bin/atom-update-check/bin/atom-update-check.js" --snooze 7d > "$LOG_DIR/t20f-snooze.log" 2>&1
assert_grep "20.10 snooze 7d prints confirmation" "snoozed for 7d" "$LOG_DIR/t20f-snooze.log"
assert_grep "20.11 snoozeUntil written to state" "snoozeUntil" "$T20F_STATE/update-check.json"
assert_grep "20.12 lastNotified cleared by snooze (so re-notify after expiry)" '"lastNotified": null' "$T20F_STATE/update-check.json"

# 20g: bogus snooze duration rejected.
ATOM_STATE_DIR="$T20F_STATE" \
  node "$ATOM/bin/atom-update-check/bin/atom-update-check.js" --snooze 99x > "$LOG_DIR/t20g-bogus.log" 2>&1
RC=$?
if [ "$RC" != "0" ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  20.13 atom-update-check rejects bogus snooze duration")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  20.13 should have rejected '99x' but exited 0")
fi
assert_grep "20.14 error mentions valid durations" "24h, 48h, 7d" "$LOG_DIR/t20g-bogus.log"

# 20h: notice suppressed while snoozed.
# Build state where snoozeUntil is in the future; notice should be skipped.
T20H_STATE=$SCRATCH/test-20h-state
rm -rf "$T20H_STATE"
mkdir -p "$T20H_STATE"
FUTURE=$(date -u -v+1d "+%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+1 day" "+%Y-%m-%dT%H:%M:%S.000Z")
cat > "$T20H_STATE/update-check.json" <<EOF
{ "lastChecked": "2026-05-14T00:00:00.000Z", "latestVersion": "0.99.99", "snoozeUntil": "$FUTURE" }
EOF
ATOM_STATE_DIR="$T20H_STATE" \
  ATOM_INSTALL="$T20_INSTALL" \
  node "$ATOM/bin/atom/bin/atom.js" --version > "$LOG_DIR/t20h-snoozed.log" 2>&1
assert_not_grep "20.15 notice suppressed while snooze is active" "0.99.99" "$LOG_DIR/t20h-snoozed.log"

# 20i: \`atom upgrade --snooze 24h\` delegates to atom-update-check.
T20I_STATE=$SCRATCH/test-20i-state
T20I_BIN=$SCRATCH/test-20i-bin
rm -rf "$T20I_STATE" "$T20I_BIN"
mkdir -p "$T20I_STATE" "$T20I_BIN"
# Put atom-update-check on PATH so `atom upgrade --snooze` can spawn it.
ln -sf "$ATOM/bin/atom-update-check/bin/atom-update-check.js" "$T20I_BIN/atom-update-check"
ATOM_STATE_DIR="$T20I_STATE" \
  ATOM_UPDATE_CHECK_DISABLED=1 \
  PATH="$T20I_BIN:$PATH" \
  node "$ATOM/bin/atom/bin/atom.js" upgrade --snooze 24h > "$LOG_DIR/t20i-upgrade-snooze.log" 2>&1
assert_grep "20.16 \`atom upgrade --snooze 24h\` delegates and confirms" "snoozed for 24h" "$LOG_DIR/t20i-upgrade-snooze.log"
assert "20.17 state file written by delegation" test -f "$T20I_STATE/update-check.json"

# 20j: \`atom upgrade --snooze\` with no duration fails fast.
ATOM_STATE_DIR="$T20I_STATE" \
  ATOM_UPDATE_CHECK_DISABLED=1 \
  PATH="$T20I_BIN:$PATH" \
  node "$ATOM/bin/atom/bin/atom.js" upgrade --snooze > "$LOG_DIR/t20j-nodur.log" 2>&1
RC=$?
if [ "$RC" != "0" ]; then
  PASS=$((PASS+1))
  RESULTS+=("  PASS  20.18 \`atom upgrade --snooze\` (no duration) exits non-zero")
else
  FAIL=$((FAIL+1))
  RESULTS+=("  FAIL  20.18 \`atom upgrade --snooze\` should have failed with no duration")
fi
assert_grep "20.19 missing-duration error mentions valid tiers" "24h, 48h, 7d" "$LOG_DIR/t20j-nodur.log"

# 20k: \`atom --help\` advertises the snooze flag.
node "$ATOM/bin/atom/bin/atom.js" --help > "$LOG_DIR/t20k-help.log" 2>&1
assert_grep "20.20 atom --help advertises --snooze" "atom upgrade --snooze" "$LOG_DIR/t20k-help.log"

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
