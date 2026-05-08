# Deploy — Python / FastAPI on Railway

This preset defaults to Railway. The Dockerfile is production-grade out
of the box; Railway picks it up automatically when `Dockerfile` is at
the repo root.

## First deploy

1. **Create the project on Railway.**
   ```bash
   railway login
   railway init
   railway link
   ```

2. **Set required env vars.**
   ```bash
   railway variables set APP_ENV=prod LOG_LEVEL=info UVICORN_WORKERS=2
   ```

3. **Push.**
   ```bash
   railway up
   ```

   Or just `git push origin main` if you've connected the GitHub repo
   to Railway — it auto-builds the Dockerfile.

4. **Verify.**
   ```bash
   curl https://<your-domain>.up.railway.app/healthz
   ```

## Healthcheck contract

The container's `HEALTHCHECK` hits `/healthz` every 30s. Keep the
endpoint cheap (no DB calls, no external services) so Railway's
restart policy doesn't fight your dependencies. If you need a
deeper readiness check, expose it as `/readyz` and configure
Railway's healthcheck path separately.

## Tuning workers

`UVICORN_WORKERS=2` is a safe default for most Railway plans. The
classic rule of thumb is `2 * cpu_count + 1` for IO-bound workloads,
but always check first — Railway's smaller plans can be CPU-throttled,
and over-provisioning workers wastes memory without helping
throughput.

## Scaling beyond Railway

When the app outgrows Railway, the Dockerfile travels — Fly.io,
ECS Fargate, GKE, etc. all consume the same image. Just redirect the
deploy step.
