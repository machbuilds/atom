# learnings/

The graduation layer. Generalized learnings that apply across projects
live here, one Markdown file per learning, organized by type.

Every project bootstrapped from atom inherits the relevant subset of
these files at clone time, filtered by the `applies_to` field against
the project's stack.

## Layout

```
learnings/
├── architecture/
├── pitfall/
├── pattern/
├── workflow/
├── decision/
├── bug-fix/
├── performance/
└── security/
```

Subdirectories are created as content lands; not all need to exist
on day one.

## File format

```markdown
---
key: cache-refresh-promise-races
type: pitfall
confidence: high
source: promoted-from-nucleus
nucleus_id: 01HXY...
ts: 2026-05-04
tags: [auth, concurrency, performance]
supersedes: null
applies_to: [web, api]
---

# Cache the refresh promise; share it across concurrent calls.

When parallel requests both detect an expired token, each kicks off
its own refresh and races. The losing requests get 401 storms while
the winning refresh succeeds.

Fix: cache the in-flight refresh promise and have all concurrent
callers await it.

```ts
let refreshing: Promise<Token> | null = null;

function refreshToken() {
  if (refreshing) return refreshing;
  refreshing = doRefresh().finally(() => { refreshing = null; });
  return refreshing;
}
```
```

## Required frontmatter

| Field | Required | Notes |
|---|---|---|
| `key` | yes | Same kebab-case as source nucleus entry. |
| `type` | yes | One of 8: `architecture`, `pitfall`, `pattern`, `workflow`, `decision`, `bug-fix`, `performance`, `security`. Determines subdirectory. |
| `confidence` | yes | `low` / `medium` / `high`. |
| `source` | yes | `promoted-from-nucleus`, `direct-write`, or `cross-model`. |
| `nucleus_id` | when promoted | Back-reference to the nucleus entry. |
| `ts` | yes | ISO date `YYYY-MM-DD`. |
| `tags` | no | Free-form labels (e.g. `[auth, concurrency]`). Used in search; not used in bootstrap filtering. |
| `supersedes` | no | Path to older learning this replaces (e.g. `pitfall/old-key.md`). |
| `applies_to` | yes | Array of canonical values. See `docs/LEARNINGS_TAXONOMY.md`. Default: `[universal]`. |

## How content lands here

Most files arrive via `nucleus promote <id>`:

1. A learning gets captured into `~/.nucleus` during a session.
2. Over time, the learning proves to apply across projects (you see
   the same lesson surface in different work).
3. From inside the atom repo, run `nucleus promote <id>`. nucleus
   generates a draft `learnings/<type>/<slug>.md` and opens
   `$EDITOR` for refinement.
4. Apply the **generalization test** (see below). If it passes, save
   the file and commit. If not, scrub the project-specific bits or
   drop the file.

Direct writes (without promoting from nucleus) are allowed but rare.
Use `source: direct-write` and skip `nucleus_id`.

## The generalization test

Before saving a learning here, ask:

- Would this help a project unrelated to where it came from?
- Does it reference project-specific names, IDs, vendor quirks, or
  internal jargon? If yes, scrub them.
- Is the lesson a pattern, or just an incident?

If the answer is "this is too specific," either rewrite at a higher
level of abstraction or drop the file. The goal is a small set of
high-value, broadly-applicable lessons. Not a personal log.

## Bootstrap filtering

When `atom-setup` clones into a new project, it runs
`scripts/copy-learnings.js`. The script filters by stack:

- A learning ships if `universal ∈ applies_to` OR
  `project.stack_tags ∩ applies_to ≠ ∅`.
- Projects without a defined stack ("Decide later") get only
  `universal` learnings.

Stack tag mapping is in `docs/LEARNINGS_TAXONOMY.md`.

## What does NOT belong here

- **Project-specific facts.** "Update `/api/v1/users/me` to return
  304." That's a commit message, not a learning.
- **Vendor quirks.** "Railway 2024-08-13 build cache hash bug."
  Belongs in `extras/<category>/<preset>/` if it applies to that
  preset, or in the source project's own learnings, not atom's.
- **In-progress thoughts.** Use `docs/INBOX.md` for raw capture or
  `~/.nucleus` for project-tagged capture. Promote here only after
  the lesson has settled.

## Related docs

- `docs/LEARNINGS_TAXONOMY.md` — `applies_to` vocabulary
- `docs/planning/learnings.md` — design rationale
- `bin/nucleus/README.md` — how to capture and promote
- `CONTRIBUTING.md` — full contribution flow
