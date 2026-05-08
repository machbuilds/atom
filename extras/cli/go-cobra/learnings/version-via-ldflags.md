---
type: pattern
applies_to: [go, cli]
slug: version-via-ldflags
---

# Inject version at link time, not compile time

## Pattern

Declare `var version = "dev"` as a package-level variable in `main.go`,
then have your release pipeline override it with `-ldflags "-X
main.version=v1.2.3"`. Never hardcode the version in source.

## Why

- Local builds (`go build`, `go run`) report `dev` — useful for
  distinguishing "did the user install via release or build from
  source?" in bug reports.
- Released builds get the actual semver from the git tag, so
  `app --version` matches the GitHub Release tag exactly.
- No source-code commit needed to release a new version — the tag
  is the version. This is what GoReleaser expects.

## How to apply

In `main.go`:
```go
var version = "dev"

func main() {
    cmd.SetVersion(version)
    cmd.Execute()
}
```

In the build / release config:
```yaml
ldflags:
  - -s -w -X main.version={{.Version}}
```

Notes:
- `-s -w` strips debug info and the symbol table — smaller binary,
  faster downloads.
- `{{.Version}}` is GoReleaser's templated tag value (e.g., `v1.2.3`).
- If you also want commit hash and build date, add them as separate
  vars: `var commit = "unknown"`, `var date = "unknown"`, then
  `-X main.commit={{.Commit}} -X main.date={{.Date}}`.
