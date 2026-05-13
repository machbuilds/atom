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

### nucleus — the user's memory of every session

`nucleus` is the user's cross-project memory: raw, project-tagged
captures from every coding session. Lives at `~/.atom/nucleus/` on
the user's machine. 100% theirs.

Common subcommands: `nucleus search`, `nucleus add`, `nucleus slug`,
`nucleus promote`, `nucleus sync`. Run `nucleus --help` for the full
CLI.

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

The capture mode is in `~/.atom/nucleus/config.json`. Capture is not
automated — there is no daemon, no hook, no cron. In `claude-managed`
mode you (the AI) actively call `nucleus add` during the session; in
`manual` mode you surface candidates and let the user run it.

Active triggers for capture (don't wait for a session boundary —
capture in-flow when one of these fires):

- **After fixing a non-obvious bug.** What was the surprise? Capture.
- **After a design decision with rationale.** Why this approach over
  the alternative? Capture.
- **After discovering a generalizable pattern.** A snippet, a flag, a
  workflow that worked. Capture.
- **At `/clear` or end-of-task signals.** Sweep recent work and
  capture anything you missed.

The bar is **low**. If you're unsure whether to capture, capture.
Promotion (later, by the user) is where refinement happens; nucleus
is the journal.

Per capture-mode flavor:

| Mode | AI behavior |
|---|---|
| `claude-managed` (default) | You call `nucleus add` directly when a trigger fires. |
| `manual` | You surface a one-line candidate ("Worth capturing? — `<one-line>`") but the user runs the command. |
| `auto-timer` | Reserved. Behave the same as `claude-managed` until the daemon ships. |

Capture command:

```
nucleus add "<insight>" \
  --type architecture|pitfall|pattern|workflow|decision|bug-fix|performance|security \
  --confidence low|medium|high \
  --source human|claude|cross-model|observation \
  --tags tag1 tag2 \
  --files path/to/file
```

**When to surface promotion candidates:**

After **3+ captures in a single session**, OR when the user signals
end-of-task ("ship it", "we're done", `/clear`, commit-ready), pause
and surface promotion candidates in a single message:

> "I've captured N entries this session. Worth promoting any to your
> playbook? Top candidates: …"

Pick 1–2 entries with the strongest generalization potential. An
entry passes the test if it would help a project unrelated to this
one, doesn't reference project-specific names or vendor quirks, and
describes a pattern rather than an incident.

**Do not call `nucleus promote` directly** — it opens `$EDITOR`
interactively, which doesn't work in agent flows. Print the command
for the user instead: `nucleus promote <ULID>`.

**What not to do:**

- Do not call `nucleus add` after every Bash command. Capture is for
  durable lessons, not noise.
- Do not write hedged or vague insights. "Be careful with auth" is
  not a learning. "Cache the in-flight refresh promise" is.
- Do not invoke `nucleus sync` automatically. Sync is on the user's
  clock (on `/clear`, end of day, or explicit request).
- Do not run `nucleus promote` yourself. Print the command and let
  the user decide.

### learnings — the user's playbook of patterns to carry forward

`learnings` is the user's curated playbook: generalized patterns
they've decided are worth carrying into every future project. Lives
at `~/.atom/learnings/` on the user's machine. **Auto-copied into
every new project they bootstrap from atom**, filtered by the new
project's stack tags.

100% theirs. Same privacy model as nucleus. Optional sync to their
own private GitHub repo (separate from the nucleus sync repo).

Common subcommands: `learnings list`, `learnings show <key>`,
`learnings sync`, `learnings init`. Run `learnings --help` for the
full CLI.

**Promotion is the bridge from nucleus → learnings:**

When a nucleus entry has settled and applies beyond the current
project, graduate it:

```
nucleus promote <id>
```

This generates a draft at `~/.atom/learnings/<type>/<key>.md`,
opens `$EDITOR` for the user to refine, and they keep it forever.

**The generalization test (the only filter that matters at promotion):**

Would this teach something that applies beyond the current project?
If the lesson references a project-specific endpoint, table, vendor
quirk, or proprietary detail, **don't promote**. The lesson stays in
nucleus, where it's still searchable.

Pass: "Cache the refresh promise across concurrent calls."
Fail: "Update the `/api/v1/users/me` route to return 304." (project-specific)

**Suggesting promotion (Claude-specific):**

After several captures from a session, before `/clear` or end of
work, scan for promotion candidates and surface them: *"This one
looks broadly useful. Promote to your playbook? — `nucleus promote
<id>`."* Don't auto-promote without the user's explicit yes.

**What not to do:**

- Do not run `nucleus promote` automatically. The user decides what
  enters their playbook.
- Do not push project-specific content into learnings, even if the
  user asks. Suggest leaving it in nucleus and refining the prose.
- Do not invoke `learnings sync` automatically. Same as nucleus —
  sync is on the user's clock.

### Setup nudge

If the user has not yet run `nucleus init` AND `learnings init`
(check for `~/.atom/nucleus/config.json` and
`~/.atom/learnings/config.json`), mention this once at the start
of the first session in a new project:

> "I notice you haven't initialized nucleus and learnings yet. Run
> `nucleus init && learnings init` once on this machine — both are
> optional but unlock the cross-project memory and playbook
> propagation."

Don't nag. Mention once, drop it.

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
