# stack-presets — build plan

> Status: locked, in build queue (v0.2 Wave 2).
> Implementation target: `extras/<category>/<preset>/` per preset.
> Wizard integration: `bin/atom-setup/src/lib/writer.js` already
> reads stack tag and copies the matching preset; v0.2 just adds
> presets, no wizard rewrite.
> Updated: 2026-05-07

## What it is

Five new opinionated stack presets so the wizard's stack question
produces the right scaffold for non-Next.js users. Each preset is a
self-contained directory under `extras/<category>/<preset>/` with
the files that should land at the root of a project on that stack.

Presets shipping in v0.2:

| Preset | Path | Category | Default deploy target | Default Docker tier |
|---|---|---|---|---|
| Python / FastAPI | `extras/web/python-fastapi/` | web | Railway | Dockerfile only |
| Swift / Vapor | `extras/web/swift-vapor/` | web | Fly | Dockerfile only |
| Rust / Axum | `extras/web/rust-axum/` | web | Fly | Dockerfile only |
| Go CLI / Cobra | `extras/cli/go-cobra/` | cli | (none — distributed via release binaries) | None |
| TypeScript library | `extras/lib/typescript-library/` | lib | (none — npm publish) | None |

Today: only `extras/web/nextjs-railway/` exists. v0.2 raises
preset count from 1 to 6.

## Why

`atom-setup.md` flags this as the biggest live limitation: "Stack
presets shipping today: `nextjs` only. Other stacks fall back to the
generic scaffold." A user who picks Python sees the same files as a
user who picks Rust, which is wrong on every level — dependency
manifest, runtime, Dockerfile, healthcheck, deploy target.

Without per-stack presets, atom is "Next.js boilerplate plus a
wizard." With them, atom is what the README claims: a project-starter
template that respects what stack you actually picked.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Preset directory shape | Mirrors v0.1's `nextjs-railway/`: `Dockerfile` (when applicable), `.env.example`, `README.snippet.md`, manifest file (`pyproject.toml` / `Package.swift` / `Cargo.toml` / `go.mod` / `package.json`), `learnings/` seed directory | Consistency with v0.1; new files don't introduce a new pattern |
| Categories | `web/`, `cli/`, `lib/`, `mobile/`, `ai/` (last two reserved for v0.3) | `nextjs-railway` already lives in `web/`; existing structure absorbs all five new presets cleanly |
| Per-preset learnings | Each ships ≥3 stack-specific learnings (e.g., FastAPI: "use uvicorn workers count = 2*cpu+1", "pin Python via pyproject `requires-python`", "Pydantic v2 over v1 for new code") | Honors the user-owned learnings principle: presets seed the user's playbook, they don't replace it |
| Default deploy targets per preset | Picked per stack idiom (FastAPI → Railway, Vapor → Fly, Axum → Fly, Go CLI → release binaries, lib → npm) | Smart default in §2 should match what most people on that stack actually do |
| Library starter | TypeScript library with `tsup` build, `vitest` test, `tsx` dev, dual ESM/CJS output | "Library" is the most-asked-for non-app preset; TypeScript covers the largest user base |
| Manifest pinning | Each preset pins runtime versions (Python 3.12, Swift 5.10, Rust stable 1.85, Go 1.23, Node 22 LTS) | Reproducible scaffolds; users can bump if they need to |
| README.snippet.md | Each preset ships a README fragment that the wizard splices into the project's generated README | Stack-specific quick start; users see the right `npm run dev` / `cargo run` / `go run` from line one |
| Healthcheck endpoint contract | Every web preset exposes `/healthz` returning 200 OK | Required by `extras/docker/Dockerfile`'s `HEALTHCHECK` directive; standardize across presets |

## Per-preset checklist

Each of the five presets must ship the following before being
considered done. Track per-preset to keep parallelization honest.

| Item | Why |
|---|---|
| Manifest file with pinned versions | Reproducibility |
| Hello-world server / entry point | Wizard output should run on first try |
| `.env.example` | Documents required environment without committing secrets |
| `Dockerfile` (web only) | Production deploy works out of the box |
| `.dockerignore` (web only) | Builds don't pull in `.git`, build artifacts |
| `/healthz` route (web only) | Container healthcheck contract |
| `README.snippet.md` | Drop-in quick start |
| `learnings/` seed directory with ≥3 entries | Stack idioms baked in from day one |
| Wizard test case in `scripts/test-atom-setup.sh` | Regression suite catches preset breakage |
| Stack-specific deploy notes in `extras/<category>/<preset>/DEPLOY.md` (web only) | Tells the user the next 3 steps after wizard runs |

## Per-preset details

### Python / FastAPI

- Manifest: `pyproject.toml` with `fastapi`, `uvicorn[standard]`,
  `pydantic`. `requires-python = ">=3.12"`.
- Entry: `app/main.py` with one `/healthz` route.
- Dockerfile: multi-stage (builder installs from pyproject, runtime
  is `python:3.12-slim`), non-root user, healthcheck.
