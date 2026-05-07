# model-race --auto — build plan

> Status: planned for v0.3 (locked design, build deferred).
> Implementation: extends `bin/model-race/`.
> Source-of-truth design: this file. v0.1's `model-race.md` parked
> the feature; this plan unparks it for the v0.3 build.
> Updated: 2026-05-07
>
> **Why v0.3, not v0.2**: cross-CLI orchestration is the largest single
> design risk in the priority list — three CLIs with three startup
> surfaces, three output formats, three "done" signals, and a
> maintenance burden that grows whether atom touches it or not. v0.2
> intentionally lands distribution + stack presets first; v0.3 picks
> this up once the v0.2 surface settles.
>
> **Ship gate (when build starts)**: at least 2 of the 3 reference
> CLIs (claude, codex, gemini) must run a real spec end-to-end on a
> clean macOS install without manual session spawning. If the gate is
> missed by build end, the feature ships behind an experimental flag.

## What it is

The `--auto` flag for `model-race start` that v0.1 documented but
parked. Spawns parallel AI sessions across worktrees from one
process, captures their output, and lets the user score and merge
without ever opening three terminals.

```
model-race start auth-refresh --auto
```

Today (v0.1) this prints "not implemented" and proceeds with the
manual scaffold flow. v0.2 makes it real.

## Why

`model-race` without `--auto` is "git worktrees plus a scoring
script." Useful, but the user still drives three sessions by hand.
`--auto` is what makes the workflow feel like the pitch: race three
models in parallel, see the output, pick a winner, merge.

The reason it was deferred from v0.1: cross-CLI orchestration is
genuinely hard. Three CLIs with three startup surfaces, three
output formats, three "done" signals. v0.1 shipped the scaffolding
that proves the worktree pattern works; v0.2 adds the orchestration
that makes it feel like one tool.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Adapter pattern | Per-CLI plugin contract at `bin/model-race/src/adapters/<cli>.js`. Each adapter exports `{ name, detect(), invoke(opts), stream(proc), waitForCompletion(proc) }` | Vendor CLIs are unstable; isolating each behind one file means upstream changes only touch one adapter |
| Reference adapters | `claude`, `codex`, `gemini` ship in v0.2. Others are user-pluggable | Three covers what the README already promises; user adapters are a small extension surface |
| Adapter discovery | Adapters in `~/.atom/model-race/adapters/` override the bundled ones | User-owned principle: bundled is a default, user can swap |
| Process model | Each adapter spawns a child process via Node's `child_process.spawn`. Adapters own their own argv construction | No shared "headless mode" assumption that doesn't exist |
| Output capture | All stdout/stderr funneled to per-worktree log files at `<worktree>/.model-race/log.{out,err}`. Live UI tails them | Logs persist for post-race forensics; UI is a presentation layer |
| Live UI | Three-pane terminal display via `@clack/prompts` spinners + a manual `tail`-style follow on the active log. Fallback to plain interleaved output if `process.stdout.isTTY` is false (CI) | Clack is already a dependency; matches wizard aesthetic |
| Completion detection | Per adapter. Default heuristic: process exits AND log has been silent for ≥ 30s AND last line matches a per-adapter "done" pattern. Adapters override | No standard "done" signal exists; per-CLI heuristics is the honest answer |
| Auth pre-flight | Each adapter implements `detect()` returning `{ available, authenticated, reason }`. `--auto` runs detect on all selected CLIs before spawning anything | The worst failure mode is "two worktrees done, third was never auth'd." Catch it pre-flight |
| Cost meter | Each adapter optionally implements `estimateCost(spec)`. Print pre-flight: "Estimated cost: $X across 3 models. Continue?" | Users will get bills they didn't expect; surface it before spending |
| Per-CLI failure handling | One adapter crashing does not abort the race. Logs the failure, marks worktree as failed in `model-race status`, continues | Process supervision basics |
| Spec injection | Adapter receives the spec text on stdin or via temp file (adapter chooses). Spec is read-only at `<worktree>/SPEC.md` | The v0.1 `model-race spec` command already produces this file |
| Vendor flux | Adapters are versioned. Each declares `compat: { cliVersion: "^X.Y" }` and degrades gracefully on mismatch | Upstream rewrites won't silently break races |
| No daemon | `--auto` is a foreground process. Ctrl-C aborts and tears down all worktrees | Daemon model is overkill for v0.2 |

## Adapter contract

```js
// bin/model-race/src/adapters/claude.js
export default {
  name: 'claude',

  // Detect availability + auth state. Runs pre-flight.
  async detect() {
    // Returns: { available: boolean, authenticated: boolean, version: string | null, reason: string | null }
  },

  // Build the spawn arguments for a given race invocation.
  invoke({ worktreePath, specPath, model }) {
    // Returns: { command, args, env, cwd, stdin: string | null }
  },

  // Optional: estimate cost before spawning.
  async estimateCost({ specPath, model }) {
    // Returns: { usd: number, confidence: 'low' | 'medium' | 'high' } | null
  },

  // Decide when this adapter's session is "done."
  // Called periodically while the process is running.
  waitForCompletion(proc, { logPath }) {
    // Returns a Promise that resolves when:
    //  - process exited cleanly, AND
    //  - log has had no new lines for >= 30s, AND
    //  - log matches adapter-specific done patterns
  },

  // Pattern-match for "done" — adapter-specific.
  donePatterns: [
    /Race complete/i,
    /Implementation done\./i,
  ],

  compat: { cliVersion: '^1.0.0' },
};
```

