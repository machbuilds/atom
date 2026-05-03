# LESSONS_LEARNED.md — pain points to avoid

Specific gotchas that bit a real project. Each generalised so it applies
beyond its source. See `CONTRIBUTING.md` for the format and the
generalisation test.

---

### Pin dependencies to minor, not exact patch

**First encountered**: 2026-05-04 (wallet-persona, DEX-45 deploy)
**Tag**: deploy, dependencies, security
**Why this generalises**: any modern deploy platform with a security
scanner; happens regardless of language.

Pinning a dep to an exact patch (e.g., `14.2.3`) blocks security fixes
from flowing in via routine `npm install`. Modern deploy platforms
(Railway, Vercel, Fly) run pre-build security scans against your
dependency tree. When a HIGH-severity CVE lands on your pinned version,
the deploy is rejected with no build logs.

Pin to caret-minor (`^14.2.x` for npm, `~=2.1.0` for Python, etc.) so
patch-level security fixes flow automatically.

**How to apply**: in the project's `CLAUDE.md` "Tech stack (locked)"
section, document versions as caret-minor unless reproducibility demands
exact-patch. Re-evaluate the lock at every milestone gate.

---

### Healthchecks fail only on truly required infra

**First encountered**: 2026-05-04 (wallet-persona, /api/health refactor)
**Tag**: ops, healthcheck, deploy
**Why this generalises**: every deployed service has a healthcheck;
every healthcheck makes a "what counts as broken?" decision.

A healthcheck that returns 503 for any missing env var (including ones
the app handles gracefully via fallback) creates restart-loops on the
deploy platform. The container starts, healthcheck fails, platform
kills it, repeat.

Split env vars into REQUIRED (boot fails → 503) and OPTIONAL (degrades
gracefully → 200 with `status: "degraded"` and `optional: "missing: ..."`
fields). Restart-loop behaviour gets reserved for genuine breakage.

**How to apply**: every service's healthcheck endpoint maintains explicit
`REQUIRED` and `OPTIONAL` lists. Cross-reference from the env vars
table in the project's `CLAUDE.md`.

---

### Watch for variant env-var names across consumers

**First encountered**: 2026-05-03 (wallet-persona, BASE_URL vs SITE_URL)
**Tag**: env-vars, migration, integration
**Why this generalises**: silent fallback to a hardcoded literal is
indistinguishable from "working" until the URL is shared and clicked.

When a project grows, multiple files end up reading "the same" env var
under different names (`BASE_URL`, `SITE_URL`, `APP_URL`, `PUBLIC_URL`,
`HOST`). Each call site has its own fallback. When the env var gets
renamed or the project is migrated to a new account, some consumers
silently use a stale fallback.

Before declaring "config is fully env-driven", grep the codebase for
all variant names AND for the hardcoded fallback strings. Consolidate
to one canonical name. Document it in `CLAUDE.md`.

**How to apply**: at every milestone gate, run a quick audit:
```
grep -rE "process\.env\.(BASE_URL|SITE_URL|APP_URL|PUBLIC_URL|HOST)" src/
grep -rE "\"https?://[a-z0-9-]+\.(com|app|io|dev)\"" src/
```
If either returns multiple variants or hardcoded fallbacks, consolidate.

---

### A `test` script in package.json doesn't mean tests run

**First encountered**: 2026-05-04 (wallet-persona, CI gap)
**Tag**: ci, testing
**Why this generalises**: presence of test files is not the same as
tests being invoked.

A project can have N test files and still have zero coverage from CI
if `package.json` has no `test` script. CI workflows that don't
explicitly run `npm test` (or equivalent) will pass even when tests
would have failed.

After adding test files, verify:
1. `package.json` has a `test` script that invokes the runner
2. CI workflow includes a `npm test` step
3. Run `npm test` locally — does it actually find and run the tests?

**How to apply**: when scaffolding a project, the baseline `package.json`
includes `"test": "<runner>"`. The CI workflow includes a `test` step.
Both ship together.

---

### A `lint` script doesn't mean lint runs either

**First encountered**: 2026-05-04 (wallet-persona, Next.js lint)
**Tag**: ci, linting
**Why this generalises**: same shape as the test-script issue, different tool.

A `"lint": "next lint"` (or equivalent) doesn't run lint if no
`.eslintrc.*` exists. The first invocation prompts interactively for
ESLint setup, which fails non-interactively in CI.

Either configure the linter properly (install `eslint-config-next`,
write `.eslintrc.json`) or remove the lint step from CI explicitly with
a comment back-referencing a tracking issue. Don't let it silently fail.

**How to apply**: when scaffolding, either include a working linter
config or comment out the lint step in `ci.yml` with a TODO referencing
a tracked issue. Don't ship a half-configured linter.

---

### `.claude/settings.json` is machine-specific — gitignore from day one

**First encountered**: 2026-05-04 (wallet-persona, .gitignore update)
**Tag**: git, agent-tooling
**Why this generalises**: every project that uses Claude Code (or
similar agent tooling with per-machine permission allowlists) hits this.

