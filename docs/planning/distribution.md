# distribution — architectural plan

> Status: planned (locked decisions, build in v0.2 Wave 3).
> Implementation lands across `bin/atom/`, `bin/atom-setup/`, the
> bash wrapper, `install.sh` (new), and `README.md`.
> Updated: 2026-05-07
> Related: [`v0.2.md`](v0.2.md) for the milestone slotting,
> [`atom-setup.md`](atom-setup.md) for current wizard internals.

## What it is

The story for how a user installs atom on their machine, how they
upgrade it when a new release ships, and how the maintainer iterates
on atom's source without disturbing their own user install. Today
those flows are tangled. This plan separates them.

## Why

Three concrete pains in the v0.1.x model:

1. **No upgrade story.** Once a user has atom installed, they have
   no command to fetch a new release. Their only path is re-cloning
   or re-running `./atom-setup` from a stale clone — and the wrapper
   only triggers install when a CLI is *missing*, so stale globals
   stay stale.
2. **Dev and use collide on the maintainer's machine.** Working on
   atom's source while also using atom for real projects means edits
   to the dev clone instantly become "live" for the user install.
   Breaking changes ship before the maintainer chooses to ship them.
3. **The wizard mutates the clone.** Re-running `atom-setup` against
   an existing project clone risks clobbering it. There's nowhere
   stable to `git pull` against, because every clone is also a
   candidate project.

## Locked decisions

| Decision | Choice | Why |
|---|---|---|
| Distribution channel | **Git, not npm registry.** atom is a template repo, not a package. The wizard reads `scaffold/`, `extras/`, `docs/` from inside the cloned tree. npm-only would still need git for templates → split upgrade flow, worse UX. gstack solves the same shape (template + skill bundle) with git only. |
| Canonical user install | **`~/.atom/atom/`**, alongside `~/.atom/nucleus/` and `~/.atom/learnings/`. | One namespace for all per-machine atom state. Reinforces the user-owned principle. |
| Source of truth for version | **Plain `VERSION` file at repo root.** | Same pattern as gstack. Polled via `raw.githubusercontent.com/.../main/VERSION` — no GitHub API, no auth. |
| Upgrade verb | **`atom upgrade`** subcommand on the existing `atom` help dispatcher. | One verb, one place. Mirrors `gstack-upgrade`. |
| New-project verb | **`atom-setup new <name>`**. Creates a fresh dir, scaffolds from `~/.atom/atom/`. | Decouples "atom source" from "the project being bootstrapped." The current in-place `./atom-setup` becomes a deprecated path with one release of grace. |
| Install entry point | **`curl … \| bash`** one-liner, plus the manual `git clone` path. | Polished UX on top of git. Same shape as gstack's install. Now possible because the repo is public. |
| Auto-update notice | **`bin/atom-update-check`** runs lazily on any atom CLI invocation. Capped at one check per 6h. Snoozable 24h / 48h / 7d. | Users won't know to run `atom upgrade`. Gentle nudge handles that. |

## Reference: gstack pattern (the model we're adapting)

| Piece | gstack | atom equivalent |
|---|---|---|
| Install one-liner | `curl … \| bash` clones to `~/.claude/skills/gstack` and runs `./setup` | `curl … \| bash` clones to `~/.atom/atom/` and runs `./install.sh` |
| Version source | `VERSION` file at root | Same |
| Auto-update check | `bin/gstack-update-check` curls `raw.githubusercontent.com/.../main/VERSION`, throttled, snoozable, network-safe-silent | `bin/atom-update-check`, same behavior |
| Upgrade command | `/gstack-upgrade` skill | `atom upgrade` subcommand |
| Snooze | Tiered (24h / 48h / 7d). Resets on new version. | Same |
| State dir | `~/.gstack/` | `~/.atom/state/` |

## Layout (v0.2 Wave 3 + after)

```
~/.atom/
  atom/                  ← user install (clone of github.com/machbuilds/atom)
    bin/                   atom, atom-setup, nucleus, learnings, model-race
    scaffold/              template files copied into new projects
    extras/                stack presets, docker tiers
    docs/                  reference docs (read-only at this layer)
    install.sh             one-shot installer (used by curl pipe)
    atom-setup             bash wrapper (legacy, kept for in-place users)
    VERSION                source of truth for version polling
  nucleus/               ← user data (raw session memory)
  learnings/             ← user data (curated playbook)
  state/
    update-check.json    ← throttle + snooze state for atom-update-check
```

Anywhere a project gets created lives wherever the user puts it
(`~/code/<project>/`, `~/work/<project>/`, etc.). The wizard reads
from `~/.atom/atom/` and writes into the user-chosen path.

## Build order (v0.2 Wave 3)

The architectural shift is sequenced so each step is shippable on
its own:

1. **#2 `VERSION` + `atom upgrade`** (Wave 1, prerequisite). Without
   the upgrade verb, the curl one-liner has nothing to recommend on
   re-run.
