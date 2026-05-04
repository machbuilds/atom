# AGENTS.md

Project instructions for any AI tool working in this repository. Source
of truth: `.specify/memory/constitution.md` (v<TODO: version>) +
`<TODO: link to plan.md, spec.md, or other primary planning doc>`.

This is the canonical instructions file. Tool-specific files (`CLAUDE.md`,
`GEMINI.md`, `.cursorrules`, `.github/copilot-instructions.md`) are
forwarders that point here. atom's richest experience assumes Claude
Code; other tools (Codex CLI, Gemini CLI, Cursor, Copilot) read this
file and call the project's CLIs (e.g. `nucleus`) directly.

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

Skill files in `.claude/skills/{role}-agent/SKILL.md` define each
agent's full workflow, conventions, and constitutional enforcement
points. These are Claude-specific augmentations on top of the
instructions in this file. AI tools without skill auto-loading still
get the relevant guidance by reading this file.

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
**this AGENTS.md → nucleus search (relevant) → mem0 query → Multica skill → `.claude/memory.md`** (Claude only)

- **AGENTS.md** (this file) — static, hand-maintained, hard cap ~250 lines.
  Tool-specific forwarders (`CLAUDE.md`, `GEMINI.md`, `.cursorrules`,
  `.github/copilot-instructions.md`) all redirect here.
- **nucleus** — cross-project learning store. Run `nucleus search "<keyword>"`
  at session start when the work touches a known concern (auth, caching,
  deploys, migrations). See "Tooling > nucleus" below for full usage.
- **mem0** — episodic; agents log key decisions after task completion.
  All memory operations use `user_id: "<TODO: project-slug>"`.
- **Multica skills** — procedural, per-agent. In Claude Code, lives at
  `.claude/skills/`. Other tools read the equivalent guidance from this
  file directly.
- **`.claude/memory.md`** — auto-generated session notes; Claude-only;
  do not edit.

After every commit, log a mem0 entry with the SHA, what changed, and the
non-obvious WHY (the constraint, the surprise, the past incident).

## Tooling

The project's CLIs and conventions for AI tools.

### nucleus — cross-project learning store

This project has nucleus available. Run `nucleus --help` for the full
CLI. Common subcommands: `nucleus search`, `nucleus add`, `nucleus slug`,
`nucleus promote`, `nucleus sync`.

**When to search nucleus:**

At session start, before coding on a known concern (auth, caching,
deploys, migrations, performance, etc.):

```
nucleus search "<keyword>" --json --limit 5
```

If past pitfalls or patterns apply, mention them to the user before
proceeding. Empty results: proceed normally; do not pad responses with
"nucleus had nothing to say."

Before non-obvious decisions, search for prior context:

- Adding a new dependency: `nucleus search --type pitfall --tags deps`
- Adding a cache layer: `nucleus search "cache"`
- Writing a migration: `nucleus search --type pitfall --tags migration`

**When to add to nucleus:**

The capture mode is in `~/.nucleus/config.json`. Three modes:

| Mode | AI behavior |
|---|---|
| `claude-managed` (default) | Capture at natural session boundaries: end of feature, after a commit, on `/clear`. Apply the generalization test for each candidate. |
| `manual` | Surface candidates to the user ("Worth capturing? — `<one-line>`") but do not call `nucleus add`. The user runs it. |
| `auto-timer` | A background process drains a session log periodically. Append to `~/.nucleus/sessions/<session>.log` instead of calling `nucleus add` directly. |

Capture command:

```
nucleus add "<insight>" \
  --type architecture|pitfall|pattern|workflow|decision|bug-fix|performance|security \
  --confidence low|medium|high \
  --source human|claude|cross-model|observation \
  --tags tag1 tag2 \
  --files path/to/file
```

**The generalization test (the one filter that matters):**

Would this teach something that applies beyond the current project?
If it references a project-specific endpoint, table, or vendor quirk,
**don't capture**. The fix is in the code; the lesson is not.

Pass: "Cache the refresh promise across concurrent calls."
Fail: "Update the `/api/v1/users/me` route to return 304." (project-specific)

**What not to do:**

- Do not call `nucleus add` after every Bash command. Capture is for
  durable lessons, not noise.
- Do not capture project-specific facts as universal learnings.
- Do not write hedged or vague insights. "Be careful with auth" is
  not a learning. "Cache the in-flight refresh promise" is.
- Do not invoke `nucleus sync` automatically. Sync is on the user's
  clock (on `/clear`, end of day, or explicit request).

**Promotion (rare):**

When a learning has settled and applies broadly, graduate it from
nucleus to atom's `learnings/`:

```
nucleus promote <id>
```

This generates a draft `learnings/<type>/<slug>.md` and opens
`$EDITOR`. Only run from inside the atom repo (or a fork intended for
PR back to atom).

### model-race — parallel AI model comparison via Git worktrees

This project may have model-race available (opt-in via the wizard;
check for `model-race.config.json` in the repo root). Run
`model-race --help` for the CLI.

**What it is.** A development-time workflow for running the same
feature spec through multiple AI models in parallel via Git worktrees.
Compare the implementations, merge the winner.

**When to suggest it (AI-facing rule):**

Only when the user is about to make a non-obvious decision with multiple
reasonable approaches AND the stakes justify the comparison cost. Cases:

- Tricky algorithm or data structure choice.
- Non-obvious API design where shape decisions compound later.
- Performance-critical hot paths.
- Refactors where the right pattern is unclear.

NOT for: CRUD endpoints, boilerplate, glue code, bug fixes, or
anything where the answer is obvious.

**Lifecycle:**

```
model-race start <feature> --spec spec.md   # create worktrees
model-race status                            # see state
model-race launch <model>                    # open AI CLI in worktree
                                              # (run for each model in
                                              #  separate terminal)
model-race score                              # automated scorecard
model-race judge                              # opt-in LLM evaluation
model-race merge <winner>                     # cherry-pick + cleanup
```

**Spec quality matters.** A race is only as good as its spec. Before
`model-race start`, help the user write a spec with:

- One-paragraph statement.
- Testable acceptance criteria.
- Constraints (perf budgets, API contracts, file boundaries).
- No solution details (don't pre-decide the approach).

A weak spec produces three confused implementations and no clear winner.

**What not to do:**

- Don't suggest model-race for routine work. The 3-5x time cost is only
  justified when the decision is hard.
- Don't run `model-race judge` automatically. It costs an LLM call and
  the user should decide when to invoke it.
- Don't run `model-race abort` without confirmation. It destroys
  in-progress work in worktrees.

### Other CLIs

<TODO: list other project-specific CLIs as they're added — e.g.,
`gsd-new-project`, custom build/deploy scripts. Each entry: when to
invoke, what flags matter, what NOT to do automatically.>

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
