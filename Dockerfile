# =====================================================================
# Finance Cockpit — Production Docker image
# Multi-stage build: deps -> build -> runtime
# =====================================================================

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json ./
RUN npm install --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:/data/finance.db"
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# openssl is required for Prisma's query engine to correctly detect the
# OpenSSL version at runtime. Without it, Alpine's node image doesn't
# expose libssl, Prisma's detection silently defaults to "openssl-1.1.x",
# which mismatches the "openssl-3.0.x" engine actually generated during
# the build stage — Prisma then tries to fetch/write a different engine
# binary at container startup, which fails due to filesystem permissions
# (see chown below). Installing openssl explicitly fixes the detection
# at the source; the chown is a defensive fallback in case Prisma still
# needs to write anything at runtime.
RUN apk add --no-cache openssl libc6-compat
RUN addgroup -S finance && adduser -S finance -G finance

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

RUN mkdir -p /data && chown -R finance:finance /data /app
VOLUME ["/data"]

USER finance
EXPOSE 3000
ENV PORT=3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
