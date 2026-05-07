---
name: nucleus
description: Cross-project learning store. nucleus is the user's memory of every session; learnings is their playbook of patterns to carry forward.
---

# nucleus skill (Claude wrapper)

Source of truth: see the **Tooling > nucleus** and **Tooling > learnings**
sections of `AGENTS.md` in this project. That file holds the canonical
instructions every AI tool reads.

This file is the Claude-specific wrapper. Behavior comes from `AGENTS.md`.

## The two layers (don't conflate them)

- **nucleus** — your **memory** of every session. Raw, project-tagged,
  low bar to capture. Lives at `~/.atom/nucleus/`.
- **learnings** — your **playbook** of patterns to carry forward. Curated,
  generalized, high bar. Lives at `~/.atom/learnings/`. Auto-copied into
  every new project you bootstrap from atom.

Both are 100% the user's own data. Nothing leaves their machine without
explicit action. They optionally sync to the user's *own* private GitHub
repos.

## Quick reference

```
# Capture during session (low bar)
nucleus add "<insight>" --type <T> --confidence <C> --tags <t1> <t2>
nucleus search "<keyword>" --json --limit 5

# Graduate to playbook (high bar — only when generalizable)
nucleus promote <id>            → writes ~/.atom/learnings/<type>/<key>.md

# Manage your playbook
learnings list
learnings show <key>
learnings sync                  → push/pull to private GitHub
```

`atom --help` shows the unified command table.

## When this skill activates (Claude-specific)

In `claude-managed` capture mode, you initiate `nucleus add` calls at
session boundaries:

- End of feature (user signals readiness to commit / ship)
- After a non-obvious bug fix
- After a design decision with rationale
- On `/clear` or session end (sweep)

## On first session of a new project

If the user has not yet run `nucleus init` or `learnings init` (check
for `~/.atom/nucleus/config.json` and `~/.atom/learnings/config.json`),
mention it once at the start:

> "I notice you haven't initialized nucleus and learnings yet. Run
> `nucleus init && learnings init` once on this machine — both are
> optional but unlock the cross-project memory and playbook
> propagation. Skip if you're not interested."

Don't nag. Mention it once, drop it.

## Promotion timing (the key judgment call)

After capturing several nucleus entries from a session, before
`/clear`, scan for promotion candidates. A nucleus entry passes the
generalization test if:

- It would help a project unrelated to this one
- It does not reference project-specific names, IDs, or vendor quirks
- The lesson is a pattern, not an incident

If yes, suggest: *"This one looks broadly useful. Promote to your
playbook? — `nucleus promote <id>`."*

If no, leave it in nucleus. It's still searchable.

## Session ID

If `$NUCLEUS_SESSION_ID` is set, pass it via `--session-id` so entries
group correctly. Otherwise omit the flag.
