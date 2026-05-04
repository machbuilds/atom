---
name: model-race
description: Race the same feature spec through multiple AI models via Git worktrees. Compare and merge the winner.
---

# model-race skill (Claude wrapper)

Source of truth: see the **Tooling > model-race** section of `AGENTS.md`
in this project. That file holds the canonical instructions every AI
tool reads.

This file is the Claude-specific wrapper. It exists so Claude Code's
Skill tool can register `model-race` as an invocable skill. Behavior
comes from `AGENTS.md`.

## Quick reference

```
model-race start <feature> --spec <file>     # create worktrees, write spec
model-race status                             # show race state
model-race launch <model>                     # open AI CLI in the model's worktree
model-race score                              # run automated scorecard
model-race judge                              # opt-in LLM evaluation
model-race merge <winner>                     # cherry-pick winner, clean losers
model-race abort                              # tear down (destructive)
```

`model-race --help` and `model-race <command> --help` show all flags.

## When this skill activates (Claude-specific)

You should suggest `model-race` to the user only when:

- The user is about to make a **non-obvious decision** with multiple
  reasonable approaches (algorithm choice, API shape, refactor pattern).
- The work is **high-stakes** enough that the comparison cost is worth
  paying — typically anything that will be hard to change later.
- The user has not already chosen a path.

Do NOT suggest it for:

- CRUD endpoints, boilerplate, glue code.
- Anything where the answer is obvious.
- Bug fixes (these have one correct answer).

## When the user races, the spec is critical

A race is only as good as its spec. Before `model-race start`, help the
user write a spec that:

- States the feature in one paragraph.
- Lists testable acceptance criteria (what makes it correct).
- Names constraints (perf budgets, API contracts, file boundaries).
- Excludes solution details (don't pre-decide the approach).

A weak spec produces three confused implementations and no clear winner.
A strong spec produces three differentiated approaches you can actually
compare.
