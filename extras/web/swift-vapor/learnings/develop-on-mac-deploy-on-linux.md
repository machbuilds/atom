---
type: pattern
applies_to: [swift]
slug: develop-on-mac-deploy-on-linux
---

# Develop on macOS, deploy on Linux — but always test both

## Pattern

For Vapor / server-side Swift, the practical workflow is:
- Day-to-day code with `swift run` on macOS (fastest iteration)
- Build the production image with the Linux Dockerfile before any deploy
- Run the test suite **inside the Linux image** at least once per PR

## Why

- Native macOS builds compile in seconds; Linux builds inside Docker
  can take minutes for a clean release build. Iteration speed
  matters.
- But `Foundation` on Linux is not 100% identical to `Foundation` on
  macOS:
  - Some `URLSession` features missing or behave differently
  - String encoding edge cases (especially around `String.Encoding`
    constants)
  - Some date / locale APIs have platform-specific behavior
  - `FileManager` differs in symlink handling
- Tests that pass on macOS can fail on Linux for these reasons.
  Catching them locally on macOS only ships the bug to production.

## How to apply

- Develop on macOS for speed.
- Add a CI job (or a local Makefile target) that runs tests inside
  the Linux Docker build:
  ```bash
  docker build -t app-test --target builder . && \
    docker run --rm app-test swift test
  ```
- When using Foundation APIs, check the Swift Linux compatibility
  matrix (e.g., `swift-corelibs-foundation`) before assuming
  parity. Prefer cross-platform alternatives (e.g., `Date.now`
  over locale-dependent date formatters) when possible.
- For deploy-blocking divergence, the rule is: if it doesn't pass
  in the Linux image, it doesn't ship.
