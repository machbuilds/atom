---
type: pattern
applies_to: [rust]
slug: release-profile-strip-lto
---

# Release profile: enable strip + thin LTO

## Pattern

In `Cargo.toml`'s `[profile.release]`, enable:
- `strip = true` — drop debug symbols from the binary
- `lto = "thin"` — link-time optimization
- `codegen-units = 1` — single codegen unit per crate

These three together cut binary size 30-60% and improve runtime
~5-15% with negligible compile-time cost beyond the LTO step.

## Why

- **Smaller binary = smaller container image.** A stripped + LTO'd
  axum binary often fits in 5-10 MB; a debug-symbol release build
  can be 50+ MB. Distroless images amplify this — when the binary
  is the whole image, every megabyte counts.
- **`thin` LTO not `fat` LTO.** Fat LTO adds 30s-2min to compile
  time for marginal additional gains. Thin LTO is the practical
  default — 90% of the win, 10% of the cost.
- **`codegen-units = 1` lets LTO see the whole crate.** The default
  (16) is faster to compile but produces less-optimized code.

## How to apply

```toml
[profile.release]
strip = true
lto = "thin"
codegen-units = 1
```

Trade-offs to know:
- Backtraces in panics get less useful (no symbol names). For
  servers, you usually want telemetry from `tracing` over panic
  backtraces anyway, so this rarely matters.
- If you're profiling with `perf` / `cargo flamegraph`, build with
  `cargo build --profile=release-with-debug` (a custom profile
  that inherits release but keeps symbols) instead of editing the
  release profile.
