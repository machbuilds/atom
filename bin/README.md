# bin/ — executable helpers

Reserved for future CLI helpers that automate atom workflows.

## Intent

When a workflow becomes repetitive enough to script, it lands here. Each
helper is a single-purpose executable, named for its job, with a short
header comment explaining when to invoke it.

## Likely future helpers

- `atom-bootstrap` — copy `scaffold/` into a target dir, prompt for the
  TODO placeholders, write filled-in `CLAUDE.md`. (Currently this is
  Claude's job per the bootstrap flow in `CLAUDE.md`. Worth automating
  if the flow stabilises.)
- `atom-promote-inbox` — interactively walk through `docs/INBOX.md`
  entries, prompt the generalisation test, append to the right target
  file. Reduces friction on the periodic INBOX drain.
- `atom-add-preset` — scaffold a new `extras/<category>/<preset>/`
  directory with the required files (Dockerfile, README.md, etc.) and
  fill in placeholders.

## Why empty for now

Premature abstraction is worse than no abstraction. Add a helper here
only after you've done the manual workflow at least 3 times and noticed
the same friction each time.

## Conventions for adding a helper

- Single executable per file
- Clear `--help` output
- Idempotent where possible (safe to re-run)
- Exit code 0 = success, non-zero = failure
- Header comment with: purpose, when to invoke, dependencies
