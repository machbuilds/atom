<p align="center">
<pre>
   █████╗ ████████╗ ██████╗  ███╗   ███╗
  ██╔══██╗╚══██╔══╝██╔═══██╗ ████╗ ████║
  ███████║   ██║   ██║   ██║ ██╔████╔██║
  ██╔══██║   ██║   ██║   ██║ ██║╚██╔╝██║
  ██║  ██║   ██║   ╚██████╔╝ ██║ ╚═╝ ██║
  ╚═╝  ╚═╝   ╚═╝    ╚═════╝  ╚═╝     ╚═╝
</pre>
</p>

<p align="center">
  <strong>atom</strong> — the seed every project starts from.<br>
  A project-starter template with cross-project memory, multi-tool AI support, and an opinionated dev workflow baked in.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue"></a>
  <img alt="Node 18+" src="https://img.shields.io/badge/node-%E2%89%A518-green">
  <img alt="Built with clack" src="https://img.shields.io/badge/wizard-%40clack%2Fprompts-purple">
  <a href="docs/planning/"><img alt="Build status: v0.1" src="https://img.shields.io/badge/build-v0.1%20feature%20complete-success"></a>
</p>

---

## Quick start

```bash
git clone https://github.com/mach273/atom.git my-project
cd my-project
atom-setup
```

Done. The cloned directory becomes your new project — atom-maintenance content removed, your stack preset and Docker tier copied in, fresh git history with one initial commit.

Don't have `atom-setup` yet? Install once per machine:

```bash
cd bin/atom-setup && npm install -g .
cd ../nucleus    && npm install -g .   # cross-project learning store
cd ../model-race && npm install -g .   # parallel AI model workflow
```

---

## What atom gives you

| Feature | What it does |
|---|---|
| **`atom-setup`** | Interactive wizard (Node + clack). 4 modes: `--bare` / `--minimal` / default / `--full`. 10 sections cover project basics, stack, license, Docker tier, CI, git. Pre-flight detection, smart defaults, resumable state. |
| **`nucleus`** | Cross-project learning store at `~/.nucleus`. Captures durable lessons mid-session; surfaces them in any future project. JSONL storage, optional GitHub sync, keyword + structured filter search. |
| **`learnings/`** | Graduation layer for `nucleus` entries that prove generalizable. Files inherit into every bootstrapped project, filtered by stack tags. |
| **`model-race`** | Parallel AI model comparison via Git worktrees. Race the same spec through claude/codex/gemini, score with weighted metrics, optional LLM judge, merge the winner. |
| **Docker, optional** | Four tiers: None / Dockerfile / + compose / + devcontainer. Smart-defaulted from your stack. Production-grade out of the box (multi-stage, non-root, healthcheck, multi-arch CI). |
| **Multi-AI tool support** | `AGENTS.md` is the canonical spec; `CLAUDE.md` / `GEMINI.md` / `.cursorrules` / `.github/copilot-instructions.md` are forwarders. Claude, Codex CLI, Gemini CLI, Cursor, and Copilot all read the same instructions. |
| **Stack presets** | `extras/` ships opinionated setups per framework (Next.js + Railway today; more coming). Wizard copies the matching one. |
| **Workflow integrations** | Optional Spec Kit + Task Master, GSD skills. Each opt-in via the wizard. |

---

## The nucleus story

Every atom has a nucleus at its center holding its identity. **nucleus** does the same for your projects: the core knowledge that makes each project what it is.

Code can be rewritten. The lessons you learned writing it are harder to recover. They sit in your head, get half-remembered, and quietly disappear when you start the next project. Most coding sessions teach you something — a pitfall, a pattern, an architecture decision with rationale. Without a capture system, that learning evaporates the moment the session ends.

`nucleus` catches those lessons mid-session and lets future sessions, in any project, benefit from them. Together with atom's structure, you get more than a starter template: code you can rewrite, plus knowledge you can't.

The flow:

```
       session
          │
          ▼  nucleus add  (raw, project-tagged)
   ~/.nucleus/projects/<slug>/learnings.jsonl
          │
          ▼  nucleus promote <id>  (passes generalization test)
   atom/learnings/<type>/<slug>.md  (curated, ships to new projects)
          │
          ▼  refine into prose
   atom/docs/LESSONS_LEARNED.md  (essay form)
```

