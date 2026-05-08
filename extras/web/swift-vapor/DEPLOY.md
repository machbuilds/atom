# Deploy — Swift / Vapor on Fly.io

This preset defaults to Fly.io. Fly's `fly launch` reads the
`Dockerfile` at the repo root automatically.

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
   Edit the `[http_service]` block to point at `/healthz`:
   ```toml
   [http_service]
   internal_port = 8080
   force_https = true

   [[http_service.checks]]
   path = "/healthz"
   interval = "30s"
   timeout = "5s"
   ```

3. **Set env vars.**
   ```bash
   fly secrets set LOG_LEVEL=info
   ```

4. **Deploy.**
   ```bash
   fly deploy
   ```

## Build cache

Swift release builds on Linux are slow — full rebuilds can take
several minutes. The Dockerfile caches `swift package resolve` in
its own layer (independent of source changes), so subsequent CI
runs that only change `Sources/` are faster.

For local iteration, **always work on macOS** (`swift run` natively),
not in the Docker image. Use the container only for deploys and
final smoke tests.

## Linux vs macOS

Vapor runs identically on both platforms, but `Foundation` has
small behavioral differences on Linux (string encoding edge cases,
some `URLSession` features missing). Run your test suite both
locally on macOS and inside the container before relying on
Foundation APIs you haven't tested on Linux.
