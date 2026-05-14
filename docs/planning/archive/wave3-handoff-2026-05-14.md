# Handoff — atom v0.2 Wave 3 (items #9, #10, #11) + #8

## What's done before this handoff

`release/v0.2` branch, latest commit `176bfb4` (merge of main → release/v0.2). All pushed to origin.

Tagged + released on GitHub: `v0.1.0`, `v0.1.1`.
Tagged but not yet published as GitHub release: `v0.1.2`, `v0.1.3`, `v0.2.0`.
Committed but not tagged (held for end-of-v0.2 bundled release):
- `32e82de` — 0.2.1: 5 stack presets (item #6)
- `cf87d73` — inline constitution generation (item #7)
- `e7d6431` — honest nucleus capture framing + `nucleus review` (item #8a — the docs/CLI half of #8)
- `ce68056` — bump nucleus 0.1.3 → 0.1.4 for the above

Test suite state: **103/103 atom-setup + 20/20 nucleus = 123/123 passing.**

Uncommitted on worktree (intentional, separate work — do not delete):
- `M docs/planning/README.md` — v0.3 candidate list link
- `?? docs/planning/v0.3.md` — v0.3 candidate list

## What this handoff covers

Final four v0.2 items, in build order:

1. **#9** `~/.atom/atom/` install + `atom-setup new <name>` (Large) — keystone
2. **#8** Migration doc for in-place users (Small) — gated on #9
3. **#10** `install.sh` curl one-liner + README Quick Start rewrite (Medium) — gated on #9
4. **#11** `bin/atom-update-check` + snooze (Medium) — gated on #9

**Source of truth for specs:** `docs/planning/v0.2.md` lines 196–359. Don't re-derive — that doc has the locked decisions, risks, and "Done when" criteria for each item.

**Architectural context:** `docs/planning/distribution.md`. Read before touching #9.

## Build order + dependency chain

```
#9 (foundation: separate source from project)
 ├─ #8  (migration doc — needs #9's target to exist)
 ├─ #10 (install.sh — clones to #9's location)
 └─ #11 (update-check — uses #9's VERSION-on-PATH pattern)
```

#9 is the keystone. Don't start #8/#10/#11 until #9's "Done when" criteria pass (v0.2.md:295).

## Commitments — things to NOT do

These come from a real conversation about blast radius. The user develops on the same machine where atom is installed. Worktree code edits are zero-risk; bad test invocations are the risk.

1. **Never run `install.sh` against real `$HOME`.** It clones to `~/.atom/atom/` and would clobber the existing install. Test only with `HOME=$(mktemp -d)` and verify the install lands in the scratch home before running the script.

2. **Never run `atom migrate-install` against real `~/.atom/`.** It's designed to relocate 0.1.x in-place installs to `~/.atom/atom/` — running it without `ATOM_HOME` scoping could move the user's real data. Test only with `ATOM_HOME=$(mktemp -d)` and a faked legacy install dir as input.

3. **Never run `npm install -g .` from the worktree.** That would replace `/opt/homebrew/bin/{atom,nucleus,learnings,atom-setup,model-race}` with in-progress code. The user's globals stay on whatever version they're at until they explicitly `atom upgrade` after we ship.

4. **Never modify `~/.atom/atom/`, `~/.atom/nucleus/`, or `~/.atom/learnings/`** during testing. All scratch state goes under `/tmp/atom-*`.

5. **Don't add `'learnings'` back to `REMOVE_AFTER_PROMOTE`** in `bin/atom-setup/src/lib/manifest.js`. That bug deleted seed learnings + user playbook silently; the fix is in v0.2 (`32e82de`). Future cleanup work should not touch this list without re-running tests 8.7, 9.5, 10.5, 11.6, 12.7.

6. **Don't lose the uncommitted v0.3 planning work** (`docs/planning/README.md`, `docs/planning/v0.3.md`). These belong to a separate task — commit them on a branch or leave alone, don't `git checkout .` or `git restore .`.

7. **Don't tag releases mid-stream.** Held until all four items pass tests; then plan tag sequence with the user. Current decision: bundle everything from `v0.2.0`..HEAD as a single `v0.2.1` with combined release notes. Confirm before tagging.

8. **Don't skip the user check-in after #9.** It's a Large architectural change. Pause, summarize what changed, get a green light before starting #8/#10/#11.

## Test isolation pattern (the one that works)

Every existing test in `scripts/test-atom-setup.sh` and `scripts/test-nucleus.sh` uses this pattern. Copy it for new tests.

```bash
SCRATCH=$(mktemp -d)
export ATOM_HOME="$SCRATCH/.atom"
export NPM_CONFIG_PREFIX="$SCRATCH/npm-prefix"
export HOME="$SCRATCH"   # only when testing install.sh
mkdir -p "$ATOM_HOME"

# ... run wizard, install.sh, migrate-install, etc.

# Cleanup unless --keep flag
[[ "$1" != "--keep" ]] && rm -rf "$SCRATCH"
```

Existing examples to read before writing new tests:
- `scripts/test-atom-setup.sh` Tests 1–13b — atom-setup wizard end-to-end
- `scripts/test-nucleus.sh` — nucleus add/search/review with isolated `ATOM_HOME`

## Per-item implementation notes

### #9 — the keystone

**Critical files:**
- `bin/atom-setup/bin/atom-setup.js` — add `new <name>` verb to commander
- `bin/atom-setup/src/lib/writer.js` — source path becomes env-overridable (`ATOM_SOURCE_DIR` or default `~/.atom/atom/`), copy *into* target dir (not mutate cwd)
- `bin/atom-setup/atom-setup` (bash wrapper) — handle the new verb passthrough
- Existing `atom-setup` (no verb) → keep working in cwd mode for back-compat, but print deprecation notice

**Done when:** `atom-setup new my-project` (run from anywhere on PATH) produces `./my-project/` with the scaffold copied from `~/.atom/atom/`, and `~/.atom/atom/` is byte-identical before and after. See v0.2.md:295.

**Reuse existing pieces:**
- `bin/atom-setup/src/lib/writer.js` `walkAndCopy()` — already does directory copy
- `bin/atom-setup/src/lib/manifest.js` `REMOVE_BEFORE_PROMOTE`, `REMOVE_AFTER_PROMOTE` — the cleanup lists. In `new` mode these don't apply (target dir starts empty) — gate them on `mode === 'in-place'`.
- `bin/atom-setup/src/lib/preflight.js` — pre-flight check pattern; add "is `~/.atom/atom/` populated?" check for `new` mode.

### #8 — the migration

**Critical files:**
- `docs/MIGRATING.md` — new file. Format: markdown checklist + commands, matching `INSTALL.md` shape.
- `bin/atom/bin/atom.js` — add `migrate-install` subcommand. One-shot, idempotent.
- `bin/atom/src/migrate-install.js` — new. Detects 0.1.x in-place install, clones fresh to `~/.atom/atom/`, re-links globals.

**Done when:** A 0.1.2 user following `MIGRATING.md` ends up with `~/.atom/atom/` populated, globals pointing there, and old clone optionally removed. v0.2.md:219.

### #10 — install.sh

**Critical files:**
- `install.sh` — new at repo root. Mirrors `./atom-setup`'s install loop but: (a) clones first, (b) operates in `~/.atom/atom/`.
- `README.md` — Quick Start rewrite to lead with the curl one-liner; keep manual `git clone` path documented below for trust.
- `SECURITY.md` — note the curl-pipe-bash trust model.

**Done when:** A clean macOS or Linux machine with no atom installed runs the curl one-liner and ends up with `~/.atom/atom/`, all 5 globals on PATH, `atom --help` working. v0.2.md:329.

### #11 — update-check

**Critical files:**
- `bin/atom-update-check/` — new CLI dir. Fork-and-forget script invoked from each CLI's startup.
- `bin/{atom,atom-setup,nucleus,learnings,model-race}/bin/*.js` — add one-line invocation at startup.
- `~/.atom/state/update-check.json` schema: `{ lastChecked, lastNotified, snoozeUntil }`.

**Done when:** A 0.1.x install with 0.2.1 published upstream prints the upgrade notice exactly once on the next CLI invocation; `atom upgrade --snooze 7d` suppresses it for a week. v0.2.md:357.

## Release plan (do not execute mid-implementation)

After all four items pass tests:

1. Verify full regression: `bash scripts/test-atom-setup.sh && bash scripts/test-nucleus.sh` — must be 123+/123+ green.
2. Update CHANGELOG.md `[Unreleased]` → cut a new `[0.2.1]` section bundling items #6, #7, #8a (nucleus review), #9, #8 (migration), #10, #11.
3. Bump versions in each `bin/*/package.json` that changed.
4. Single commit: `0.2.1: distribution architecture + Wave 2 features`.
5. Tag: `git tag -a v0.2.1 -m "..." && git push origin v0.2.1`.
6. Publish GitHub release with notes (assemble from CHANGELOG).

**Suggested release notes outline for v0.2.1:**
- Headline: "Distribution architecture: install once, project anywhere"
- New verb: `atom-setup new <name>`
- One-line installer: `curl -fsSL .../install.sh | bash`
- Update notifications: `atom-update-check` with snooze
- 5 new stack presets (Python/FastAPI, Swift/Vapor, Rust/Axum, Go-Cobra, TS library)
- Inline CONSTITUTION.md generation in wizard
- `nucleus review` + capture honesty
- Migrating from 0.1.x: see `docs/MIGRATING.md`

**Alternative (granular):** retroactive per-item tags (`v0.2.1` for #6, `v0.2.2` for #7, etc.). User previously confirmed this is possible; current preference is the single bundle.

## Quick context restore

- Current branch: `release/v0.2`
- Worktree: `/Users/mach/conductor/workspaces/atom-dev/yangon`
- User's real install: `~/.atom/atom/` (DO NOT MODIFY)
- User's globals: `/opt/homebrew/bin/{atom,atom-setup,nucleus,learnings,model-race}` (DO NOT REINSTALL)
- User dev dir: `~/work/atom-dev/` (separate Conductor worktree — don't touch)
- Current date: 2026-05-14

## Memory state (already saved in previous session, no action needed)

- `project_v02_roadmap.md` — what's done vs pending
- `project_speckit_constitution.md` — why item #7 was inline, not subprocess
- `atom_dev_use_separation_state.md` — globals → ~/.atom/atom/ pattern
- `atom_distribution_decision.md` — git template, not npm

Update `project_v02_roadmap.md` when #9–#11 complete to flip them to "done."

## After consumption

Delete this file (`HANDOFF-v0.2-wave3.md`) or move it to `docs/planning/archive/` once the work is done. It's session-state, not permanent doc.
