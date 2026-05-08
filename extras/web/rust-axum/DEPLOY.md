# Deploy — Rust / Axum on Fly.io

This preset defaults to Fly.io. Fly's `fly launch` reads the `Dockerfile`
at the repo root automatically.

## First deploy

1. **Install flyctl and authenticate.**
   ```bash
   brew install flyctl   # or: curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

2. **Generate `fly.toml`.**
   ```bash
   fly launch --no-deploy
   ```
   This creates `fly.toml`. Edit the `[http_service]` block to point
   at `/healthz`:
   ```toml
   [http_service]
   internal_port = 8080
   force_https = true
   auto_stop_machines = true
   auto_start_machines = true

   [[http_service.checks]]
   path = "/healthz"
   interval = "30s"
   timeout = "5s"
   ```

3. **Set env vars.**
   ```bash
   fly secrets set RUST_LOG=info,app=debug
   ```

4. **Deploy.**
   ```bash
   fly deploy
   ```

## Healthcheck contract

The Dockerfile uses **distroless** for the runtime image (no shell,
no curl, no wget). That means the container itself can't run a Docker
`HEALTHCHECK` directive — but Fly's HTTP service check hits
`/healthz` from outside the container, which is what you actually
want anyway. The endpoint must return 200 OK with no I/O.

## Build cache

The Dockerfile uses **cargo-chef** so dependencies cache separately
from your source. The first build takes a few minutes; subsequent
builds where only `src/` changes finish in seconds. Don't disable
this — Rust release builds are slow without it.

## Scaling

Fly's auto-stop machines kill idle containers after a few minutes
of no traffic. The first request after that wakes one up (~1-2s
cold start for an axum binary in distroless). For latency-sensitive
APIs, set `min_machines_running = 1` in `fly.toml`.
