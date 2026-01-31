FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm
# Build shared first, then frontend
RUN pnpm --filter @ticobot/shared build
RUN pnpm --filter @ticobot/frontend build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built frontend
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]