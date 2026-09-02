# Backend Dockerfile
FROM oven/bun:1.3.9-debian

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start command (overridden in docker-compose)
CMD ["bun", "run", "dev"]
