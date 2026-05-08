# syntax=docker/dockerfile:1.7
#
# Python + FastAPI Dockerfile.
#
# Production-grade defaults:
#   - Multi-stage (builder installs into a venv, runtime copies the venv)
#   - Non-root user (uid 1001)
#   - Healthcheck on /healthz
#   - Pinned Python via PYTHON_VERSION ARG
#   - BuildKit cache mount for pip wheels

ARG PYTHON_VERSION=3.12-slim

# ─── builder ───────────────────────────────────────────────────────────
FROM python:${PYTHON_VERSION} AS builder
WORKDIR /app

ENV PIP_NO_CACHE_DIR=0 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY pyproject.toml ./
RUN --mount=type=cache,target=/root/.cache/pip,sharing=locked \
    pip install --upgrade pip && pip install .

COPY app ./app

# ─── runtime ───────────────────────────────────────────────────────────
FROM python:${PYTHON_VERSION} AS runtime
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

RUN addgroup --system --gid 1001 app \
 && adduser --system --uid 1001 --ingroup app app

COPY --from=builder --chown=app:app /opt/venv /opt/venv
COPY --from=builder --chown=app:app /app/app ./app

USER app
EXPOSE 8000
ENV PORT=8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request,sys;sys.exit(0 if urllib.request.urlopen('http://localhost:'+__import__('os').environ.get('PORT','8000')+'/healthz').status==200 else 1)" || exit 1

# Worker count = 2*cpu+1 is the classic uvicorn/gunicorn rule of thumb;
# tune via UVICORN_WORKERS at deploy time.
ENV UVICORN_WORKERS=2
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers ${UVICORN_WORKERS}"]
