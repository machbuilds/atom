# Changelog

All notable changes to atom land here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

## [Unreleased]

In progress — remaining v0.2 items. See `docs/planning/v0.2.md`.

## [0.2.1] — 2026-05-09

### Added

- **Five new stack presets** under `extras/<category>/<preset>/`, raising the wizard's preset coverage from 1 to 6:
  - **Python / FastAPI** (`extras/web/python-fastapi/`) — `pyproject.toml` pinned to Python 3.12 + FastAPI + Pydantic v2; `app/main.py` with `/healthz` and lifespan; multi-stage Dockerfile (builder venv → runtime, non-root, healthcheck); Railway as default deploy target.
  - **Swift / Vapor** (`extras/web/swift-vapor/`) — `Package.swift` pinned to Vapor 4 + Swift 5.10; `Sources/App/configure.swift` binds `0.0.0.0:PORT`; multi-stage Dockerfile with static-Swift-stdlib build; Fly.io as default deploy target.
  - **Rust / Axum** (`extras/web/rust-axum/`) — `Cargo.toml` pinned to Axum 0.7 + Tokio 1 + tracing; `src/main.rs` with `/healthz` and `EnvFilter` log setup; cargo-chef Dockerfile + distroless runtime; Fly.io as default.
  - **Go CLI / Cobra** (`extras/cli/go-cobra/`) — `go.mod` pinned to Go 1.23 + Cobra 1.8; root + sample subcommand; `.goreleaser.yaml` for cross-platform release binaries; tag-push GitHub Action; no Docker (binaries distributed via GitHub Releases).
  - **TypeScript library** (`extras/lib/typescript-library/`) — strict-mode `tsconfig.json`; `tsup.config.ts` for dual ESM + CJS + `.d.ts` output; `package.json` with `exports` map, `files` allowlist, `publishConfig.provenance: true`; vitest + npm-publish workflow with provenance.
- **3 seeded learnings per preset** (15 total) with `applies_to:` matching the preset's stack tags. Each learning is a real best practice, not invented filler — e.g., "Use cargo-chef for Rust Docker builds", "Static-link the Swift stdlib for Linux deploys", "Bind to 0.0.0.0, not localhost, inside containers".
- **Stack-specific Quick Start in the project README.** Each preset ships a `README.snippet.md` that the writer splices into `<root>/README.md` (replacing a `{{QUICK_START}}` placeholder), and `{{PROJECT_NAME}}` / `{{DESCRIPTION}}` are substituted from the wizard's answers. Before this, bootstrapped projects had no README; now they have one tuned to whatever stack was picked.
- **Language values in `LEARNINGS_TAXONOMY.md`'s `applies_to` vocabulary** — `node`, `python`, `rust`, `go`, `swift`. Pre-v0.2 the taxonomy said language tags belong only in `tags:`; with per-language presets, language-level filtering became necessary so a Pydantic learning doesn't ship to a Rust project.

### Fixed

- **`<project>/learnings/` was being deleted after copy.** `manifest.js`'s `REMOVE_AFTER_PROMOTE` had `'learnings'` in it — a leftover from v0.1.0 when the repo carried a maintainer-curated `learnings/` directory. v0.1.1 removed that directory but the cleanup entry stayed, silently wiping every user playbook learning + every preset seed learning that landed in `<project>/learnings/`. Removed the entry; verified by new test assertions (`8.7`, `9.5`, `10.5`, `11.6`, `12.7`).
- **Generic Docker tier no longer overwrites preset's stack-tuned Dockerfile.** Previously, picking `dockerTier = 'dockerfile'` after a stack with its own preset Dockerfile (now: any of the 4 web presets) would overwrite the stack-tuned file with the generic one from `extras/docker/`. `copyDockerTier` now skips destinations that already exist; the generic workflow file at `.github/workflows/docker.yml` still lands because the preset doesn't ship that.

### Wizard plumbing

