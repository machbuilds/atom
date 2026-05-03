# HOW_TO_PICK_DEPLOY_TARGET.md

A decision tree for choosing where to host. Not exhaustive. Captures the
common targets and the tradeoffs that actually matter.

## Decision tree

### 1. Persistent server or serverless?

**Persistent** (a long-running container/process):
- ✅ Long-running tasks (background jobs, websockets, streaming)
- ✅ In-memory caches, connection pools
- ✅ Predictable cost at scale (you pay for the box)
- ❌ Always-on baseline cost even with zero traffic
- ❌ You manage scaling

**Serverless** (function-per-request):
- ✅ Zero-cost when idle
- ✅ Auto-scales to traffic
- ✅ No infra to manage
- ❌ Cold starts (100ms-2s)
- ❌ Per-request runtime caps (10s-15min depending on platform)
- ❌ Can't hold in-memory state across requests
- ❌ Tier costs add up at high request volume

**If you have**: long-running operations (LLM calls > 10s, websockets,
streaming, queue workers) → **persistent**.

**If you have**: bursty traffic, fast request handlers, no in-memory
state → **serverless**.

### 2. Region/latency requirements?

- Most apps: single region is fine.
- Global users with <100ms latency budget: edge runtime (Cloudflare
  Workers, Vercel Edge) or multi-region deploy.
- Compliance constraints (EU residency, etc.): pick a platform with
  clear region pinning.

### 3. Database/cache plugin ergonomics?

- One-click managed Redis/Postgres on the same platform vs separate
  managed service vs self-hosted.
- Friction here matters a lot for solo/small teams. A platform that
  bundles plugins (Railway, Render, Fly volumes) saves days vs wiring
  separate AWS RDS + ElastiCache.

### 4. Cost envelope per request?

- Calculate expected requests/day × cost-per-request
- For most apps under 100k requests/month, the platform's free or
  hobby tier covers it
- For high-volume APIs, model out: Vercel charges per execution time;
  Railway charges per resource-hour; Lambda charges per ms. The
  cheapest at low volume is rarely the cheapest at high volume.

### 5. Healthcheck story?

- Persistent platforms expect a healthcheck endpoint and restart on
  failure. Design the endpoint per `PATTERNS.md` (two-tier env vars).
- Serverless platforms typically don't need this — failed requests
  bubble up to the platform's logs, no container to restart.

## Common targets

### Railway

- **Best for**: Next.js / Node persistent servers + Redis + Postgres
  in one canvas. Solo or small team. Hobby plan ~$5/month + metered.
- **Picked when**: you want one-click managed plugins, the app needs
  long-running execution (>10s timeout), and the team is small.
- **Avoid when**: you need multi-region, free tier (only $5 trial),
  or compliance pinning.
- **Healthcheck**: declared in `railway.toml`, defaults to GET /
  every 30s.

### Vercel

- **Best for**: Next.js apps with Vercel-specific features (ISR, edge
  middleware, Vercel KV, etc.). Generous free tier.
- **Picked when**: your app fits Vercel's serverless model (no
  long-running tasks), you want cold start optimisation built-in,
  and zero-config Next.js deploy is a priority.
- **Avoid when**: you have >10s API calls (free tier 10s, hobby 60s,
  pro 300s caps), need persistent in-memory state, or want a
  framework other than Next.js.

### Fly.io

- **Best for**: globally-distributed apps that need real low latency
  worldwide. Persistent containers in 30+ regions.
- **Picked when**: you need edge compute closer to users than
  Vercel/Railway can offer. WebSockets work cleanly. Postgres
  via Fly's managed service.
- **Avoid when**: you don't need multi-region — the operational
  complexity isn't worth it for single-region apps.

### Render

- **Best for**: Heroku alternative. Static sites + persistent web
  services + cron jobs + databases. Predictable pricing.
- **Picked when**: you want Heroku ergonomics in 2026 without
  Heroku's pricing/instability. Solid free tier.
- **Avoid when**: you need cutting-edge platform features (Edge
  runtime, ISR, etc.).

### Cloudflare Workers

- **Best for**: pure edge compute. Sub-50ms global latency. KV,
  Durable Objects, R2 storage in the same ecosystem.
- **Picked when**: serverless is right AND you want global edge
  AND your runtime works in Workers' V8 isolates (no Node
  built-ins beyond what Workers polyfills).
- **Avoid when**: your stack relies on Node-specific libs that
  Workers doesn't polyfill.

### AWS (raw)

- **Best for**: when you need full control, complex infra,
  enterprise compliance, or specific services not available
  elsewhere (SQS, SNS, RDS Aurora, etc.).
- **Picked when**: you've got an infra engineer or you're at a
  scale where the operational tax is justified.
- **Avoid when**: solo or small team and you'd rather build
  product than IAM policies.

## Quick-pick matrix

| You have/need... | Pick |
|---|---|
| Next.js + Redis + Postgres + persistent server | Railway |
| Next.js, no persistent state, edge-friendly | Vercel |
| Multi-region with low latency | Fly.io or Cloudflare Workers |
| Heroku-style ergonomics | Render |
| Pure edge compute, V8-compatible runtime | Cloudflare Workers |
| Enterprise compliance, complex infra, infra engineer on team | AWS |

## When you don't know yet

Default to **Railway** for persistent-server workloads or **Vercel** for
serverless Next.js. Both are easy to migrate away from if you outgrow
them. Don't optimise for endgame on day one.
