# docker — build plan

> Status: built (v0.1).
> Implementation: `extras/docker/` (generic preset),
> `extras/web/nextjs-railway/` (stack-specific override).
> Updated: 2026-05-04
>
> **Deviation from original plan**: the plan placed Docker files in
> `scaffold/`. They moved to `extras/docker/` because `scaffold/` is
> "files that always ship," and Docker is fully optional per Q-D0.
> Putting Docker in `scaffold/` would force every "None" tier user to
> manually delete files. atom-setup now copies from `extras/docker/`
> based on the chosen tier. Same outcome; cleaner separation.

## What it is

Containerization tier choice for projects bootstrapped from atom.
Four tiers, fully optional, smart default based on user's stack and
deploy target.

## Why

Forcing Docker on every project is friction tax for the half who
don't need it. Skipping it entirely is wrong for the half who do.
Per-stack tiers with smart defaults give users the right thing
without making them think.

Docker on macOS dev has 2-3x file-system overhead. Defaulting to
"everything containerized" makes the dev experience worse for the
stacks that don't need it. Stack-aware defaults matter.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Mandatory? | No. Fully optional. | Half the projects don't need Docker; forcing it is friction |
| Tiers (4) | None / Dockerfile / + compose / + devcontainer | Maps to real user need levels |
| Default per stack | Smart default based on §2 stack and deploy target | Most users get the right thing without thinking |
| Dockerfile per stack | Per-stack optimized Dockerfile in `extras/<category>/<preset>/`; generic fallback in `scaffold/` | Quality where it matters, working fallback for unknown stacks |
| Hot reload | Backing services only by default; `docker-compose.full.yml` as opt-in for everything-containerized | Fast on Mac; full mode available for those who want it |
| Production-grade defaults | Multi-stage build, non-root user, healthcheck, pinned versions, `.dockerignore`, BuildKit cache, multi-arch | What real production needs, every time |

## The four tiers

| Tier | Files shipped | When to pick |
|---|---|---|
| **None** | (no Docker files) | Static sites, CLI tools, mobile apps, Vercel/Netlify deploys, simple scripts |
| **Dockerfile only** | `Dockerfile`, `.dockerignore` | Production deploys to Fly/Railway/AWS ECS, no local backing services needed |
| **Dockerfile + compose** | Above + `docker-compose.yml` | Multi-service web apps; local stack with Postgres, Redis, etc. |
| **Full devcontainer** | Above + `.devcontainer/` | Teams wanting code-inside-Docker dev experience |

## Smart default mapping

| User's stack / deploy choice (§2) | Suggested default tier |
|---|---|
| Mobile (Swift, React Native) | None |
| Static site (Astro, plain HTML) | None |
| Deploy target = Vercel | None |
| Deploy target = Netlify | None |
| Deploy target = Railway | Dockerfile only |
| Deploy target = Fly | Dockerfile only |
| Deploy target = AWS ECS / Kubernetes / Custom | Dockerfile only |
| Multi-service web app (DB + cache + app) | Dockerfile + compose |
| User said "Decide later" | None |

Wizard pre-selects the right tier; user can override. One-liner shown:

> Docker containerizes your app for consistent deploys. Skip it if
> you're shipping to Vercel/Netlify (they handle runtime), building
> a mobile app, or just want something simple.

## Production-grade Dockerfile defaults

Every Dockerfile shipped (whether per-stack or generic) includes:

- **Multi-stage build**. Builder stage has dev deps; runtime stage
  has only what runs.
- **Non-root user**. `USER appuser` (uid 1001).
- **Healthcheck**. `HEALTHCHECK CMD curl -f http://localhost:$PORT/healthz`.
- **Pinned base image**. `node:22.11-alpine`, not `node:alpine`.
  Renovate / Dependabot can bump major versions through PRs.
- **`.dockerignore`** alongside, excluding `.git`, `node_modules`,
  `.env*`, `dist`, etc.
- **BuildKit cache mounts**. `RUN --mount=type=cache,target=/root/.npm`
  speeds up rebuilds.
- **Multi-arch CI config**. `.github/workflows/docker.yml` builds
  `amd64` and `arm64` via `docker buildx`.

## Hot reload pattern

Default `docker-compose.yml` contains only backing services
(Postgres, Redis, etc.). User runs `npm run dev` (or stack
equivalent) on the host. Fast on macOS, no bind-mount overhead.

Opt-in `docker-compose.full.yml` runs everything containerized:

```bash
# default: just backing services
docker compose up

# everything in containers (CI, Linux dev, "I want full Docker")
docker compose -f docker-compose.full.yml up
```

## docker-compose.yml shape (when shipped)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  redis_data:
```

App service is added in `docker-compose.full.yml`, not the default.

## What ships where

| File | Lives in |
|---|---|
| Generic `Dockerfile` (fallback) | `extras/docker/Dockerfile` |
| Stack-specific `Dockerfile` | `extras/<category>/<preset>/Dockerfile` |
| `docker-compose.yml` (backing services) | `extras/docker/docker-compose.yml` |
| `docker-compose.full.yml` (full stack) | `extras/docker/docker-compose.full.yml` |
| `.devcontainer/` config | `extras/docker/.devcontainer/` |
| `.dockerignore` | `extras/docker/.dockerignore` |
| Multi-arch CI workflow | `extras/docker/.github/workflows/docker.yml` |

Wizard copies based on tier choice.

## Risks at build time

- **Base image version drift**. Pinning to `node:22.11-alpine` ages.
  Set up Renovate or Dependabot during build to keep it current.
- **Healthcheck endpoint assumption**. The Dockerfile's healthcheck
  hits `/healthz`. The stack preset must include a `/healthz` route
  that returns 200. If it doesn't, the container is marked unhealthy.
  Verify per stack preset.
- **`.env` injection**. compose reads `.env` by default; user must
  not commit `.env`. `.gitignore` already excludes it; `.env.example`
  shipped instead.
- **Volume permissions on Linux**. Bind-mounted volumes in compose
  can hit UID mismatches between container and host. Document the
  workaround (or fix via UID arg) before shipping.
- **Multi-arch CI cost**. `docker buildx` for `amd64` + `arm64`
  doubles CI minutes. Worth it for OSS but flag for users with
  paid CI.

## Dependencies

- Stack presets in `extras/<category>/<preset>/` must exist before
  per-stack Dockerfile shipping works.
- `atom-setup` §2 (stack & deploy) must record the user's choice
  so §6 can apply the smart default.
- `.github/workflows/docker.yml` is part of CI/CD section (§8).
