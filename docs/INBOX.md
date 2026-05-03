# INBOX.md — raw capture before generalising

Drop raw observations here. No formatting required, no review needed.
Promote to `PATTERNS.md` or `LESSONS_LEARNED.md` later when you have time.
See `CONTRIBUTING.md` for the format and the generalisation test.

Format (loose):
```
- **YYYY-MM-DD** — <source-project> — <raw observation>.
  Generalisation candidate: <one-line, optional>
  → goes to <target file, optional>
```

---

## Pending refinement

<!-- Pre-seeded from wallet-persona — refine or delete each entry. -->

- **2026-05-03** — wallet-persona — `MOCK_DATA_ENABLED` env override pattern
  was a last-minute add to populate the leaderboard for a client demo
  without flipping `NODE_ENV` (which would break Next.js production).
  Generalisation candidate: "Pre-launch demos need populated UI without
  NODE_ENV=development. Build an explicit mock-mode env var with loud
  server-side warning so it's hard to leave on."
  → already in PATTERNS.md, but worth checking if the warn-on-load mechanism
  belongs as its own entry.

- **2026-05-03** — wallet-persona — git history rewrite via `git filter-branch
  --env-filter` to fix author attribution after commits were made with the
  auto-derived hostname email. Worked, but `git filter-branch` is deprecated.
  Generalisation candidate: "Document the modern alternative (`git filter-repo`)
  and recommend setting `git config --global user.{name,email}` immediately
  on a fresh machine to avoid the rewrite altogether."
  → goes to LESSONS_LEARNED.md (variant of an existing entry — merge?)

- **2026-05-03** — wallet-persona — Railway's pre-build security scanner
  blocked the first deploy on Next.js CVEs. Failed in 4 seconds with no
  build logs. Diagnosis came from Railway's "Diagnosis Report" tab.
  Generalisation candidate: "Modern deploy platforms run pre-build security
  scans. When a deploy fails in <10s with no logs, check the platform's
  diagnosis tab before assuming it's a Dockerfile bug."
  → goes to LESSONS_LEARNED.md

- **2026-05-03** — wallet-persona — agent ownership scope was documented
  in the conductor plan as a role definition, but never broken out as a
  numbered task. Result: when the plan synced to Multica, the deploy work
  fell through and was never tracked.
  Generalisation candidate: "When converting a plan into tracked tasks,
  every role-ownership scope needs at least one corresponding task entry.
  Otherwise the role exists with nothing assigned to it."
  → already in LESSONS_LEARNED.md — verify wording covers this.

- **2026-05-03** — wallet-persona — the `Co-Authored-By: Claude` trailer
  convention worked well for AI-assisted commits. GitHub recognises it
  and shows both authors.
  Generalisation candidate: "Use `Co-Authored-By: <agent name> <noreply
  email>` trailer in commits to make AI involvement transparent and
  auditable in `git log`."
  → goes to PATTERNS.md (new entry)

<!-- Add new entries below as you remember things from this or future projects. -->

---

## How to drain this file

1. Pick an entry.
2. Apply the generalisation test: would this help a project unrelated to
   the source?
3. If yes → rewrite in the structured format from `CONTRIBUTING.md`,
   move to the right target file.
4. If no → delete.
5. Commit the change.

Don't let this file grow past ~30 entries. If it does, do a sweep.
