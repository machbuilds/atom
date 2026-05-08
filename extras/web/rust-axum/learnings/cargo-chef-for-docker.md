---
type: pattern
applies_to: [rust]
slug: cargo-chef-for-docker
---

# Use cargo-chef for Rust Docker builds

## Pattern

Use `cargo-chef` to split dependency compilation from source compilation
in your Rust Dockerfile. The first build takes minutes; every subsequent
build that only changes `src/` finishes in seconds.

## Why

Without cargo-chef, every `docker build` re-compiles every dependency
from scratch because Cargo doesn't have stable layer caching across
docker builds. A Rust release build of a non-trivial axum app can
take 5-10 minutes; without dep caching, you pay that on every CI run
and every deploy.

cargo-chef solves this by:
1. Reading `Cargo.toml` + `Cargo.lock` to produce a `recipe.json`
   describing only the dependency graph.
2. Building deps from the recipe in a separate Docker layer that
   only invalidates when deps actually change.
3. Then copying source on top and building only the application code.

## How to apply

The Dockerfile in this preset already implements the three-stage
chef → planner → builder pattern. Don't squash these stages — the
whole point is that the `cargo chef cook` layer caches independently
from the `cargo build` layer.

Other notes:
- Pin `cargo-chef` with `--locked` so it doesn't churn its own
  dependency graph between builds.
- The recipe.json must be regenerated when `Cargo.lock` changes;
  the Dockerfile handles this by COPY'ing `Cargo.lock*` before
  `cargo chef prepare`.
- For multi-crate workspaces, cargo-chef supports them out of the
  box — same pattern, just COPY all member Cargo.toml files into
  the planner stage.
