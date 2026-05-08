## Quick start

```bash
# 1. Install Go 1.23+
go version

# 2. Run during development
go run . hello --name world

# 3. Build a binary
go build -o app .
./app hello --name world

# 4. Install to your $GOBIN (typically ~/go/bin)
go install .
```

## Project layout

```
cmd/
├── root.go          Root command, version injection
└── hello.go         Sample subcommand (replace / extend)
main.go              Entry point + version variable
go.mod               Pinned to Go 1.23, Cobra 1.8
.goreleaser.yaml     Release config (linux/darwin/windows × amd64/arm64)
.github/workflows/release.yml  Tag push → GoReleaser
```

## Releasing

Tag a version and push — the release workflow runs GoReleaser, which
builds binaries for every (OS, arch) combination, generates checksums,
and uploads everything to a GitHub Release.

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Common commands

| Task | Command |
|---|---|
| Run | `go run . <subcommand>` |
| Build | `go build -o app .` |
| Test | `go test ./...` |
| Lint | `go vet ./...` |
| Tidy modules | `go mod tidy` |
| Local release dry-run | `goreleaser release --snapshot --clean` |
