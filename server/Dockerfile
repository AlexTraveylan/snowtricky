# syntax=docker/dockerfile:1

############################
# Install dependencies stage
############################
FROM node:20-alpine AS deps
WORKDIR /app

# Copy manifest files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

############################
# Runtime stage
############################
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Copy installed dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the server source code
COPY server ./server

# Optional: copy the pre-built client if it is mounted or provided at build time
# COPY dist ./dist

EXPOSE 3000

CMD ["node", "server/index.js"]
