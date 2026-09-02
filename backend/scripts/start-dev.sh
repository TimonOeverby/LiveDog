#!/bin/bash
set -e

echo "⚙️ Generating Prisma client..."
bun run prisma:generate

echo "🔄 Resetting database completely (dropping and recreating)..."
bunx prisma migrate reset --force

echo "🌱 Seeding database if needed..."
bun run prisma:seed:if-empty

echo "🚀 Starting development server..."
bun run dev
