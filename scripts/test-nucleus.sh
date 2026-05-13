#!/usr/bin/env bash
# scripts/test-nucleus.sh
#
# Regression test runner for the nucleus CLI. Exercises:
# - shouldNudge thresholds (count >= 10, oldest >= 14 days, 24h debounce)
# - `nucleus review` listing and filters
# - `nucleus add` footer behavior
# - getBacklog skips already-promoted entries
#
# Runs entirely in an isolated $ATOM_HOME so the user's real ~/.atom is
# untouched.
#
# Usage:
#   scripts/test-nucleus.sh              # run, clean up after
#   scripts/test-nucleus.sh --keep       # keep test dirs after run
#
# Exit code = number of failures (0 = all pass, suitable for CI).

set -u

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ATOM=$(cd "$SCRIPT_DIR/.." && pwd)
NUCLEUS="node $ATOM/bin/nucleus/bin/nucleus.js"
SCRATCH=${ATOM_TEST_SCRATCH:-/tmp/atom-nucleus-tests}
KEEP=0

for arg in "$@"; do
  case "$arg" in
    --keep) KEEP=1 ;;
    -h|--help)
      sed -n '2,17p' "$0" | sed 's|^# ||;s|^#||'
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

assert_contains() {
  local desc="$1"
  local needle="$2"
  local haystack="$3"
  if printf '%s' "$haystack" | grep -qF -- "$needle"; then
    PASS=$((PASS+1))
    RESULTS+=("  PASS  $desc")
  else
    FAIL=$((FAIL+1))
    RESULTS+=("  FAIL  $desc  (missing: $needle)")
  fi
}

assert_not_contains() {
  local desc="$1"
  local needle="$2"
  local haystack="$3"
  if printf '%s' "$haystack" | grep -qF -- "$needle"; then
    FAIL=$((FAIL+1))
    RESULTS+=("  FAIL  $desc  (unexpected: $needle)")
  else
    PASS=$((PASS+1))
    RESULTS+=("  PASS  $desc")
  fi
}

# Fresh scratch tree
rm -rf "$SCRATCH"
mkdir -p "$SCRATCH"

# -----------------------------------------------------------------------------
# Test fixture: an isolated ATOM_HOME and a fake project with a deterministic
# slug via a git remote URL.
# -----------------------------------------------------------------------------
export ATOM_HOME="$SCRATCH/atom-home"
export NUCLEUS_HOME="$ATOM_HOME/nucleus"
PROJECT_DIR="$SCRATCH/test-proj"
PROJECT_SLUG="me-test-proj"

mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"
git init -q
git remote add origin git@example.com:me/test-proj.git

# Initialize nucleus with defaults.
$NUCLEUS init --yes > /dev/null 2>&1 || true

CONFIG="$NUCLEUS_HOME/config.json"
LEARNINGS_FILE="$NUCLEUS_HOME/projects/$PROJECT_SLUG/learnings.jsonl"

assert "nucleus init creates config.json"      test -f "$CONFIG"
assert "config has lastNudgeAt=null"           grep -q '"lastNudgeAt": null' "$CONFIG"

# -----------------------------------------------------------------------------
# Helper: reset config + learnings to a clean state between groups.
# -----------------------------------------------------------------------------
reset_state() {
  rm -rf "$NUCLEUS_HOME/projects" "$ATOM_HOME/learnings"
  # Reset lastNudgeAt via Node so we don't depend on jq.
  node -e "
    const fs=require('fs');
    const p='$CONFIG';
    const c=JSON.parse(fs.readFileSync(p,'utf8'));
    c.lastNudgeAt=null;
    fs.writeFileSync(p, JSON.stringify(c,null,2)+'\n');
  "
}

# Append a JSONL entry with a custom timestamp (ISO8601). For age tests.
seed_entry() {
  local id="$1" ; local type="$2" ; local key="$3" ; local ts="$4" ; local insight="$5"
  mkdir -p "$(dirname "$LEARNINGS_FILE")"
  node -e "
    const fs=require('fs');
    const entry={
      id:'$id', ts:'$ts', schema_version:1, project:'$PROJECT_SLUG',
      type:'$type', key:'$key', insight:'$insight',
      confidence:'medium', source:'human', files:[], tags:[],
      supersedes:null, session_id:null
    };
    fs.appendFileSync('$LEARNINGS_FILE', JSON.stringify(entry)+'\n');
  "
}

# Read a JSON field from config via Node.
config_field() {
  local field="$1"
  node -e "console.log(JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).$field)"
}

# -----------------------------------------------------------------------------
# Group 1: shouldNudge unit-ish tests via direct module import.
# -----------------------------------------------------------------------------
reset_state

# 1a. count < 10, oldest < 14 days → no nudge
add_out=$($NUCLEUS add "first learning" --type pattern --confidence medium 2>&1)
assert_not_contains "no footer on first add" "unpromoted entries" "$add_out"

for i in 2 3 4 5 6 7 8 9; do
  $NUCLEUS add "learning $i" --type pattern --key "learning-$i" > /dev/null 2>&1
