# PATTERNS.md — reusable patterns

Patterns that have proven themselves across at least one shipped project.
See `CONTRIBUTING.md` for the format and the generalisation test before
adding new ones.

---

### Five non-negotiable principles

**First encountered**: 2026-04-29 (wallet-persona, constitution v1.1.0)
**Tag**: governance, planning, code-review
**Why this generalises**: every project benefits from a small fixed set of
non-negotiables that override taste calls.

Pick at most 5 principles that the project will not compromise on.
One-line statement + one-paragraph rationale per principle. Version the
list (semver) and lock it in `.specify/memory/constitution.md`. Reference
the version from `AGENTS.md`. Every PR's review checklist includes
"does this respect principles I-V?"

If you find yourself with 8 principles, you don't have a constitution —
you have a wishlist. Cut.

**How to apply**: include the principles section in `scaffold/AGENTS.md`
with `<TODO>` markers. Reference them from the PR template's
"Constitutional checks" section. Re-read them at every milestone gate.

---

### Agent ownership matrix with strict file boundaries

**First encountered**: 2026-04-29 (wallet-persona, multi-agent split)
**Tag**: multi-agent, governance
**Why this generalises**: any project with more than one developer (or one
human + multiple AI agents) benefits from explicit ownership.

Define a table mapping agents to owned paths. If a task forces an agent
across the boundary, it must stop and flag a routing error, not silently
edit the other agent's files. Each agent has a skill file at
`.claude/skills/<role>-agent/SKILL.md` codifying:
- Owned paths
- Conventions and constraints
- Memory load order
- Constitutional enforcement points

The matrix is part of the constitution. Crossing boundaries silently is
a constitution violation, not a process suggestion.

**How to apply**: fill the agent ownership table in `scaffold/AGENTS.md`.
Customise each `scaffold/.claude/skills/<role>-agent/SKILL.md` with the
project's specific paths and conventions.

---

### Tech stack lock with version pins

**First encountered**: 2026-04-29 (wallet-persona, plan.md)
**Tag**: dependencies, governance
**Why this generalises**: silent version drift across team members or
CI/local mismatches cause hours of debugging.

In `AGENTS.md`, declare every key dependency with an explicit version
pin: runtime (Node 20, Python 3.12, etc.), framework (Next 14.2.x), key
libs (the database client, the LLM SDK, etc.). Pin to **minor not exact
patch** so security fixes flow automatically. Re-evaluate the lock at
every milestone.

**How to apply**: section in `scaffold/AGENTS.md` titled "Tech stack
(locked)". Cross-reference from `package.json` / equivalent.

---

### Two-tier env vars (required vs optional)

**First encountered**: 2026-05-03 (wallet-persona, /api/health refactor)
**Tag**: ops, healthcheck, env-vars
**Why this generalises**: every project has env vars whose absence has
different severity.

Split env vars into:
- **Required** — boot fails if missing. Healthcheck returns 503.
- **Optional** — degrades gracefully if missing. Healthcheck returns 200
  with `degraded` status and a list of missing optional vars.

The healthcheck endpoint surfaces both: `status: "ok" | "degraded"`,
plus an `optional: "missing: ..."` field when applicable. Restart-loop
behaviour gets reserved for genuine breakage, not graceful-degradation
paths.

**How to apply**: in the project's `/api/health` (or equivalent),
maintain `REQUIRED_ENV` and `OPTIONAL_ENV` arrays. In `AGENTS.md`'s
env vars table, add a column distinguishing the two.

---

### Mock data with explicit env-var override

**First encountered**: 2026-05-03 (wallet-persona, MOCK_DATA_ENABLED)
**Tag**: demo, ops, env-vars
**Why this generalises**: pre-launch demos need populated UI on
production-mode hosts without flipping `NODE_ENV`.

Build a `MOCK_DATA_ENABLED` env var that activates fixture data fallbacks
in any data-dependent endpoint. Default off. Gate on it explicitly:

