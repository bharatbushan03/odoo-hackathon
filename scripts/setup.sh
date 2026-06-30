#!/bin/bash
set -e

echo "Starting Postgres..."
docker compose up -d

echo "Setting up backend..."
cd backend
npm install
if [ ! -f .env ]; then cp .env.example .env; fi
cd ..

echo "Setting up frontend..."
cd frontend
npm install
cd ..

echo "Done. Run 'cd backend && node server.js' and 'cd frontend && npm run dev' in separate terminals."
