# CLAUDE.md

Guidance for Claude Code working in this repository. Source of truth:
`.specify/memory/constitution.md` (v<TODO: version>) +
`<TODO: link to plan.md, spec.md, or other primary planning doc>`.

## Project overview

<TODO: 1-paragraph description — what this is, what problem it solves,
who the user is. Be concrete. Reference real numbers if they exist.>

<TODO: 1-paragraph on the product's "primary surface" — what's the canonical
user moment? Mobile screenshot? Desktop dashboard? CLI output? API
response? This decides many downstream design and engineering tradeoffs.>

## <N> non-negotiable principles (constitution v<TODO>)

<TODO: list 3-5 principles, each one-line action-oriented, each followed
by a short rationale. See atom's `docs/HOW_TO_WRITE_CONSTITUTION.md`.>

1. **<Principle 1>** — <one-line rationale>
2. **<Principle 2>** — <one-line rationale>
3. **<Principle 3>** — <one-line rationale>
4. **<Principle 4 — optional>**
5. **<Principle 5 — optional>**

## Tech stack (locked)

<TODO: pin runtime, framework, key libraries. Pin to caret-minor, not
exact patch. See atom's `docs/LESSONS_LEARNED.md` on dependency pinning.>

- **Runtime**: <e.g., Node.js 20, Python 3.12>
- **Framework**: <e.g., Next.js ^14.2.x, FastAPI ~=0.110>
- **Database**: <e.g., PostgreSQL via `pg` ^8.x>
- **Cache**: <e.g., Redis via `ioredis` ^5.x>
- **Hosting**: <target — see atom's `docs/HOW_TO_PICK_DEPLOY_TARGET.md`>
- **Key libraries**: <list with pins>

<TODO: one-line cost envelope expectation — e.g., "~$0.005/request at scale"
or "~$50/month at expected traffic">

## Folder conventions

<TODO: describe the project's directory structure. Keep it terse — the
pattern is what matters, not every file.>

```
src/
├── <main entry>
├── <api/server logic>
├── <components — if frontend>
├── <lib — pure functions>
├── <types>
├── <constants>
└── <tests>
```

<TODO: one-line note on where pure functions live vs where I/O lives.>

## Agent ownership rules (do not cross boundaries)

<TODO: customise this matrix for the project. If solo with no agent split,
write "solo build — no agent split" and skip the table.>

| Agent | Harness | Owns |
|---|---|---|
| **Backend** | <e.g., Claude Code> | <paths> |
| **Design** | <e.g., Codex> | <paths> |
| **Test** | <e.g., Gemini CLI> | <paths> |
| **Deploy** | <e.g., Claude Code> | <paths> |

If a task forces you across a boundary, **stop** and flag it as a routing
error. Never silently edit another agent's files.

Skill files in `.claude/skills/{role}-agent/SKILL.md` define each agent's
full workflow, conventions, and constitutional enforcement points.

## Workflow discipline (Superpowers — non-negotiable)

Every task: **clarify → design → plan → TDD → build → verify**. Skipping
a step = mandatory restart. Writing code before a failing test exists =
mandatory restart.

## Environment variables

`.env` is never committed. `.env.example` is the canonical reference.

<TODO: list env vars in this format. Mark each Required or Optional per
the two-tier pattern in atom's `docs/PATTERNS.md`.>

| Variable | Required? | Notes |
|---|---|---|
| `<VAR_1>` | Required | <what it's for> |
| `<VAR_2>` | Required | <what it's for> |
| `<VAR_3>` | Optional | <what it's for; what degrades if missing> |

`NEXT_PUBLIC_*` (or framework equivalent) vars are inlined into the
client bundle at build time. Never put a secret behind that prefix.

<TODO: note what the healthcheck endpoint does. Required env missing
should be 503; optional env missing should be 200 with `degraded` status.>

## Git rules

- **Never** `--no-verify`, `--force` to `main`, or `--no-gpg-sign`.
- **Never** amend a published commit. Create a new commit instead.
- **Always** force-push with `--force-with-lease`, never `--force`.
- Stage specific files (`git add path/to/file`), not `git add .` or `-A`
  — keeps `.env` and credentials out of accidental commits.
- Commit messages: lowercase imperative, scoped where useful
  (`backend: …`, `design: …`, `deploy: …`).
- Co-author trailer required when AI-assisted:
  `Co-Authored-By: <agent name> <noreply@<vendor>.com>`.

## Memory architecture

Load order at task start:
**this CLAUDE.md → mem0 query → GBrain search → Multica skill → `.claude/memory.md`**.

- **CLAUDE.md** (this file) — static, hand-maintained, hard cap ~200 lines.
- **mem0** — episodic; agents log key decisions after task completion.
  All memory operations use `user_id: "<TODO: project-slug>"`.
- **GBrain** — structured cross-project knowledge; queried via `gbrain search`.
- **Multica skills** — procedural, per-agent, in `.claude/skills/`.
- **`.claude/memory.md`** — auto-generated session notes; do not edit.

After every commit, log a mem0 entry with the SHA, what changed, and the
non-obvious WHY (the constraint, the surprise, the past incident).

## Source-of-truth references

<TODO: link to project-specific planning docs once they exist:>

- `.specify/memory/constitution.md` — principles + locked tech stack
- `<spec.md, plan.md, etc.>` — feature specs and implementation plans
- `<contracts/, schemas/>` — API contracts and data shapes
- `<README.md, docs/>` — how to develop locally
- `.claude/skills/{role}-agent/SKILL.md` — per-agent procedural memory

## Project status

<TODO: one-line on current phase. E.g., "Phase 1 (planning), no production
code yet" or "Phase 2 (active development), beta target X".>
