# scripts/ — automation scripts

Reserved for shell / Python / Node automation that supports atom's
maintenance — distinct from `bin/` which is for end-user CLI helpers.

## Intent

Scripts in here are run by the atom maintainer (you), not by users of
atom. Examples of scripts that might land here:

- `sync-from-projects.sh` — pull lessons from a list of project repos
  back into atom (e.g., scan their AGENTS.md files for sections marked
  as "candidate for atom" and append to INBOX.md).
- `validate-scaffold.sh` — sanity check that `scaffold/AGENTS.md` has
  all `<TODO>` markers and no project-specific content snuck in.
- `regenerate-tree.sh` — keep the README.md tree diagram in sync with
  actual directory contents.

## Why empty for now

Same reason as `bin/`: don't add automation until the manual workflow
proves repetitive. atom is small enough today that hand-maintenance is
fine.

## Conventions

- Scripts are runnable from the atom repo root: `./scripts/<name>.sh`
- Each script has a one-line description in its header comment
- Scripts that modify atom files are dry-run by default; require `--apply`
  to actually write changes
- No script silently overwrites — always show diff and confirm
