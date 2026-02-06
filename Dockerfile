# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY vite.config.js ./
COPY client ./client

RUN npx vite build && \
    echo "Verifying build output..." && \
    ls -la /app/ && \
    if [ ! -d "/app/dist" ]; then \
        echo "ERROR: dist directory not found after build!"; \
        exit 1; \
    fi && \
    echo "✓ Build successful, dist directory found"

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY server ./server

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "server/index.js"]