2. **#9 `~/.atom/atom/` install + `atom-setup new <name>`**. The
   structural change. Source separates from project. Old in-place
   model gets a deprecation notice.
3. **#10 `install.sh` + README rewrite**. Adds the curl one-liner.
   README Quick Start changes from "git clone … && cd … &&
   ./atom-setup" to "curl … | bash" + "atom-setup new my-project."
4. **#11 `bin/atom-update-check` + snooze**. The auto-notification
   loop closes.

#8 (migration doc) ships in the same release as #9 + #10 so
existing users have a path forward.

## Open questions (answered before build starts)

1. **One-shot migration for in-place users**: yes. `atom migrate-install`
   subcommand walks the user from "in-place clone at `~/work/atom`"
   to "user install at `~/.atom/atom/`," updating globals to point
   at the new location. Mirrors the `~/.nucleus/` → `~/.atom/nucleus/`
   precedent. Documented in #8 (migration doc). Manual for users who
   prefer it; auto for the impatient.
2. **Repo URL stability**: `https://github.com/machbuilds/atom`.
   Public as of 2026-05-07. Curl one-liner is unblocked.
3. **VERSION bump policy**: bumped on every tagged release (matches
   the existing CHANGELOG cadence). Never on `main` HEAD alone —
   `atom upgrade` only acts on tagged versions.
4. **What happens if `~/.atom/atom/` is dirty during `atom upgrade`?**
   Refuse with a clear message. The user's install dir should be
   pristine; if they've been editing it, they're on the maintainer
   path and should `git pull` themselves.

## What this plan does NOT cover

- **Publishing to the npm registry.** Explicitly rejected (see
  decision table). atom is a template repo; the npm registry is
  for packages.
- **Hosted "atom service"** (web UI, central sync). Out of scope
  permanently per the user-owned-data principle (every layer of
  cross-project knowledge stays on the user's machine; sync, when
  opted-in, points at the user's own GitHub repo).
- **Self-update mechanism that bypasses git.** The model is
  `git pull` under the hood; the user-facing verb (`atom upgrade`)
  just polishes it. This keeps the source-of-truth single and
  inspectable.
- **Auto-update that runs on a schedule (cron, launchd).**
  `bin/atom-update-check` is lazy; it runs when the user runs an
  atom CLI. No background process is installed.
- **GPG signature verification on install / upgrade.** Defer until
  there's a concrete threat model; the curl-pipe security story
  lives in `SECURITY.md` and currently leans on git tag verification.

## Maintainer dev/use separation (current state, 2026-05-07)

Already achieved manually; the architectural items in this plan
formalize it:

- **`~/work/atom-dev/`** is the dev source. Edits here do NOT affect
  the user install. Push from here.
- **`~/.atom/atom/`** is the user install (cloned from
  `https://github.com/machbuilds/atom.git`). Globals symlink here.
- **`~/.atom/nucleus/`** and **`~/.atom/learnings/`** are personal
  stores, synced to the maintainer's own private GitHub repos.
- **Manual upgrade procedure** (until #2 ships):
  ```bash
  cd ~/.atom/atom && git pull && \
    for cli in bin/atom bin/atom-setup bin/nucleus bin/learnings bin/model-race; do
      (cd "$cli" && npm install && npm install -g .)
    done
  ```

This is what `atom upgrade` will codify. The `npm install && npm
install -g .` shape is the same fix that landed in v0.1.2; it's
load-bearing.

## Risks at build time

- **Migration churn.** Users on the in-place model who don't run
  the migration end up with stale globals pointing at a clone that
  may have been deleted or reorganized. Mitigation: #8 (migration
  doc), `atom migrate-install` auto path, and a one-release
  deprecation window where both models work.
- **`curl | bash` skepticism.** Some users won't install via curl
  pipe. README must offer the manual `git clone` path equally.
  `SECURITY.md` should document the trust model.
- **`~/.atom/atom/` collisions.** If a user already has the dir
  (manual experiment, leftover from this dev cycle, etc.), the
  installer refuses with a clear message. No silent overwrites.
- **PATH not set after install.** If the user's npm prefix isn't
  on PATH, every install procedure fails the same way. The 0.1.2
  wrapper already prints the canonical EACCES guidance — same path.
- **Update check noise.** Lazy startup adds latency. Cap at 50ms
  via a fork-and-die child; if the network call hasn't returned,
  the user sees nothing. Same as gstack.

## Dependencies

- Wave 1 #2 (`VERSION` + `atom upgrade`) must ship before Wave 3
  items have anything coherent to recommend.
- The 0.1.2 install fix (`npm install` before `npm install -g .`)
  is load-bearing for both `install.sh` and `atom upgrade`. Already
  shipped.
- Repo public: required for the curl one-liner. Done 2026-05-07.
- `SECURITY.md` needs a small section on the curl-pipe trust model
  before #10 lands.
