# LiveDog 🐕

**Team 20 - TDT4140 Programvareutvikling**

Digital plattform for hundeshows og konkurranser.

---

## 📋 Om Prosjektet

LiveDog er en webapplikasjon som gjør det enklere å gjennomføre og følge hundeshows. Deltakere kan registrere seg, opprette hundeprofiler, melde på konkurranser og engasjere seg med andre hundeentusiaster. Administratorer kan opprette og administrere konkurranser samt moderere innhold.

### Produktnavn

**LiveDog**

### Teamnummer

20

### Teammedlemmer

| Navn                           | E-post           | Rolle    |
| ------------------------------ | ---------------- | -------- |
| Timon Øverby                   | timonao@ntnu.no  | Utvikler |
| Alexander Wang                 | alexawan@ntnu.no | Utvikler |
| Thor Tveito                    | thortve@ntnu.no  | Utvikler |
| Leo Garcia De Vinuesa Birkenes | lgbirken@ntnu.no | Utvikler |
| Bilal Rasulovich Mataev        | bilalrm@ntnu.no  | Utvikler |

### Kodebase

https://git.ntnu.no/orgs/TDT4140-2026-groups/teams/group-20

---

## 🎯 MVP Funksjonalitet (Gjennomgang 1)

**P1 – Må være med i første versjon:**

- ✅ Brukerregistrering og innlogging
- ✅ Opprette hundeprofil med bilde og beskrivelse
- ✅ Melde hund på konkurranser
- ✅ Se aktive og kommende konkurranser
- ✅ Admin: opprette/slette konkurranser
- ✅ Admin: angi start- og sluttid for konkurranser

**P2 – Engasjement (Gjennomgang 2):**

- Like og kommentere hunder i konkurranser
- Utforske andre brukeres profiler

**P3 – Administrasjon:**

- Moderere kommentarer og bilder
- Admin-dashbord med statistikk

---

## 🛠️ Teknologi Stack

Vi benytter en helhetlig **TypeScript-basert arkitektur** for å redusere kompleksitet og sikre konsistens:

### Frontend

- **Vue 3** - Moderne, reaktivt frontend-rammeverk
- **TypeScript** - Type-sikkerhet og bedre utvikleropplevelse
- **Vite** - Rask build-tool og dev-server
- **Pinia** - State management
- **Vue Router** - Routing
- **Axios** - HTTP-klient

### Backend

- **Bun** - JavaScript runtime og package manager
- **TypeScript** - Type-sikker backend-kode
- **Prisma ORM v7** - Type-sikker database-klient med PostgreSQL adapter
- **JWT** - Autentisering

### Database

- **PostgreSQL** - Relasjonsdatabase

### Verktøy

- **Git** - Versjonskontroll
- **Prettier** - Kodeformatering
- **ESLint** - Linting
- **Vitest** - Testing

---

## 📂 Prosjektstruktur

```
group-20/
├── frontend/           # Vue 3 frontend
│   ├── src/
│   │   ├── components/  # Vue-komponenter
│   │   ├── views/       # Sidevisninger
│   │   ├── router/      # Vue Router-konfigurasjon
│   │   ├── stores/      # Pinia stores
│   │   ├── services/    # API-klienter
│   │   └── types/       # TypeScript-typer
│   ├── package.json
│   └── vite.config.ts
├── backend/            # Bun backend
│   ├── src/
│   │   ├── routes/      # API-endepunkter
│   │   ├── middleware/  # Middleware (auth, CORS, etc.)
│   │   └── services/    # Business logic
│   ├── prisma/
│   │   └── schema.prisma # Prisma-skjema
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
├── .prettierrc
├── package.json         # Root package.json for monorepo
└── README.md
```

---

## 🚀 Komme i Gang

### Prerequisites (Forutsetninger)

**Required:**

- **Docker Desktop** - For running containers
    - Windows/Mac: https://www.docker.com/get-started
    - Linux: https://docs.docker.com/engine/install/

