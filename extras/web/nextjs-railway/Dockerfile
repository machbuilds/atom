# syntax=docker/dockerfile:1.7
#
# Next.js + Railway Dockerfile.
#
# Production-grade defaults baked in:
#   - Multi-stage build (deps → builder → runtime)
#   - Non-root user (uid 1001)
#   - Healthcheck on /api/health
#   - Pinned base image
#   - BuildKit cache mount for npm cache
#   - Next.js standalone output
#
# Railway expects build-time env vars passed via --build-arg.
# Declare each NEXT_PUBLIC_* explicitly below.

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

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so
# Railway must pass them via --build-arg. Declare each one explicitly here.
# Without these ARGs, Railway can't pass them at build time and they will
# be undefined in the client bundle.
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    --mount=type=cache,target=/app/.next/cache,sharing=locked \
    npm run build

# ─── runtime ───────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Add a Next.js route handler at app/api/health/route.ts that returns 200
# when ready, 503 when degraded. Required env missing → 503.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

CMD ["node", "server.js"]
