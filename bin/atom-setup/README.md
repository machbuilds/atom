# atom-setup

The interactive wizard that transforms a cloned atom checkout into a
personalized project.

```
git clone <atom-repo-url> ~/work/my-project
cd ~/work/my-project
atom-setup
```

After it runs, the directory is your new project. atom-maintenance
content (planning docs, source `learnings/`, `bin/`, `extras/`,
`scaffold/`) is removed. Scaffold contents are promoted to the root.
The chosen stack preset and Docker tier are copied in. Git history is
re-initialized with one initial commit on `main`.

## Install

From inside this directory:

```
npm install -g .
```

Verify:

```
atom-setup --version
atom-setup --help
```

Requires Node 18+ and Git 2.x+.

## Modes

| Mode | Flag | Time | What it does |
|---|---|---|---|
| **Bare** | `--bare` | <5 sec | Zero questions. Sane defaults. For power users. |
| **Minimal** | `--minimal` | ~30 sec | 5 essential questions: name, stack, nucleus, license, git. |
| **Default** | (no flag) | ~2 min | All 10 sections, with smart defaults you can press Enter through. |
| **Full** | `--full` | ~5 min | All 10 sections, every detail prompted. |

## Sections

1. **Project basics** — name, description, visibility, multi-agent y/n.
2. **Stack & deploy** — primary stack, deploy target. Drives presets.
3. **nucleus** — enable, capture mode (claude-managed / auto-timer / manual).
4. **Memory stack** — mem0 / Multica / Chrome DevTools MCP.
5. **Workflow tooling** — Spec Kit + Task Master, GSD skills, model-race.
6. **Docker** — None / Dockerfile / + compose / + devcontainer. Smart-defaulted from §2.
7. **License** — MIT / Apache-2.0 / GPL-3.0 / Proprietary / None.
8. **CI/CD** — auto-deploy on push to main (only asked if §2 picked a deploy target).
9. **Constitution** — generate starter constitution after setup.
10. **Git** — fresh `git init` + initial commit; optionally wire a remote.

## Polish features

- **Pre-flight detection** — checklist of git, node, gh, docker, gum
  availability at the top of every run.
- **Smart defaults** — project name from cwd, author/email from
  `git config`, GitHub user from `gh auth status`.
- **Final confirmation** — shows a summary BEFORE writing files. Press
  Enter to confirm or N to bail.
- **Resume support** — interrupt mid-wizard, re-run with `--resume` to
  pick up where you left off. State lives at `.atom-setup-state.json`
  (gitignored). Secrets are stripped before write.
- **Idempotent** — re-runnable. Running again does not break partial
  config; you can re-enable features you previously declined.
- **Dry run** — `--dry-run` shows everything that would change without
  writing a single file.

## Discoverability layer

What does NOT get asked in the wizard but ships with every project:

| Feature | Where to find it |
|---|---|
| Cost envelope | Constitution template prompt |
| Code style / linting | Bundled into stack presets |
| Env vars / secrets | Tailored `.env.example` (wizard never reads secrets) |
| Editor / IDE config | `.vscode/` + `.cursorrules` shipped |
| `nucleus` CLI usage | `AGENTS.md` "Tooling > nucleus" |
| `model-race` workflow | `AGENTS.md` "Tooling > model-race" (if enabled) |

The post-setup cheatsheet prints whatever next steps are relevant
(e.g., `nucleus init`, fill `.env.local`, push to remote).

## Examples

### Just give me the files

```
atom-setup --bare
```

Project name inferred from `cwd`. Sane defaults (MIT license, no
Docker, no extras). Done in seconds.

### Quick interactive setup

```
atom-setup --minimal
```

Five questions. Most users finish in ~30 seconds.

### Full ceremonial setup

```
atom-setup --full
```

Walks every section, every option. For users who want explicit control
over every decision.

### Try it without committing

```
atom-setup --dry-run
```

Shows what would change. No files modified.

### Resume an interrupted setup

```
atom-setup --resume
```

If you cancel mid-flow, your state is saved. Resume picks up at the
section you left off.

## Flags

```
atom-setup [options]

  --bare              no questions, just files (under 5 seconds)
  --minimal           5 essential questions (~30 seconds)
  --full              every section, no defaults autopilot (~5 minutes)
  --resume            pick up from .atom-setup-state.json
  --dry-run           show what would change without writing
  --target <dir>      project directory to operate on (default: cwd)
  --yes               skip the final confirmation prompt
  -V, --version       output the version number
  -h, --help          display help for command
```

## What atom-setup does NOT do

- **Install global tools.** `nucleus`, `model-race`, mem0 MCP, etc. are
  installed once per machine. atom-setup records your preferences but
  doesn't `npm install -g` anything for you.
- **Read secrets.** API keys are never collected. The tailored
  `.env.example` lists what to fill in; the cheatsheet points you at it.
- **Push to remote automatically.** Even if you wire a remote during the
  Git section, the push happens at the end with confirmation, never
  silently.
- **Modify atom itself.** atom-setup operates on `--target` (default
  cwd), which is a clone of atom. The atom repo you cloned from is
  unchanged.

## Limitations (v0.1)

- **Constitution generation is a TODO marker, not an automated flow.**
  When you opt in, the cheatsheet reminds you to run
  `speckit-constitution` (or your AI tool's equivalent) yourself.
- **`gh repo create` flow during Git section** stores the intent but
  defers actual creation to a follow-up. This will be wired live in
  v0.2.
- **Stack presets** currently include only `nextjs` (Next.js + Railway).
  Other stacks (Python, Swift, Rust, etc.) get the generic preset until
  their `extras/<category>/<preset>/` lands.

## License

MIT (matches atom).
