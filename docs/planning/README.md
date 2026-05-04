# Planning docs

Per-feature build plans for atom. One file per feature. Each captures
locked decisions, rationale, and what to watch for at build time.

These are the source of truth for the upcoming build. Read the relevant
file before starting work on that feature.

## Files

- [`atom-setup.md`](atom-setup.md). Interactive wizard. The first thing
  a user runs after cloning atom. Drives all per-project configuration.
- [`nucleus.md`](nucleus.md). Cross-project learning store. Lives at
  `~/.nucleus`. Captures session learnings; syncs to private GitHub.
- [`learnings.md`](learnings.md). Graduation layer in `atom/learnings/`.
  Where generalized nucleus entries get baked into the template so every
  bootstrapped project inherits them.
- [`docker.md`](docker.md). Containerization tiers. Fully optional;
  smart default based on stack choice.
- [`model-race.md`](model-race.md). Parallel model comparison workflow
  using Git Worktrees. Niche power-user feature; opt-in.

## Build order

1. nucleus
2. learnings
3. docker
4. model-race

`atom-setup` is built incrementally as features come online. Each
feature contributes its wizard section when it lands.

## Status

All five plans are locked. Decisions reached through guided planning
(see HANDOFF.md for session origin). No re-litigation without a written
reason.
