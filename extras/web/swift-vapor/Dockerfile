# syntax=docker/dockerfile:1.7
#
# Swift + Vapor Dockerfile.
#
# Production-grade defaults:
#   - Multi-stage (build with full Swift toolchain, run with slim image)
#   - Non-root user
#   - Static linking against Linux runtime libs (no glibc surprises)
#   - Pinned Swift version via SWIFT_VERSION ARG

ARG SWIFT_VERSION=5.10-jammy

# ─── builder ───────────────────────────────────────────────────────────
FROM swift:${SWIFT_VERSION} AS builder

WORKDIR /build

# Resolve dependencies first so they cache independently from src.
COPY Package.swift Package.resolved* ./
RUN swift package resolve

COPY Sources ./Sources
RUN swift build --configuration release \
      --static-swift-stdlib \
      -Xlinker -ljemalloc

# Collect everything the runtime image needs into one staging dir.
WORKDIR /staging
RUN cp /build/.build/release/App ./App && \
    find /usr/libexec/swift/linux -name '*.so' -exec cp {} ./ \;

# ─── runtime ───────────────────────────────────────────────────────────
FROM swift:${SWIFT_VERSION}-slim AS runtime

RUN useradd --user-group --create-home --system --skel /dev/null --home-dir /app vapor

WORKDIR /app
COPY --from=builder --chown=vapor:vapor /staging /app

USER vapor:vapor
EXPOSE 8080
ENV PORT=8080

# vapor's hot-reload / dev mode is for local only; container always
# runs production binary.
ENTRYPOINT ["./App"]
CMD ["serve", "--env", "production", "--hostname", "0.0.0.0", "--port", "8080"]
