# atom

A project-starter template. Every new project begins here.

## Quick orientation (for agents)

> **TL;DR**: This is a project-starter template, not an application. Don't
> develop features here. You operate in one of two modes — figure out
> which one from the user's first message, then act.
>
> **Mode 1 — Bootstrap a new project.** Triggered by: "let's start a new
> project from atom", "use atom to bootstrap X", or similar.
> 1. Read `AGENTS.md` for the full bootstrap flow (`CLAUDE.md`, `GEMINI.md`,
>    `.cursorrules`, `.github/copilot-instructions.md` are forwarders)
> 2. Read `docs/VOICE.md`, `docs/WORKFLOW.md`, `docs/PATTERNS.md`,
>    `docs/LESSONS_LEARNED.md` (in that order — high-signal first)
> 3. Ask the user for project context (name, stack, deploy target, etc.)
> 4. Copy `scaffold/` into the new project repo + matching
>    `extras/<category>/<preset>/` if applicable
> 5. Fill `<TODO>` markers in `scaffold/AGENTS.md` with user input
> 6. Run tooling install per `INSTALL.md`
>
> **Mode 2 — Add a learning to atom.** Triggered by: "add this lesson",
> "atom learned that X", "update the template with X", or similar.
> 1. Read `CONTRIBUTING.md` for the rules
> 2. Apply the generalisation test (would this help an unrelated project?)
> 3. If yes → propose structured entry, append to right file
> 4. If unsure → drop in `docs/INBOX.md` for later refinement
> 5. Always commit to atom with a message naming the source project
>
> **Hard rules**: don't copy project-specific lessons (specific API
> names, domain logic) into `LESSONS_LEARNED.md`. Don't develop application
> features here. Don't add stack-specific files outside
> `extras/<category>/<preset>/`. Use the voice from `docs/VOICE.md`
> (builder-to-builder, direct, no AI vocabulary, no em-dashes-as-commas).

## What's inside

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
├── scaffold/          Copy these into every new project's repo
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
├── bin/nucleus/       Cross-project learning store CLI
│
├── scripts/           Maintenance scripts (e.g. copy-learnings.mjs)
│
└── extras/            Opt-in stack presets, copied based on user choice
    ├── docker/                Dockerfile, compose, devcontainer, CI
    ├── web/nextjs-railway/    Next.js + Railway preset (incl. Dockerfile)
    ├── ai/                    (placeholder — future presets)
    └── mobile/                (placeholder — future presets)
```

## How to use

### Starting a new project

```bash
git clone <atom-repo-url> ~/work/<new-project>
cd ~/work/<new-project>

# Open in your AI tool of choice. Claude Code auto-loads CLAUDE.md (which
# forwards to AGENTS.md) and walks you through the bootstrap. Codex CLI,
# Gemini CLI, Cursor, and Copilot read AGENTS.md directly. Scaffold gets
# copied, placeholders filled, tooling installed, constitution drafted,
# first phase planned.
```

### Adding a new learning back to atom

```bash
cd ~/work/atom

# Either edit docs/INBOX.md directly with a raw note, or ask Claude:
#   "Add this learning to atom: <rough description>"
# Claude will apply the generalisation test, propose structured wording,
# and commit if it passes. See CONTRIBUTING.md for the rules.
```

## Tool compatibility

atom is **built primarily for Claude Code**. The richest experience —
slash commands, the nucleus skill, deep tooling integration — assumes
you are working in Claude Code. If you use Claude, everything just
works.

**Other AI tools work, with caveats.** Codex CLI (GPT), Gemini CLI,
Cursor, and GitHub Copilot all read `AGENTS.md` (or a forwarder
pointing to it). The full project instructions, including how to use
nucleus and model-race, live in `AGENTS.md`. So the *knowledge* of
atom's tooling is universal — every AI tool that lands in this project
will know nucleus exists, when to search it, and when to capture.

What other tools miss today:

- **Skill auto-invocation.** Claude has a Skill tool that activates the
  nucleus skill at session boundaries. Other tools have to be prompted
  to remember nucleus, or you call `nucleus add` manually.
- **Slash commands.** `/gsd-new-project`, `/nucleus-promote`, etc. are
  Claude-only conventions today.

**Roadmap.** As Codex CLI, Gemini CLI, and others grow richer
integration surfaces (skill systems, slash command equivalents), atom
will add tool-specific wrappers that delegate to `AGENTS.md` for
content. The plan is to never duplicate — one source of truth, multiple
read paths.

If you use Claude Code, run `atom-setup`. If you use something else,
read `AGENTS.md`, install the `nucleus` CLI from `bin/nucleus/`, and
invoke it manually as you go. The core works either way; the polish
is Claude-first today.

## Why "atom"

Atom = nucleus, seed, the unit everything else is built from. Every project
shipped from this template inherits atom's principles, agent boundaries,
workflow conventions, and accumulated lessons.

## Cadence

- **End of every project**: skim `docs/INBOX.md`, promote what survives the
  generalisation test, delete the rest. Add new lessons learned. Add new
  presets to `extras/` if you used a stack that's likely to recur.
- **End of every quarter**: review `docs/PATTERNS.md` and `docs/LESSONS_LEARNED.md`
  for entries that have aged out or been superseded.
