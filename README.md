# atom

A project-starter template. Every new project begins here.

## Quick orientation (for agents)

> **TL;DR**: This is a project-starter template, not an application. Don't
> develop features here. You operate in one of two modes — figure out
> which one from the user's first message, then act.
>
> **Mode 1 — Bootstrap a new project.** Triggered by: "let's start a new
> project from atom", "use atom to bootstrap X", or similar.
> 1. Read `CLAUDE.md` for the full bootstrap flow
> 2. Read `docs/VOICE.md`, `docs/WORKFLOW.md`, `docs/PATTERNS.md`,
>    `docs/LESSONS_LEARNED.md` (in that order — high-signal first)
> 3. Ask the user for project context (name, stack, deploy target, etc.)
> 4. Copy `scaffold/` into the new project repo + matching
>    `extras/<category>/<preset>/` if applicable
> 5. Fill `<TODO>` markers in `scaffold/CLAUDE.md` with user input
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
├── CLAUDE.md          Agent bootstrap — what Claude reads first
├── INSTALL.md         Per-project tooling setup
├── CONTRIBUTING.md    How to add new learnings to atom
│
├── docs/              Read these before starting any new project
│   ├── VOICE.md
│   ├── WORKFLOW.md
│   ├── PATTERNS.md
│   ├── LESSONS_LEARNED.md
│   ├── HOW_TO_WRITE_CONSTITUTION.md
│   ├── HOW_TO_PICK_DEPLOY_TARGET.md
│   ├── HOW_TO_DESIGN.md
│   └── INBOX.md       Raw capture before generalising
│
├── scaffold/          Copy these into every new project's repo
│   ├── CLAUDE.md      Skeleton — fill <TODO> markers
│   ├── .gitignore
│   ├── .github/       CI workflows + PR template
│   ├── .claude/       Per-agent skill files
│   ├── package.json   Baseline scripts
│   └── Dockerfile.example
│
└── extras/            Opt-in stack presets
    ├── web/nextjs-railway/    Next.js + Railway preset
    ├── ai/                    (placeholder — future presets)
    └── mobile/                (placeholder — future presets)
```

## How to use

### Starting a new project

```bash
git clone <atom-repo-url> ~/work/<new-project>
cd ~/work/<new-project>

# Open in Claude Code. Claude auto-loads CLAUDE.md and walks you through
# the bootstrap. Scaffold gets copied, placeholders filled, tooling installed,
# constitution drafted, first phase planned.
```

### Adding a new learning back to atom

```bash
cd ~/work/atom

# Either edit docs/INBOX.md directly with a raw note, or ask Claude:
#   "Add this learning to atom: <rough description>"
# Claude will apply the generalisation test, propose structured wording,
# and commit if it passes. See CONTRIBUTING.md for the rules.
```

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
