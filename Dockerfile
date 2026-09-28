# =====================================================================
# Finance Cockpit — Production Docker image
# Multi-stage build: deps -> build -> runtime
# (Uses the full node_modules in the runtime image, on purpose, so the
#  Prisma CLI is available for `prisma migrate deploy` on container start —
#  simpler and more robust for a self-hosted NAS/Docker target than the
#  trimmed-down Next.js "standalone" output.)
# =====================================================================

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dummy DATABASE_URL only for `next build` / `prisma generate` (no DB access needed at build time)
ENV DATABASE_URL="file:/data/finance.db"
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S finance && adduser -S finance -G finance

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

RUN mkdir -p /data && chown -R finance:finance /data
VOLUME ["/data"]

USER finance
EXPOSE 3000
ENV PORT=3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