The first arrow is automated. The second is human-in-the-loop. The third is rare and intentional.

---

## How it compares

| | atom | create-next-app | cookiecutter | degit |
|---|---|---|---|---|
| Stack-agnostic | yes | no (Next.js only) | yes | yes |
| Interactive wizard | yes (4 modes) | yes | yes | no |
| Stack presets | yes | partial | yes | no |
| AI-tool integration | yes (multi-tool via AGENTS.md) | no | no | no |
| Cross-project learning store | yes (nucleus) | no | no | no |
| Parallel-model workflow | yes (model-race) | no | no | no |
| Constitution / principles | yes | no | no | no |
| Production Docker defaults | yes (4 tiers, opt-in) | partial | no | no |
| Multi-arch CI workflow | yes (amd64 + arm64) | no | no | no |

`degit` is the closest analog for "just give me the files." atom does more: it accumulates real practice (presets, learnings, AI-tool wiring) and it grows with your work via `nucleus`.

---

## Tool compatibility

atom is **built primarily for Claude Code**. The richest experience — slash commands, the nucleus skill, deep tooling integration — assumes you're working in Claude Code. If you use Claude, everything just works.

**Other AI tools work, with caveats.** Codex CLI (GPT), Gemini CLI, Cursor, and GitHub Copilot all read `AGENTS.md` (or a forwarder pointing to it). The full project instructions, including how to use nucleus and model-race, live in `AGENTS.md`. Every AI tool that lands in this project knows nucleus exists, when to search it, and when to capture.

What other tools miss today:

- **Skill auto-invocation.** Claude has a Skill tool that activates the nucleus skill at session boundaries. Other tools have to be prompted to remember nucleus, or you call `nucleus add` manually.
- **Slash commands.** `/gsd-new-project`, `/nucleus-promote`, etc. are Claude-only conventions today.

**Roadmap.** As Codex CLI, Gemini CLI, and others grow richer integration surfaces (skill systems, slash command equivalents), atom will add tool-specific wrappers that delegate to `AGENTS.md` for content. The plan is to never duplicate — one source of truth, multiple read paths.

---

## Modes

Pick how much ceremony you want at clone time:

| Mode | Time | Best for |
|---|---|---|
| `atom-setup --bare` | <5 sec | Power users. Sane defaults, no questions. |
| `atom-setup --minimal` | ~30 sec | Most people. 5 essential questions, defaults for the rest. |
| `atom-setup` | ~2 min | New users. All 10 sections with smart defaults you can press Enter through. |
| `atom-setup --full` | ~5 min | Explicit control over every option. |

Plus `--resume` (pick up an interrupted setup), `--dry-run` (preview without writing), and `--target <dir>` (operate on a different directory).

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
├── learnings/         Generalised, structured learnings (graduation layer)
│
├── bin/               Global CLIs (install once per machine)
│   ├── atom-setup/    Interactive wizard
│   ├── nucleus/       Cross-project learning store CLI
│   └── model-race/    Parallel AI model comparison via Git worktrees
│
├── scripts/           Maintenance scripts (e.g. copy-learnings.mjs)
│
└── extras/            Opt-in stack presets, copied based on user choice
    ├── docker/                Dockerfile, compose, devcontainer, CI
    ├── web/nextjs-railway/    Next.js + Railway preset (incl. Dockerfile)
    ├── ai/                    (placeholder — future presets)
    └── mobile/                (placeholder — future presets)
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
10. **Git** — fresh `git init`, optional remote URL

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

**v0.2 (next)**
- Stack presets beyond Next.js: Python (FastAPI), Swift, Rust, Go CLI, library starters
- Live `gh repo create` during the Git section (currently records intent, defers push)
- Constitution auto-generation via `speckit-constitution` integration
- `model-race --auto` (parallel session orchestration across CLIs)
- Semantic search in `nucleus` (`--semantic` flag, vector store)

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
2. **At the end of the project**, run `nucleus promote <id>` for entries that pass the generalization test. Files land in `atom/learnings/<type>/<slug>.md`.
3. **Periodically**, refine those into prose for `docs/LESSONS_LEARNED.md`.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the rules and the generalization test.

---

## License

[MIT](LICENSE).
