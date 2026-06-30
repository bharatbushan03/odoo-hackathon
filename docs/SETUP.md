# Setup

## Prerequisites
- Node 20 LTS
- Docker + Docker Compose

## Run locally
```bash
docker compose up -d        # postgres
cd backend && npm install && cp .env.example .env && node server.js
cd frontend && npm install && npm run dev
```

## Naming conventions
- Files/folders: kebab-case
- JS variables/functions: camelCase
- React components: PascalCase

## Branch strategy
- `main` — always deployable, no direct pushes
- `dev` — integration branch, PRs merge here
- `feature/<name>-<desc>` — one per person per task

## Integration Owner (decide before sprint starts)
Name: ___________
Role: merges PRs into dev from hour 5 onward, resolves conflicts, keeps dev always running