- **Stack list expanded from 13 → 18 entries.** The 6 preset-mapped values are grouped at the top with `preset:` hints; non-preset stacks (React, Astro, Node API, etc.) are below with `(no preset)` hints so users can see at a glance which paths get opinionated scaffolding. Existing values stay for back-compat with older `.atom-setup-state.json` files.
- **`STACK_PRESET_DIR` and `STACK_TAGS`** in `manifest.js` updated to map each new preset to its directory and tag set. `suggestDockerTier()` extended to return `'none'` for `go-cobra` and `ts-library` (CLI / library distributions don't ship Docker images).

### Tests

- 32 new assertions in `scripts/test-atom-setup.sh` covering: every preset's signature files at root, `/healthz` route presence in web presets, no Dockerfile in CLI / library presets, the docker-tier-skips-preset behavior, README placeholder substitution, README snippet splice + cleanup. Suite total: **92 / 92** passing.

## [0.2.0] — 2026-05-08

### Added

- **`atom upgrade`** subcommand on the `atom` help dispatcher. Detects the install location (`$ATOM_INSTALL` env override → `~/.atom/atom/` → realpath walk-up from this script), reads the local `VERSION` (added in 0.1.3), fetches upstream, and on a mismatch runs `git pull --ff-only` followed by `npm install` + `npm install -g .` for every CLI. Refuses to upgrade if the install dir's git tree is dirty. Network failure is silent and degrades to a no-op. `atom upgrade --check` polls without installing.
- **`ATOM_VERSION_URL`** env override (testing affordance) — defaults to the `raw.githubusercontent.com` URL; `data:` URLs are accepted for offline tests.
- **`./atom-setup --reinstall`** flag on the bash wrapper. Forces re-install of every atom CLI globally even when they're already on PATH. Useful when a global is stale or pointing at an old clone. Stop-gap until `atom upgrade` is the daily refresh path; both flow through the same `npm install` + `npm install -g .` shape that landed in 0.1.2. The flag is consumed by the wrapper and not forwarded to the wizard.
- **nucleus schema migration framework.** New `nucleus migrate` subcommand walks every `~/.atom/nucleus/projects/*/learnings.jsonl` and applies pending migrations from a versioned registry at `bin/nucleus/src/migrations/00X-*.js`. Each migration takes `{header, entries}` and returns `{header, entries}`; the runner writes back atomically (`.tmp` + rename) under the same `proper-lockfile` lock that `appendEntry` uses, so concurrent `nucleus add` cannot race. `--dry-run` previews; `--quiet` suppresses per-file lines. Auto-triggered lazily on `nucleus add` and `nucleus search`: O(1) per-file check (read first line, compare header version) — silent when up-to-date, prints a one-line "migrated N file(s)" notice when not.
- **First migration: `001-add-header.js`.** Prepends `{"_atom_nucleus": true, "_schema": 1}` to legacy v0.1.x JSONL files lacking it. Entries are unchanged; the header gives future migrations an O(1) version-check path. `readEntries()` now skips header lines so existing search/promote/sync flows keep working before and after migration.
- **`gh repo create` integration in wizard §10.** When the user picks "Create new GitHub repo via gh", the writer now calls `gh repo create <user>/<name> --private|--public --source <root> [--push]` after the initial commit. Visibility (private/public) is collected from a new prompt in section 10. On failure, the wizard logs the exact retry command and continues — the project is always left in a working local state. `choice = 'existing'` similarly runs `git remote add origin <url>` and optional `git push -u origin main`, both with non-fatal error handling.

### Notes

- Existing 0.1.x users won't have `atom upgrade` until they install v0.2.0 once manually (it's the verb that enables itself). After that, every future release is one command.
- v0.2 is being shipped incrementally; remaining items (stack presets, speckit-constitution, distribution overhaul) will land as patch releases on the v0.2 line.

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

[Unreleased]: https://github.com/machbuilds/atom/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/machbuilds/atom/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/machbuilds/atom/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/machbuilds/atom/releases/tag/v0.1.3
[0.1.2]: https://github.com/machbuilds/atom/releases/tag/v0.1.2
[0.1.1]: https://github.com/machbuilds/atom/releases/tag/v0.1.1
[0.1.0]: https://github.com/machbuilds/atom/releases/tag/v0.1.0
