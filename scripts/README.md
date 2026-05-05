# scripts/ — automation scripts

Shell / Python / Node automation that supports atom's maintenance —
distinct from `bin/` which is for end-user CLI helpers.

## Available now

- **`copy-learnings.mjs`** — bootstrap selection algorithm. Filters
  `learnings/<type>/<slug>.md` by `applies_to` against a project's
  stack tags and copies the matching subset. Used by `atom-setup`
  during the wizard's apply phase. Run standalone:
  `node scripts/copy-learnings.mjs --target /path/to/project --stack-tags universal,web`.
- **`test-atom-setup.sh`** — regression test runner for the wizard.
  53 assertions across 7 scenarios (`--bare`, `--dry-run`, `--resume`,
  smart defaults, idempotency, etc.). Runs in CI on every push.
  Run locally: `bash scripts/test-atom-setup.sh` (add `--keep` to
  retain test dirs).

## Likely future helpers

- `sync-from-projects.sh` — pull lessons from a list of project repos
  back into atom (e.g., scan their AGENTS.md files for sections marked
  as "candidate for atom" and append to INBOX.md).
- `validate-scaffold.sh` — sanity check that `scaffold/AGENTS.md` has
  all `<TODO>` markers and no project-specific content snuck in.
- `regenerate-tree.sh` — keep the README.md tree diagram in sync with
  actual directory contents.

## Conventions

- Scripts are runnable from the atom repo root: `./scripts/<name>.sh`
  (or `node scripts/<name>.mjs` for Node scripts).
- Each script has a one-line description in its header comment.
- Scripts that modify atom files are dry-run by default; require
  `--apply` to actually write changes.
- No script silently overwrites — always show diff and confirm.
- Test scripts exit with the failure count (0 = all pass), making
  them suitable for CI without extra wrapping.
