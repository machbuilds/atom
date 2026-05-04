# learnings — build plan

> Status: locked. Ready to build.
> Updated: 2026-05-04

## What it is

The graduation layer for nucleus entries. Path: `atom/learnings/`.
One Markdown file per generalized learning, with YAML frontmatter.

Lives inside the atom repo itself. Every project bootstrapped from
atom inherits the relevant subset of these files at clone time.

## Why

nucleus captures session learnings raw and project-tagged. Most stay
project-specific. The ones that turn out to apply across projects
need somewhere to live where they propagate to new projects at
bootstrap. That somewhere is `learnings/`.

Without this layer, a learning captured in project A never reaches
project B. The graduation flow makes the value compound.

## Promotion flow

```
session
  ↓ (Claude or user captures via nucleus add)
nucleus (raw, project-tagged, lives in ~/.nucleus)
  ↓ (passes generalization test; nucleus promote <id> in atom repo)
learnings/<type>/<slug>.md (curated, lives in atom repo)
  ↓ (refined further into prose narrative; manual)
docs/LESSONS_LEARNED.md (curated essay-form lessons)
```

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Directory name | `learnings/` | Descriptive; matches existing CLAUDE.md and HANDOFF.md references; renaming for theme adds no value |
| File path | `learnings/<type>/<slug>.md` | Subdirectory by type makes 50+ entries scannable; date prefix is noise (frontmatter has `ts`) |
| Promotion mechanism | `nucleus promote <id>` opens `$EDITOR` with generated draft | Combines Claude pattern-matching with human judgment |
| Bootstrap selection | `applies_to: [universal]` ships always; stack-specific filtered by wizard stack choice | Most learnings are universal; tagging is opt-in for the minority |
| Default `applies_to` | `[universal]` | Contributors don't need to think about it unless writing genuinely stack-specific content |

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

## Frontmatter rules

| Field | Required | Notes |
|---|---|---|
| `key` | yes | Same kebab-case key as the source nucleus entry. |
| `type` | yes | One of 8 enum values. Determines subdirectory. |
| `confidence` | yes | `low` / `medium` / `high`. |
| `source` | yes | `promoted-from-nucleus`, `direct-write`, or `cross-model`. |
| `nucleus_id` | when promoted | Back-reference to the nucleus entry. |
| `ts` | yes | ISO date (YYYY-MM-DD). |
| `tags` | no | Free-form labels. |
| `supersedes` | no | Path to older learning file this replaces (e.g. `pitfall/old-key.md`). |
| `applies_to` | yes | Array. `[universal]` by default. Possible: `web`, `api`, `mobile`, `cli`, `python`, `node`, `swift`, etc. |

## Bootstrap selection

When `atom-setup` runs, it copies `learnings/` files into the new
project based on the user's stack and category choices in §2.

Algorithm:

```
for each file in atom/learnings/<type>/*.md:
  read frontmatter
  if "universal" in applies_to OR user's_stack_tags ∩ applies_to:
    copy file to <new-project>/learnings/<type>/<slug>.md
```

Wizard prints: `Copying 23 universal learnings + 8 web-specific
learnings into your project...`

Projects bootstrapped from atom can then reference their own
`learnings/` directory the same way atom does. Their learnings can
themselves be promoted upstream via PR to atom if generalized.

## Generalization test

A nucleus entry passes the generalization test (and is therefore
ready for promotion) when:

- It would help a project unrelated to where it came from.
- It does not reference project-specific names, IDs, internal jargon.
- The lesson is a pattern, not an incident.

If the test fails, the entry stays in nucleus and never graduates.

## Risks at build time

- **`nucleus promote` outside atom repo**. If user runs promote in
  a bootstrapped project, the file should land in that project's
  own `learnings/`, not atom's. Detect repo identity before writing.
- **Slug collisions**. Two promotions producing the same slug must
  fail or auto-suffix. Pick one before first write.
- **`applies_to` taxonomy drift**. Without a controlled vocabulary,
  contributors will invent inconsistent tags (`web` vs `webapp` vs
  `frontend`). Define the canonical list in `docs/LEARNINGS_TAXONOMY.md`
  as part of build.
- **Existing prose lessons**. `docs/LESSONS_LEARNED.md` has 10+
  entries from wallet-persona. Decide whether to back-port them as
  individual `learnings/<type>/<slug>.md` files or leave them as
  prose. (Recommendation: leave as prose; new content goes through
  the new flow.)

## Dependencies

- nucleus must exist (`nucleus promote` is the entry point).
- `atom-setup` §2 must record stack tags so the bootstrap selector
  knows what to copy.
- `docs/LEARNINGS_TAXONOMY.md` defines the canonical `applies_to`
  values.