**Optional (for faster local development):**

- **Bun** - JavaScript runtime (enables faster local frontend dev)
    - Windows: `powershell -c "irm bun.sh/install.ps1 | iex"`
    - macOS/Linux: `curl -fsSL https://bun.sh/install | bash`

### Quick Start (Docker-Only - Easiest!)

**For new team members - minimal setup:**

```bash
# 1. Clone the repository
git clone https://git.ntnu.no/TDT4140-2026-groups/group-20.git
cd group-20

# 2. Create environment file (use the example - credentials are for local dev only)
cp backend/.env.example backend/.env

# 3. Start the database first
docker compose up -d db

# 4. Run database migrations
cd backend
bun install
bun run prisma:generate
bun run prisma:migrate
cd ..

# 5. Start everything!
docker compose --profile full up --build
```

**Open http://localhost:5173 - you're ready to code!** 🎉

### 🔑 Default Test Accounts

The database is automatically seeded with test accounts for development:

| Email            | Password | Role  | Description                            |
| ---------------- | -------- | ----- | -------------------------------------- |
| `user@test.com`  | `test`   | USER  | Regular user account for testing       |
| `admin@test.com` | `test`   | ADMIN | Admin account with elevated privileges |

**Note:** These credentials are for local development only. The database also includes 8 sample competitions.

---

**Note:** The database credentials in `.env.example` are safe for local development. Since the database only runs locally, there's no security risk pushing these to the repository.

---

## 🐳 Docker Commands

We have two modes for running the application:

### Option 1: Full Docker (Recommended for Most)

Everything runs in containers - easiest setup, only Docker needed!

```bash
docker compose --profile full up       # Start frontend + backend + database
docker compose --profile full up -d    # Start in background (detached)
docker compose down                    # Stop all containers
docker compose logs -f                 # View logs
```

**Access:**

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Database: localhost:5433

### Option 2: Hybrid (Optional - Requires Bun Installed)

Backend + Database in Docker, frontend runs locally for faster hot-reload.

**Requires:** Bun installed locally

```bash
# Terminal 1: Start backend + database
docker compose up

# Terminal 2: Run frontend locally (requires Bun)
cd frontend && bun run dev
```

**Access:**

- Frontend: http://localhost:5173 (local, faster reload)
- Backend: http://localhost:3000 (in Docker)
- Database: localhost:5433 (in Docker)

### Other Docker Commands

```bash
docker compose build              # Rebuild containers after dependency changes
bun run docker:down       # Stop and remove containers
bun run docker:logs       # Follow logs from all containers
docker compose ps         # See running containers
docker compose exec backend sh   # Access backend container shell
```

---

## 💻 Local Development (Without Docker)

If you prefer to run everything locally without Docker:

### Prerequisites

- Bun installed
- PostgreSQL installed and running locally

### Setup

1. **Install dependencies:**

```bash
bun install

bun install
```

2. **Setup backend environment:**

```bash
cd backend
cp .env.example .env
# No need to edit - the credentials are already configured for local development
```

3. **Setup database with Prisma:**

```bash
cd backend
bun install
bun run prisma:generate   # Generate Prisma Client
bun run prisma:migrate    # Run database migrations
cd ..
```

4. **Start development servers:**

```bash
# From root - runs both frontend and backend
bun run dev
```

---

## 🎨 Code Formatting (Automatic via GitHub Actions)

**Don't worry about code formatting - GitHub handles it!** 🎉

### How It Works:

1. Write code however you want
2. Commit and push to your branch
3. Create a Pull Request
4. **GitHub Actions automatically formats your code**
5. Formatted code is committed back to your PR

**Your code is always pretty - zero effort required!**

### Manual Formatting (Optional):

**With Docker (no Bun needed):**

```bash
# Check formatting
docker compose run --rm frontend bun run format:check

# Fix formatting
docker compose run --rm frontend bun run format
```

**With Bun installed locally:**

