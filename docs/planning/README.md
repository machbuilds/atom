# Planning docs

Per-feature build plans for atom. One file per feature. Each captures
locked decisions, rationale, and what to watch for at build time.

These are the source of truth for the upcoming build. Read the relevant
file before starting work on that feature.

## Files

### v0.1 (built)

- [`atom-setup.md`](atom-setup.md). Interactive wizard. The first thing
  a user runs after cloning atom. Drives all per-project configuration.
- [`nucleus.md`](nucleus.md). Cross-project learning store. Lives at
  `~/.atom/nucleus`. Captures session learnings; syncs to private GitHub.
- [`learnings.md`](learnings.md). User-owned playbook at
  `~/.atom/learnings/`. Where generalized nucleus entries land and ride
  forward into every bootstrapped project.
- [`docker.md`](docker.md). Containerization tiers. Fully optional;
  smart default based on stack choice.
- [`model-race.md`](model-race.md). Parallel model comparison workflow
  using Git Worktrees. Niche power-user feature; opt-in.

### v0.2 (planning)

- [`v0.2.md`](v0.2.md). Milestone plan. 10 items across 3 waves;
  sequenced so the cheapest wins land first and the architectural
  shift lands last. v0.1.2 shipped the install-bug patch ahead of
  this milestone.
- [`distribution.md`](distribution.md). How atom is installed,
  upgraded, and separated from project clones. Locks the architectural
  decisions behind v0.2 Wave 3 (`~/.atom/atom/` install,
  `atom upgrade`, `install.sh` curl one-liner, auto-update check).
- [`stack-presets.md`](stack-presets.md). Five new stack presets —
  Python/FastAPI, Swift (Vapor), Rust (Axum), Go CLI (Cobra),
  TypeScript library — closing the v0.1 gap where only Next.js had
  a real preset. v0.2 Wave 2.

### v0.3 (candidate list)

- [`v0.3.md`](v0.3.md). Candidate to-do list, **not locked**. Bundles
  7 new candidates (hook-driven nucleus capture, prompt auto-injection,
  PreCompact/PostCompact, `atom doctor`, SQLite+FTS5 nucleus storage,
  research/wiki layer, cost tracking) sourced from the
  `rohitg00/pro-workflow` comparison analysis, plus the two
  pre-existing v0.3 deferrals below. v0.3 planning session decides
  yes/no/defer on each.
- [`model-race-auto.md`](model-race-auto.md). Pre-existing deferral.
  The `--auto` flag for `model-race start`. Cross-CLI parallel session
  orchestration via a per-CLI adapter contract. Risky (per-CLI
  maintenance surface); parked to v0.3 with the design locked.
- `nucleus --semantic`. Pre-existing deferral. Local embeddings via
  `@xenova/transformers`. Risky (embedding-model + vector-store +
  indexing decisions). If v0.3 picks up SQLite migration (#16), this
  rides on top.

## Build order

**v0.1 (locked, built)**: nucleus → learnings → docker → model-race.
`atom-setup` built incrementally as features came online.

**v0.1.2 (shipped 2026-05-07)**: fresh-clone install crash fix.

**v0.2 (locked 2026-05-07, in build)**:

```
Wave 1 — foundation, parallelizable, ~1 day
  #2  VERSION + atom upgrade
  #3  ./atom-setup --reinstall flag
  #4  nucleus schema migration tooling
  #5  live gh repo create
  #8  Migration doc for in-place users

Wave 2 — user-facing features, parallelizable, ~3 days
  #6  Stack presets (5 new)
  #7  speckit-constitution integration

Wave 3 — distribution architecture, sequential, ~2 days
  #9   ~/.atom/atom/ install + atom-setup new <name>
  #10  install.sh curl one-liner + README rewrite
  #11  bin/atom-update-check + snooze
```

Wave 3 is preauthorized to de-scope to v0.2.1 if it hits a design
wall (most likely the in-place migration story).

**v0.3 (candidate list, not locked)**:

See [`v0.3.md`](v0.3.md) for the full list. Nine items total:

- #12 Hook-driven nucleus capture (`Stop` hook)
- #13 `UserPromptSubmit` auto-injection of nucleus + learnings
- #14 `PreCompact` / `PostCompact` hooks for nucleus
- #15 `atom doctor` command
- #16 Move nucleus to SQLite + FTS5
- #17 Research / wiki layer
- #18 Cost tracking surface
- #19 `model-race --auto` (pre-existing deferral, design locked)
- #20 `nucleus --semantic` (pre-existing deferral, design locked)

The v0.3 planning session decides yes/no/defer on each candidate.
#12–#18 came from the `rohitg00/pro-workflow` comparison analysis;
#19–#20 carried over from v0.2 with their design already locked.

## Status

All v0.1 plans built. All v0.2 plans locked (2026-05-07). v0.3
items have full design locked but build is deferred. Decisions
reached through guided planning. No re-litigation without a written
reason.
