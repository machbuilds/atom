# Changelog

All notable changes to atom land here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

## [Unreleased]

Tracking work targeting v0.2. See `docs/planning/` for in-flight build plans.

### Added

- **`atom upgrade`** subcommand on the `atom` help dispatcher. Detects the install location (`$ATOM_INSTALL` env override → `~/.atom/atom/` → realpath walk-up from this script), reads the local `VERSION` (added in 0.1.3), fetches upstream, and on a mismatch runs `git pull --ff-only` followed by `npm install` + `npm install -g .` for every CLI. Refuses to upgrade if the install dir's git tree is dirty. Network failure is silent and degrades to a no-op. `atom upgrade --check` polls without installing.
- **`ATOM_VERSION_URL`** env override (testing affordance) — defaults to the `raw.githubusercontent.com` URL; `data:` URLs are accepted for offline tests.
- **`./atom-setup --reinstall`** flag on the bash wrapper. Forces re-install of every atom CLI globally even when they're already on PATH. Useful when a global is stale or pointing at an old clone. Stop-gap until `atom upgrade` is the daily refresh path; both flow through the same `npm install` + `npm install -g .` shape that landed in 0.1.2. The flag is consumed by the wrapper and not forwarded to the wizard.
- **nucleus schema migration framework.** New `nucleus migrate` subcommand walks every `~/.atom/nucleus/projects/*/learnings.jsonl` and applies pending migrations from a versioned registry at `bin/nucleus/src/migrations/00X-*.js`. Each migration takes `{header, entries}` and returns `{header, entries}`; the runner writes back atomically (`.tmp` + rename) under the same `proper-lockfile` lock that `appendEntry` uses, so concurrent `nucleus add` cannot race. `--dry-run` previews; `--quiet` suppresses per-file lines. Auto-triggered lazily on `nucleus add` and `nucleus search`: O(1) per-file check (read first line, compare header version) — silent when up-to-date, prints a one-line "migrated N file(s)" notice when not.
- **First migration: `001-add-header.js`.** Prepends `{"_atom_nucleus": true, "_schema": 1}` to legacy v0.1.x JSONL files lacking it. Entries are unchanged; the header gives future migrations an O(1) version-check path. `readEntries()` now skips header lines so existing search/promote/sync flows keep working before and after migration.
- **`gh repo create` integration in wizard §10.** When the user picks "Create new GitHub repo via gh", the writer now calls `gh repo create <user>/<name> --private|--public --source <root> [--push]` after the initial commit. Visibility (private/public) is collected from a new prompt in section 10. On failure, the wizard logs the exact retry command and continues — the project is always left in a working local state. `choice = 'existing'` similarly runs `git remote add origin <url>` and optional `git push -u origin main`, both with non-fatal error handling.

### Notes

- Existing 0.1.x users won't have `atom upgrade` until they install v0.2 once manually (it's the verb that enables itself). After that, every future release is one command.

## [0.1.3] — 2026-05-07

Hotfix surfaced by an end-to-end isolated install test of `release/v0.2`. Existing 0.1.2 users in any working state are unaffected; the bug only bites a fresh `git clone + ./atom-setup` on a machine that doesn't already have `atom-setup` on PATH.

### Fixed

- **`./atom-setup` silently skipped installing `atom-setup` itself.** The bash wrapper's `find_global()` rebuilds PATH via `echo "$PATH" | tr ':' '\n' | grep -v ^$ATOM_DIR$ | tr '\n' ':'`. The final `tr` left a **trailing colon**, which bash interprets as cwd. When the wrapper is run from inside the source dir, cwd contains a file named `atom-setup` (the wrapper itself), so `command -v atom-setup` returned `./atom-setup` and the install loop took the "already installed, skipping" path. `find_global` now strips both empty PATH components and the trailing colon.

### Added

- **`VERSION`** at the repo root. Plain text, single line. Forward-compatible with the `atom upgrade` verb landing in v0.2 (the upgrade verb polls this file on `main` to decide whether a new release is available).

## [0.1.2] — 2026-05-07

Patch release. Single fix to the install path so a fresh `git clone + ./atom-setup` actually works.

### Fixed

- **`./atom-setup` install crash on fresh clones.** The bash wrapper ran `npm install -g .` in each `bin/<cli>/` without first running `npm install` (no `-g`) to populate the source's `node_modules/`. Result: the global install "succeeded" but invoking any installed CLI immediately crashed with `ERR_MODULE_NOT_FOUND` for `commander` (and other ESM deps) — Node was resolving imports against the source dir's missing `node_modules/`. Wrapper now runs `npm install` for each CLI before the global install. Existing users on `0.1.1` who already have the CLIs working are unaffected; the bug only bites a true fresh clone.

## [0.1.1] — 2026-05-06

Architectural refactor of the nucleus + learnings story. **No new features**, but the conceptual model is now coherent and the storage layout is namespaced under `~/.atom/`.

### Changed

