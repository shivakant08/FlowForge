# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Prune dev dependencies so only production packages remain in node_modules
RUN npm prune --production

# Stage 2: Production Execution
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy pruned node_modules (includes compiled @prisma/client & binaries)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server.js"]