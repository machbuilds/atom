# nucleus — build plan

> Status: rebuilt (v0.1.1) — moved from `~/.nucleus/` to `~/.atom/nucleus/`.
> Implementation: `bin/nucleus/`. Skill: `scaffold/.claude/skills/nucleus/SKILL.md`.
> `nucleus promote` target moved from `<atom-repo>/learnings/` (v0.1) to
> the user-owned `~/.atom/learnings/` (v0.1.1) — see `learnings.md`
> for the architectural shift.
> Migration is one-shot: nucleus detects `~/.nucleus/` on first run and
> renames it to `~/.atom/nucleus/`.
> Updated: 2026-05-06

## What it is

Cross-project learning store. Lives at `~/.atom/nucleus/` on the user's
machine. Captures key learnings from coding sessions into JSONL,
optionally synced to a private GitHub repo for cross-machine access.

Single CLI: `nucleus init`, `nucleus add`, `nucleus search`,
`nucleus sync`, `nucleus promote`, `nucleus slug`.

Independent of GBrain. Anyone who clones atom gets nucleus, no
GStack account or closed tooling required.

## Why

Most coding sessions teach you something. Without a capture system,
the learning evaporates the moment the session ends. nucleus catches
those lessons and lets future sessions (in any project) benefit from
them.

GBrain only captures at skill-invocation time and is closed to
gstack. nucleus captures during regular sessions and ships inside
atom for anyone who clones it.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Name | `nucleus` | Atom-themed; "the core knowledge of every project"; not generic like "brain" |
| Independence | Zero GStack/GBrain dependency | Must travel with atom to people who clone it |
| CLI structure | One command, subcommands | Modern pattern (git, gh, npm); discoverable via `nucleus --help` |
| Storage | JSONL at `~/.atom/nucleus/projects/<slug>/learnings.jsonl` | Git-diffable, grep-able, human-readable |
| Slug derivation | From git remote URL (`user/repo` → `user-repo`); cwd fallback | Stable across clones; `nucleus slug` exposes it |
| Sync | Optional private GitHub repo | User opts in; `~/.atom/nucleus` is itself a git repo |
| Capture mode | User picks at setup: claude-managed (default) / auto-timer / manual | Respects different working styles |
| Schema fields | 12 (see below) | Covers identity, content, metadata, lineage |
| Type enum (8) | architecture, pitfall, pattern, workflow, decision, bug-fix, performance, security | Covers what real projects produce |
| Confidence | 3-tier: low / medium / high | Simpler than 1-10; less false precision |
| Search | Keyword (ripgrep) + structured filters (jq) | Fast, no AI deps; semantic flagged for later |
| Claude integration | `.claude/skills/nucleus/SKILL.md` | Tells Claude when to capture, when to search |

## Schema

Each entry is one line in `learnings.jsonl`:

```json
{
  "id": "01HXY...",
  "ts": "2026-05-04T15:23:11Z",
  "schema_version": 1,
  "project": "machbuilds-atom",
  "type": "architecture",
  "key": "nucleus-uses-jsonl-not-sqlite",
  "insight": "Chose JSONL over SQLite for ~/.atom/nucleus because git-diffable, grep-able, and human-readable. SQLite would be faster but kills the cross-project sync story.",
  "confidence": "high",
  "source": "human",
  "files": ["bin/nucleus", "docs/planning/nucleus.md"],
  "tags": ["storage", "design-decision"],
  "supersedes": null,
  "session_id": "claude-2026-05-04-1523"
}
```

Field rules:

| Field | Required | Notes |
|---|---|---|
| `id` | yes | ULID. Stable cross-reference target. |
| `ts` | yes | ISO 8601 UTC. |
| `schema_version` | yes | Integer. Starts at 1. Migrations add a version on schema change. |
| `project` | yes | Output of `nucleus slug`. |
| `type` | yes | One of 8 enum values. |
| `key` | yes | Stable kebab-case. Primary lookup key for updates. |
| `insight` | yes | Prose, 1-3 sentences. The actual learning. |
| `confidence` | yes | `low`, `medium`, or `high`. |
| `source` | yes | `human`, `claude`, `cross-model`, or `observation`. |
| `files` | no | File paths the learning relates to. |
| `tags` | no | Free-form labels. |
| `supersedes` | no | ID of older entry this replaces. |
| `session_id` | no | Groups entries from same Claude session. |

