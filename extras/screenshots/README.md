# Screenshots

Generated artifacts for the README, launch posts, and social cards.
**Do not hand-edit these files — regenerate with `scripts/regen-screenshots.sh`.**

## Inventory

| File                          | Source  | What it shows                                          | Use for                          |
|-------------------------------|---------|--------------------------------------------------------|----------------------------------|
| `wizard.gif`                  | VHS     | Full wizard run (~22s), from logo to dry-run finish    | README hero                      |
| `wizard.webm`                 | VHS     | Same demo, ~3x smaller — better for HTML embeds        | Docs site / blog                 |
| `01-logo.png`                 | VHS     | ATOM logo + pre-flight + Step 1 prompt                 | README, "first impression" card  |
| `02-stack.png`                | VHS     | Stack preset picker open (all 18 options visible)      | Feature card — "5 presets"       |
| `03-nucleus.png`              | VHS     | Mid-flight: prior answers + nucleus capture-mode picker | Feature card — guided UX        |
| `04-summary.png`              | VHS     | Full-run journey — summary + dry-run + outro           | "What it does" card              |
| `marketing-atom-help.png`     | Freeze  | `atom --help` as a styled window with shadow           | Product Hunt / Twitter           |
| `marketing-bare-mode.png`     | Freeze  | `atom-setup --bare` (~5s no-questions bootstrap)       | "Fast" launch angle              |

## Regenerating

```sh
brew install vhs charmbracelet/tap/freeze   # one-time
scripts/regen-screenshots.sh                # all
scripts/regen-screenshots.sh vhs            # wizard demo + stills only
scripts/regen-screenshots.sh freeze         # marketing cards only
```

## Notes

- VHS drives the wizard headlessly through `wizard.tape`. The tape uses
  `--dry-run` against `/tmp/atom-screenshots-sandbox`, so nothing in the
  repo (or your home dir) is touched.
- If you reorder or add prompts in `bin/atom-setup/src/sections/*`, you
  almost certainly need to adjust `Enter` / `Down` counts in `wizard.tape`.
  Off-by-one bugs there cascade — extra `Enter`s spill into the next
  prompt and silently change selections downstream.
- Freeze stills use macOS-style window chrome via `--window`. To change
  the look (background, padding, shadow), edit `scripts/regen-screenshots.sh`.