Three adapters ship. The contract is the upstream-resistance layer.

## Pre-flight sequence (the most important part)

`model-race start <feature> --auto` runs this **before spawning
anything**:

1. Read `model-race.config.json`, get the model list.
2. For each model: load the adapter, call `detect()`.
3. If any adapter returns `available: false` → abort with the exact
   `reason` and the install command.
4. If any adapter returns `authenticated: false` → abort with the
   exact auth command for that CLI.
5. For each adapter that implements `estimateCost`, sum and display.
6. Final confirmation: "Race 3 models in parallel. Estimated cost
   $X. Continue?"
7. Only after yes: spawn all three.

This is 90% of what makes `--auto` not awful. Every failure becomes
a one-line message before you've burned compute or worktree state.

## Live UI

```
race: auth-refresh                              elapsed 0:23

  claude (sonnet-4-6)    ● running     12 lines
  codex  (gpt-5)         ● running     8 lines
  gemini (2.5-pro)       ✓ done        47 lines     in 3:12

  → press TAB to switch active log, q to abort
```

One pane shows the active log live. TAB cycles. The non-active
panes show line counts and status. Implementation uses ANSI cursor
control via `picocolors` and a small render loop. No new dep.

CI mode (no TTY): plain interleaved log lines prefixed with adapter
name, no fancy UI.

## Output capture

Per worktree:

```
<worktree>/.model-race/
  log.out       Combined stdout
  log.err       Combined stderr
  meta.json     { adapter, startedAt, endedAt, exitCode, cost? }
```

`model-race status` reads `meta.json` from every worktree and
displays the table. `model-race score` and `model-race judge` read
the worktree's actual code state, not the logs — this is the same
as v0.1.

## Failure modes and what we do about them

| Failure mode | Handling |
|---|---|
| Adapter not installed | Pre-flight aborts; print install command for that CLI |
| Adapter not authenticated | Pre-flight aborts; print auth command for that CLI |
| Adapter version mismatch (`compat.cliVersion`) | Pre-flight warns; user can `--force` |
| Spawned process crashes | Mark worktree failed in `meta.json`, continue race, surface in `model-race status` |
| Process hangs (no output for 5min, exceeds adapter's `idleTimeout`) | Surface as "stalled" in UI; user decides to wait or abort |
| Spec file missing | Hard fail before spawn |
| `model-race abort` mid-race | Send SIGTERM to all child processes, wait 5s, SIGKILL holdouts, tear down worktrees |
| User Ctrl-C | Same as `model-race abort` |
| Disk full | Logs go to per-worktree files; if `<worktree>/.model-race/` fails to write, abort the race honestly with the disk error |

## Risks at build time

- **Adapter completion detection is wrong half the time.** Plan for
  this. Ship a `--max-wall-time 10m` flag so a hung adapter doesn't
  hold the race forever. Document in `model-race.md` that the
  heuristic is a heuristic.
- **Vendor CLIs change their flags during the build window.**
  Pin against versions known to work. The `compat.cliVersion` check
  means incompat fails loudly at pre-flight, not silently mid-race.
- **Output formats are noisy.** Some CLIs print TUI artifacts, ANSI
  control codes, "thinking" animations. Logs will look like garbage.
  Strip ANSI for the line-count display; keep raw in `log.out`.
- **Cost meter is unreliable.** `estimateCost` has no real way to
  predict token usage from a spec. Adapters return `{ confidence:
  'low' }` when the estimate is heuristic. Document.
- **Three parallel processes can starve a laptop.** Document
  recommended hardware in `model-race.md`. v0.2 does not throttle.
- **Auth-token leakage in logs.** Some CLIs print auth state on
  startup. Adapters must scrub `Bearer .*`, `sk-.*`, `gh_.*` from
  stdout before logging. Bake this into the shared log writer, not
  per adapter.

## What ships behind the gate

The ship gate is "at least 2 of 3 reference CLIs work end-to-end on
a clean macOS install." If only 1 of 3 works at build end, v0.2
ships without `--auto` (it stays "not implemented"), the partial
adapter work lands behind an `--experimental-auto` flag, and the
feature properly ships in v0.2.1.

This is the preauthorized de-scope from the milestone plan. It's
not a re-litigation when it triggers — it's the rule we agreed to.

## Dependencies

- v0.1 `model-race` scaffolding — already in place.
- v0.1 `model-race.config.json` schema — already includes the
  `models` array used by the orchestrator.
- No dependency on Wave 1 (#3, #6) or Wave 2 (#1, #2). This work
  is independent and can run in parallel with Wave 2.

## Done when

`model-race start auth-refresh --auto` on a clean macOS with claude
and codex installed and authenticated runs both CLIs in parallel,
displays a live three-pane status (gemini shows "not installed"
in the third pane, race continues with two), captures their output,
detects completion, exits cleanly, and `model-race score` produces
a real scorecard against the two completed worktrees.
