# LEARNINGS_TAXONOMY.md — the canonical `applies_to` vocabulary

The `applies_to` field in every `learnings/<type>/<slug>.md` controls
which projects bootstrapped from atom inherit that learning. This
file defines the allowed values.

Without a controlled vocabulary, contributors invent inconsistent
tags (`web` vs `webapp` vs `frontend`). That breaks bootstrap-time
filtering. Pick values from this list.

## Canonical values

| Value | Meaning | Example matches |
|---|---|---|
| `universal` | Applies to every kind of project | "Pin dependencies to caret-major" |
| `web` | Browser-rendered or SSR web apps | "Cache in-flight refresh promise across concurrent fetch calls" |
| `api` | Backend APIs (REST, GraphQL, RPC) | "Use cursor pagination, not offset, past 10k rows" |
| `mobile` | iOS, Android, React Native | "Avoid synchronous main-thread layout in scroll handlers" |
| `cli` | Command-line tools | "Parse stdin only when not a TTY" |
| `library` | Reusable packages (npm, pip, etc.) | "Ship dual ESM + CJS via package.json `exports` map" |
| `ai` | LLM-driven apps, agents, RAG systems | "Cache embeddings by content hash, not by request id" |

Most learnings are `[universal]`. Stack-specific values are the
minority by design.

## Wizard mapping (which projects get which learnings)

When `atom-setup` runs and the user picks a primary stack in §2, the
wizard derives a set of stack tags. A learning is copied to the new
project when:

```
"universal" ∈ learning.applies_to
   OR
project.stack_tags ∩ learning.applies_to ≠ ∅
```

| Wizard stack choice | Stack tags |
|---|---|
| Next.js | `[universal, web]` |
| React (SPA) | `[universal, web]` |
| Astro / static site | `[universal, web]` |
| Python (FastAPI / Flask) | `[universal, api]` |
| Node API (Express / Fastify) | `[universal, api]` |
| Swift / iOS | `[universal, mobile]` |
| React Native / Expo | `[universal, mobile]` |
| Go / Rust / Python CLI | `[universal, cli]` |
| Library (npm / pip / cargo) | `[universal, library]` |
| AI agent / LLM app | `[universal, ai]` |
| Other / Decide later | `[universal]` |

When in doubt, default to `[universal]`. A learning that sometimes
applies to non-web projects but mostly applies to web should still
be `[web]` (false negatives are cheap; false positives are noise in
projects that don't need it).

## How to use `applies_to`

In a learning file's frontmatter:

```yaml
applies_to: [universal]            # the default, ships everywhere
applies_to: [web]                  # ships only to web projects
applies_to: [web, api]             # ships to web OR api projects
applies_to: [universal, ai]        # ships everywhere; flagged as ai-relevant
```

Lists are unions, not intersections. `[web, api]` means "ships if the
project is web or api," not "must be both."

## Adding new values

Adding a value to this list requires:

1. A PR to `docs/LEARNINGS_TAXONOMY.md` proposing the value.
2. A clear definition (what's in vs. out).
3. At least one real learning that needs the value (no speculative additions).
4. Approval before the value can appear in any `learnings/*.md` file.

Keep the list small. Five well-defined values beat fifteen overlapping
ones. If a category isn't pulling weight, fold it back into a
broader one.

## What `applies_to` is not

- **Not for runtime/language tags.** `node`, `python`, `swift`,
  `typescript` go in the `tags:` field, not `applies_to`. A learning
  about "Node EventEmitter memory leaks" is `applies_to: [universal]`
  with `tags: [node, performance]`. Filtering by language at bootstrap
  is overkill.
- **Not for concern domains.** `auth`, `data`, `security`, `performance`
  go in `tags:`. They cross-cut categories; using them for filtering
  produces noise.
- **Not for deploy targets.** `railway`, `vercel`, `fly` go in `tags:`.
  Deploy-specific learnings are usually too narrow for cross-project
  application.

If a learning genuinely only applies to one deploy target or framework,
it probably belongs in that preset's docs (`extras/<category>/<preset>/`),
not in `learnings/`.