Claude Code writes `.claude/settings.json` with a per-developer Bash
permission allowlist (which commands the agent can run without prompting).
Committing it leaks personal convenience config and creates noise on
every clone.

Add to `.gitignore` from project setup, not after the file appears.

**How to apply**: include in scaffold's `.gitignore`:
```
.claude/settings.json
.claude/settings.local.json
```

---

### Set `git config --global user.{name,email}` immediately on a new machine

**First encountered**: 2026-05-04 (wallet-persona, history rewrite)
**Tag**: git, identity
**Why this generalises**: git's auto-derived author email is
`<user>@<hostname>.local`, which doesn't match any GitHub account.
Commits won't link to the author's profile until config is set.

When migrating to a new machine or onboarding a fresh dev:
1. `git config --global user.name "<github-handle>"`
2. `git config --global user.email "<github-verified-email>"`

Or use the no-reply variant from GitHub's email settings:
`<id>+<handle>@users.noreply.github.com` to keep the real email private.

If commits were already made with the wrong identity, rewrite with
`git filter-branch --env-filter` (deprecated but in core) or
`git filter-repo` (recommended). Force-push with `--force-with-lease`,
not `--force`.

**How to apply**: include in `INSTALL.md` as a per-project verification
step. Easier to do up front than to rewrite history later.

---

### Force-push with `--force-with-lease`, never `--force`

**First encountered**: 2026-05-04 (wallet-persona, history rewrite)
**Tag**: git, safety
**Why this generalises**: `--force` overwrites remote state without
checking if anyone else pushed first. `--force-with-lease` aborts if
the remote has commits you don't have locally.

Use `--force-with-lease` for every history rewrite, every overwrite,
every restore. The cost is zero. The benefit is catching the case
where someone else (or another agent, or a different worktree) pushed
work you're about to nuke.

**How to apply**: include in scaffold's `CLAUDE.md` git rules. Codify
as a hard rule, not a recommendation.

---

### Agent ownership scopes need explicit task entries

**First encountered**: 2026-05-04 (wallet-persona, deploy work fell through)
**Tag**: planning, multi-agent, tasks
**Why this generalises**: planning docs that document role ownership
without corresponding numbered tasks lose work to syncing layers.

When a planning doc says "Deploy agent owns Dockerfile, CI, env-var manifest"
but doesn't break that out into a numbered task, the work doesn't show
up in the issue tracker. The role exists with nothing assigned.

Every role-ownership scope in a planning doc needs at least one
corresponding task in the tracker. Otherwise the role is decorative.

**How to apply**: when reviewing a plan, run a quick consistency check:
for each agent listed in the ownership matrix, find at least one task
in the tracker assigned to them. If you can't, add tasks before kickoff.

---

### Free-plan API quotas reset daily — budget calls accordingly

**First encountered**: 2026-05-04 (wallet-persona, Moralis daily quota)
**Tag**: api-integration, ops, demo
**Why this generalises**: many free-tier APIs (data, AI, search) reset
on a UTC midnight boundary. Burning the day's budget on tuning leaves
nothing for the demo.

When using a free or low-tier API, treat the daily quota as a budget.
Don't run expensive batch operations (calibration, bulk reindex) within
24 hours of a demo or release. Schedule them after the high-stakes
window.

If the operation must happen, upgrade the plan first. Don't gamble the
demo on quota.

**How to apply**: in `CLAUDE.md`'s "External APIs" or equivalent section,
note each API's quota reset time. Reference from any task that performs
batch operations.

---

### Modern deploy platforms run pre-build security scans

**First encountered**: 2026-05-04 (wallet-persona, Railway CVE block)
**Tag**: deploy, security, ci
**Why this generalises**: Railway, Vercel, Fly, AWS App Runner — most
modern deploy platforms now scan dependencies before building.

When a deploy fails in <10 seconds with no build logs, check the
platform's "diagnosis" or "security" tab before assuming a Dockerfile
issue. The most common pre-build failure is dependency CVEs that the
platform's scanner blocks.

Fix by upgrading the flagged dep to its patched version, then redeploy.
Don't fight the scanner — it's catching real CVEs.

**How to apply**: in `CLAUDE.md`'s deploy section, note the platform's
pre-build scan behaviour (if any) and how to find its diagnosis output.
Reference in the troubleshooting section.

---

### Healthcheck behaviour decides whether your container restart-loops

**First encountered**: 2026-05-04 (wallet-persona, optional env vars)
**Tag**: ops, healthcheck, deploy
**Why this generalises**: deploy platforms restart containers that fail
healthchecks. If your healthcheck overpromises (returns 503 on graceful-
degradation paths), the container restart-loops forever even though the
app would work.

Design healthchecks to distinguish "broken" (genuinely cannot serve
traffic) from "degraded" (some optional feature is offline but core
service works). Only the first should fail the platform's health probe.

**How to apply**: pair this with the "two-tier env vars" pattern from
`PATTERNS.md`. Healthcheck logic should explicitly map `OPTIONAL` env
gaps to `200 / status: degraded`, not 503.

---

(Add new entries below using the structured format from `CONTRIBUTING.md`.)
