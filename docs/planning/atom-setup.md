# atom-setup — build plan

> Status: built (v0.1).
> Implementation: `bin/atom-setup/`.
> Updated: 2026-05-05
>
> **Live limitations to address in v0.2**:
> - Constitution generation is a TODO marker in the cheatsheet, not an
>   automated flow. User runs `speckit-constitution` themselves.
> - `gh repo create` during Git section stores intent but defers actual
>   creation. Push happens manually post-setup.
> - Stack presets shipping today: `nextjs` only. Other stacks fall back
>   to the generic scaffold.

## What it is

A single-command interactive wizard the user runs once after cloning
atom. Configures the project per the user's choices: project name,
stack, license, Docker tier, nucleus capture mode, GitHub sync,
constitution generation, initial commit and push.

Implementation: Node + `@clack/prompts` + `picocolors`. Run via
`./atom-setup` or `npx atom-setup`.

## Why

Cloning a starter template with 30 config files and no guidance is
the worst onboarding in software. atom has many features (nucleus,
learnings, GSD, Spec Kit, model-race, etc.). Without a guided setup,
new users either skip features they would have wanted, or ship with
defaults that don't fit them. atom-setup makes the first 90 seconds
after cloning produce a project that is actually theirs.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Implementation | Node + `@clack/prompts` + `picocolors` | Best-in-class TUI; cross-platform; Node is near-universal in 2026 |
| Entry point | `./atom-setup` (also `npx atom-setup` if published) | One command, no flags for happy path |
| Section count | 10 | Covers per-project config without becoming a slog when paired with `--minimal` |
| Cut-from-wizard policy | Discoverability layer (4-tier) | Wizard stays focused; cut features surface in README, post-setup cheatsheet, `docs/FEATURES.md`, template prompts |
| Resume support | `.atom-setup-state.json` + `--resume` flag | User can quit mid-flow and pick up later |
| Modes | `--bare` (no questions, just files) / `--minimal` (5 essential) / default / `--full` (every section) | Real-power users skip everything; cautious users see everything |
| Idempotency | Re-runnable | Running again does not break partial config; can enable features previously declined |
| Pre-flight detection | Top of wizard, before any questions | Shows availability of git, node, docker, gh, gum |
| Smart defaults | Pre-fill from environment | Project name from cwd, GitHub user from `gh auth status`, email from git config |
| Final confirmation | Summary screen before writing | User can back out if they pick wrong |
| Per-section explainer | One-line intro under each section header | Users who don't know what mem0 / nucleus / model-race are can still pick |

## Modes

The wizard has four invocation modes:

| Mode | Flag | Behavior |
|---|---|---|
| **Bare** | `--bare` | Zero questions. Copies `scaffold/` as-is, infers project name from cwd (or prompts once if ambiguous). No license, no `.env.example`, no constitution, no `nucleus init`, no initial commit. For power users who will configure everything themselves. Done in <5 seconds. Re-runnable as `atom-setup` later (without `--bare`) to opt into wizard sections. |
| **Minimal** | `--minimal` | 5 essential questions: project name, stack, nucleus y/n, license, git remote. All other choices use sensible defaults. Done in ~30 seconds. |
| **Default** | (no flag) | All 10 sections, but each has smart defaults the user can press Enter through. Done in ~2 minutes. |
| **Full** | `--full` | All 10 sections, prompts for every detail (no defaults autopilot). For users who want explicit control. Done in ~5 minutes. |

