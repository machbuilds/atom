# LEARNINGS_TAXONOMY.md — the canonical `applies_to` vocabulary

The `applies_to` field in every `learnings/<type>/<slug>.md` controls
which projects bootstrapped from atom inherit that learning. This
file defines the allowed values.

Without a controlled vocabulary, contributors invent inconsistent
tags (`web` vs `webapp` vs `frontend`). That breaks bootstrap-time
filtering. Pick values from this list.

## Canonical values

### Project-shape values (broad)

| Value | Meaning | Example matches |
|---|---|---|
| `universal` | Applies to every kind of project | "Pin dependencies to caret-major" |
| `web` | Browser-rendered or SSR web apps | "Cache in-flight refresh promise across concurrent fetch calls" |
| `api` | Backend APIs (REST, GraphQL, RPC) | "Use cursor pagination, not offset, past 10k rows" |
| `mobile` | iOS, Android, React Native | "Avoid synchronous main-thread layout in scroll handlers" |
| `cli` | Command-line tools | "Parse stdin only when not a TTY" |
| `library` | Reusable packages (npm, pip, etc.) | "Ship dual ESM + CJS via package.json `exports` map" |
| `ai` | LLM-driven apps, agents, RAG systems | "Cache embeddings by content hash, not by request id" |

### Language values (preset-bound)

These exist for learnings that are genuinely language-specific and
would be noise in projects of a different language. They were added
in v0.2 alongside the per-language stack presets.

| Value | Meaning | Example matches |
|---|---|---|
| `node` | Node.js runtime | "Use `npm pack --dry-run` before publish" |
| `python` | Python runtime | "Pydantic v2 over v1 for new code" |
| `rust` | Rust toolchain | "cargo-chef for Docker builds" |
| `go` | Go toolchain | "Inject version via ldflags, not source" |
| `swift` | Swift toolchain (server or iOS) | "Static-link the stdlib for Linux deploys" |

Most learnings are `[universal]`. Project-shape and language-specific
values are the minority by design — the bar to use one is "this is
genuinely useless or wrong outside the named context."

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
| Next.js + Railway | `[universal, web, node]` |
| Python / FastAPI | `[universal, web, api, python]` |
| Swift / Vapor | `[universal, web, api, swift]` |
| Rust / Axum | `[universal, web, api, rust]` |
| Go CLI (Cobra) | `[universal, cli, go]` |
| TypeScript library | `[universal, library, node]` |
| React (SPA) | `[universal, web, node]` |
| Astro / static site | `[universal, web]` |
| Node API (Express / Fastify) | `[universal, web, api, node]` |
| Python API (other) | `[universal, web, api, python]` |
| Swift / iOS | `[universal, mobile, swift]` |
| React Native / Expo | `[universal, mobile]` |
| CLI (other) | `[universal, cli]` |
| Library (other) | `[universal, library]` |
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

- **Not for runtimes outside the canonical list.** `node`, `python`,
  `rust`, `go`, `swift` are allowed (see "Language values" above).
  Other runtimes (`ruby`, `java`, `kotlin`, `dotnet`) go in the
  `tags:` field until a preset for them lands. Adding a new language
  value follows the "Adding new values" rules — needs at least one
  real preset and at least one real learning.
- **Not for concern domains.** `auth`, `data`, `security`, `performance`
  go in `tags:`. They cross-cut categories; using them for filtering
  produces noise.
- **Not for deploy targets.** `railway`, `vercel`, `fly` go in `tags:`.
  Deploy-specific learnings are usually too narrow for cross-project
  application.

If a learning genuinely only applies to one deploy target or framework,
it probably belongs in that preset's docs (`extras/<category>/<preset>/`),
not in `learnings/`.