done
add_out=$($NUCLEUS add "learning 10 oh no" --type pattern --key "learning-10" 2>&1)
# That was the 10th — threshold is >=10, so this add should trigger nudge.
assert_contains "footer triggers at count=10" "10 unpromoted entries" "$add_out"
assert "lastNudgeAt was set"                  test "$(config_field 'lastNudgeAt')" != "null"

# 1b. Within 24h debounce window, next add should NOT print footer.
add_out=$($NUCLEUS add "learning 11" --type pattern --key "learning-11" 2>&1)
assert_not_contains "debounce suppresses footer within 24h" "unpromoted entries" "$add_out"

# 1c. With lastNudgeAt aged > 24h, footer fires again.
node -e "
  const fs=require('fs');
  const p='$CONFIG';
  const c=JSON.parse(fs.readFileSync(p,'utf8'));
  c.lastNudgeAt = new Date(Date.now() - 25*60*60*1000).toISOString();
  fs.writeFileSync(p, JSON.stringify(c,null,2)+'\n');
"
add_out=$($NUCLEUS add "learning 12" --type pattern --key "learning-12" 2>&1)
assert_contains "footer fires after 24h debounce expires" "unpromoted entries" "$add_out"

# -----------------------------------------------------------------------------
# Group 2: age-based trigger with small count.
# -----------------------------------------------------------------------------
reset_state

# Two entries: one very old, one fresh — count is far below 10, but oldest is >14d.
OLD_TS=$(node -e "console.log(new Date(Date.now() - 20*86400000).toISOString())")
NEW_TS=$(node -e "console.log(new Date().toISOString())")

seed_entry "01HOLDXXXXXXXXXXXXXXXXXXXX" pattern old-key "$OLD_TS" "an old learning"
seed_entry "01HNEWXXXXXXXXXXXXXXXXXXXX" pattern new-key "$NEW_TS" "a new learning"

# Now add a fresh entry — backlog is 3 (well under 10) but oldest is 20 days.
add_out=$($NUCLEUS add "another fresh entry" --type pattern --key "another-fresh" 2>&1)
assert_contains "footer fires when oldest entry is >=14 days" "unpromoted entries" "$add_out"
assert_contains "footer mentions age in days"                "20 days"             "$add_out"

# -----------------------------------------------------------------------------
# Group 3: `nucleus review` lists and filters.
# -----------------------------------------------------------------------------
reset_state

seed_entry "01HAAA1111111111111111111A" pitfall  cache-stampede "$OLD_TS" "Cache in-flight refresh promises"
seed_entry "01HBBB2222222222222222222B" pattern  exec-form      "$NEW_TS" "Use exec form in Dockerfile ENTRYPOINT"
seed_entry "01HCCC3333333333333333333C" bug-fix  off-by-one     "$NEW_TS" "Off-by-one in pagination cursor"

review_out=$($NUCLEUS review 2>&1)
assert_contains "review header counts entries"          "3 unpromoted entries"      "$review_out"
assert_contains "review groups by project"              "$PROJECT_SLUG"             "$review_out"
assert_contains "review shows promote command for entry 1" "nucleus promote 01HAAA1111111111111111111A" "$review_out"
assert_contains "review shows insight body"             "Cache in-flight refresh"   "$review_out"
assert_contains "review shows age"                       "20 days ago"              "$review_out"

# --type filter
review_out=$($NUCLEUS review --type pattern 2>&1)
assert_contains    "review --type filters in"  "Use exec form"      "$review_out"
assert_not_contains "review --type filters out" "Cache in-flight"   "$review_out"

# --limit
review_out=$($NUCLEUS review --limit 1 2>&1)
assert_contains "review --limit clamps display" "showing oldest 1" "$review_out"

# -----------------------------------------------------------------------------
# Group 4: getBacklog skips already-promoted entries.
# -----------------------------------------------------------------------------
# Create a fake promoted learnings file matching one of our entries.
mkdir -p "$ATOM_HOME/learnings/pitfall"
cat > "$ATOM_HOME/learnings/pitfall/cache-stampede.md" <<'EOF'
---
key: cache-stampede
type: pitfall
---
# Cache in-flight refresh promises
EOF

review_out=$($NUCLEUS review 2>&1)
assert_not_contains "review hides promoted entry"  "Cache in-flight" "$review_out"
assert_contains    "review still shows unpromoted" "Use exec form"   "$review_out"

# -----------------------------------------------------------------------------
# Group 5: empty backlog message.
# -----------------------------------------------------------------------------
reset_state

review_out=$($NUCLEUS review 2>&1)
assert_contains "review reports empty backlog" "No unpromoted entries" "$review_out"

# -----------------------------------------------------------------------------
# Report
# -----------------------------------------------------------------------------
echo ""
echo "============================================"
echo "nucleus test results"
echo "============================================"
for r in "${RESULTS[@]}"; do
  echo "$r"
done
echo "--------------------------------------------"
echo "  PASS: $PASS    FAIL: $FAIL"
echo "============================================"

if [ "$KEEP" = "0" ]; then
  rm -rf "$SCRATCH"
fi

exit "$FAIL"