- Seed learnings: uvicorn worker count, Pydantic v2, dependency
  pinning via `uv` lockfile.

### Swift / Vapor

- Manifest: `Package.swift` pinned to Vapor 4.x, swift-tools 5.10.
- Entry: `Sources/App/configure.swift` with `/healthz`.
- Dockerfile: official `swift:5.10-jammy` builder, `swift:5.10-slim`
  runtime, multi-stage.
- Seed learnings: Linux-vs-macOS Swift behavior, Vapor's async/await
  middleware ordering, Foundation differences on Linux.

### Rust / Axum

- Manifest: `Cargo.toml` pinned to Axum 0.7, Tokio 1.x, Tower 0.5.
- Entry: `src/main.rs` with `/healthz` and structured logging via
  `tracing`.
- Dockerfile: cargo-chef for layer caching, distroless runtime.
- Seed learnings: cargo-chef for build cache, `RUST_LOG` defaults,
  static binary via `x86_64-unknown-linux-musl`.

### Go CLI / Cobra

- Manifest: `go.mod` pinned to Go 1.23, Cobra v1.8.
- Entry: `cmd/root.go` plus a `cmd/version.go`.
- No Dockerfile (CLIs ship as release binaries).
- Bonus: `.goreleaser.yml` for cross-compiled releases.
- Seed learnings: cross-compile matrix, `go install` vs release
  binary, version stamping via `-ldflags`.

### TypeScript library

- Manifest: `package.json` with `tsup`, `vitest`, `tsx`, dual
  ESM/CJS, `engines.node: ">=18"`.
- Entry: `src/index.ts` exporting one stub function with JSDoc.
- No Dockerfile (libraries publish to npm).
- Seed learnings: dual-format publish, `exports` field correctness,
  `peerDependencies` for framework adapters, semver for libraries.

## Wizard integration

The writer in `bin/atom-setup/src/lib/writer.js` already reads the
stack tag from `state.answers.stack` and copies from
`extras/<category>/<preset>/`. v0.2 work here:

1. Add the five new stack values to `bin/atom-setup/src/lib/sections/stack.js`
   prompts.
2. Map each to the right `extras/<category>/<preset>/` directory.
3. Adjust the Docker tier smart-default mapping in
   `bin/atom-setup/src/lib/sections/docker.js` per the table above.
4. Adjust the deploy-target prompt in
   `bin/atom-setup/src/lib/sections/stack.js` to filter sensible
   targets per stack (don't offer Vercel for a Go CLI).
5. README.snippet.md per preset gets spliced into the generated
   project README under "Quick start" — replaces the current
   generic stub.

No new wizard sections. Existing flow stays.

## Risks at build time

- **Healthcheck assumption.** The shared `Dockerfile`'s
  `HEALTHCHECK` hits `/healthz`. Every web preset must implement it.
  Catch in CI: spin each preset's Dockerfile in
  `scripts/test-atom-setup.sh` and assert `/healthz` returns 200
  inside the container.
- **Runtime version drift.** Pinned versions age. Set up Renovate
  or Dependabot rules during the v0.2 build so the pins move
  forward without a manual cycle. Same risk as `docker.md` flagged.
- **Learnings authenticity.** Seeded learnings have to be real,
  not invented. If we don't have first-hand experience on a stack
  (e.g., Swift / Vapor in production), the seed list is shorter
  and honest. Don't fake learnings to pad a preset.
- **Per-preset Dockerfile drift.** Five new Dockerfiles can each
  diverge from the production-grade defaults in `docker.md`. Build
  a shared lint script that asserts: multi-stage, non-root user,
  pinned base image, healthcheck, `.dockerignore` present.
- **Mobile / AI placeholders stay empty.** `extras/mobile/` and
  `extras/ai/` were placeholders in v0.1. They stay placeholders
  in v0.2. Don't quietly fill them; ship them as v0.3 work.

## Dependencies

- `extras/<category>/<preset>/` directory pattern from v0.1 — already
  in place via `nextjs-railway`.
- `bin/atom-setup/src/lib/writer.js` copy logic — already in place,
  just needs new mappings.
- `scripts/test-atom-setup.sh` — gets five new test cases, one per
  preset.
- `docs/LEARNINGS_TAXONOMY.md` — adds new `applies_to` values:
  `python`, `swift`, `rust`, `go`, `library`. Today only `web`,
  `api`, `mobile`, `cli`, `node` are listed.

## Done when

A user picks Python in the wizard and ends up with a working
FastAPI scaffold that builds, serves `/healthz`, has stack-specific
learnings in the playbook, and deploys to Railway via the printed
deploy notes — without anyone telling them what to do next.
Same for Swift, Rust, Go CLI, and TypeScript library on their
respective deploy paths. Smoke tests in `scripts/test-atom-setup.sh`
cover all five.
