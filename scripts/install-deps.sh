#!/bin/bash

# Install Dependencies Script - Set up the project
# Usage: ./scripts/install-deps.sh

set -e

REPO_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "📦 Installing project dependencies..."
echo ""

# Backend
echo "🐍 Setting up backend..."
cd "$REPO_ROOT/backend"

if [ ! -d ".venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo "✅ Backend dependencies installed"
echo ""

# Frontend
echo "⚛️  Setting up frontend..."
cd "$REPO_ROOT/frontend"

npm install
echo "✅ Frontend dependencies installed"
echo ""

# Playwright
echo "🎭 Installing Playwright browsers..."
npx playwright install --with-deps
echo "✅ Playwright browsers installed"
echo ""

cd "$REPO_ROOT"

echo "🎉 All dependencies installed!"
echo ""
echo "📚 Next steps:"
echo "   1. Configure .env files (if needed)"
echo "   2. Start database: docker compose up -d db"
echo "   3. Run backend: cd backend && source .venv/bin/activate && uvicorn app.main:app --reload"
echo "   4. Run frontend: cd frontend && npm run dev"
echo "   5. Run tests: cd frontend && npm run test"