## Capture modes

Picked at `atom-setup` time, written to `~/.atom/nucleus/config.json`.

- **claude-managed** (default). Claude calls `nucleus add` at natural
  session boundaries (end of feature, after a commit, on `/clear`).
  Lowest user friction, highest signal.
- **auto-timer**. Background process pulls from a session log Claude
  maintains, runs `nucleus add` every N minutes (configurable: 5,
  15, 30, 60). Useful for users who don't want to think about it.
- **manual**. Claude surfaces "worth capturing?" suggestions; user
  types `nucleus add "..."` themselves. For users who want full
  control.

## GitHub sync

Smart hybrid:

1. Wizard asks "Sync `~/.atom/nucleus` to GitHub for cross-machine access?"
2. If yes: "Existing repo URL or create new?"
3. For "create new":
   - If `gh` is detected and authenticated, create the repo
     immediately (default name `nucleus-<github-username>`, private,
     single user). Wire `~/.atom/nucleus` to it as origin.
   - If `gh` is not available, show two options: install gh and
     re-run, or create the repo manually and paste the URL.
4. If no, skip. User can run `nucleus init --setup-sync` later.

## Search

CLI:

```
nucleus search "auth token"
nucleus search --type pitfall
nucleus search --project atom --since 30d
nucleus search --confidence high
nucleus search "auth" --type pitfall --confidence high
nucleus search --files "src/auth/*"
nucleus search --tags storage
nucleus search "..." --sort=recent          # default: confidence DESC, recency DESC
nucleus search "..." --json                  # for programmatic consumers (Claude skill)
nucleus search "..." --semantic              # reserved for future
```

Default human-readable output:

```
machbuilds-atom · pitfall · high · 2026-04-12
  Auth token refresh races on parallel requests cause 401 storms.
  Cache the refresh promise; share it across concurrent calls.
  → src/auth/refresh.ts
```

Implementation: keyword pass via `rg` against `learnings.jsonl` files,
structured filters via `jq`, output formatted by the CLI.

## Promotion to learnings/

`nucleus promote <id>`:

1. Reads the entry by ID from JSONL.
2. Generates a draft `learnings/<type>/<slug>.md` file with YAML
   frontmatter populated from the entry.
3. Opens the draft in `$EDITOR`.
4. After the user closes the editor, commits the file (if inside
   the atom repo) or just leaves it on disk (if in a bootstrapped
   project).

See `learnings.md` for the target format.

## Risks at build time

- **Concurrent writes to JSONL**. If Claude and user both call
  `nucleus add` at the same time, append can corrupt. Solve with
  `flock(2)` or per-session staging files merged at sync time.
  Pick one before first write.
- **Schema migration**. `schema_version: 1` ships first. Any later
  schema change needs a migration script that walks all JSONL files
  and rewrites entries. Keep this in mind when designing v2 fields.
- **Slug collisions**. Two projects with same `user/repo` slug from
  different remotes would clobber each other. Unlikely (slug includes
  GitHub user), but allow `nucleus slug --override <name>` for the
  edge case.
- **Session log format**. auto-timer mode requires Claude to maintain
  a session log somewhere. Decide format (JSONL append? single
  current-session.json?) before shipping that mode.
- **Sync conflicts**. Two machines pushing to the same GitHub repo
  can conflict on `learnings.jsonl`. Standard git merge usually
  works because each line is independent, but document the recovery
  path.

## Dependencies

- None. nucleus is the foundation; everything else depends on it.
- learnings depends on nucleus (`nucleus promote` writes the files).
- atom-setup §3 (nucleus section) depends on nucleus existing.
