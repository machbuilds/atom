# distribution — build plan

> ⚠️ **EPHEMERAL — DELETE AFTER DISCUSSION.** This file was committed only to
> share planning notes across Conductor workspaces. Once the discussion wraps,
> `git rm` it. Do not treat as a long-lived planning doc.

> Status: planned (locked decisions, not yet built).
> Updated: 2026-05-07
> Related: `docs/planning/atom-setup.md` (current install bash wrapper)

## What it is

The story for how a user installs atom on their machine, how they upgrade it
when a new release ships, and how the developer (you) can iterate on atom-dev
without affecting their own user install. Today these flows are tangled — the
folder a user clones IS the project the wizard transforms IS the same folder
where atom-dev development happens. This plan separates them.

## Why

Three concrete pains today:

1. **No upgrade story.** Once a user has atom installed, they have no command
   to fetch a new release. Their only path is re-cloning or re-running
   `./atom-setup` from a stale clone (which doesn't even refresh stale globals
   — only triggers install if a CLI is *missing*).

2. **Dev and use collide on the maintainer's machine.** Working on atom-dev
   while also using atom for real projects means edits to the dev folder
   instantly become live for the "user" install. Breaking changes ship before
   the developer chooses to ship them.

3. **The wizard mutates the clone.** Re-running atom-setup against an existing
   clone risks clobbering it. There's nowhere stable to `git pull` against,
   because every clone is also a candidate project.

## Locked decisions

| Decision | Choice | Why |
|---|---|---|
| Distribution channel | Git, not npm registry | atom is a template repo, not a package. The wizard reads `scaffold/`, `extras/`, `docs/` from inside the cloned tree. npm-only would still require git for templates → split upgrade flow. gstack solves the same shape (template + skill bundle) with git only. See `~/.claude/projects/-Users-mach-work-atom-dev/memory/atom_distribution_decision.md`. |
| Canonical user install location | `~/.atom/atom/` | Sits next to `~/.atom/nucleus/` and `~/.atom/learnings/`. One namespace for all per-machine atom state. |
| Source of truth for version | Plain `VERSION` file at repo root | Same pattern as gstack. Polled via raw GitHub URL — no API needed, no auth. |
| Upgrade UX | `atom upgrade` subcommand on the existing `atom` help dispatcher | One verb, one place, mirrors `gstack-upgrade`. |
| New-project UX | `atom-setup new <name>` (creates fresh dir, scaffolds from `~/.atom/atom/`) | Decouples "atom source" from "the project being bootstrapped." The current `./atom-setup` in-place model becomes a deprecated path. |
| Install entry point | `curl ... | bash` one-liner | Polished UX on top of `git clone + setup`. Same shape as gstack's install. |

## Reference: gstack pattern (the model we're adapting)

| Piece | gstack implementation | atom equivalent |
|---|---|---|
| Install | `git clone --depth 1 ... ~/.claude/skills/gstack && ./setup` | `git clone ... ~/.atom/atom && cd ~/.atom/atom && ./setup` (or curl one-liner) |
| Version source | `VERSION` file at root | Same |
| Auto-update check | `bin/gstack-update-check` curls `raw.githubusercontent.com/.../main/VERSION`, throttled, snoozable, network-safe-silent | `bin/atom-update-check` (new), same behavior |
| Upgrade command | `/gstack-upgrade` skill | `atom upgrade` subcommand (extends existing help dispatcher) |
| Snooze | Tiered (24h / 48h / 7d). Resets on new version. | Same |
| State dir | `~/.gstack/` | Already have `~/.atom/state/` namespace available |

## Build order

Smallest first, biggest payoff first within size class.

1. **Install-path dependency bug** (~30 min) — `./atom-setup` runs `npm install -g .`
   without first running `npm install` in the source dir. Fresh clones crash with
   `ERR_MODULE_NOT_FOUND`. Already documented in `docs/planning/atom-setup.md`.
   Fix: prepend `(cd "$ATOM_DIR/bin/$cli" && npm install)` to the loop.

2. **`VERSION` file + `atom upgrade` subcommand** (~1 hour) — smallest change,
   biggest single-step win. Adds a real upgrade verb users can rely on.

3. **`./atom-setup --reinstall` flag** (~30 min) — closes the "stale globals"
   gap. Forces re-install even when CLIs are present. Stop-gap until the
   architectural shift below lands.

4. **Architectural shift: `~/.atom/atom/` install + `atom-setup new <name>`**
   (~half-day) — the structural change. Wizard reads templates from its
   installed location, scaffolds into a fresh target dir. Old in-place
   behavior becomes deprecated path with a one-release deprecation notice.

5. **`install.sh` one-liner + README rewrite** (~1-2 hours) — the curl install
   experience. Updates Quick Start in README to the new flow.

6. **`bin/atom-update-check` + snooze** (~half-day) — auto-update notification.
   Hooks into shell or runs lazily when any atom CLI starts. Ports gstack's
   throttle/snooze logic with naming changes.

7. **Migration doc for existing users** (~30 min) — any user on the old
   in-place model needs guidance: clone fresh to `~/.atom/atom/`, re-run
   `./atom-setup`, optionally remove old clones.

## Open questions to answer before build starts

1. **One-shot migration**: `nucleus` did this for `~/.nucleus/` → `~/.atom/nucleus/`.
   Should `atom upgrade` do the same for users who installed via the old
   in-place model? Or just document the manual migration?

2. **Repo URL stability**: install one-liner needs a fixed URL. Stays at
   `https://github.com/machbuilds/atom`. Note: repo is currently private —
   curl install will fail without auth until repo goes public.

3. **VERSION bump policy**: who bumps and when? Tied to the existing
   CHANGELOG.md cadence — bump on every tagged release, never on master HEAD
   alone.

## What this plan does NOT cover

- Publishing to the npm registry. Explicitly rejected; see decision table.
- Hosted "atom service" (web UI, central sync). Out of scope per the
  user-owned-data principle (`~/.claude/projects/-Users-mach-work-atom-dev/memory/atom_user_owned_principle.md`).
- A self-update mechanism that bypasses git. The model is `git pull` under
  the hood; the user-facing verb (`atom upgrade`) just polishes it.

## Current state on the maintainer's machine (2026-05-07)

Already done in this session — gives the dev/use separation TODAY without
the architectural shift:

- `~/work/atom-dev/` is the dev source. Edits here do NOT affect the user
  install. Push from here.
- `~/.atom/atom/` is the user install (cloned from
  `https://github.com/machbuilds/atom.git`). Globals symlink here.
- `~/.atom/nucleus/` and `~/.atom/learnings/` are personal stores, synced
  to private GitHub repos.
- Upgrade procedure for the user install (manual until `atom upgrade` ships):
  `cd ~/.atom/atom && git pull && for cli in bin/atom bin/atom-setup bin/nucleus bin/learnings bin/model-race; do (cd "$cli" && npm install && npm install -g .); done`

The user install is now a clean dogfooding surface. Real projects bootstrap
via `git clone <atom-repo> <project-dir> && cd <project-dir> && ./atom-setup`
(in-place model) until item 4 above lands.
