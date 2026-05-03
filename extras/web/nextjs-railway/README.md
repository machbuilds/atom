# nextjs-railway preset

A Next.js 14+ App Router project deployed to Railway with managed
Redis + PostgreSQL plugins.

## When to use this

All of:
- Next.js 14+ with App Router
- Persistent server (not Vercel serverless)
- Railway as the deploy target
- Probably needs Redis (cache / rate limit) + PostgreSQL (durable storage)

If the project is Next.js but Vercel-bound, this preset doesn't apply —
Vercel handles its own build, no Dockerfile needed.

## What's included

```
nextjs-railway/
├── Dockerfile              Multi-stage Node 20 Alpine, standalone output
├── railway.toml            Railway config — DOCKERFILE builder, healthcheck
├── next.config.js.example  output: 'standalone' + common config
└── README.md               (this file)
```

## How to use

1. Copy these files into your new project's root.
2. Rename `next.config.js.example` to `next.config.js`.
3. In `Dockerfile`, edit the `ARG NEXT_PUBLIC_*` block to match the
   public env vars your project actually uses. Without ARG declarations,
   Railway can't pass them at build time and they'd default to undefined
   in the client bundle.
4. In Railway: create project, add Redis + PostgreSQL plugins (Railway
   auto-provisions; reference `${{Redis.REDIS_URL}}` and
   `${{Postgres.DATABASE_URL}}` as service variables).
5. Add manual env vars in Railway's UI: `MORALIS_API_KEY` (or whatever
   your app needs), `NEXT_PUBLIC_BASE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}`,
   etc.
6. Generate domain: Railway → Service → Settings → Networking → Generate Domain.
7. Smoke-test the URL: `/api/health` should return 200 once env vars +
   plugins are in place.

## What this preset does NOT include

- **App code** — that's yours
- **Auth** — add on top
- **Sentry** — wire when you need it; gate init on `SENTRY_DSN` presence
- **Analytics** — PostHog or otherwise; add to your project's setup
- **Specific env vars** — only the structural pattern (build-time ARG
  declarations) is here; the actual list is project-specific

## Cost expectations

- **Hobby plan**: $5/month flat
- **Idle service + Redis + PostgreSQL**: ~$1-3/month metered
- **Total at low traffic**: ~$6-8/month

For demo/feedback-session projects, idle cost over a few days is well
under $1. For ongoing production, budget ~$10-20/month at typical
small-app traffic.

## Healthcheck behaviour

`railway.toml` points the platform's healthcheck at `/api/health` with
a 30s timeout and on-failure restart x3. The app's `/api/health` endpoint
should follow the two-tier env-var pattern from atom's `PATTERNS.md`:
- Required env missing or Redis ping fails → 503
- Optional env missing → 200 with `status: "degraded"`

This avoids restart-loop behaviour on graceful-degradation paths.

## Source

This preset is the structure used in the wallet-persona project (May 2026).
