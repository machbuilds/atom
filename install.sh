#!/usr/bin/env bash
# install.sh — one-shot atom installer.
#
# Designed for the curl-pipe-bash UX:
#
#   curl -fsSL https://raw.githubusercontent.com/machbuilds/atom/main/install.sh | bash
#
# Clones the atom repo to ~/.atom/atom/, then installs every CLI
# globally (`atom`, `atom-setup`, `nucleus`, `learnings`, `model-race`).
# Idempotent: if ~/.atom/atom/ already exists, recommends `atom upgrade`
# and exits without touching anything.
#
# Env overrides (used for tests; users do not normally set these):
#   ATOM_HOME              base dir for the install (default ~/.atom)
#   ATOM_GIT_URL           upstream repo to clone from
#                          (default https://github.com/machbuilds/atom.git)
#   ATOM_BRANCH            branch/tag to check out (default: repo default)

set -e

DEFAULT_GIT_URL="https://github.com/machbuilds/atom.git"
GIT_URL="${ATOM_GIT_URL:-$DEFAULT_GIT_URL}"
ATOM_HOME_DIR="${ATOM_HOME:-$HOME/.atom}"
TARGET="$ATOM_HOME_DIR/atom"
BRANCH="${ATOM_BRANCH:-}"

CLIS=(atom atom-setup nucleus learnings model-race atom-update-check)

# ─── pre-flight ─────────────────────────────────────────────────────
if ! command -v git > /dev/null 2>&1; then
  echo "Error: git not found on PATH." >&2
  echo "atom requires git. Install it and re-run." >&2
  exit 1
fi

if ! command -v node > /dev/null 2>&1; then
  echo "Error: node not found on PATH." >&2
  echo "atom requires Node.js 18+. Install from https://nodejs.org and re-run." >&2
  exit 1
fi

if ! command -v npm > /dev/null 2>&1; then
  echo "Error: npm not found on PATH." >&2
  echo "npm ships with Node.js. Reinstall Node from https://nodejs.org and re-run." >&2
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Error: Node $(node -v) is too old. atom requires Node 18 or newer." >&2
  exit 1
fi

# ─── idempotency ────────────────────────────────────────────────────
if [ -d "$TARGET" ]; then
  echo ""
  echo "atom is already installed at $TARGET."
  echo ""
  if [ -d "$TARGET/.git" ]; then
    echo "To upgrade to the latest release:"
    echo "  atom upgrade"
  else
    echo "That directory exists but does not look like an atom checkout (no .git)."
    echo "Inspect it, then remove it and re-run this installer if you want a fresh install:"
    echo "  rm -rf $TARGET"
  fi
  echo ""
  exit 0
fi

# ─── clone ──────────────────────────────────────────────────────────
echo ""
echo "Installing atom to $TARGET..."
echo ""

mkdir -p "$ATOM_HOME_DIR"

CLONE_ARGS=(clone --quiet)
if [ -n "$BRANCH" ]; then
  CLONE_ARGS+=(--branch "$BRANCH")
fi
CLONE_ARGS+=("$GIT_URL" "$TARGET")

if ! git "${CLONE_ARGS[@]}"; then
  echo "" >&2
  echo "Error: git clone failed." >&2
  echo "Tried: git ${CLONE_ARGS[*]}" >&2
  echo "Check your network or git config, then re-run." >&2
  exit 1
fi

echo "  → cloned to $TARGET"
echo ""

# ─── install CLIs ───────────────────────────────────────────────────
for cli in "${CLIS[@]}"; do
  CLI_DIR="$TARGET/bin/$cli"
  if [ ! -d "$CLI_DIR" ]; then
    printf "  → %-12s no bin/, skipping (atom layout drift?)\n" "$cli"
    continue
  fi
  printf "  → %-12s " "$cli"
  if ! (cd "$CLI_DIR" && npm install > /tmp/atom-install-$cli.log 2>&1); then
    echo "FAILED"
    echo "" >&2
    echo "npm install (deps) for $cli failed. Last 10 lines of output:" >&2
    tail -10 /tmp/atom-install-$cli.log >&2
    exit 1
  fi
  if (cd "$CLI_DIR" && npm install -g . >> /tmp/atom-install-$cli.log 2>&1); then
    echo "ok"
  else
    echo "FAILED"
    echo "" >&2
    echo "npm install -g for $cli failed. Last 10 lines of output:" >&2
    tail -10 /tmp/atom-install-$cli.log >&2
    echo "" >&2
    echo "Common cause: EACCES on global install. Either re-run with sudo," >&2
    echo "or set up an npm prefix in your home dir:" >&2
    echo "  https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally" >&2
    exit 1
  fi
done

# ─── PATH check ─────────────────────────────────────────────────────
# If npm's global bin isn't on PATH, the install "succeeded" but the
# user can't run anything. Catch this and point them at the fix.
MISSING=()
for cli in "${CLIS[@]}"; do
  if ! command -v "$cli" > /dev/null 2>&1; then
    MISSING+=("$cli")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "" >&2
  echo "Installed, but these CLIs are not on your PATH yet: ${MISSING[*]}" >&2
  echo "Run 'npm config get prefix' and make sure that prefix's bin/ is in PATH." >&2
  echo "Then open a new shell and run 'atom --help' to verify." >&2
  exit 1
fi

# ─── success ────────────────────────────────────────────────────────
echo ""
echo "✓ atom installed. Run \`atom-setup new <project-name>\` to start your first project."
echo ""
echo "Quick reference:"
echo "  atom --help                       see every atom command"
echo "  atom-setup new my-project         scaffold a new project"
echo "  atom upgrade                      update atom in place"
echo "  nucleus init                      one-time setup for your session memory"
echo ""
