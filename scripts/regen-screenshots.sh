#!/usr/bin/env bash
# scripts/regen-screenshots.sh
#
# Regenerate every artifact under extras/screenshots/:
#   - wizard.gif / wizard.webm  (VHS — animated demo)
#   - 01-logo.png …             (VHS — interactive wizard stills)
#   - marketing-*.png           (Freeze — stylized launch cards)
#
# Requirements (one-time):
#   brew install vhs charmbracelet/tap/freeze
#
# Usage:
#   scripts/regen-screenshots.sh           # all artifacts
#   scripts/regen-screenshots.sh vhs       # only VHS (wizard demo + stills)
#   scripts/regen-screenshots.sh freeze    # only Freeze (marketing cards)
#
# The wizard runs against /tmp/atom-screenshots-sandbox in --dry-run mode,
# so nothing in the repo (or your home dir) is touched.

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ATOM=$(cd "$SCRIPT_DIR/.." && pwd)
TAPE="$ATOM/extras/screenshots/wizard.tape"
OUT="$ATOM/extras/screenshots"
SANDBOX_VHS="/tmp/atom-screenshots-sandbox"
SANDBOX_FREEZE="/tmp/atom-freeze-bare"

WANT=${1:-all}

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "✗ $1 not found. Install with: $2"
    exit 1
  }
}

run_vhs() {
  require vhs "brew install vhs"
  echo "→ vhs $TAPE"
  cd "$ATOM"
  vhs "$TAPE"
  echo "  produced:"
  ls -1 "$OUT" | grep -E '\.(gif|webm|png)$' | grep -v '^marketing-' | sed 's/^/    /'
}

run_freeze() {
  require freeze "brew install charmbracelet/tap/freeze"

  # Marketing card 1: atom --help
  echo "→ freeze: atom --help → marketing-atom-help.png"
  freeze --execute "node $ATOM/bin/atom/bin/atom.js --help" \
    --output "$OUT/marketing-atom-help.png" \
    --window \
    --background "#1a1b26" \
    --padding "40,48" \
    --margin 32 \
    --border.radius 14 \
    --shadow.blur 30 \
    --shadow.x 0 \
    --shadow.y 12 \
    --font.size 18 \
    --line-height 1.5 \
    --width 1400 >/dev/null

  # Marketing card 2: atom-setup --bare (5-second bootstrap)
  echo "→ freeze: atom-setup --bare → marketing-bare-mode.png"
  rm -rf "$SANDBOX_FREEZE" && mkdir -p "$SANDBOX_FREEZE"
  freeze --execute "node $ATOM/bin/atom-setup/bin/atom-setup.js --bare --target $SANDBOX_FREEZE --dry-run --yes" \
    --output "$OUT/marketing-bare-mode.png" \
    --window \
    --background "#1a1b26" \
    --padding "40,48" \
    --margin 32 \
    --border.radius 14 \
    --shadow.blur 30 \
    --shadow.x 0 \
    --shadow.y 12 \
    --font.size 18 \
    --line-height 1.5 \
    --width 1400 >/dev/null

  echo "  produced:"
  ls -1 "$OUT" | grep '^marketing-' | sed 's/^/    /'
}

case "$WANT" in
  vhs)    run_vhs ;;
  freeze) run_freeze ;;
  all)    run_vhs; run_freeze ;;
  *)      echo "usage: $0 [vhs|freeze|all]"; exit 1 ;;
esac

echo
echo "✓ Done. Artifacts in: $OUT"
