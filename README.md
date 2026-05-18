# Personal Expense Tracker

Cloud-ready personal expense tracker with Google login, Gmail transaction import, optional PDF statement import, budgets, and analytics.

## Projects

- `backend/` - FastAPI, PostgreSQL, Gmail/PDF parsing, analytics APIs
- `frontend/` - React + TypeScript dashboard UI

## Documentation

- `docs/architecture.md` - system flow, Gmail sync strategy, and storage overview.
- `docs/model-context.md` - detailed repository and Markdown-file context for other coding models.

## Quick Start

### Option A: Docker

Install Docker Desktop first if `docker` is not available:

```bash
docker --version
```

1. Copy env files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Start PostgreSQL:

```bash
docker compose up -d db
```

3. Run backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

4. Run frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:8000`

### Option B: No Docker

If Docker is not installed, run PostgreSQL locally instead:

```bash
brew install postgresql@16
brew services start postgresql@16
createdb expense_tracker
```

Then update `backend/.env` with your local PostgreSQL connection string.

## Notes

Google login is required. Users must sign in with the Gmail account that receives their bank transaction alerts. The app requests read-only Gmail access so it can detect and import bank transaction emails.