```
const explicitMockEnabled = process.env.MOCK_DATA_ENABLED === "true";
export const MOCK_DATA_ENABLED = (NODE_ENV === "development") || explicitMockEnabled;
```

Add a loud `console.warn` at module load when mock is on in a non-dev
env, so the flag is hard to forget about post-demo.

**How to apply**: when building any data-fetch fallback for development,
expose the flag via env var so demo deploys can opt in. Document the
flag in `AGENTS.md`'s env vars table with a "MUST REMOVE BEFORE LAUNCH"
note.

---

### Per-commit mem0 memory log

**First encountered**: 2026-05-03 (wallet-persona, ongoing convention)
**Tag**: memory, decision-log
**Why this generalises**: every project benefits from durable rationale
that survives `git log` truncation.

After every commit, write a mem0 entry with:
- The commit SHA
- What changed (one line, generalised)
- The non-obvious WHY (the constraint, the surprise, the past incident)

Don't log derivable facts (file paths, code patterns). Log only what
won't be obvious from the diff months later.

**How to apply**: codify in `AGENTS.md` as a per-commit habit. The
agent should propose the mem0 entry alongside the commit, then write
both atomically.

---

### Two-phase data fetch for batch APIs

**First encountered**: 2026-04-29 (wallet-persona, Moralis integration)
**Tag**: api-integration, performance, cost
**Why this generalises**: any external API with expensive batch endpoints
benefits from a cheap detection phase before bulk work.

Phase 1: cheap detection calls to filter the targets that need bulk work.
Phase 2: bulk-fetch only the live targets, in parallel, with timeout
budgets per chain/region/tenant.

This pattern shows up whenever an API is "free to query, expensive to
bulk-process" — which is most modern data APIs.

**How to apply**: in any `lib/<service>.ts` integration layer, structure
the entry function as `phase1Detect()` then `phase2Fetch()`. Document
the CU/cost budget per call in the function header.

---

### Memory load order

**First encountered**: 2026-04-29 (wallet-persona, AGENTS.md)
**Tag**: memory, agent-bootstrapping
**Why this generalises**: AI agents need a clear precedence when multiple
memory sources contradict.

Load order at task start:
**project's AGENTS.md → mem0 query → GBrain search → Multica skill →
.claude/memory.md**

Highest signal first. Most-noisy last. When sources disagree, higher-precedence
wins.

**How to apply**: state the order in `scaffold/AGENTS.md`'s "Memory
architecture" section. Apply uniformly across every agent.

---

### Constitution-as-code

**First encountered**: 2026-04-29 (wallet-persona, .specify/memory/constitution.md)
**Tag**: governance, versioning
**Why this generalises**: principles drift over time; versioning forces
explicit conversations when they change.

Store the constitution at `.specify/memory/constitution.md` with a semver
header. Breaking changes (removing a principle, weakening a constraint)
bump major. New principles bump minor. Wording polish bumps patch.
Reference the active version from `AGENTS.md`.

When you violate a principle, you don't quietly do it — you bump the
constitution, write the rationale, and the diff lives in `git log`.

**How to apply**: scaffold provides the directory structure. The constitution
content itself comes from `HOW_TO_WRITE_CONSTITUTION.md`.

---

### Co-authored commit trailer for AI-assisted work

**First encountered**: 2026-04-29 (wallet-persona, every commit)
**Tag**: git, transparency, audit
**Why this generalises**: any project with AI involvement benefits from
making the AI co-authorship visible in `git log`.

End every AI-assisted commit message with:

```
Co-Authored-By: <Agent name> <noreply@<vendor>.com>
```

GitHub recognises this trailer and shows both authors on the commit page.
Auditable in `git log`. Encourages clear separation of human-authored
vs AI-collaborative work in code review.

**How to apply**: include in `scaffold/AGENTS.md`'s git rules section.
The agent appends the trailer automatically when proposing commits.

---

(Add new entries below using the structured format from `CONTRIBUTING.md`.)