```bash
bun run format              # Format all files
bun run format:check        # Check formatting
```

**What gets formatted:**

- TypeScript/JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`)
- Vue files (`.vue`)
- JSON files (`.json`)
- Markdown files (`.md`)

---

## 📚 Nyttige Kommandoer

### Docker Commands (No Bun Required)

```bash
# Start everything
docker compose --profile full up          # Start frontend + backend + database
docker compose --profile full up -d       # Start in background
docker compose up                         # Start only backend + database
docker compose down                       # Stop all containers
docker compose build                      # Rebuild containers
docker compose logs -f                    # View logs
docker compose ps                         # See running containers

# Format code (without Bun)
docker compose run --rm frontend bun run format
```

### Bun Commands (Optional - Only if Bun Installed)

# Local development (without Docker)

bun run dev # Start frontend + backend locally
bun run dev:frontend # Start only frontend (port 5173)
bun run dev:backend # Start only backend (port 3000)

# Code formatting

bun run format # Format all files with Prettier
bun run format:check # Check if files are formatted

# Building

bun run build # Build both frontend and backend
bun run build:frontend # Build only frontend
bun run build:backend # Build only backend

````

### Bun Commands
```bash
bun install                # Install dependencies
bun run <script>           # Run a script from package.json
bun add <package>          # Add a package
bun add -d <package>       # Add a dev dependency
bun remove <package>       # Remove a package
````

### Prisma Commands (Backend)

```bash
cd backend

# Generate Prisma Client (run after schema changes)
bun run prisma:generate

# Create and run a new migration
bun run prisma:migrate

# Reset database (WARNING: deletes all data!)
bun run prisma:migrate:reset

# Open Prisma Studio (Database GUI)
bun run prisma:studio

# Deploy migrations in production
bun run prisma:deploy
```

**Important:** Always run `prisma:generate` after pulling changes that modify the Prisma schema, and run `prisma:migrate` to apply new migrations.

**Prisma 7 Configuration:**

- Database connection is configured in `backend/prisma.config.ts`
- Schema file `backend/prisma/schema.prisma` no longer contains the connection URL
- PostgreSQL adapter (`@prisma/adapter-pg`) is used for database connections
- All configuration is automatically handled - no manual setup needed!

### Git Commands

```bash
git status                     # See current changes
git pull                       # Get latest changes from remote
git checkout -b feature/name   # Create new branch
git add .                      # Stage all changes
git commit -m "message"        # Commit changes
git push                       # Push to remote
# Create Pull Request - GitHub auto-formats your code! 🎉
```

---

## 🔄 Development Workflow

### For Team Members (Docker-Only)

1. **First Time Setup:**

```bash
git clone https://git.ntnu.no/TDT4140-2026-groups/group-20.git
cd group-20

# Copy environment file (credentials are for local dev only)
cp backend/.env.example backend/.env

# Start database
docker compose up -d db

# Setup Prisma
cd backend
bun install
bun run prisma:generate
bun run prisma:migrate
cd ..
```

2. **Daily Development:**

```bash
git pull                                    # Get latest changes
git checkout -b feature/my-feature          # Create feature branch

# Start everything in Docker
docker compose --profile full up

# Make your changes...
# GitHub Actions will auto-format when you create a PR!

git add .
git commit -m "Add: my feature"
git push
# Create Pull Request on GitLab
```

3. **When Done:**

```bash
bun run docker:down        # Stop containers
```

---

## 📝 Scrum Praksis

### Sprintlengde

**2 uker** - for å gi nok tid til vertikale brukerhistorier (frontend, backend, database)

### Sprint Plan

| Sprint   | Uker      | Fokus                                                               |
| -------- | --------- | ------------------------------------------------------------------- |
| Sprint 1 | Uke 5–6   | Oppstart, arkitektur, walking skeleton. **Forstudie leveres uke 6** |
| Sprint 2 | Uke 7–8   | MVP ferdigstilles. **Gjennomgang 1 i uke 8**                        |
| Sprint 3 | Uke 9–10  | Forbedringer + engasjement. **Retrospektiv 1 uke 9**                |
| Sprint 4 | Uke 11–12 | Admin moderering + polish. **Gjennomgang 2 uke 12**                 |

