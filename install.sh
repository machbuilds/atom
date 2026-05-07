#!/usr/bin/env bash
# install.sh — one-line installer for atom's three CLIs.
#
# Run once per machine from inside a cloned atom directory:
#   ./install.sh
#
# Installs atom-setup, nucleus, and model-race globally via npm so they
# are on your PATH for any project. Idempotent: re-running just
# refreshes them.

set -e

ATOM_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# ─── pre-flight ─────────────────────────────────────────────────────
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

# ─── install ────────────────────────────────────────────────────────
echo ""
echo "Installing atom's CLIs globally..."
echo ""

CLIS=(atom-setup nucleus model-race)
for cli in "${CLIS[@]}"; do
  printf "  → %-12s " "$cli"
  if (cd "$ATOM_DIR/bin/$cli" && npm install -g . > /tmp/atom-install-$cli.log 2>&1); then
    echo "ok"
  else
    echo "FAILED"
    echo "" >&2
    echo "npm install for $cli failed. Last 10 lines of output:" >&2
    tail -10 /tmp/atom-install-$cli.log >&2
    echo "" >&2
    echo "Common cause: EACCES on global install. Either re-run with sudo," >&2
    echo "or set up an npm prefix in your home dir:" >&2
    echo "  https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally" >&2
    exit 1
  fi
done

# ─── verify ─────────────────────────────────────────────────────────
echo ""
echo "Verifying..."
echo ""

ALL_OK=1
for cli in "${CLIS[@]}"; do
  if VERSION=$(command -v "$cli" > /dev/null && "$cli" --version 2>/dev/null); then
    printf "  %-12s v%s\n" "$cli" "$VERSION"
  else
    printf "  %-12s NOT ON PATH\n" "$cli"
    ALL_OK=0
  fi
done

echo ""

if [ "$ALL_OK" = "1" ]; then
  echo "Done. Run 'atom-setup' inside any cloned atom directory."
  echo ""
else
  echo "Some CLIs are not on PATH. Check your npm global prefix:"
  echo "  npm config get prefix"
  echo "Make sure that prefix's bin/ directory is in your PATH."
  echo ""
  exit 1
fi
