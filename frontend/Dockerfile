# Frontend Dockerfile
FROM oven/bun:1.3.8-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Copy application code
COPY . .

# Expose port
EXPOSE 5173

# Start command (overridden in docker-compose)
CMD ["bun", "run", "dev", "--host"]
