---
type: pattern
applies_to: [swift, web]
slug: bind-zero-not-localhost
---

# Bind to 0.0.0.0, not localhost, inside containers

## Pattern

Server config in `configure.swift` must set
`app.http.server.configuration.hostname = "0.0.0.0"`. Never default
to `127.0.0.1` / `localhost` for a containerized service.

## Why

- A container's `localhost` is the container's own loopback interface.
  Binding there means nothing from outside the container can reach
  the service — Docker port-mapping (`-p 8080:8080`) silently does
  nothing.
- The classic symptom: the service starts, logs say "listening on
  port 8080", but `curl http://localhost:8080` from the host gets
  "connection refused." Wasted hours of debugging.
- `0.0.0.0` binds to all network interfaces in the container's
  network namespace. Docker's port-publish mechanism then forwards
  external traffic to the bound port.

## How to apply

```swift
public func configure(_ app: Application) async throws {
    app.http.server.configuration.hostname = "0.0.0.0"
    if let portString = Environment.get("PORT"),
       let port = Int(portString) {
        app.http.server.configuration.port = port
    }
    // ...
}
```

Notes:
- Vapor's CLI flag `--hostname 0.0.0.0` does the same thing. Use
  whichever fits your deploy shape — config-based is more reliable
  because it doesn't depend on the operator passing the right CLI
  args.
- This is not a Vapor-specific issue — every server framework on
  every language has this trap. Ruby/Sinatra, Express, FastAPI,
  axum, etc. all default to localhost in dev and need explicit
  `0.0.0.0` for containers.
