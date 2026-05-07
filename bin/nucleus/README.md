# nucleus

Cross-project learning store. Captures durable lessons from coding
sessions into `~/.atom/nucleus`. Surfaces past lessons when you start new
work in any project.

Independent of GBrain, GStack, or any closed system. Anyone who
clones atom gets nucleus.

## Install

From inside this directory:

```
npm install -g .
```

Verify:

```
nucleus --version
nucleus --help
```

Requires Node 18+.

## Quick start

```
nucleus init                                       # one-time, interactive
nucleus add "<insight>" --type pitfall --confidence high --tags auth
nucleus search "auth"                              # keyword search
nucleus search --type pitfall --confidence high    # structured filter
nucleus sync                                       # push/pull to GitHub (if configured)
nucleus promote <id>                               # graduate to ~/.atom/learnings/
```

## Commands

### `nucleus init`

Initialize `~/.atom/nucleus`. Asks you:
- Capture mode (claude-managed default, auto-timer, manual).
- Whether to sync to a private GitHub repo (smart hybrid: auto-create
  via `gh` if available, accepts an existing URL otherwise).

Re-runnable. `--yes` uses defaults without prompts.

### `nucleus slug`

Print the slug for the current project. Derived from `git config
remote.origin.url`; falls back to the directory name. Used as the
key in `~/.atom/nucleus/projects/<slug>/`.

### `nucleus add`

Append a learning to the current project's JSONL.

```
nucleus add "<prose>" \
  --type pitfall|pattern|architecture|workflow|decision|bug-fix|performance|security \
  --confidence low|medium|high \
  --source human|claude|cross-model|observation \
  --tags tag1 tag2 \
  --files path/one path/two
```

Insight can also come from `--insight` or stdin. Key auto-generates
from the insight; override with `--key`.

### `nucleus search`

Keyword + structured filtering across all projects.

```
nucleus search "<query>"               # keyword
nucleus search --type pitfall          # structured
nucleus search --since 30d
nucleus search --confidence high       # high only
nucleus search --tags auth concurrency
nucleus search --files "src/auth/*"
nucleus search "..." --json            # programmatic output
nucleus search "..." --sort recent     # default: confidence then recency
nucleus search "..." --limit 10
```

`--semantic` is reserved for a future release (vector search).

### `nucleus sync`

Push and pull `~/.atom/nucleus` to/from the configured GitHub remote.
Wraps `git add -A && git commit && git pull --rebase && git push`.

```
nucleus sync                  # push and pull
nucleus sync --push-only
nucleus sync --pull-only
nucleus sync -m "manual sync"
```

### `nucleus promote <id>`

Graduate a nucleus entry to atom's `learnings/<type>/<slug>.md`. Runs
the entry through a generation template, opens `$EDITOR` for
refinement.

```
nucleus promote 01HXY...
nucleus promote 01HXY... --target /path/to/atom
nucleus promote 01HXY... --no-editor
nucleus promote 01HXY... --applies-to web api
```

## Configuration

Lives at `~/.atom/nucleus/config.json`:

```json
{
  "version": 1,
  "enabled": true,
  "captureMode": "claude-managed",
  "autoTimerMinutes": 15,
  "sync": {
    "enabled": true,
    "remote": "git@github.com:user/nucleus-user.git"
  },
  "perProject": {
    "user-project": { "enabled": false }
  }
}
```

`perProject` lets you disable nucleus for a specific project even when
globally enabled.

## Storage

```
~/.atom/nucleus/
├── config.json
└── projects/
    └── <slug>/
        └── learnings.jsonl
```

`learnings.jsonl` — one entry per line. Each entry:

```json
{
  "id": "01HXY...",
  "ts": "2026-05-04T15:23:11Z",
  "schema_version": 1,
  "project": "user-project",
  "type": "pitfall",
  "key": "cache-refresh-promise-races",
  "insight": "...",
  "confidence": "high",
  "source": "human",
  "files": ["src/auth/refresh.ts"],
  "tags": ["auth", "concurrency"],
  "supersedes": null,
  "session_id": "claude-2026-05-04-1523"
}
```

`schema_version` is bumped only on incompatible schema changes. v1 is
current.

## Environment

| Var | Purpose |
|---|---|
| `NUCLEUS_HOME` | Override `~/.atom/nucleus` location. Useful for tests. |
| `EDITOR` / `VISUAL` | Used by `nucleus promote`. |
| `NUCLEUS_SESSION_ID` | Optional. If set, `nucleus add` uses it for `session_id`. |

## How Claude uses this

The Claude skill at `.claude/skills/nucleus/SKILL.md` (in projects
bootstrapped from atom) tells Claude when to search and when to add.
In `claude-managed` mode, Claude calls `nucleus add` at natural
session boundaries.

## Promotion flow

```
session
  ↓ (Claude or you call nucleus add)
~/.atom/nucleus/projects/<slug>/learnings.jsonl  (raw, low bar)
  ↓ (passes generalization test; nucleus promote <id>)
~/.atom/learnings/<type>/<key>.md  (your local playbook)
  ↓ (atom-setup copies into every new project, filtered by stack)
<new-project>/learnings/<type>/<key>.md
```

The first arrow is automated when you're in `claude-managed` mode.
The second is human-in-the-loop — `nucleus promote` opens `$EDITOR`
so you can refine before saving. The third runs every time you
bootstrap a project from atom.

`learnings/` content is yours alone. nucleus and learnings both stay
on your machine; optional sync is to *your own* private GitHub repos,
not anyone else's.

## License

MIT (matches atom).
