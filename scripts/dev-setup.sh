#!/bin/bash

# Development Setup Script - Start all services for local development
# Usage: ./scripts/dev-setup.sh

set -e

REPO_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "🚀 Starting development environment..."
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
  echo "❌ Docker is not running"
  echo "   Please start Docker Desktop and try again"
  exit 1
fi

echo "🐘 Starting PostgreSQL..."
cd "$REPO_ROOT"
docker compose up -d db
echo "✅ PostgreSQL started"
echo ""

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker exec $(docker compose ps -q db) pg_isready -U expense_user -d expense_tracker > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Database ready"
echo ""

echo "🐍 Starting backend..."
cd "$REPO_ROOT/backend"
source .venv/bin/activate
echo "   URL: http://localhost:8000"
echo "   Run in separate terminal:"
echo "   cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo ""

echo "⚛️  Starting frontend..."
cd "$REPO_ROOT/frontend"
echo "   URL: http://localhost:5173"
echo "   Run in separate terminal:"
echo "   cd frontend && npm run dev"
echo ""

echo "🎯 Development environment is ready!"
echo ""
echo "📝 Instructions:"
echo "   1. Open 3 terminal windows"
echo "   2. In Terminal 1 (Backend): cd backend && source .venv/bin/activate && uvicorn app.main:app --reload"
echo "   3. In Terminal 2 (Frontend): cd frontend && npm run dev"
echo "   4. In Terminal 3 (Tests): cd frontend && npm run test:ui"
echo ""
echo "🌐 Access the app:"
echo "   Frontend: http://localhost:5173"
echo "   Backend: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "✅ Database is running in Docker!"
echo ""
echo "💡 Useful commands:"
echo "   View database: docker exec -it \$(docker compose ps -q db) psql -U expense_user -d expense_tracker"
echo "   Stop services: docker compose down"
echo "   View logs: docker compose logs -f"
