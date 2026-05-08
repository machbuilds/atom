---
type: pattern
applies_to: [rust]
slug: rust-log-defaults
---

# Set sensible RUST_LOG defaults; honor the env override

## Pattern

Default `RUST_LOG` to `info,<your_crate>=debug` in dev and `info` in
prod. Always honor the env-set value if present. Never hardcode the
filter in code.

## Why

- `tracing-subscriber::EnvFilter::from_default_env()` panics if
  `RUST_LOG` is unset. Use `try_from_default_env` and fall back to
  a hardcoded filter.
- "Just turn on debug for everything" floods the logs with noise from
  hyper, tokio, h2, etc. — the per-crate syntax (`info,app=debug`)
  is what makes debug-level logging actually useful.
- An operator who sets `RUST_LOG=warn` to debug a noisy production
  issue should always win — never override their setting from code.

## How to apply

```rust
tracing_subscriber::fmt()
    .with_env_filter(
        tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
    )
    .init();
```

In `.env.example` document the per-crate syntax explicitly:
```
RUST_LOG=info,app=debug,tower_http=debug
```

In production deploy scripts (Fly secrets, Railway env, etc.), the
default should be `info` — debug-level prod logging burns money on
log ingestion and rarely tells you anything you couldn't get from
metrics.
