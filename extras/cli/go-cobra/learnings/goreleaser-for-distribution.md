---
type: pattern
applies_to: [go, cli]
slug: goreleaser-for-distribution
---

# Use GoReleaser for Go CLI distribution

## Pattern

For any Go CLI you intend to distribute, use **GoReleaser**. Don't
hand-roll cross-compilation, archive creation, checksum files, or
GitHub Release upload — GoReleaser does all of it from one
`.goreleaser.yaml` file.

## Why

- Cross-compiling Go for `(linux, darwin, windows) × (amd64, arm64)`
  is one `gorelease` command — no Makefile gymnastics.
- Each release produces:
  - Per-platform tar.gz / zip archives
  - A `checksums.txt` for integrity verification
  - A GitHub Release with auto-generated changelog
  - Optional: Homebrew tap, Scoop bucket, Docker images, SBOMs
- Reproducible across local dev (`goreleaser release --snapshot`) and
  CI (the workflow in this preset).
- Version is injected via `-ldflags "-X main.version={{.Version}}"`,
  so `app --version` reflects the git tag.

## How to apply

The preset already wires this up:
- `.goreleaser.yaml` — build matrix, archive shape, changelog filter
- `.github/workflows/release.yml` — tag push triggers release
- `main.go` declares `var version = "dev"` for ldflags injection

Trade-offs to know:
- For private CLIs distributed inside a single org, GoReleaser is
  overkill — `go install` from a private module is enough.
- For tools where binary size matters, add `-tags=osusergo,netgo` to
  the build flags and statically link.
- Don't ship a Docker image for a CLI unless you have a real reason
  to — users expect to install CLIs as native binaries via
  package managers, not docker pull.
