## Quick start

```bash
# 1. Install Rust (via rustup) — needs 1.85+
rustup default stable

# 2. Run the server
cargo run

# Health check
curl http://localhost:8080/healthz
```

## Project layout

```
src/
└── main.rs          Axum app, /healthz, tracing setup
Cargo.toml           Pinned deps, release profile (LTO, strip)
Dockerfile           cargo-chef + distroless runtime
.env.example         Environment contract
DEPLOY.md            Fly.io deploy notes
```

## Common commands

| Task | Command |
|---|---|
| Run dev | `cargo run` |
| Run release | `cargo run --release` |
| Run tests | `cargo test` |
| Lint | `cargo clippy --all-targets -- -D warnings` |
| Format | `cargo fmt` |
| Build container | `docker build -t app .` |
| Run container | `docker run -p 8080:8080 --env-file .env app` |
