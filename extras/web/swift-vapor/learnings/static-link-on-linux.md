---
type: pattern
applies_to: [swift]
slug: static-link-on-linux
---

# Static-link the Swift stdlib for Linux deploys

## Pattern

When building a Swift server for Linux (Vapor on Fly/Railway/ECS),
pass `--static-swift-stdlib` to `swift build`. The resulting binary
ships its own copy of the runtime, decoupling deploy images from
the host's libc/libstdc++ versions.

## Why

- The default Swift Linux build dynamically links against the Swift
  runtime libraries shipped with the toolchain. If the runtime
  image and the build image disagree on Swift versions, you'll get
  cryptic "symbol not found" errors at startup.
- `swift:5.10-slim` runtime images don't always carry every shared
  library the binary expects. Static-linking sidesteps this.
- Static binaries make the runtime image swap-able — you could run
  on `debian:slim`, `ubuntu`, or even `distroless` without
  re-resolving Swift's runtime layout.

## How to apply

In the Dockerfile:
```dockerfile
RUN swift build --configuration release --static-swift-stdlib
```

Trade-offs:
- Static binaries are larger (~20-30 MB extra). For a server image,
  this is a non-issue.
- Linux-only flag — on macOS local dev, omit it (the system already
  has the Swift runtime).
- If you also need jemalloc (Vapor recommends it for production),
  add `-Xlinker -ljemalloc` to the build flags and ensure the
  runtime image has libjemalloc.
