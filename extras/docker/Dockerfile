# syntax=docker/dockerfile:1.7
#
# Generic multi-stage Dockerfile. Targets Node-based projects by default.
# For Python / Go / Rust / Swift, see extras/docker/README.md for the
# stack-specific patterns to swap in.
#
# Production-grade defaults baked in:
#   - Multi-stage build (builder → runtime)
#   - Non-root user (uid 1001)
#   - Healthcheck on /healthz
#   - Pinned base image (node:22.11-alpine)
#   - BuildKit cache mount for npm cache
#   - Reproducible builds (npm ci, frozen lockfile)
#
# Build: DOCKER_BUILDKIT=1 docker build -t app .
# Run:   docker run -p 3000:3000 app

ARG NODE_VERSION=22.11-alpine

# ─── deps ──────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund

# ─── builder ───────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

# Build-time env vars (e.g. NEXT_PUBLIC_*) get inlined into the bundle.
# Declare each ARG explicitly so the build orchestrator can pass them.
# See extras/docker/README.md for the pattern.

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm run build

# ─── runtime ───────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 appuser

# Adjust these COPY lines to your framework's build output:
#   Next.js standalone:  /app/.next/standalone, /app/.next/static, /app/public
#   Vite / SPA:          /app/dist (then serve via a static server)
#   Express / Fastify:   /app/dist + /app/node_modules + package.json
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json

USER appuser
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# /healthz must return 200 when ready, 503 when degraded.
# Required env missing → 503; optional env missing → 200 with degraded flag.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/healthz || exit 1

CMD ["node", "dist/server.js"]
