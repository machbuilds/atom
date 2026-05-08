# syntax=docker/dockerfile:1.7
#
# Rust + Axum Dockerfile.
#
# Production-grade defaults:
#   - cargo-chef for layer caching (deps cached separately from src)
#   - distroless runtime (no shell, smaller surface area)
#   - Non-root user
#   - Healthcheck on /healthz (via the binary's HTTP server)
#   - Pinned Rust toolchain via RUST_VERSION ARG

ARG RUST_VERSION=1.85-bookworm

# ─── chef: prepare recipe for cargo-chef ───────────────────────────────
FROM rust:${RUST_VERSION} AS chef
RUN cargo install cargo-chef --locked
WORKDIR /app

# ─── planner: produce the recipe.json from src ─────────────────────────
FROM chef AS planner
COPY Cargo.toml Cargo.lock* ./
COPY src ./src
RUN cargo chef prepare --recipe-path recipe.json

# ─── builder: cook deps, then build the app ────────────────────────────
FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    cargo chef cook --release --recipe-path recipe.json
COPY Cargo.toml Cargo.lock* ./
COPY src ./src
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    cargo build --release && \
    cp /app/target/release/app /app/app

# ─── runtime: distroless, non-root, healthchecked ──────────────────────
FROM gcr.io/distroless/cc-debian12:nonroot AS runtime
WORKDIR /app
COPY --from=builder /app/app /app/app
USER nonroot
EXPOSE 8080
ENV PORT=8080 \
    RUST_LOG=info

# Distroless has no shell, so we use the binary itself for healthcheck
# (it serves /healthz). Entry must be exec form. We can't use wget/curl
# from this image, so prefer a deploy-platform healthcheck (Railway/Fly
# can hit /healthz directly via their probe configuration).
ENTRYPOINT ["/app/app"]
