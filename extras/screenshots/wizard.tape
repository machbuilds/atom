# atom-setup wizard demo — VHS tape
#
# Generates:
#   extras/screenshots/wizard.gif       — README hero animation
#   extras/screenshots/wizard.webm      — same, smaller
#   extras/screenshots/01-logo.png      — atom logo + pre-flight + step 1
#   extras/screenshots/02-stack.png     — stack preset picker open
#   extras/screenshots/03-nucleus.png   — nucleus capture-mode picker
#   extras/screenshots/04-summary.png   — full-run journey (summary + dry-run output)
#
# Wizard runs with --dry-run so no real files are written.
# Must be run from the repo root (vhs requires relative paths).
# Regenerate: scripts/regen-screenshots.sh

Output extras/screenshots/wizard.gif
Output extras/screenshots/wizard.webm

Set Shell zsh
Set FontSize 16
Set Width 1200
Set Height 760
Set Padding 28
Set Theme "Catppuccin Mocha"
Set TypingSpeed 45ms
Set PlaybackSpeed 1.0

# --- prep: clean sandbox ---
Hide
Type "rm -rf /tmp/atom-screenshots-sandbox && mkdir -p /tmp/atom-screenshots-sandbox && clear"
Enter
Sleep 400ms
Show

# --- launch the wizard ---
Type "node bin/atom-setup/bin/atom-setup.js --target /tmp/atom-screenshots-sandbox --dry-run"
Sleep 500ms
Enter
Sleep 2500ms
Screenshot extras/screenshots/01-logo.png

# --- Step 1/10: Project basics ---
# Clear the pre-filled default before typing.
Sleep 600ms
Ctrl+U
Sleep 150ms
Type "rocket-api"
Sleep 300ms
Enter

# Description (empty by default — type directly)
Sleep 400ms
Type "A tiny launch project for screenshot day"
Sleep 300ms
Enter

# Visibility — accept default (public)
Sleep 400ms
Enter

# --- Step 2/10: Stack & deploy ---
# initialValue='other' (index 16). Wrap: Down → decide-later (17) → nextjs (0)
# → python-fastapi (1). Press three discrete Downs (VHS coalesces "Down 3").
Sleep 700ms
Screenshot extras/screenshots/02-stack.png
Down
Sleep 150ms
Down
Sleep 150ms
Down
Sleep 200ms
Enter

# Deploy target — accept default (decide-later)
Sleep 400ms
Enter

# --- Step 3/10: nucleus ---
# Confirm enabled (yes), then pause on capture-mode select for the screenshot.
Sleep 500ms
Enter
Sleep 600ms
Screenshot extras/screenshots/03-nucleus.png
Enter

# --- Step 4/10: memory stack MCPs ---
# Default mode: only mem0 prompt (multica + chrome-devtools are --full only).
Sleep 400ms
Enter

# --- Step 5/10: workflow tooling ---
Sleep 400ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter

# --- Step 6/10: docker ---
Sleep 400ms
Enter

# --- Step 7/10: license ---
Sleep 400ms
Enter

# --- Step 8/10: CI/CD ---
Sleep 400ms
Enter

# --- Step 9/10: constitution ---
Sleep 400ms
Enter

# --- Step 10/10: git ---
# Default mode: single select prompt (remote choice, default = skip).
Sleep 400ms
Enter

# --- Summary + confirm + dry-run output ---
# Press Enter to confirm; let the wizard finish; capture the full journey.
Sleep 800ms
Enter
Sleep 1500ms
Screenshot extras/screenshots/04-summary.png

Sleep 800ms
