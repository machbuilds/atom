## Quick start

```bash
# 1. Install Swift 5.10 (via swiftly, or use the official Apple toolchain)
swift --version

# 2. Build & run
swift run

# Health check
curl http://localhost:8080/healthz
```

## Project layout

```
Sources/App/
├── entrypoint.swift     @main, Application bootstrap + lifecycle
└── configure.swift      Server config + routes (extend here)
Package.swift            Pinned to Vapor 4, Swift 5.10
Dockerfile               Multi-stage, non-root, static-linked Linux build
.env.example             Environment contract
DEPLOY.md                Fly.io deploy notes
```

## Common commands

| Task | Command |
|---|---|
| Run dev | `swift run` |
| Run release | `swift run --configuration release` |
| Run tests | `swift test` |
| Build container | `docker build -t app .` |
| Run container | `docker run -p 8080:8080 --env-file .env app` |
