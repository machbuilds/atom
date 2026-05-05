# INSTALL.md — per-machine and per-project tooling

This is the full setup checklist for atom and the projects it bootstraps.

There are two scopes:

- **Machine-level (one-time per machine)**: install atom's three CLIs (`atom-setup`, `nucleus`, `model-race`) and any AI tooling you'll use across projects. Steps 1-3 below.
- **Project-level (per project)**: configure mem0, Multica, and any optional tools that the wizard offered to record but didn't actually install. Steps 4-9 below.

For a fresh project bootstrapped from atom, run the machine-level steps first (if you haven't), then `atom-setup`, then the project-level checklist.

---

## Machine-level

### 1. atom's three CLIs

Inside the cloned `atom` directory:

```bash
(cd bin/atom-setup && npm install -g .)
(cd bin/nucleus    && npm install -g .)
(cd bin/model-race && npm install -g .)
```

Verify:

```bash
atom-setup --version
nucleus --version
model-race --version
```

Requires Node 18+.

### 2. nucleus init

Run once on each machine to set up `~/.nucleus`:

```bash
nucleus init
```

You'll be asked:
- **Capture mode** — `claude-managed` (default), `auto-timer`, or `manual`. See `bin/nucleus/README.md` for details.
- **GitHub sync** — optional private repo for cross-machine learning sync. If `gh` is detected and authenticated, the repo can be created automatically; otherwise paste an existing URL or skip.

Verify:

```bash
nucleus add "test entry" --type pattern --confidence low
nucleus search "test"
```

The first command appends an entry; the second should find it. Once verified you can delete the test entry by editing `~/.nucleus/projects/<slug>/learnings.jsonl` directly.

### 3. AI CLI of your choice

atom is built primarily for Claude Code. Install whichever AI tools you'll use:

| Tool | Install |
|---|---|
| Claude Code | https://github.com/anthropics/claude-code |
| Codex CLI (GPT) | https://github.com/openai/codex |
| Gemini CLI | https://github.com/google-gemini/gemini-cli |
| Cursor | https://cursor.com |
| GitHub Copilot CLI | `gh extension install github/gh-copilot` |

All read `AGENTS.md` (or a forwarder) — the project instructions are universal.

---

## Project-level

These run inside a project bootstrapped from atom. The wizard records your preferences for the items below, but most need an actual install or auth step you do yourself.

### 4. Multica — agent ownership + workspace

Required only if your wizard run set `multiAgent: true` (Backend / Design / Test / Deploy split).

```bash
multica login                 # if not already authed
multica workspace list        # confirm correct workspace
```

If the workspace doesn't exist yet, create it via the Multica UI. The backend / design / test / deploy agents auto-load from `.claude/skills/` once the workspace is connected.

Verify:

```bash
multica issue list --limit 1   # should not error
```

### 5. mem0 — episodic memory

mem0 runs as an MCP server. Verify it's wired in your Claude config and set the `user_id` for this project.

**Configure user_id**: every memory operation in this project uses `user_id: "<project-slug>"`. Set this in the project's `AGENTS.md` so future Claude sessions pick it up.

Verify:

```
# In Claude Code, in this project:
mcp__mem0__search_memories({ query: "test", filters: {"AND": [{"user_id": "<project-slug>"}]}, top_k: 1 })
# Should return an empty result (no memories yet) without erroring.
```

### 6. Gstack / GSD — workflow skill ecosystem

Gstack is a collection of `/gsd-*`, `/plan-*`, `/qa`, `/ship`, `/review`, `/investigate`, `/codex`, `/canary`, `/autoplan`, `/context-save`, `/freeze`, `/health`, `/retro`, and more. Verify availability:

```
# In Claude Code, type:
/gsd-help
```

If skills aren't available, see https://github.com/garrytan/gstack for install. Then enable for this project:

```
/gsd-new-project        # OR /gsd-resume-work if seeded from atom
```

### 7. Spec Kit — spec → plan → tasks

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

For atom-bootstrapped projects, run `speckit-constitution` AFTER drafting the constitution via `docs/HOW_TO_WRITE_CONSTITUTION.md` — as a verification pass, not the primary author.

### 8. Task Master — issue tracker bridge

Task Master MCP exposes `mcp__task-master-ai__*` tools. Use it when a project needs a PRD-driven task ingestion (the AI parses the PRD into discrete tasks).

```
mcp__task-master-ai__parse_prd     # if seeding from a PRD doc
mcp__task-master-ai__next_task     # day-to-day "what's next"
mcp__task-master-ai__get_tasks     # full task list
```

For projects that already use Multica or Linear as their tracker, Task Master is optional.

### 9. Chrome DevTools MCP — for projects with frontend

If the project ships UI, install the Chrome DevTools MCP plugin. It exposes `mcp__plugin_chrome-devtools-mcp_chrome-devtools__*` for browser automation, screenshot capture, mobile QA, and Lighthouse.

Use pattern:

```
new_page(url)
  → resize_page(width, height)   # 375 mobile, 768 tablet, 1280 desktop
  → take_screenshot(fullPage: true, filePath)
```

### 10. Optional but useful

- **Codex CLI** — independent code review via `/codex review`. Adversarial second opinion. Use before merging non-trivial PRs.
- **Browse / Gstack-browse** — fast headless browser for QA testing authenticated flows.
- **CSO** — security audit skill for periodic threat modelling.
- **`model-race`** — already installed in step 1. Use when you have a high-stakes feature worth racing across multiple AI models. See `bin/model-race/README.md` for the full workflow.

---

## Verification

After all the above, run:

```bash
nucleus --version       # confirms nucleus
atom-setup --version    # confirms wizard
model-race --version    # confirms race CLI
/gsd-help               # confirms gstack (in Claude Code)
multica issue list      # confirms Multica (if used)
```

If all respond cleanly, the project tooling is wired. Begin Phase 1.
