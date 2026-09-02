# 🚀 LiveDog Quick Start Guide

## First Time Setup (2 minutes)

### 1. Install Docker Desktop

```bash
# Download and install Docker Desktop
# Windows/Mac: https://www.docker.com/get-started
# Linux: https://docs.docker.com/engine/install/
```

### 2. Clone and Setup

```bash
git clone https://git.ntnu.no/TDT4140-2026-groups/group-20.git
cd group-20
cp backend/.env.example backend/.env
```

### 3. Start Everything!

```bash
docker compose --profile full up --build
```

**Open http://localhost:5173 - you're coding!** 🎉

---

## Daily Development

```bash
# 1. Get latest code
git pull

# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Start the app
docker compose --profile full up

# 4. Make your changes
# (GitHub Actions auto-formats when you create a PR!)

# 5. Commit and push
git add .
git commit -m "Your message"
git push

# 6. Create Pull Request - auto-formatting happens automatically!
```

---

## Most Used Commands

### Starting the App

```bash
docker compose --profile full up       # Everything (frontend + backend + DB)
docker compose --profile full up -d    # Start in background
docker compose up                      # Only backend + DB
docker compose down                    # Stop all containers
docker compose logs -f                 # View logs
```

### Formatting Code (Optional - GitHub does it automatically!)

```bash
# With Docker (no other tools needed)
docker compose run --rm frontend bun run format
```

### Running Tests

```bash
# Backend smoke tests
cd backend && bun test

# Frontend smoke tests
cd frontend && bun run test

# Frontend end-to-end tests (requires app running on localhost:5173)
cd frontend && bun run test:e2e
```

### Git Workflow

```bash
git status                 # See what changed
git pull                   # Get latest code
git checkout -b feature/name   # New branch
git add .                  # Stage changes
git commit -m "message"    # Commit (auto-formats!)
git push                   # Push to remote
```

### When Things Break

```bash
# Rebuild containers (if dependencies changed)
docker compose build

# Restart everything
docker compose down
docker compose --profile full up --build

# Check logs
docker compose logs -f

# Reset database (when schema changes - later)
docker compose run --rm backend bun run prisma:migrate
```

---

## URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Database:** localhost:5433

---

## Need Help?

1. Check the full [README.md](README.md)
2. Ask in the team chat
3. Create an issue on GitHub

---

## Tips

✅ **Only Docker needed** - no other installations required!
✅ **GitHub auto-formats PRs** - don't worry about code style!
✅ **Use Docker** - it's the easiest way to get started
✅ **Keep branches small** - easier to review
✅ **Pull often** - stay up to date with team changes
✅ **Ask questions** - we all have different skill levels, that's OK!
