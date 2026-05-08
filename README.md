<div align="center">

<pre>
   █████╗ ████████╗ ██████╗  ███╗   ███╗
  ██╔══██╗╚══██╔══╝██╔═══██╗ ████╗ ████║
  ███████║   ██║   ██║   ██║ ██╔████╔██║
  ██╔══██║   ██║   ██║   ██║ ██║╚██╔╝██║
  ██║  ██║   ██║   ╚██████╔╝ ██║ ╚═╝ ██║
  ╚═╝  ╚═╝   ╚═╝    ╚═════╝  ╚═╝     ╚═╝
</pre>

### Every project starts here. Every lesson travels with you.

A project-starter template with cross-project memory, multi-tool AI support, and an opinionated dev workflow baked in.

<br>

[![License: MIT](https://img.shields.io/badge/License-MIT-00bcd4?style=for-the-badge)](LICENSE)
[![Node 18+](https://img.shields.io/badge/node-%E2%89%A518-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Build: v0.2.1](https://img.shields.io/badge/build-v0.2.1-00bcd4?style=for-the-badge)](docs/planning/)
[![AI Tools](https://img.shields.io/badge/AI%20tools-Claude%20%C2%B7%20Codex%20%C2%B7%20Gemini%20%C2%B7%20Cursor%20%C2%B7%20Copilot-7c4dff?style=for-the-badge)](#tool-compatibility)

</div>

---

## Contents

[**Requirements**](#requirements) · [**Quick start**](#quick-start) · [**Modes**](#modes) · [**Features**](#what-atom-gives-you) · [**What is nucleus**](#what-is-nucleus) · [**Comparison**](#how-it-compares) · [**Compatibility**](#tool-compatibility) · [**Docs**](#documentation) · [**Roadmap**](#roadmap)

---

## Requirements

Before you clone, make sure you have:

| Tool | Required? | Why | Check |
|---|---|---|---|
| **Node.js 18+** | Required | atom's three CLIs (`atom-setup`, `nucleus`, `model-race`) are Node packages. | `node --version` |
| **Git 2.5+** | Required | Cloning atom, fresh `git init` after setup, `model-race` uses Git worktrees (Git ≥ 2.5). | `git --version` |
| **npm** (ships with Node) | Required | Used to install the three CLIs globally. | `npm --version` |
| **GitHub CLI (`gh`)** | Optional | Lets `atom-setup` auto-create a private GitHub repo, and `nucleus init` auto-wire its sync repo. Falls back gracefully if missing. | `gh --version` |
| **Docker** | Optional | Only needed if you pick a Docker tier in the wizard (`Dockerfile` / `+ compose` / `+ devcontainer`). Skip if you're shipping to Vercel/Netlify or building a CLI/mobile app. | `docker --version` |
| **An AI CLI** | Recommended | atom is built primarily for [Claude Code](https://github.com/anthropics/claude-code). Codex CLI, Gemini CLI, Cursor, and GitHub Copilot also work via `AGENTS.md`. | `claude --version` |

> [!NOTE]
> The wizard runs a pre-flight check at startup and shows you what's installed before any questions. Missing required tools = it stops with a clear message; missing optional tools = some sections offer fallback paths.

Platform: macOS, Linux. Windows users need Git Bash, WSL, or similar for the shell-style commands; the Node CLIs themselves are cross-platform.

---

## Quick start

```bash
git clone https://github.com/machbuilds/atom.git my-project
cd my-project
./atom-setup
```

That's it. `./atom-setup` installs atom's CLIs globally (one-time per machine, only if not already installed) and then launches the interactive wizard.

`atom-setup` walks through up to 10 short sections (project name, stack, license, Docker, git, and so on), then turns the cloned directory into your new project: a fresh `main` branch with one initial commit, your chosen scaffold and presets at the root, and atom's own source content cleaned out. The Git section can create a GitHub repo via `gh` and push — no manual step needed.

After the first run, `atom-setup`, `nucleus`, `learnings`, `model-race`, and `atom` are on your `PATH` globally — future clones can drop the `./` and just run `atom-setup`. To keep atom itself up to date, run `atom upgrade`.

> [!TIP]
> Want zero questions? Run `./atom-setup --bare` and you're done in under 5 seconds. All flags pass through (`--minimal`, `--full`, `--dry-run`, `--resume`, etc.).

> [!NOTE]
> If the install errors with `EACCES`, you need to either prefix the command with `sudo` or [set up an npm prefix that doesn't need sudo](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally). The installer points you at this if it fails.

---

## Modes

Pick how much ceremony you want at clone time:

| Mode | Time | Best for |
|---|---|---|
| `atom-setup --bare` | <5 sec | Power users. Sane defaults, no questions. |
| `atom-setup --minimal` | ~30 sec | Most people. 5 essential questions, defaults for the rest. |
| `atom-setup` | ~2 min | New users. All 10 sections with smart defaults you can press Enter through. |
| `atom-setup --full` | ~5 min | Explicit control over every option. |

Plus `--resume` (pick up an interrupted setup), `--dry-run` (preview without writing), `--reinstall` (force re-install all CLIs even if already on PATH), and `--target <dir>` (operate on a different directory).

---

## What atom gives you

| Feature | What it does |
|---|---|
| **`atom-setup`** | Interactive wizard (Node + clack). 4 modes: `--bare` / `--minimal` / default / `--full`. 10 sections cover project basics, stack, license, Docker tier, CI, git. Pre-flight detection, smart defaults, resumable state. Git section creates a GitHub repo via `gh` and pushes — no manual step. |
| **`atom upgrade`** | Keeps atom itself up to date. Detects your install, polls `VERSION` upstream, runs `git pull --ff-only` + re-installs all CLIs. `atom upgrade --check` polls without installing. |
| **`nucleus`** | Your **memory** — raw notes from every session, project-tagged, captured fast. Lives at `~/.atom/nucleus/`. JSONL storage with versioned schema migrations, keyword + structured filter search. Optionally synced to your own private GitHub repo. |
| **`learnings`** | Your **playbook** — patterns you've decided to carry forward. Lives at `~/.atom/learnings/`. Auto-copied into every new project you bootstrap (filtered by stack tags). Optionally synced to your own private GitHub repo. |
| **`model-race`** | Parallel AI model comparison via Git worktrees. Race the same spec through claude/codex/gemini, score with weighted metrics, optional LLM judge, merge the winner. |
| **Docker, optional** | Four tiers: None / Dockerfile / + compose / + devcontainer. Smart-defaulted from your stack. Production-grade out of the box (multi-stage, non-root, healthcheck, multi-arch CI). |
| **Multi-AI tool support** | `AGENTS.md` is the canonical spec; `CLAUDE.md` / `GEMINI.md` / `.cursorrules` / `.github/copilot-instructions.md` are forwarders. Claude, Codex CLI, Gemini CLI, Cursor, and Copilot all read the same instructions. |
| **Stack presets** | `extras/` ships 6 opinionated setups: **Next.js + Railway**, **Python / FastAPI**, **Swift / Vapor**, **Rust / Axum**, **Go CLI / Cobra**, **TypeScript library**. Each ships a manifest with pinned versions, a hello-world entry, a stack-tuned Dockerfile (web only), seed learnings, and a Quick Start spliced into the project README. |
| **Workflow integrations** | Optional Spec Kit + Task Master, GSD skills. Each opt-in via the wizard. |

---

## What is nucleus?

atom ships with two layers of cross-project knowledge. They're easy to confuse, so the distinction matters:

| | **nucleus** | **learnings** |
|---|---|---|
| What it is | Your **memory** of every session | Your **playbook** of patterns to carry forward |
| Bar to capture | Low — "worth noting" | High — "worth carrying into every future project" |
| Granularity | Raw, project-tagged | Curated, generalized, per-type |
| Lives where | `~/.atom/nucleus/` | `~/.atom/learnings/` |
| Auto-copied to new projects? | No | Yes (filtered by stack tags) |
| Optional sync | Your own private GitHub repo | Your own private GitHub repo (separate from nucleus) |

**Both are 100% yours.** Nothing leaves your machine without your explicit action. atom is the system; the content is yours.

### Why it exists

Code can be rewritten. The lessons you learned writing it are harder to recover. They sit in your head, get half-remembered, and quietly disappear when you start the next project. Most coding sessions teach you something — a pitfall, a pattern, an architecture decision with rationale. Without a capture system, that learning evaporates the moment the session ends.

`nucleus` catches those lessons mid-session, low bar, project-tagged. `learnings` is the curated subset you've decided to carry forward — auto-copied into every new project you bootstrap. Together they give you code you can rewrite **plus knowledge you can't**.

### The flow

```
       session
          │
          ▼  nucleus add  (raw, project-tagged, low bar)
   ~/.atom/nucleus/projects/<slug>/learnings.jsonl
          │
          ▼  nucleus promote <id>  (passes generalization test)
   ~/.atom/learnings/<type>/<key>.md  (your local playbook)
          │
          ▼  atom-setup new project  (filtered by stack)
   <new-project>/learnings/<type>/<key>.md  (carried forward)
```

The first arrow is automated when Claude is your AI (`claude-managed` capture mode is the default). The second is human-in-the-loop — `nucleus promote` opens `$EDITOR` so you can refine the draft before it lands. The third runs every time you bootstrap a project from atom — your playbook follows you.

### Capture modes

| Mode | What happens |
|---|---|
| **`claude-managed`** (default) | Claude calls `nucleus add` at natural session boundaries (end of feature, after a commit, on `/clear`). Lowest friction. |
| **`auto-timer`** | A background process drains a session log every N minutes (5/15/30/60). For users who don't want to think about it. |
| **`manual`** | Claude surfaces "worth capturing?" suggestions; you run `nucleus add` yourself. For users who want full control. |

Picked at `atom-setup` time, configurable later via `~/.atom/nucleus/config.json`.

---

## How it compares

| | atom | create-next-app | cookiecutter | degit |
|---|---|---|---|---|
| Stack-agnostic | yes | no (Next.js only) | yes | yes |
| Interactive wizard | yes (4 modes) | yes | yes | no |
| Stack presets | yes | partial | yes | no |
| AI-tool integration | yes (multi-tool via AGENTS.md) | no | no | no |
| Cross-project memory + playbook | yes (nucleus + learnings) | no | no | no |
| Parallel-model workflow | yes (model-race) | no | no | no |
| Constitution / principles | yes | no | no | no |
| Production Docker defaults | yes (4 tiers, opt-in) | partial | no | no |
| Multi-arch CI workflow | yes (amd64 + arm64) | no | no | no |

`degit` is the closest analog for "just give me the files." atom does more: it accumulates real practice (presets, learnings, AI-tool wiring) and it grows with your work via `nucleus`.

---

## Tool compatibility

> [!NOTE]
> atom is built primarily for **Claude Code**. The richest experience — slash commands, the nucleus skill, deep tooling integration — assumes you're working in Claude Code. If you use Claude, everything just works.

**Other AI tools work, with caveats.** Codex CLI (GPT), Gemini CLI, Cursor, and GitHub Copilot all read `AGENTS.md` (or a forwarder pointing to it). The full project instructions, including how to use nucleus and model-race, live in `AGENTS.md`. Every AI tool that lands in this project knows nucleus exists, when to search it, and when to capture.

What other tools miss today:

- **Skill auto-invocation.** Claude has a Skill tool that activates the nucleus skill at session boundaries. Other tools have to be prompted to remember nucleus, or you call `nucleus add` manually.
- **Slash commands.** `/gsd-new-project`, `/nucleus-promote`, etc. are Claude-only conventions today.

**Roadmap.** As Codex CLI, Gemini CLI, and others grow richer integration surfaces (skill systems, slash command equivalents), atom will add tool-specific wrappers that delegate to `AGENTS.md` for content. The plan is to never duplicate — one source of truth, multiple read paths.

---

<details>
<summary><strong>What's inside (full file tree)</strong></summary>

```
atom/
├── AGENTS.md          Canonical AI tooling instructions (every tool reads this)
├── CLAUDE.md          Forwarder → AGENTS.md (Claude Code auto-load)
├── INSTALL.md         Per-project tooling setup
├── CONTRIBUTING.md    How to add new learnings to atom
│
├── docs/              Read these before starting any new project
│   ├── VOICE.md
│   ├── WORKFLOW.md
│   ├── PATTERNS.md
│   ├── LESSONS_LEARNED.md
│   ├── LEARNINGS_TAXONOMY.md
│   ├── HOW_TO_WRITE_CONSTITUTION.md
│   ├── HOW_TO_PICK_DEPLOY_TARGET.md
│   ├── HOW_TO_DESIGN.md
│   ├── planning/      Per-feature build plans
│   └── INBOX.md       Raw capture before generalising
│
├── scaffold/          Promoted to project root by atom-setup
│   ├── AGENTS.md      Canonical instructions skeleton — fill <TODO> markers
│   ├── CLAUDE.md      Forwarder → AGENTS.md
│   ├── GEMINI.md      Forwarder → AGENTS.md
│   ├── .cursorrules   Forwarder → AGENTS.md
│   ├── .gitignore
│   ├── .github/       CI workflows + PR template + copilot-instructions.md
│   ├── .claude/       Claude-specific skills (nucleus + agent skills)
│   └── package.json   Baseline scripts
│
├── bin/               Global CLIs (install once per machine)
│   ├── atom/          Top-level help dispatcher (`atom --help`)
│   ├── atom-setup/    Interactive wizard
│   ├── nucleus/       Your session memory CLI
│   ├── learnings/     Your playbook CLI
│   └── model-race/    Parallel AI model comparison via Git worktrees
│
├── scripts/           Maintenance scripts (e.g. copy-learnings.mjs, test-atom-setup.sh)
│
└── extras/            Opt-in stack presets, copied based on user choice
    ├── docker/                Dockerfile, compose, devcontainer, CI
    ├── web/nextjs-railway/    Next.js + Railway preset (incl. Dockerfile)
    ├── web/python-fastapi/    Python + FastAPI preset (v0.2)
    ├── web/swift-vapor/       Swift + Vapor preset (v0.2)
    ├── web/rust-axum/         Rust + Axum preset (v0.2)
    ├── cli/go-cobra/          Go CLI + Cobra preset (v0.2)
    ├── lib/typescript-library/ TypeScript library starter (v0.2)
    ├── ai/                    (placeholder — v0.3)
    └── mobile/                (placeholder — v0.3)
```

</details>

<details>
<summary><strong>The 10 wizard sections</strong></summary>

1. **Project basics** — name, description, visibility, multi-agent y/n
2. **Stack & deploy** — primary stack, deploy target. Drives presets.
3. **nucleus** — enable, capture mode (claude-managed / auto-timer / manual)
4. **Memory stack** — mem0 / Multica / Chrome DevTools MCP
5. **Workflow tooling** — Spec Kit + Task Master, GSD, model-race
6. **Docker** — None / Dockerfile / + compose / + devcontainer (smart-defaulted from stack)
7. **License** — MIT / Apache-2.0 / GPL-3.0 / Proprietary / None
8. **CI/CD** — auto-deploy on push to main (only asked if deploy target concrete)
9. **Constitution** — generate starter constitution after setup
10. **Git** — fresh `git init`, then: create a new GitHub repo via `gh` (with visibility choice + optional push) / add an existing remote / skip

`--bare` skips all of these and uses sane defaults. `--minimal` asks only the essentials (1, 2, 3, 7, 10).

</details>

<details>
<summary><strong>Polish features (every wizard run)</strong></summary>

- **Pre-flight detection.** Checklist of `git`, `node`, `gh`, `docker`, `gum` availability at the top of every run.
- **Smart defaults.** Project name from `cwd`. Author/email from `git config`. GitHub user from `gh auth status`. Year from current date.
- **Final confirmation.** Summary screen BEFORE writing any files. Press Enter to confirm or N to bail.
- **Resume support.** Cancel mid-wizard, re-run with `--resume` to pick up where you left off. State at `.atom-setup-state.json` (gitignored). Secrets stripped before write.
- **Idempotent.** Re-runnable. Running again does not break partial config; you can re-enable features you previously declined.
- **Dry run.** `--dry-run` shows everything that would change without writing a single file.

</details>

---

## Documentation

- [`AGENTS.md`](AGENTS.md) — what every AI tool reads when it lands in this repo
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to add learnings back to atom (generalization test, two-stage workflow)
- [`bin/atom-setup/README.md`](bin/atom-setup/README.md) — wizard reference
- [`bin/nucleus/README.md`](bin/nucleus/README.md) — nucleus CLI reference, schema, capture modes
- [`bin/model-race/README.md`](bin/model-race/README.md) — race lifecycle, config, scoring
- [`docs/planning/`](docs/planning/) — per-feature build plans (decisions + rationale)
- [`docs/LEARNINGS_TAXONOMY.md`](docs/LEARNINGS_TAXONOMY.md) — canonical `applies_to` vocabulary
- [`extras/docker/README.md`](extras/docker/README.md) — Docker tier mapping, stack adaptation patterns
- [`INSTALL.md`](INSTALL.md) — per-project tooling setup (mem0, Multica, etc.)

---

## Roadmap

> [!TIP]
> atom is actively developed. Everything in the [Features](#what-atom-gives-you) table works today. The roadmap below is what's shipping next.

**v0.2 (in progress)**

Shipped so far:
- `atom upgrade` — keep atom up to date with one command
- `./atom-setup --reinstall` flag — force re-install stale globals
- `nucleus migrate` — versioned schema migrations for JSONL files, auto-triggered
- Live `gh repo create` in wizard §10 — creates GitHub repo and pushes; non-fatal on failure
- 5 new stack presets: Python/FastAPI, Swift/Vapor, Rust/Axum, Go CLI/Cobra, TypeScript library

Coming next in v0.2:
- Constitution auto-generation via `speckit-constitution` integration
- `~/.atom/atom/` canonical install + `install.sh` curl one-liner
- `bin/atom-update-check` + snooze (gstack pattern)

**v1.0**
- First public release. Polished docs, demo screencast, full stack-preset coverage.

**Beyond**
- Tool-specific wrappers as Codex/Gemini/Cursor gain skill-system equivalents
- Plugin system for custom presets
- `nucleus` web UI for cross-project learning browsing

---

## Contributing

atom evolves with every project that's shipped from it. The flow:

1. **During the project**, capture learnings via `nucleus add` (or `docs/INBOX.md` if you prefer manual).
2. **At the end of the project**, run `nucleus promote <id>` for entries that pass the generalization test. Files land in your local playbook at `~/.atom/learnings/<type>/<slug>.md` and ride forward into every new project you bootstrap.
3. **Periodically**, refine those into prose for `docs/LESSONS_LEARNED.md`.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the rules and the generalization test.

---

## License

[MIT](LICENSE).
