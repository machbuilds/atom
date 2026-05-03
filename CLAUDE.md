# CLAUDE.md — atom

This is **atom**, a project-starter template. It is not an application. When
you read this file, you are being asked to help bootstrap a NEW project from
this template, OR to maintain the template itself by adding new learnings.

The name: every project starts from atom. Atom is the seed.

## Two modes you operate in here

### Mode 1 — Bootstrap a new project

When the user says "let's start a new project from atom", or similar:

1. **Ask for project context first**:
   - Project name and one-line description (what + why)
   - Primary stack/runtime (Next.js? Python? Swift? Other?)
   - Deploy target (Railway? Vercel? Fly? AWS? Custom? Don't know yet?)
   - Cost envelope expectations (per-request or monthly)
   - Solo build or multi-agent (Backend / Design / Test / Deploy split)?
   - Public-facing or internal-only?

2. **Read the docs in this order** (you must, even if you've read them before
   on a different machine — they may have evolved):
   - `docs/VOICE.md` — how to write
   - `docs/WORKFLOW.md` — how the toolchain composes
   - `docs/PATTERNS.md` — reusable patterns to consider
   - `docs/LESSONS_LEARNED.md` — pain points to avoid
   - `docs/HOW_TO_WRITE_CONSTITUTION.md` — for the new project's constitution
   - `docs/HOW_TO_PICK_DEPLOY_TARGET.md` — only if user said "don't know yet"
   - `docs/HOW_TO_DESIGN.md` — only if the project has a UI

3. **Copy `scaffold/` into the new project repo**. The `.github/`, `.claude/`,
   `.gitignore`, `package.json`, `Dockerfile.example` all go to the new
   repo's root.

4. **If the stack matches one in `extras/<category>/<preset>/`**, also copy
   that preset into the new repo. Otherwise leave `Dockerfile.example` alone
   — the user picks framework first.

5. **Walk the user through filling `scaffold/CLAUDE.md` placeholders**
   (search for `<TODO>` markers): project name, principles, tech stack lock,
   agent ownership, env vars, references.

6. **Write the constitution**: follow `docs/HOW_TO_WRITE_CONSTITUTION.md`
   methodology to draft it, THEN run the `speckit-constitution` skill once
   as a verification pass to catch anything the methodology missed.

7. **Run tooling install** per `INSTALL.md`: Multica auth, mem0 MCP, GBrain
   init, Gstack/GSD skill availability, Spec Kit, Task Master, Grill-me,
   Chrome DevTools MCP.

8. **Begin the GSD/Spec Kit flow**: `/gsd-new-project` OR
   `speckit-specify` → `speckit-plan` → `speckit-tasks`. User's preference.

9. **Initial commit + push**, then start Phase 1.

### Mode 2 — Maintain atom itself

When the user says "add this lesson to atom", "update atom with X", or
similar:

1. **Read `CONTRIBUTING.md`** for the rules.
2. **Apply the generalisation test**: would this help a project unrelated
   to where it came from?
3. **If yes**: propose the structured entry, ask user to confirm wording,
   append to the right file (`PATTERNS.md`, `LESSONS_LEARNED.md`, or new
   `extras/<category>/<preset>/`).
4. **If no**: suggest scrubbing the project-specific bits or dropping.
5. **If unsure**: drop it in `docs/INBOX.md` raw, refine later.
6. **Always commit changes to atom** with a message that names the
   source project (e.g., `lessons: pin deps to minor (from wallet-persona)`).

## What NOT to do here

- **Don't develop application features inside atom.** This repo seeds new
  projects. It is not itself a project.
- **Don't copy project-specific lessons** (specific API quirks, specific
  domain logic) into `LESSONS_LEARNED.md`. Only generalisable patterns.
  Project-specific stays in the source project.
- **Don't add stack-specific files outside `extras/<category>/<preset>/`.**
  When updating `scaffold/`, keep it framework-agnostic.
- **Don't grow `docs/INBOX.md` indefinitely.** Promote or delete entries
  on a regular cadence (end of project, end of quarter).

## Memory architecture (inherited by every project bootstrapped from atom)

Load order at task start in any bootstrapped project:
**project's CLAUDE.md → mem0 query → GBrain search → Multica skill →
.claude/memory.md**

Set mem0 `user_id` per-project (e.g., `user_id: "<project-slug>"`). Log
to mem0 after every commit with the SHA, what changed, and the
non-obvious why.

## Voice

Read `docs/VOICE.md`. In short: builder-to-builder, direct, concrete, tied
to user outcomes. No corporate hedging. No AI vocabulary. Same voice for
the template and every project bootstrapped from it.
