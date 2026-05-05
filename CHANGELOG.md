# Changelog

All notable changes to atom land here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

## [Unreleased]

Tracking work targeting v0.2. See `docs/planning/` for in-flight build plans.

## [0.1.0] — 2026-05-05

First feature-complete release. atom is a project-starter template with cross-project memory, multi-tool AI support, and an opinionated dev workflow.

### Added

- **`atom-setup`** — interactive wizard (Node + clack). Four modes: `--bare`, `--minimal`, default, `--full`. Ten sections cover project basics, stack, license, Docker tier, CI/CD, git. Pre-flight detection, smart defaults from environment, resumable state, dry-run, final confirmation screen.
- **`nucleus`** — cross-project learning store CLI. Subcommands: `init`, `add`, `search`, `sync`, `promote`, `slug`. JSONL storage at `~/.nucleus/projects/<slug>/`, optional GitHub sync, keyword + structured filter search, three capture modes (claude-managed, auto-timer, manual).
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

[Unreleased]: https://github.com/mach273/atom/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mach273/atom/releases/tag/v0.1.0
