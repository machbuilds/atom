# model-race

Run the same feature spec through multiple AI models in parallel via
Git worktrees. Compare the implementations, score them, merge the
winner.

A development-time workflow for high-stakes features. Not a runtime
model switcher. Not a config file mapping task types to models.

## Install

From inside this directory:

```
npm install -g .
```

Verify:

```
model-race --version
model-race --help
```

Requires Node 18+ and Git 2.5+ (worktree support).

## Setup

Each project that uses model-race needs a `model-race.config.json` at
the repo root. Copy the example:

```
cp /path/to/atom/bin/model-race/model-race.config.example.json model-race.config.json
```

Edit the file to define which models you want to race, what metrics
to score, and (optionally) judge settings.

## When to use

**Use model-race for:**

- Tricky algorithm or data structure choices.
- Non-obvious API design where shape decisions compound.
- Performance-critical hot paths.
- Refactors where the right pattern is unclear.

**Don't use model-race for:**

- CRUD endpoints, boilerplate, glue code.
- Bug fixes (one right answer).
- Anything where the answer is obvious.

A race takes 3-5x the time of a single-model run. Pay that cost only
when the decision is worth it.

## Lifecycle

### 1. Start

```
model-race start <feature> --spec spec.md
```

Reads `model-race.config.json`, creates one Git worktree per model,
writes the spec to `.race/spec.md`. State is tracked in
`.race/state.json`.

Worktrees land at `<config.worktree.base>/<model>/` (default
`../.race/<model>/`). Each gets a branch named
`<branchPrefix>/<feature>/<model>` (default
`feature/race/<feature>/<model>`).

If you don't have a spec file, omit `--spec` and the CLI prompts you
to type one inline.

### 2. Launch sessions

For each model in the race, open a terminal and run:

```
model-race launch <model>
```

This `cd`s into the model's worktree, prints the path to the canonical
spec (`.race/spec.md`), and spawns the configured AI CLI (`claude`,
`codex`, `gemini`, etc.).

The AI agent works in its worktree against the spec. Commits land on
the model's branch.

You can run launches in parallel terminals or sequentially — the
worktrees are independent.

### 3. Score

After each model finishes:

```
model-race score
```

Runs every metric in `model-race.config.json` against each worktree.
Renders a comparison table:

```
metric          claude      gpt5        gemini
--------------  ---------   ---------   ---------
tests (×3)      ✓ pass      ✓ pass      ✗ fail
lint (×1)       ✓ pass      ✗ fail      ✓ pass
typecheck (×2)  ✓ pass      ✓ pass      ✓ pass
size (×1)       127         203         156
total           7.0 / 7.0   4.5 / 7.0   5.7 / 7.0
```

Higher total wins.

### 4. Judge (opt-in)

For an LLM evaluation overlay:

```
model-race judge
```

Builds a prompt with the spec, criteria, and each worktree's diff;
spawns the configured judge CLI (`claude` by default); prints the AI's
ranking and rationale.

Disabled by default. Enable in `model-race.config.json`:

```json
"judge": { "enabled": true, "cli": "claude" }
```

To preview the assembled prompt without spawning an AI:

```
model-race judge --print-prompt
```

### 5. Merge

Pick the winner:

```
model-race merge <winner>
```

Cherry-picks the winner's branch onto your current branch, removes
all worktrees, deletes all race branches, and clears `.race/`.

Cherry-pick conflicts are surfaced; resolve them manually and re-run.

### 6. Abort (when racing was a dead end)

```
model-race abort
```

Tears down all worktrees, deletes all race branches, removes `.race/`.
Confirms before doing destructive work.

## Configuration

`model-race.config.json` schema:

```json
{
  "version": 1,
  "models": [
    { "name": "claude", "cli": "claude", "args": [] },
    { "name": "gpt5", "cli": "codex", "args": [] },
    { "name": "gemini", "cli": "gemini", "args": [] }
  ],
  "metrics": {
    "<name>": {
      "command": "<shell command>",
      "weight": 3,
      "mode": "pass-fail" | "numeric-min"
    }
  },
  "judge": {
    "enabled": false,
    "cli": "claude",
    "criteria": ["correctness", "idiomatic", "..."]
  },
  "worktree": {
    "base": "../.race",
    "branchPrefix": "feature/race"
  }
}
```

### Models

`name` is the friendly name used in CLI commands. `cli` is the binary
spawned by `launch`. `args` are passed to the CLI.

You need at least 2 models. Three is typical.

### Metrics

Each metric is a shell command run in each worktree. Two modes:

- **pass-fail** — exit code 0 = pass = full weight earned, non-zero
  = fail = 0 earned. Best for tests, lint, typecheck.
- **numeric-min** — parses the first number from stdout. Smaller is
  better. Normalized across worktrees so the smallest gets full
  weight. Best for diff size, line counts.

`weight` controls the metric's contribution to the total. Higher
weight = more important.

### Judge

Off by default. When enabled:

- `model-race judge` builds a prompt from the spec + each worktree's
  diff + criteria, pipes it to the judge CLI's stdin.
- `criteria` is a list of evaluation dimensions the judge scores
  against.
- `cli` is the binary to spawn (default `claude`).

Each judge invocation costs an LLM call. Document expected cost per
race in your project's docs.

### Worktree

`base` is where worktrees are created (relative to repo root).
`branchPrefix` is the prefix for race branches.

Defaults put worktrees at `../.race/<model>/` (sibling to your repo)
to avoid polluting the working tree.

## Environment

| Var | Purpose |
|---|---|
| `EDITOR` / `VISUAL` | Used by `model-race spec --edit`. |

## CLI reference

```
model-race start <feature>
  --spec <file>           use spec file (otherwise prompts inline)
  --models <list>         comma-separated model subset
  --base <branch>         base ref for worktrees (default main)
  --auto                  [v0.2 — not implemented] spawn parallel sessions

model-race status
  --json                  output JSON

model-race spec
  --edit                  open spec in $EDITOR
  --sync                  mirror spec into worktrees as RACE_SPEC.md

model-race launch <model>
  --cli <bin>             override the CLI to spawn
  --print-only            print the cd + cli command instead of running

model-race score
  --metrics <list>        run subset of metrics
  --json                  output JSON

model-race judge
  --cli <bin>             override the judge CLI
  --criteria <list>       override criteria
  --print-prompt          print prompt and exit (no AI call)

model-race merge <winner>
  --no-cleanup            do not delete losing worktrees and branches
  --keep-state            keep .race/state.json (archives the race)
  --yes                   skip confirmation

model-race abort
  --yes                   skip confirmation
  --keep-branches         remove worktrees but keep branches
```

## Limitations (v0.1)

- **No `--auto` flag.** Cross-AI parallel session orchestration is
  complex (different CLIs have different startup, output, exit
  semantics). For now, run `model-race launch <model>` in N terminals
  manually. `--auto` will land in v0.2.
- **No conflict-resolution helper for merge.** If `git cherry-pick`
  conflicts, you resolve manually and re-run with `--keep-state` to
  finish cleanup.
- **No spec drift protection.** If you edit the spec mid-race, the
  models that already worked off the older version don't get notified.
  Use `model-race spec --edit` early; freeze it before launches.

## License

MIT (matches atom).
