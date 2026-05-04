---
name: nucleus
description: Cross-project learning store. Captures durable lessons from coding sessions; surfaces past lessons when starting new work.
---

# nucleus skill

You have access to a cross-project learning store called **nucleus**. It
lives at `~/.nucleus` on the user's machine. Every project the user
works on can capture learnings into it. Past learnings from any project
can be searched from any other project.

The CLI is `nucleus`. Common subcommands: `nucleus search`,
`nucleus add`, `nucleus slug`, `nucleus promote`.

## When to use search

**At session start, before you start coding**, if the task touches a
known concern (auth, caching, deploys, migrations, performance, etc.):

```
nucleus search "<keyword>" --json --limit 5
```

Read the results. If past pitfalls or patterns apply, mention them to
the user before proceeding. Example: "Your past notes flag a 401 storm
pitfall on auth refresh; let me check we are not repeating it."

**Before making a non-obvious decision**: search for prior context.
Examples:
- About to introduce a new dependency: `nucleus search --type pitfall --tags deps`
- About to add a cache layer: `nucleus search "cache"`
- About to write a migration: `nucleus search --type pitfall --tags migration`

If results are empty, proceed normally. Do not pad responses with
"nucleus had nothing to say."

## When to use add

The capture mode is set in `~/.nucleus/config.json` (`captureMode`:
`claude-managed` / `auto-timer` / `manual`). Behavior depends on the
mode.

### claude-managed (default)

You initiate captures at natural boundaries:

- **End of a feature.** When the user says "looks good" / "ship it" /
  "let's commit", before they move on, decide if anything from this
  session is worth capturing.
- **After a non-obvious bug fix.** If the fix involved a subtlety that
  would help the next person hit the same bug.
- **After a design decision with rationale.** Architecture choices
  with a "we picked X because Y" reasoning.
- **On `/clear` or session end.** Sweep for anything that did not
  graduate during the session.

For each candidate, check the **generalization test**: would this
help a project unrelated to this one? If yes, capture. If no, skip.

```
nucleus add "Cache the refresh promise; share across concurrent calls. \
Two requests racing both kicked off refresh and the loser got 401s." \
  --type pitfall \
  --confidence high \
  --tags auth,concurrency \
  --files src/auth/refresh.ts \
  --session-id "$NUCLEUS_SESSION_ID"
```

### manual

The user runs `nucleus add` themselves. Your job is to surface
candidates: "Worth capturing? — `<one-line summary>`" — but do not
call `nucleus add` for them.

### auto-timer

A background process drains a session log periodically. You append to
the log instead of calling `nucleus add` directly. (Detail: see
`~/.nucleus/sessions/<session>.log`.)

## Required fields for nucleus add

| Flag | Purpose | Pick from |
|---|---|---|
| `--type` | Category | `architecture`, `pitfall`, `pattern`, `workflow`, `decision`, `bug-fix`, `performance`, `security` |
| `--confidence` | How sure | `low`, `medium`, `high` |
| `--source` | Who learned it | `human`, `claude`, `cross-model`, `observation` (default `human` — set to `claude` if you generated the insight without explicit user agreement) |

Insight prose: 1-3 sentences. State what to do AND why. Naming the
real failure mode is often more useful than the prescription.

Tags are free-form but reuse what's there. Run
`nucleus search --json | jq -r '.[].tags[]?' | sort -u` to see what
exists.

## Generalization test (the one filter that matters)

Before capturing: does this teach something that applies beyond the
current project? If it references a project-specific endpoint, table,
or vendor quirk, **don't capture**. The fix is in the code; the lesson
is not.

Captures that pass: "Cache the refresh promise across concurrent
calls." Captures that fail: "Update the `/api/v1/users/me` route to
return 304." (Project-specific. Belongs in a commit message, not
nucleus.)

## When to use promote

After a learning lands in nucleus and proves to apply across projects
(seen the same lesson surface twice in different work), graduate it
upstream into atom's `learnings/` directory:

```
nucleus promote <id>
```

This generates a draft `learnings/<type>/<slug>.md` and opens
`$EDITOR` for refinement. Only run this from inside the atom repo
(or a fork that you intend to PR back).

## What not to do

- **Do not call `nucleus add` after every Bash command.** Capture is
  for durable lessons, not noise.
- **Do not capture project-specific facts** as universal learnings.
  Failed generalization test = skip.
- **Do not capture without a `--type`.** The type is what makes
  search useful.
- **Do not write hedged or vague insights.** "Be careful with auth"
  is not a learning. "Cache the in-flight refresh promise across
  concurrent callers" is.
- **Do not invoke `nucleus sync` automatically.** Sync is on the
  user's clock. It happens on `/clear`, end of day, or explicit
  request.

## Quick reference

```
nucleus search "auth" --type pitfall --confidence high --limit 5
nucleus add "..." --type pitfall --confidence high --tags auth
nucleus promote 01HXY...
nucleus sync
nucleus slug
```

`nucleus --help` and `nucleus <command> --help` show all flags.
