# CONTRIBUTING.md — adding to atom

atom evolves with every project you ship. Here's how to add to it without
letting it rot.

## The generalisation test

One rule for everything that lands in `docs/PATTERNS.md`,
`docs/LESSONS_LEARNED.md`, or `extras/`:

> Would this help a project unrelated to where it came from?

- **Yes** → promote it.
- **No** → either rewrite until it does, or drop it.
- **Unsure** → put it in `docs/INBOX.md` and decide later.

If a "lesson" only makes sense once you know about Moralis, ENS, the wallet
persona archetypes, or any other project-specific context, it fails the
test. Strip the project-specific bits or drop it.

## What goes where

| The thing | Lives in |
|---|---|
| One-line rule of thumb (no story behind it) | Don't add — too thin |
| Reusable pattern across multiple projects | `docs/PATTERNS.md` |
| Specific gotcha that bit you and could bite again | `docs/LESSONS_LEARNED.md` |
| New stack you'll likely use again (Dockerfile, configs) | `extras/<category>/<preset>/` |
| Anything not yet decided / quick capture | `docs/INBOX.md` |
| Update to how a workflow tool composes with another | `docs/WORKFLOW.md` |
| Update to constitution methodology | `docs/HOW_TO_WRITE_CONSTITUTION.md` |
| Update to deploy decision tree | `docs/HOW_TO_PICK_DEPLOY_TARGET.md` |
| Update to design flow | `docs/HOW_TO_DESIGN.md` |

## Two-stage workflow

### Stage 1 — Quick capture (zero friction)

Append to `docs/INBOX.md` whenever something interesting happens. No
formality. Format is loose:

```markdown
- **YYYY-MM-DD** — <source-project> — <raw observation>.
  Generalisation candidate: <one-line, optional>
  → goes to <target file, optional>
```

You can do this during a project, right after one ends, or weeks later
when you remember something. The point is: write it down before you
forget.

### Stage 2 — Promote to a structured entry

When you sit down to refine, each INBOX entry runs the generalisation
test. If it passes, promote with this format:

```markdown
### <Title — start with a verb if it's a lesson, a noun phrase if a pattern>

**First encountered**: YYYY-MM-DD (<source-project>, <issue/commit ref>)
**Tag**: <comma-separated tags — e.g., deploy, security, env-vars>
**Why this generalises**: <one line — what makes it apply beyond the source>

<Body — the lesson or pattern, 1–3 short paragraphs.>

**How to apply**: <where in a new project this should be enforced or
used. Be specific — mention CLAUDE.md sections, agent skill files,
specific phases, or PR-checklist items.>
```

### Stage 3 — Drain INBOX to zero, periodically

INBOX.md is a working file, not an archive. Skim it at:
- **End of every project**: refine all entries from that project.
- **End of every quarter**: anything still sitting in INBOX after 3 months
  either gets refined or deleted.

If an INBOX entry has been sitting unrefined for 6+ months, it probably
wasn't a real lesson. Delete without guilt.

## Anti-patterns

- **Project-specific names in promoted entries.** "Moralis", "vitalik.eth",
  "DEX-26" stay in INBOX raw. They get scrubbed when promoted to
  PATTERNS.md or LESSONS_LEARNED.md.
- **Vague entries.** "Always test things" is not a lesson. "When test files
  exist, verify there's a `test` script in package.json invoking them" is.
  Be specific enough that someone could enforce it on a PR review.
- **Duplicates.** Before adding, search existing entries for similar
  patterns. Update the existing entry rather than creating a parallel one.
- **Aspirational entries.** Don't add patterns you wish you used. Only add
  patterns you actually used (and benefited from) on at least one shipped
  project.

## Cadence checklist

After every project ends:

- [ ] Skim `docs/INBOX.md` — any unrefined entries from this project?
- [ ] Promote what passes the generalisation test.
- [ ] Delete what doesn't.
- [ ] If you used a new stack: add `extras/<category>/<preset>/` with
      Dockerfile, deploy config, and a README explaining when to use it.
- [ ] Commit changes to atom with a message naming the source project,
      e.g., `lessons: add four entries from <project-slug>`.

After every quarter:

- [ ] Re-read `docs/PATTERNS.md` and `docs/LESSONS_LEARNED.md`. Anything
      contradicted by newer experience? Anything no longer relevant
      (e.g., a pattern about a deprecated framework)?
- [ ] Re-read `docs/INBOX.md`. Promote stragglers or delete.

## Voice

Read `docs/VOICE.md`. Apply it to every entry you add. atom's writing
style is the same as the projects bootstrapped from it: builder-to-builder,
direct, concrete.
