# model-race — build plan

> Status: locked. Ready to build.
> Updated: 2026-05-04

## What it is

A development-time workflow for running the same feature spec
through multiple AI models in parallel via Git Worktrees, comparing
outputs, and merging the winner.

Not a runtime model switcher. Not a config file mapping task types
to models. The actual concept is Git Worktrees: separate a feature
across models by running each in its own worktree branch, then
merge the winner.

## Why

Some features are high-stakes enough that picking the right model
output matters more than the time spent racing them. Tricky API
design. Non-obvious algorithms. Refactors where small differences
in approach compound. For these, having three model attempts to
compare beats picking blindly.

For the other 90% of features (CRUD, boilerplate, glue code), this
is overkill. So model-race is opt-in, niche, and the design respects
that scope.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Default in scaffold? | No. Opt-in via wizard §5. | Niche feature; bloat for 90% who don't use it |
| Automation level | Tiered: scaffolding + launcher commands by default; `--auto` flag for parallel session spawning | Reliable default; power flag for users who want full automation |
| Evaluation | Hybrid: automated scorecard always (tests, lint, size); opt-in `model-race judge` for LLM evaluation | Objective metrics + subjective AI input; user always decides |
| Config | `model-race.config.json` with project defaults; CLI flags override per-race | Most users want consistent defaults; flags for edge cases |
| Skill location | `scaffold/.claude/skills/model-race/SKILL.md` | Available in projects that opted in |

## Workflow

```
1. User identifies a high-stakes feature worth racing.
2. User runs `model-race start <feature-name>`.
3. model-race reads model-race.config.json, creates N worktrees:
   feature/race/claude
   feature/race/gpt5
   feature/race/gemini
4. model-race writes the spec into each worktree.
5. User opens each worktree (or uses --auto to spawn parallel sessions).
6. Each model session executes the spec independently.
7. User runs `model-race score` — scorecard runs across worktrees.
8. (Optional) User runs `model-race judge` — LLM evaluation.
9. User picks winner: `model-race merge claude` (cherry-picks branch).
10. model-race cleans up: deletes losing worktrees, removes branches.
```

## CLI

```
model-race start <feature-name>           # set up worktrees from config
model-race start <feature> --auto         # also spawn parallel sessions

model-race status                          # show worktree state
model-race spec <feature>                  # show or edit the shared spec

model-race launch <model>                  # opens a session in the right
                                           # worktree, on the right branch,
                                           # with the right model

model-race score                           # run scorecard across worktrees
model-race judge [--judge-model <model>]   # opt-in LLM evaluation

model-race merge <winner>                  # cherry-pick winner; clean losers
model-race abort                           # tear down all worktrees, lose work
```

## Config schema

`model-race.config.json` at project root:

```json
{
  "models": [
    { "name": "claude", "id": "claude-sonnet-4-6", "cli": "claude" },
    { "name": "gpt5", "id": "gpt-5", "cli": "codex" },
    { "name": "gemini", "id": "gemini-2.5-pro", "cli": "gemini" }
  ],
  "metrics": {
    "tests": { "command": "npm test", "weight": 3 },
    "lint": { "command": "npm run lint", "weight": 1 },
    "typecheck": { "command": "npm run typecheck", "weight": 2 },
    "size": { "command": "git diff --stat main..HEAD | tail -1", "weight": 1 }
  },
  "judge": {
    "enabled": false,
    "model": "claude-opus-4-7",
    "criteria": [
      "correctness against spec",
      "code idiomaticity",
      "test coverage",
      "minimal diff"
    ]
  },
  "worktree": {
    "base": "../.worktrees/race",
    "branchPrefix": "feature/race"
  }
}
```

CLI flags override config:

```
model-race start auth --models=claude,gpt5
model-race score --metrics=tests,lint
model-race judge --criteria="correctness,test-coverage"
```

## Scorecard output

```
                  claude        gpt5         gemini
tests             ✓ 42/42       ✓ 42/42      ✗ 39/42
lint              ✓ 0 errors    ✗ 3 errors   ✓ 0 errors
typecheck         ✓ pass        ✓ pass       ✓ pass
size              +127 lines    +203 lines   +156 lines

weighted score    7.0           4.0          5.0

(weighting from model-race.config.json: tests=3, lint=1,
 typecheck=2, size=1; tests/lint/typecheck pass=1, fail=0;
 size: less is better, normalized)
```

## LLM judge output (opt-in)

```
$ model-race judge

Evaluating with claude-opus-4-7...

Ranking:
1. claude   (8.5/10) — Cleanest separation of concerns. Refresh
                       cache pattern matches existing project
                       conventions. Test coverage matches spec.
2. gemini   (7.0/10) — Correct logic but introduces unnecessary
                       abstraction (RefreshManager class). Tests
                       cover edge cases not in spec.
3. gpt5     (5.5/10) — Working solution but with 3 lint errors
                       and a hardcoded TTL value the spec said
                       to read from env.

Recommend: claude
```

User has final say. Judge output is one input among many.

## When to use, when not to

Documented in `scaffold/docs/WORKFLOW.md`:

**Use model-race for:**
- Tricky algorithm or data structure choices.
- Non-obvious API design (where shape decisions compound later).
- Performance-critical hot paths.
- Refactors where the right pattern is unclear.

**Don't use model-race for:**
- CRUD endpoints.
- Boilerplate (form validation, route registration).
- Glue code between known systems.
- Anything where the answer is obvious.

The reason: model-race takes 3-5x the time of a single-model run.
Pay that cost only when the decision is worth the time.

## Risks at build time

- **Cross-CLI process orchestration**. `--auto` mode spawns parallel
  Claude Code, Codex, Gemini sessions. Each has different startup
  flags, different output streams, different exit conditions.
  Reliable orchestration is non-trivial. Default to manual
  (scaffolding + launcher) and only ship `--auto` when it works.
- **Worktree cleanup on abort**. If user aborts mid-race, dangling
  worktrees and branches accumulate. `model-race abort` must be
  thorough; document recovery for the case where it crashes.
- **Spec drift between worktrees**. The spec file must be identical
  across worktrees at start. If user edits in one, the others should
  warn. Could enforce by writing the spec to a read-only location.
- **Judge cost**. `model-race judge` invokes an LLM. Each race could
  cost real money if the user runs it often. Document expected cost
  per race; allow `--judge-model` override for cheaper evaluation.
- **Config drift across projects**. Each bootstrapped project has
  its own `model-race.config.json`. No central reference. If a
  user has 10 projects and wants to update model versions, they
  edit 10 files. Acceptable for v1; flag for later.

## Dependencies

- `atom-setup` §5 must let the user opt in (default no).
- nucleus is independent; not a dependency.
- learnings is independent; not a dependency.
- The Claude skill at `scaffold/.claude/skills/model-race/SKILL.md`
  must reference the CLI; both ship together.