### Møtestruktur

- **Sprint Planning** - ved start av sprint (~4 timer)
- **Ukentlige statusmøter** + møte med produkteier
- **Sprint Review** - ved slutten av sprint (demo)
- **Retrospektiv** - uke 9 og uke 13 (~2 timer)

### Definition of Done

En brukerhistorie er ferdig når:

- ✅ Akseptansekriterier er oppfylt
- ✅ Relevant testdekning er implementert
- ✅ Koden er reviewed og merged via pull request
- ✅ Eventuelle kjente avvik er registrert som issues

---

## 🧪 Testing og Kvalitet

Vi følger **smidige testkvadranter** (Q1 og Q3):

### Q1 - Automatisert (støtter utviklingsteamet)

- Backend enhetstester
- Backend integrasjonstester mot database
- Frontend komponenttester
- Statiske sjekker (lint, formatter)

**Når:** Lokalt før PR + ved merge (CI)

### Q3 - Akseptanse og produktfeedback

- Akseptansetesting mot kriterier
- Utforskende testing av brukerflyter
- Brukertest med produkteier

**Når:** Per ferdigstilt brukerhistorie + før sprint review

---

## 🔄 Arbeidsflyt

### Branching og Git

```bash
# Opprett ny feature branch
git checkout -b feature/kort-beskrivelse

# Commit endringer
git add .
git commit -m "Beskrivende melding"

# Push til remote
git push origin feature/kort-beskrivelse

# Opprett Pull Request på GitLab
```

### Parprogrammering

- Alle parprogrammerer med alle i løpet av perioden
- Parprogrammert kode sjekkes inn med observatør som `Co-authored-by`
- Pull requests krever minst én godkjenning før merge

### KI-bruk

- All KI-generert kode merkes med `# Generert av KI` eller `// Generert av KI`
- Dokumenteres i relevante commits/PR-er

---

## 📚 Nyttige Kommandoer

### Bun

```bash
bun install              # Installer dependencies
bun run dev              # Kjør dev-server
bun run build            # Bygg for produksjon
bun run format           # Formater kode med Prettier
```

### Prisma

```bash
bun install              # Install dependencies
bun run <script>           # Run a script from package.json
bun add <package>          # Add a package
bun add -d <package>       # Add a dev dependency
bun remove <package>       # Remove a package
```

### Prisma (Backend Database Management)

```bash
cd backend

bun run prisma:generate    # Generate Prisma Client (after schema changes)
bun run prisma:migrate     # Run database migrations
bun run prisma:studio      # Open Prisma Studio (database GUI)
```

### Git

```bash
git status               # Se endringer
git pull                 # Hent siste endringer
git log --oneline        # Se commit-historikk
```

---

## 🐛 Kjente Feil

Vi bruker GitLab Issues for å registrere feil og forbedringer.

- Merkes med etiketter (`bug`, `severity`, `frontend/backend`)
- Kjent-feil-liste oppdateres ukentlig
- Gjennomgås i sprint review ved behov

---

## 📖 Referanser

1. TDT4140 L3 Oppgavebeskrivelse
2. Crispin & Gregory - Smidige Testkvadranter
3. Scrum Guide (scrum.org)
4. Vue 3 Dokumentasjon - https://vuejs.org
5. Bun Dokumentasjon - https://bun.sh
6. Prisma Dokumentasjon - https://www.prisma.io
7. PostgreSQL Dokumentasjon - https://www.postgresql.org

---

## 📞 Kontakt

For spørsmål, kontakt teamet via:

- GitLab Issues
- NTNU e-post (se teammedlemmer over)

---

**Sist oppdatert:** Februar 2026
