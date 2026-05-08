---
type: pattern
applies_to: [python, api]
slug: uvicorn-worker-count
---

# uvicorn worker count — measure, don't guess

## Pattern

Default to **2 workers** in production for a small FastAPI service.
Bump only when you have evidence the box is CPU-saturated and adding
a worker measurably improves throughput.

## Why

The classic rule of thumb is `2 * cpu_count + 1` (Gunicorn docs), but
that assumes:
- True multi-core hardware (not a throttled cgroup slice on Railway /
  Fly.io's smaller plans)
- IO-bound workload (FastAPI is already async — for pure-async code,
  one worker per core is often enough)
- Memory headroom — each worker loads the whole app into memory.

Over-provisioning workers is a common Railway/Fly mistake: 8 workers
on a 1-CPU plan just causes context-switching overhead without helping
throughput.

## How to apply

- Start at 2 workers. Watch p95 latency under realistic load.
- If CPU is saturated and latency is climbing, add 1 worker and
  re-measure. Stop when adding workers stops helping.
- For a 4+ CPU container with a mostly-async app, `workers = cpus`
  often outperforms `2*cpu+1` because async handlers don't benefit
  from extra processes.
- Configure via `UVICORN_WORKERS` env var (set in Railway/Fly UI) —
  don't bake the worker count into the Dockerfile CMD.