- **`learnings` is now user-owned, not maintainer-curated.** Previously, `learnings/` was a directory in the atom repo where the maintainer's curated wisdom lived; new projects inherited it at clone time. That conflated maintainer content with user data and confused the privacy story. Now `learnings` is the user's *own* playbook, lives at `~/.atom/learnings/` on their machine, and follows them across every new project they bootstrap. atom ships the system; the content is theirs alone. Optional sync to *their* private GitHub repo (separate from the nucleus sync repo).
- **Storage moved from `~/.nucleus/` to `~/.atom/nucleus/`.** Namespace consistency with `~/.atom/learnings/` and any future per-machine atom state (config, cache, etc.). Migration is one-shot: `nucleus` detects `~/.nucleus/` on first run and renames it to `~/.atom/nucleus/`.
- **`nucleus promote <id>`** now writes into `~/.atom/learnings/<type>/<key>.md` (the user's playbook) instead of the atom repo's `learnings/`.
- **`scripts/copy-learnings.mjs`** sources from `~/.atom/learnings/` by default (was `./learnings`).
- **`atom-setup` writer** copies learnings from the user's `~/.atom/learnings/` into the new project, filtered by stack tags. No-op when the user hasn't run `learnings init` or hasn't promoted anything yet.
- **README, AGENTS.md, planning docs** rewritten to make the nucleus-vs-learnings distinction unmissable. Both layers framed as "100% yours."

### Added

- **`learnings` CLI** at `bin/learnings/` — `init`, `list`, `show`, `remove`, `sync`. Mirrors the nucleus CLI's shape. Promote target for `nucleus promote`.
- **`atom` CLI** at `bin/atom/` — top-level help dispatcher. `atom --help` (or `atom`) prints the unified command table for every CLI in the atom system. No subcommand routing; pure discovery surface.
- **Setup nudges** in the post-`atom-setup` cheatsheet and Claude nucleus skill: prompt the user to run `nucleus init && learnings init` once per machine.

### Removed

- **`atom/learnings/`** (the maintainer-curated directory) — removed from the repo. The system (taxonomy doc, copy script, promote flow) stays; the content is no longer atom's.

### CLI count

`./atom-setup` now installs **5 CLIs** globally: `atom`, `atom-setup`, `nucleus`, `learnings`, `model-race`.

## [0.1.0] — 2026-05-05

First feature-complete release. atom is a project-starter template with cross-project memory, multi-tool AI support, and an opinionated dev workflow.

### Added

- **`atom-setup`** — interactive wizard (Node + clack). Four modes: `--bare`, `--minimal`, default, `--full`. Ten sections cover project basics, stack, license, Docker tier, CI/CD, git. Pre-flight detection, smart defaults from environment, resumable state, dry-run, final confirmation screen.
- **`nucleus`** — cross-project learning store CLI. Subcommands: `init`, `add`, `search`, `sync`, `promote`, `slug`. JSONL storage at `~/.atom/nucleus/projects/<slug>/`, optional GitHub sync, keyword + structured filter search, three capture modes (claude-managed, auto-timer, manual).
- **`learnings/`** — graduation layer for nucleus entries that pass the generalisation test. Files inherit into bootstrapped projects via `scripts/copy-learnings.mjs`, filtered by stack tags from `docs/LEARNINGS_TAXONOMY.md`.
- **`model-race`** — parallel AI model comparison via Git worktrees. Subcommands: `start`, `status`, `spec`, `launch`, `score`, `judge`, `merge`, `abort`. Weighted scorecard (pass-fail and numeric-min metrics), opt-in LLM judge, configurable per-project via `model-race.config.json`.
- **Docker** — four optional tiers in `extras/docker/`: None, Dockerfile only, + compose, + devcontainer. Smart-defaulted from stack and deploy target. Production-grade defaults: multi-stage build, non-root user, healthcheck, pinned base image, BuildKit cache mounts, multi-arch CI workflow.
- **Multi-AI tool support** — `AGENTS.md` is the canonical instructions file. `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.github/copilot-instructions.md` are forwarders. Claude Code, Codex CLI, Gemini CLI, Cursor, and GitHub Copilot all read the same source of truth.
- **Stack preset** — Next.js + Railway in `extras/web/nextjs-railway/`, with stack-specific Dockerfile and config templates.
- **Planning docs** — `docs/planning/{atom-setup,nucleus,learnings,docker,model-race}.md` capture every locked design decision with rationale.
- **Voice doc** — `docs/VOICE.md` defines atom's writing style. Applies to every doc in atom and every project bootstrapped from it.
- **Repo hygiene** — `LICENSE` (MIT), `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `.github/workflows/ci.yml`, PR + issue templates.

### Notes

- atom is built primarily for Claude Code. Other AI tools work via `AGENTS.md` but get fewer skill-system features (slash commands, Skill auto-invocation) until those tools grow richer integration surfaces.
- `model-race --auto` (parallel session orchestration across CLIs) is documented but reserved for v0.2.
- Stack presets currently include `nextjs` only. Other stacks fall back to the generic scaffold and will land per-stack in v0.2.
- Constitution generation is a TODO marker in the cheatsheet; v0.2 will wire `speckit-constitution` automatically.

[Unreleased]: https://github.com/machbuilds/atom/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/machbuilds/atom/releases/tag/v0.1.3
[0.1.2]: https://github.com/machbuilds/atom/releases/tag/v0.1.2
[0.1.1]: https://github.com/machbuilds/atom/releases/tag/v0.1.1
[0.1.0]: https://github.com/machbuilds/atom/releases/tag/v0.1.0
