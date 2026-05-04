---
name: nucleus
description: Cross-project learning store. Captures durable lessons from coding sessions; surfaces past lessons when starting new work.
---

# nucleus skill (Claude wrapper)

Source of truth: see the **Tooling > nucleus** section of `AGENTS.md`
in this project. That file holds the canonical instructions every AI
tool reads (Claude, Codex CLI, Gemini CLI, Cursor, Copilot).

This file is the Claude-specific wrapper. It exists so Claude Code's
Skill tool can register `nucleus` as an invocable skill. Behavior comes
from `AGENTS.md`.

## Quick reference

```
nucleus search "<keyword>" --json --limit 5    # at session start
nucleus add "<insight>" --type <T> --confidence <C> --tags <t1> <t2>
nucleus promote <id>                            # graduate to learnings/
nucleus sync                                    # push/pull to GitHub
nucleus slug                                    # current project's slug
```

`nucleus --help` and `nucleus <command> --help` show all flags.

## When this skill activates (Claude-specific)

In `claude-managed` capture mode, Claude initiates `nucleus add` calls
at session boundaries. Trigger points:

- End of feature (user signals readiness to commit / ship)
- After a non-obvious bug fix
- After a design decision with rationale
- On `/clear` or session end (sweep)

Other AI tools without skill auto-invocation: read `AGENTS.md` and
prompt yourself to capture at the same boundaries, or rely on the
user to invoke `nucleus add` manually.

## Session ID

If `$NUCLEUS_SESSION_ID` is set, pass it via `--session-id` so entries
group correctly. Otherwise omit the flag.
