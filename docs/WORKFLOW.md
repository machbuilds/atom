# WORKFLOW.md — how the toolchain composes

atom assumes a specific stack of tools that compose into a development
workflow. Each tool has a clear job. Skipping any of them produces drift.

## The tools, ordered by when they fire

```
                    ┌──────────────────────────────────────────────┐
                    │  Superpowers (the underlying discipline)     │
                    │  clarify → design → plan → TDD → build → verify
                    └──────────────────────────────────────────────┘
                                          │
        ┌───────────────────────┬─────────┴─────────┬────────────────────┐
        │                       │                   │                    │
        ▼                       ▼                   ▼                    ▼
   speckit-constitution    speckit-specify      speckit-plan        speckit-tasks
   (principles)            (what to build)      (how to build)      (decompose)
        │                       │                   │                    │
        │                       │                   ▼                    │
        │                  /grill-me           /plan-ceo-review          │
        │                  (stress-test)       /plan-eng-review          │
        │                                      /plan-design-review       │
        │                                      (review the plan)         │
        │                                                                ▼
        │                                                        Multica issues
        │                                                        (track tasks)
        │                                                                │
        │                                                                ▼
        │                                                        /gsd-execute-phase
        │                                                        (run the plan)
        │                                                                │
        │                                                                ▼
        │                                                        /qa, /review,
        │                                                        /investigate, /ship
        │                                                        (verify, fix, deploy)
        │                                                                │
        ▼                                                                │
  CLAUDE.md ←─── (committed at every step) ───→ mem0 (per-commit memory)
        ▲                                                                │
        └────────── feeds back into Superpowers loop on next phase ──────┘
```

## What each tool does

### Superpowers — the discipline

**Not a tool, a contract.** Every task follows the same shape:
**clarify → design → plan → TDD → build → verify**. Skipping a step
forces a restart. Writing code before a failing test exists forces a
restart. This is the philosophy underneath everything else.

### Spec Kit — what before how

The `speckit-*` skills produce concrete artefacts:
- `speckit-constitution` — write/verify project principles
- `speckit-specify` — capture the feature spec
- `speckit-clarify` — AI asks clarifying questions to refine spec
- `speckit-plan` — generate plan.md from spec
- `speckit-tasks` — decompose plan into tasks
- `speckit-analyze` — cross-artefact consistency check
- `speckit-implement` — execute tasks

Use Spec Kit to lock down WHAT the project is before any code is written.
Run `speckit-constitution` AFTER drafting the constitution per
`HOW_TO_WRITE_CONSTITUTION.md` — as a verification pass.

### Grill-me — adversarial scope review

`/grill-me` interviews you relentlessly until each branch of the decision
tree is resolved. Use after a plan exists but before code is written.
Catches scope drift, hidden assumptions, and "what if" branches the planner
glossed over. Cheap to run, expensive to skip.

### GSD / Gstack — execute the plan

Once the plan is locked, GSD operationalises the discuss → plan → execute
→ verify loop with phase gates and atomic commits. Key skills:
- `/gsd-new-project` — start a new project (alternative entry to spec-kit)
- `/gsd-plan-phase N` — plan the Nth phase
- `/gsd-execute-phase N` — run the plan
- `/gsd-verify-work` — UAT + verification
- `/gsd-ship` — create PR, run review, prep for merge

GSD also includes review skills (`/plan-ceo-review`, `/plan-eng-review`,
`/plan-design-review`, `/plan-devex-review`) for cross-perspective plan
critique, and runtime skills (`/qa`, `/review`, `/investigate`, `/codex`,
`/canary`, `/health`) for execution-time work.

### Task Master — issue tracker bridge

`mcp__task-master-ai__*` exposes:
- `parse_prd` — turn a PRD into discrete tasks
- `next_task` — "what's next"
- `get_tasks`, `get_task` — task data
- `set_task_status`, `update_subtask` — status updates
- `expand_task` — break down a task into subtasks

Useful when a project starts from a PRD doc rather than from scratch.
Optional if you're using Multica or Linear directly.

### Multica — agent ownership + workspace

Multica enforces strict file boundaries between agents (Backend, Design,
Test, Deploy). Each agent has a skill file at `.claude/skills/<role>-agent/
SKILL.md` that lists owned paths. If a task crosses an agent boundary, the
agent must stop and flag a routing error, not silently edit the other
agent's files.

### mem0 — episodic decision log

mem0 records decisions per commit. Every commit gets a memory entry with:
- The SHA
- What changed
- The non-obvious WHY (the reason that won't be in `git log`)

Search at task start, write after task completes. `user_id: "<project-slug>"`
scopes the memories per project.

### GBrain — structured cross-project knowledge

GBrain holds knowledge that crosses project boundaries (architectural
patterns, security defaults, library evaluations). Queryable via
`gbrain search`. Use when a question might have been answered before
on a different project.

## The composition

In a typical project lifecycle:

| Phase | Primary tool | Supporting tools |
|---|---|---|
| Define principles | `speckit-constitution` + atom's HOW_TO doc | — |
| Spec the work | `speckit-specify` | `speckit-clarify` |
| Plan the work | `speckit-plan` + `/gsd-plan-phase` | `/grill-me`, `/plan-*-review` |
| Decompose | `speckit-tasks` | Multica issues, Task Master |
| Execute | `/gsd-execute-phase` | mem0 (log every commit), `/codex review` |
| Verify | `/gsd-verify-work`, `/qa` | `/canary`, `/health` |
| Ship | `/gsd-ship`, `/land-and-deploy` | CI workflows |

## Memory load order

In every project bootstrapped from atom:

```
project's CLAUDE.md  →  mem0 query  →  GBrain search  →  Multica skill  →  .claude/memory.md
```

The order matters. CLAUDE.md is hand-curated truth (highest signal).
mem0 is project-scoped episodic memory. GBrain is cross-project. Multica
skills are role-specific procedural memory. `.claude/memory.md` is
auto-generated session notes (lowest signal, highest noise).

## When to deviate

The composition above is the default for non-trivial projects. For very
small one-shot tasks (e.g., a 30-minute helper script), you can skip
Spec Kit and Multica and go straight to `/gsd-quick` or just write the
code. But for anything you'd want to maintain in 6 months, run the
full loop.
