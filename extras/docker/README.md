# extras/docker — generic Docker preset

Files for projects that opted into Docker during `atom-setup`. The
generic preset targets Node-based projects. For stack-specific
optimizations (Next.js, Python, Go, etc.), see the matching
`extras/<category>/<preset>/`.

## What lives here

| File | Purpose |
|---|---|
| `Dockerfile` | Generic Node-based, multi-stage, production-grade. |
| `.dockerignore` | Standard exclusions for the build context. |
| `docker-compose.yml` | Backing services only (Postgres, Redis). Default for macOS dev. |
| `docker-compose.full.yml` | Everything containerized. For CI, Linux dev, full parity testing. |
| `.devcontainer/devcontainer.json` | VSCode dev container config. Uses `docker-compose.full.yml`. |
| `.github/workflows/docker.yml` | Multi-arch (`amd64` + `arm64`) build + push to GHCR. |

## Tier-to-file mapping

`atom-setup` copies a subset based on the user's choice in §6 of the
wizard:

| Tier | Files copied |
|---|---|
| **None** | (none) |
| **Dockerfile only** | `Dockerfile`, `.dockerignore`, `.github/workflows/docker.yml` |
| **+ compose** | Above + `docker-compose.yml`, `docker-compose.full.yml` |
| **+ devcontainer** | Above + `.devcontainer/` |

The CI workflow (`docker.yml`) ships whenever the Dockerfile does.
For the **None** tier, no Docker files land in the project at all.

## Stack-specific overrides

When a stack preset (`extras/<category>/<preset>/`) ships its own
`Dockerfile`, atom-setup uses that instead of this generic one. The
stack preset's Dockerfile is opinionated and tuned for that stack
(Next.js standalone output, Python uv lockfiles, Go binary
distroless runtime, etc.).

Currently shipped per-stack Dockerfiles:

| Preset | Dockerfile location |
|---|---|
| Next.js + Railway | `extras/web/nextjs-railway/Dockerfile` |

Add new stack-specific Dockerfiles by dropping a `Dockerfile` (and
matching `.dockerignore`) into the preset's directory. atom-setup
auto-discovers them.

## Adapting the generic Dockerfile to non-Node stacks

The shipped `Dockerfile` assumes Node. To switch:

### Python (FastAPI, Flask, Django)

Replace the base image and dep install:

```dockerfile
ARG PYTHON_VERSION=3.12-slim

FROM python:${PYTHON_VERSION} AS deps
WORKDIR /app
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip,sharing=locked \
    pip install --no-cache-dir -r requirements.txt

FROM python:${PYTHON_VERSION} AS runtime
WORKDIR /app
RUN addgroup --system --gid 1001 app \
 && adduser --system --uid 1001 --gid 1001 app
COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --chown=app:app . .
USER app
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/healthz').read()" || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

If using `uv`: replace `pip install` with `uv sync --frozen`.

### Go

Multi-stage with a distroless runtime:

```dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download
COPY . .
RUN --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/bin/server ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot AS runtime
COPY --from=builder /app/bin/server /server
USER nonroot:nonroot
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD ["/server", "healthcheck"]
ENTRYPOINT ["/server"]
```

### Rust

```dockerfile
FROM rust:1.82-alpine AS builder
WORKDIR /app
RUN apk add --no-cache musl-dev
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src
COPY . .
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/target \
    cargo build --release && cp target/release/server /server

FROM alpine:3.20 AS runtime
RUN addgroup --system app && adduser --system -G app app
COPY --from=builder /server /usr/local/bin/server
USER app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1
CMD ["server"]
```

## Production-grade defaults (every Dockerfile shipped)

These are non-negotiable across every Dockerfile in atom:

- **Multi-stage build** — builder has dev deps; runtime has only what runs.
- **Non-root user** — `USER appuser` (uid 1001).
- **Healthcheck** — every Dockerfile defines `HEALTHCHECK` against
  `/healthz` (or stack equivalent). The route returns 200 when ready,
  503 when degraded. Required env missing = 503; optional env missing =
  200 with a `degraded` flag.
- **Pinned base image** — `node:22.11-alpine`, not `node:alpine`. Renovate
  or Dependabot bumps majors via PR.
- **BuildKit cache mounts** — `--mount=type=cache` for package manager
  caches. Enable with `DOCKER_BUILDKIT=1`.
- **`.dockerignore`** alongside, excluding `.git`, `node_modules`,
  `.env*`, `dist`, etc.
- **Multi-arch CI** — `.github/workflows/docker.yml` builds `amd64` and
  `arm64` via `docker buildx`. Doubles CI minutes; worth it for OSS
  but watch the bill on paid CI.

## Hot reload pattern

Default `docker-compose.yml` is **backing services only**. Run the app
natively (`npm run dev`) on macOS for fast hot reload:

```bash
docker compose up -d           # postgres + redis only
npm run dev                    # native
```

For everything in containers (CI, Linux, parity testing):

```bash
docker compose -f docker-compose.full.yml up
```

The full mode bind-mounts source for live reload but is 2-3x slower on
macOS due to Docker Desktop file-system overhead.

## Healthcheck expectations

Every Dockerfile shipped expects `/healthz` (or `/api/health` for
Next.js per Vercel convention). Your app must implement this route:

- **200 OK** — required deps present, app ready.
- **200 OK + `degraded: true` JSON** — optional deps missing, app
  partially functional.
- **503 Service Unavailable** — required deps missing or app failed to
  start.

Without this route, the container reports unhealthy. Compose
healthchecks loop forever.
