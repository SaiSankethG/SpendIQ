# Personal Expense Tracker

Cloud-ready personal expense tracker with Google login, Gmail transaction import, optional PDF statement import, budgets, and analytics.

## Projects

- `backend/` - FastAPI, PostgreSQL, Gmail/PDF parsing, analytics APIs
- `frontend/` - React + TypeScript dashboard UI

## Documentation

- `docs/architecture.md` - system flow, Gmail sync strategy, and storage overview.
- `docs/model-context.md` - detailed repository and Markdown-file context for other coding models.

## Architecture

At a high level, the project is split into three main layers:

```text
+---------------------------+      +---------------------------+      +---------------------------+
| React + TypeScript UI    | ---> | FastAPI API + Services    | ---> | PostgreSQL Database       |
|                           |      |                           |      |                           |
| - Login and dashboard    |      | - Auth and profile        |      | - Users                   |
| - Gmail/PDF imports      |      | - Gmail sync + webhook    |      | - OAuth tokens            |
| - Budgets and analytics  |      | - PDF import pipeline     |      | - Transactions            |
| - JWT stored locally     |      | - Transactions/budgets    |      | - Budgets                 |
+---------------------------+      | - Analytics aggregation   |      | - Gmail message history   |
                                   +-------------+-------------+      +---------------------------+
                                                 ^
                                                 |
                              +------------------+------------------+
                              | External Services                    |
                              | - Google OAuth                       |
                              | - Gmail API                          |
                              | - Optional Pub/Sub push notifications|
                              +--------------------------------------+
```

### Main request and data flow

1. The user signs in from the frontend.
2. The backend completes Google OAuth, stores Google tokens in the database, and returns an app JWT for future API calls.
3. The frontend uses that JWT to call backend endpoints under `/api`.
4. For Gmail imports, the backend reads email data through the Gmail API, parses bank messages with the parser registry, categorizes transactions, and saves normalized records in PostgreSQL.
5. For PDF imports, the backend previews and parses statement rows before saving confirmed transactions.
6. Dashboard analytics and budget views read from the same normalized transaction and budget tables.

### Backend module layout

- `api/` - HTTP endpoints
- `services/` - business logic
- `models/` - SQLAlchemy entities
- `schemas/` - request/response models
- `parsers/` - bank-specific parsing logic
- `db/` and `core/` - database/session setup, config, and security helpers

For a deeper walkthrough, see `docs/architecture.md`.

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
