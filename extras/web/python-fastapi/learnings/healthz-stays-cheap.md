---
type: pattern
applies_to: [python, api, web]
slug: healthz-stays-cheap
---

# Keep `/healthz` cheap; use `/readyz` for deep checks

## Pattern

`/healthz` should answer "is this process alive?" — never call the
database, cache, or external services from it. If you need a deeper
readiness check, expose it as `/readyz` and let the load balancer
or orchestrator point at the right one.

## Why

- Container `HEALTHCHECK` runs every 30s by default. If it touches
  the DB and the DB is overloaded, every container in the cluster
  starts failing healthchecks at once and the orchestrator restarts
  them — turning a slow query into an outage.
- Liveness ("am I alive?") and readiness ("can I serve traffic?")
  are different questions. Kubernetes splits them; Docker
  HEALTHCHECK doesn't, but you should still split the endpoints
  so you have the option later.
- A failing `/healthz` should mean "kill this process and start a
  new one." A failing `/readyz` means "stop sending me traffic
  but don't kill me." The difference matters under load.

## How to apply

- `/healthz` returns 200 OK with no I/O. Just a `{"status": "ok"}`
  literal.
- `/readyz` (when added) checks DB connection pool + critical
  caches. Return 503 with a body explaining what's degraded.
- Cache `/readyz` results for 5-10 seconds so the endpoint doesn't
  become a thundering-herd amplifier.
- Container HEALTHCHECK points at `/healthz`. Load balancer
  health probe points at `/readyz` once you have one.
