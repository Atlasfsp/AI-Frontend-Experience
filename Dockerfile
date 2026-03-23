# ──────────────────────────────────────────────────────────────────────────────
# AI-Frontend-Experience — Multi-stage production Dockerfile
# Builds any app in the monorepo: software-factory-web | platform-automation-web | docs-portal
# Usage:
#   docker build --build-arg APP_NAME=software-factory-web -t bac/software-factory-web .
# ──────────────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=20

# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS deps

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

# Copy lockfile and workspace manifests first for layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build the target application ───────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS builder

ARG APP_NAME=software-factory-web

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy installed node_modules and full source
COPY --from=deps /app/ ./

# Use turbo prune to create a minimal build context for the target app
RUN npx turbo prune @bac/${APP_NAME} --docker

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx turbo run build --filter=@bac/${APP_NAME}

# ─── Stage 3: Production runner ─────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner

ARG APP_NAME=software-factory-web

RUN apk add --no-cache libc6-compat curl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy the standalone output from the builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# server.js is at the root of standalone output
CMD ["node", "server.js"]
