# learnings

Your local playbook of generalized patterns. Lives at `~/.atom/learnings/`.

`learnings` is the curated layer that sits above `nucleus`. nucleus is the user's *memory* (raw, project-tagged session captures); learnings is the user's *playbook* (the patterns they've decided to carry forward into every future project).

**Auto-copied into every new project bootstrapped from atom**, filtered by the new project's stack tags. Optionally synced to your own private GitHub repo.

## Install

Installed automatically by atom's bootstrap script. From a cloned atom directory:

```
./atom-setup
```

That installs `atom`, `atom-setup`, `nucleus`, `learnings`, and `model-race` globally.

To install just learnings manually:

```
cd bin/learnings && npm install -g .
```

Requires Node 18+.

## Quick start

```
learnings init           # one-time per machine
learnings list           # show your curated playbook
learnings show <key>     # view one entry
learnings sync           # push/pull to private GitHub (if configured)
```

You don't normally write to learnings directly — entries arrive via `nucleus promote <id>` after they pass the generalization test.

## Commands

### `learnings init`

Initialize `~/.atom/learnings/`. Asks you:

- Whether to sync to a private GitHub repo for cross-machine access. Smart-hybrid via `gh`:
  - If `gh` is detected and authenticated, the CLI offers to create a private repo (default name `learnings-<your-github-username>`).
  - If `gh` isn't available, you can paste an existing repo URL.

Re-runnable. `--yes` uses defaults without prompts. `--setup-sync` re-runs only the sync setup.

### `learnings list` (alias: `learnings ls`)

Show your learnings, grouped by type.

```
learnings list
learnings list --type pitfall
learnings list --applies-to web
learnings list --json
```

### `learnings show <key>`

Print one learning by key (the `key:` field in its frontmatter).

```
learnings show cache-refresh-promise-races
```

### `learnings remove <key>` (alias: `learnings rm`)

Delete a learning. Confirms before deleting unless `--yes`.

### `learnings sync`

Push and pull `~/.atom/learnings/` to/from the configured GitHub remote.

```
learnings sync
learnings sync --push-only
learnings sync --pull-only
```

## How content arrives

The intended flow:

1. You capture lessons in `nucleus` mid-session (low bar — anything that might help later).
2. After the session, scan your nucleus entries for ones that **generalize beyond this project**.
3. For each generalizable entry: `nucleus promote <id>`. nucleus generates a draft at `~/.atom/learnings/<type>/<key>.md` and opens `$EDITOR` so you can refine.
4. Save the file. It's now in your playbook forever.
5. Next time you bootstrap a project from atom, `atom-setup` copies relevant entries (filtered by stack) into the new project's `learnings/` directory.

You can also write learning files directly into `~/.atom/learnings/<type>/<key>.md` if you prefer, using the same YAML frontmatter format as `nucleus promote` produces.

## File format

```markdown
---
key: cache-refresh-promise-races
type: pitfall                    # one of: architecture, pitfall, pattern, workflow, decision, bug-fix, performance, security
confidence: high                 # low | medium | high
source: promoted-from-nucleus    # or direct-write, or cross-model
nucleus_id: 01HXY...             # back-reference if promoted
ts: 2026-05-06
tags: [auth, concurrency]
supersedes: null
applies_to: [web, api]           # used at bootstrap-time stack filtering
---

# Cache the in-flight refresh promise across concurrent calls.

(prose explanation, code snippet, etc.)
```

The `applies_to` field uses the canonical taxonomy from atom's `docs/LEARNINGS_TAXONOMY.md`: `universal`, `web`, `api`, `mobile`, `cli`, `library`, `ai`. Default is `[universal]` (ships to every project).

## Storage

```
~/.atom/learnings/
├── config.json
├── architecture/
│   └── ...md
├── pitfall/
│   └── ...md
├── pattern/
│   └── ...md
└── ... (one subdirectory per type)
```

Type subdirectories are created on demand as you promote entries.

## Environment

| Var | Purpose |
|---|---|
| `ATOM_HOME` | Override `~/.atom` location. Useful for tests. |
| `ATOM_LEARNINGS_HOME` | Override the learnings directory specifically. |
| `EDITOR` / `VISUAL` | Used by `nucleus promote` when refining drafts. |

## Privacy

`~/.atom/learnings/` is yours alone. Nothing leaves your machine without your explicit action. The optional GitHub sync is to **your own** private repo (created during `learnings init` or via existing URL); the maintainer of atom never sees your content.

## License

MIT (matches atom).
