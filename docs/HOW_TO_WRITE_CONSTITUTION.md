# HOW_TO_WRITE_CONSTITUTION.md

Methodology for drafting `.specify/memory/constitution.md` for a new project.
Hybrid: this project's structure + speckit-constitution conventions.

## What a constitution is

A short, opinionated, version-controlled document that captures the
non-negotiables of a project. Anything that, if violated, requires an
explicit conversation and a constitution version bump. Not a wishlist.
Not a style guide. Not a TODO. **Decisions you've already made and don't
want to relitigate.**

## The methodology (this project's structure)

### Step 1 — Pick at most 5 principles

Each principle:
- One-line statement (memorable, action-oriented)
- One-paragraph rationale (why this matters, what breaks without it)

If you have 8, you're not making decisions, you're collecting preferences.
Cut to 5. If 3 is enough, ship with 3.

Examples (from a real project):
- "Speed: <10s reveal end-to-end" (the user-facing performance contract)
- "Share-first: every element must raise P(share)" (the product-design lens)
- "Zero friction: no auth, no wallet-connect, no signature prompts" (the
  removal-mindset principle)
- "Specific not generic: copy references real wallet stats, no hedging
  language" (the AI-output quality principle)
- "Mobile screenshot is primary" (the format-priority principle that
  cascades into many UI decisions)

### Step 2 — Lock the tech stack

In the constitution, explicitly pin:
- Runtime version (Node 20, Python 3.12, etc.)
- Framework version pin (caret-minor — see `LESSONS_LEARNED.md`)
- Key libraries (database client, LLM SDK, payment SDK, etc.)
- Hosting target

This is not the same as `package.json`. The constitution is the
**rationale + commitment**. `package.json` is the implementation. They
should agree, but the constitution explains WHY, not just WHAT.

### Step 3 — Define the agent ownership matrix

A table:

| Agent | Harness | Owns |
|---|---|---|
| Backend | <e.g., Claude Code> | `<paths>` |
| Design  | <e.g., Codex>       | `<paths>` |
| Test    | <e.g., Gemini CLI>  | `<paths>` |
| Deploy  | <e.g., Claude Code> | `<paths>` |

Strict rule: if a task forces an agent across these paths, the agent
**stops** and flags a routing error, not silently edits.

For solo projects with no agent split, this section becomes "I own
everything" — but write it down anyway, because future-you might add
agents later.

### Step 4 — Phase definitions and gates

If the project has discrete phases (Phase 1: pre-development;
Phase 2: implementation; Phase 3: launch), define them. List the gates
between phases — what must be true before moving forward. Examples:
- Phase 1 → Phase 2: API verification, fixtures created, plan reviewed
- Phase 2 → Phase 3: calibration ≥87%, security review passed,
  load test passed

Without explicit gates, "phases" become vibes. With them, transitions
become decisions.

### Step 5 — Version the constitution

`v1.0.0` for the first lock. Bump:
- **major** when removing a principle or weakening a constraint
- **minor** when adding a principle
- **patch** for wording polish that doesn't change meaning

Reference the active version from `AGENTS.md`. When you violate a
principle, the diff lives in `git log` — the violation is auditable.

## The verification step (speckit-constitution)

After drafting using the methodology above, run the `speckit-constitution`
skill in Claude Code as a verification pass:

```
speckit-constitution
```

Spec Kit's skill enforces its own opinionated constitution conventions
(structure, completeness, format). Running it as a second pass catches
anything the methodology section missed. Treat its output as a code
review, not as the primary author.

## Where to store it

`.specify/memory/constitution.md` at the project root.

## Example skeleton

```markdown
# Constitution v1.0.0

This document captures the non-negotiables of <project-name>.

## I. <Principle one — one line>

<One-paragraph rationale.>

## II. <Principle two — one line>

<One-paragraph rationale.>

[... up to 5 ...]

## Tech stack (locked)

- Runtime: <pin>
- Framework: <pin>
- Database: <pin>
- Hosting: <target>
- Key libraries: <list with pins>

## Agent ownership

| Agent | Harness | Owns |
|---|---|---|
| ... | ... | ... |

## Phase definitions and gates

### Phase 1 — <name>
**Gate to Phase 2**: <list of must-be-true conditions>

### Phase 2 — <name>
**Gate to launch**: <list>

## Versioning policy

- Major: removing a principle, weakening a constraint
- Minor: adding a principle
- Patch: wording polish

## Change log

- v1.0.0 (YYYY-MM-DD) — initial lock
```

## Anti-patterns

- **Aspirational principles** ("we should write good code"). If it's not
  enforceable in code review, it doesn't belong here. Cut.
- **Style guide content** (formatting, naming conventions). That belongs
  in `CONTRIBUTING.md` or a linter config, not in the constitution.
- **TODOs and roadmap items.** The constitution describes what is, not
  what will be. Roadmap goes in a roadmap doc.
- **Long rationales.** If a principle needs more than a paragraph to
  explain, you haven't decided yet. Keep deciding until it fits.
