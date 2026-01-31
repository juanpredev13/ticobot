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
# Build shared first, then backend
RUN pnpm --filter @ticobot/shared build
RUN pnpm --filter @ticobot/backend build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Copy built backend
COPY --from=builder --chown=backend:nodejs /app/backend/dist ./backend/dist
COPY --from=builder --chown=backend:nodejs /app/backend/package.json ./backend/
COPY --from=builder --chown=backend:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=backend:nodejs /app/shared/dist ./shared/dist

USER backend

EXPOSE 3001
CMD ["node", "backend/dist/api/server.js"]