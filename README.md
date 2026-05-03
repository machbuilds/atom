# atom

A project-starter template. Every new project begins here.

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
