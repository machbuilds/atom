# INSTALL.md — per-project tooling

Run this checklist when bootstrapping a new project. These are project-level
setup steps, not machine-level (CLI tools like Claude Code itself, Codex,
Gemini are assumed to already be on the machine).

## 1. Multica — agent ownership + workspace

```bash
multica login                 # if not already authed
multica workspace list        # confirm correct workspace
```

If the workspace doesn't exist yet, create it via the Multica UI. The
backend / design / test / deploy agents auto-load from `.claude/skills/`
once the workspace is connected.

**Verify:**
```bash
multica issue list --limit 1   # should not error
```

## 2. mem0 — episodic memory

mem0 runs as an MCP server. Verify it's wired in your Claude config and
set the `user_id` for this project.

**Configure user_id**: every memory operation in this project uses
`user_id: "<project-slug>"` (e.g., `"wallet-persona"` for the wallet-persona
project). Set this in the project's `AGENTS.md` so future Claude sessions
pick it up.

**Verify**:
```
# In Claude Code, in this project:
mcp__mem0__search_memories({ query: "test", filters: {"AND": [{"user_id": "<project-slug>"}]}, top_k: 1 })
# Should return an empty result (no memories yet) without erroring.
```

## 3. GBrain — structured cross-project knowledge

```bash
gbrain doctor --fast --json
```

If GBrain isn't connected for this machine yet, run `setup-gbrain` skill
in Claude Code, or `gbrain init` manually.

## 4. Gstack / GSD — workflow skill ecosystem

Gstack is a giant collection of `/gsd-*`, `/plan-*`, `/qa`, `/ship`,
`/review`, `/investigate`, `/codex`, `/canary`, `/autoplan`, `/context-save`,
`/freeze`, `/health`, `/retro`, and more. Verify availability:

```
# In Claude Code, type:
/gsd-help
```

If skills aren't available, see https://github.com/garrytan/gstack for
install. Then enable for this project:

```
/gsd-new-project        # OR /gsd-resume-work if seeded from atom
```

## 5. Spec Kit — spec → plan → tasks

The `speckit-*` skills clarify WHAT to build before HOW. Standard sequence:

```
speckit-constitution    # write/verify project principles
speckit-specify         # capture the feature spec
speckit-clarify         # AI asks clarifying questions
speckit-plan            # generate plan.md
speckit-tasks           # decompose into actionable tasks
speckit-analyze         # cross-artifact consistency check
speckit-implement       # execute tasks
```

For atom-bootstrapped projects, run `speckit-constitution` AFTER drafting
the constitution via `docs/HOW_TO_WRITE_CONSTITUTION.md` — as a verification
pass, not the primary author.

## 6. Grill-me — adversarial scope review

```
/grill-me
```

Use after a plan is drafted but before any code is written. Grill-me
interviews you relentlessly until each branch of the decision tree is
resolved. Catches scope drift, hidden assumptions, and unanswered "what
if" branches before you commit.

## 7. Task Master — issue tracker bridge

Task Master MCP exposes `mcp__task-master-ai__*` tools. Use it when a
project needs a PRD-driven task ingestion (the AI parses the PRD into
discrete tasks).

```
mcp__task-master-ai__parse_prd     # if seeding from a PRD doc
mcp__task-master-ai__next_task     # day-to-day "what's next"
mcp__task-master-ai__get_tasks     # full task list
```

For projects that already use Multica or Linear as their tracker, Task
Master is optional.

## 8. Chrome DevTools MCP — for projects with frontend

If the project ships UI, install the Chrome DevTools MCP plugin. It
exposes `mcp__plugin_chrome-devtools-mcp_chrome-devtools__*` for
browser automation, screenshot capture, mobile QA, and Lighthouse.

Use pattern:
```
new_page(url)
  → resize_page(width, height)   # 375 mobile, 768 tablet, 1280 desktop
  → take_screenshot(fullPage: true, filePath)
```

## 9. Optional but useful

- **Codex CLI** — independent code review via `/codex review`. Adversarial
  second opinion. Use before merging non-trivial PRs.
- **Browse / Gstack-browse** — fast headless browser for QA testing
  authenticated flows.
- **CSO** — security audit skill for periodic threat modelling.

## Verification

After all the above, run:

```
/gsd-help              # confirms gstack
multica issue list     # confirms Multica
gbrain doctor          # confirms GBrain
```

If all three respond cleanly, the project tooling is wired. Begin Phase 1.