`--bare` is the escape hatch for power users who view the wizard as
friction. They get atom's structure and can opt into features later by
re-running `atom-setup` (it's idempotent and resumable).

## Sections (10)

1. **Project basics**. Name, description, public-or-internal, multi-agent
   skills yes/no.
2. **Stack & deploy**. Primary stack (Next.js, Python, Swift, Other,
   Decide later). Deploy target (Railway, Vercel, Fly, AWS, Custom,
   Decide later). Stack choice triggers preset copy from `extras/`.
3. **nucleus**. Enable yes/no. Capture mode (claude-managed default,
   auto-timer, manual). GitHub sync repo (smart hybrid via `gh`).
4. **Memory stack**. mem0 MCP yes/no. Multica yes/no. Chrome DevTools
   MCP yes/no.
5. **Workflow tooling**. Spec Kit + Task Master yes/no. GSD skills
   yes/no. model-race yes/no (default no, opt-in).
6. **Docker**. Tier select: None / Dockerfile / + compose / +
   devcontainer. Smart default based on §2 stack and deploy target.
7. **License**. MIT, Apache-2.0, GPL-3.0, Proprietary, None. Auto-fill
   year and author from git config.
8. **CI/CD**. Auto-deploy on push to main, yes or no. Only asked if
   §2 deploy target was concrete (skipped if "Decide later").
9. **Constitution**. Generate starter constitution now, yes or no.
   Uses `docs/HOW_TO_WRITE_CONSTITUTION.md` methodology.
10. **Git**. Initial commit and push. Where to (existing remote URL,
    or create new on GitHub via `gh repo create`).

## Discoverability layer (cut from wizard, surfaced elsewhere)

| Cut category | Where it lives instead |
|---|---|
| Cost envelope | Constitution template prompt |
| Code style / linting | Bundled into stack presets in `extras/` |
| Env vars / secrets | Tailored `.env.example` written by wizard, listed in cheatsheet |
| Editor / IDE | Defaults shipped (`.vscode/`, `.cursorrules`); mentioned in cheatsheet |
| Telemetry / analytics | `docs/FEATURES.md` |
| Database / auth provider | Folded into stack presets |
| Package manager / Node version | Implied by stack preset |
| README boilerplate | Auto-generated from wizard answers |

The cheatsheet prints at the end of `atom-setup`, listing what was
not configured but is available. Same content lives in the README's
"What atom gives you" section.

## How it works (implementation sketch)

- `bin/atom-setup` (Node script with shebang). Entry point.
- `bin/lib/sections/*.js`. One file per wizard section. Each exports
  a `run(state)` function that uses clack prompts to collect answers
  into the shared `state` object.
- `bin/lib/state.js`. Reads and writes `.atom-setup-state.json` for
  resume support. Never stores secrets.
- `bin/lib/preflight.js`. Detects git, node, docker, gh, gum. Renders
  the availability checklist at top of wizard.
- `bin/lib/defaults.js`. Pulls smart defaults from environment
  (cwd, `gh auth status`, `git config user.email`).
- `bin/lib/writer.js`. After confirmation, writes files: copies
  scaffold, copies stack preset, generates `LICENSE`, generates
  tailored `.env.example`, runs `git init` and initial commit.
- `bin/lib/cheatsheet.js`. Prints post-setup summary.

State file shape (no secrets):

```json
{
  "version": 1,
  "completedSections": ["project-basics", "stack-deploy"],
  "answers": {
    "projectName": "my-project",
    "stack": "nextjs",
    "deployTarget": "railway",
    "nucleus": { "enabled": true, "captureMode": "claude-managed" },
    "license": "MIT"
  },
  "startedAt": "2026-05-04T15:23:00Z"
}
```

## Risks at build time

- **Cross-platform behavior**. Test on macOS, Linux, and Windows
  (PowerShell + WSL). clack handles most of this; `gh` integration
  may need fallbacks on Windows.
- **`gh` authentication state detection**. `gh auth status` returns
  exit code 1 when not logged in. Don't crash on that; offer the
  manual URL fallback.
- **Idempotent re-runs**. If user re-runs after partial setup, detect
  what was already done and skip. Easy to get wrong (re-running
  `git init` over an existing repo is bad).
- **State file location**. `.atom-setup-state.json` lives at project
  root. Must be in `.gitignore` from the start so it doesn't get
  committed.
- **Polish features test pass**. Before declaring done, run through
  all 5 polish features end-to-end manually (see memory entry
  `atom_setup_polish_test.md`).

## Dependencies

- nucleus must exist before §3 of the wizard does anything useful
  (the wizard collects nucleus config but cannot enable a feature
  that does not exist).
- learnings must exist before bootstrap-time learning copy works.
- Docker presets in `extras/<stack>/` must exist before §6 can copy
  the right Dockerfile.

The wizard can ship section by section as features come online. Early
versions will have placeholder sections that just record the user's
preference for later.
