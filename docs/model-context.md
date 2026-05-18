# Model Context Guide

This file is written for other coding models and future maintainers. It explains what the Markdown files describe, which files are project-owned, which Markdown files are vendor noise, and how the application is arranged.

## Project-Owned Markdown Files

Only these Markdown files should be treated as first-party documentation:

- `README.md` - entry point for the repository. It gives the product summary, top-level project split, quick-start commands, local service URLs, and the important Google/Gmail access note.
- `docs/architecture.md` - architecture summary. It explains the frontend to backend to database flow, the Gmail sync strategy, and the data storage model.
- `docs/model-context.md` - this handoff guide. It is the most detailed context file for models that need to understand where things live before editing code.

The repository also contains many Markdown files under `frontend/node_modules/`. Those belong to installed dependencies and should not be edited as project documentation. Treat them as third-party package documentation unless a task explicitly asks about a dependency.

## Repository Map

```text
.
|-- README.md
|-- docker-compose.yml
|-- docs/
|   |-- architecture.md
|   `-- model-context.md
|-- backend/
|   |-- Dockerfile
|   |-- requirements.txt
|   |-- .env.example
|   `-- app/
|       |-- main.py
|       |-- api/
|       |-- core/
|       |-- db/
|       |-- models/
|       |-- parsers/
|       |-- schemas/
|       `-- services/
`-- frontend/
    |-- Dockerfile
    |-- package.json
    |-- .env.example
    `-- src/
        |-- main.tsx
        |-- api/
        |-- pages/
        |-- types/
        `-- styles.css
```

Generated or local-only directories such as `frontend/node_modules/`, `frontend/dist/`, `backend/.venv/`, `backend/.venv312/`, and Python `__pycache__/` directories are not part of the source model.

## Product Summary

This is a cloud-ready personal expense tracker. A user signs in with Google, grants read-only Gmail access, imports bank transaction alerts, optionally previews PDF statement data, edits categories, sets budgets, and views analytics in a React dashboard.

The current implementation is centered on HDFC transaction parsing, but the parser registry is shaped so additional banks can be added later.

## Runtime Shape

```text
React + TypeScript frontend
  |
  | HTTP JSON requests with bearer JWT
  v
FastAPI backend
  |
  | SQLAlchemy ORM
  v
PostgreSQL
```

The backend also talks to Google OAuth and the Gmail API. For production Gmail push sync, it is intended to receive Pub/Sub delivery through the Gmail webhook endpoint.

## Backend Context

The backend is a FastAPI app in `backend/app`.

Important files:

- `backend/app/main.py` - creates the FastAPI app, configures CORS, creates database tables at startup, exposes `/health`, and mounts all API routers under `/api`.
- `backend/app/core/config.py` - loads environment settings through `pydantic-settings`.
- `backend/app/core/security.py` - handles JWT creation and decoding.
- `backend/app/db/session.py` - configures SQLAlchemy engine, session creation, and declarative base.
- `backend/app/models/entities.py` - defines database tables and enums.
- `backend/app/api/deps.py` - resolves the current authenticated user from bearer auth.

API routers:

- `backend/app/api/auth.py` - development login, Google OAuth login URL creation, and Google OAuth callback handling.
- `backend/app/api/profile.py` - returns the current user profile.
- `backend/app/api/gmail.py` - manual Gmail sync, Gmail watch setup, and webhook entry point.
- `backend/app/api/imports.py` - PDF preview and confirm endpoints.
- `backend/app/api/transactions.py` - transaction list and transaction patch endpoints.
- `backend/app/api/analytics.py` - analytics summary endpoint.
- `backend/app/api/budgets.py` - budget upsert and budget status endpoints.

Service modules hold most business logic:

- `analytics_service.py` - computes totals, category breakdowns, trends, top merchants, and credit/debit chart data.
- `budget_service.py` - stores budget amounts and compares monthly actual spending against budgets.
- `category_service.py` - applies merchant pattern rules and category defaults.
- `gmail_service.py` - queries Gmail, extracts message content, deduplicates processed Gmail messages, parses transactions, and stores new records.
- `pdf_service.py` - extracts structured transaction rows from uploaded statement PDFs.
- `transaction_service.py` - lists, creates, and updates transactions.

Parser modules:

- `parsers/base.py` - common parsed transaction model and abstract bank email parser contract.
- `parsers/hdfc.py` - HDFC transaction email parser.
- `parsers/registry.py` - maps bank names to parser implementations.

## Data Model

The SQLAlchemy entities in `backend/app/models/entities.py` are the source of truth:

- `User` - application user profile with Google email, name, avatar URL, default bank, and creation date.
- `OAuthToken` - Google OAuth access token, refresh token, expiry, and scopes for a user.
- `GmailMessage` - processed Gmail message IDs and raw text for deduplication.
- `Transaction` - normalized expense/income records from Gmail or PDFs.
- `Budget` - monthly category budgets, unique per user/category/month.
- `CategoryRule` - merchant pattern to category rules.

Transaction enums:

- `TransactionSource` - `gmail` or `pdf`.
- `TransactionType` - `debit` or `credit`.

## Frontend Context

The frontend is a Vite React TypeScript app in `frontend/src`.

Important files:

- `frontend/src/main.tsx` - application entry point, OAuth callback token capture, login/profile bootstrap, sidebar navigation, and page routing state.
- `frontend/src/api/client.ts` - typed API client functions and bearer token handling through `localStorage`.
- `frontend/src/types/index.ts` - shared TypeScript types that mirror backend response shapes.
- `frontend/src/styles.css` - global styling for the app shell, pages, controls, charts, and responsive behavior.

Pages:

- `DashboardPage.tsx` - analytics and transaction overview.
- `ImportsPage.tsx` - Gmail sync and PDF import workflow.
- `BudgetsPage.tsx` - monthly category budget management.
- `SettingsPage.tsx` - configuration-oriented UI.
- `ProfilePage.tsx` - current user profile and logout action.
- `LoginPage.tsx` - Google login and development login entry.

Frontend API calls expect `VITE_API_BASE_URL`, defaulting to `http://localhost:8000/api`.

## Main User Flows

### Login

1. User opens the frontend.
2. `main.tsx` checks the URL for an OAuth callback `token`.
3. If a token exists, it is saved in `localStorage` under `expense_tracker_token`.
4. The frontend calls `/api/profile`.
5. If profile loading fails, the login page is shown.

### Gmail Import

1. User authenticates with Google and grants Gmail read-only scope.
2. User starts a manual sync or production calls the Gmail webhook path.
3. Backend uses stored OAuth credentials to read matching Gmail messages.
4. Gmail messages are deduplicated by `GmailMessage`.
5. The selected bank parser extracts transaction fields.
6. Category service assigns categories.
7. Transactions are written to PostgreSQL.

### PDF Import

1. User uploads a PDF statement from the imports page.
2. Backend preview endpoint extracts transaction-like rows with `pdfplumber` and `pandas`.
3. User can review preview data before confirm.
4. Confirmed rows become `Transaction` records with `source = pdf`.

### Dashboard and Budgets

1. Dashboard calls analytics and transaction endpoints with date filters.
2. Analytics service aggregates non-ignored transactions.
3. Budget page reads monthly status and upserts budget rows.
4. Transactions can be patched for category, merchant, ignored state, or other editable fields exposed by the backend schema.

## Environment And Local Run

Backend environment template: `backend/.env.example`.

Required or important backend variables:

- `APP_NAME`
- `ENVIRONMENT`
- `DATABASE_URL`
- `BACKEND_BASE_URL`
- `FRONTEND_BASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CLIENT_SECRETS_FILE`
- `GOOGLE_REDIRECT_URI`
- `GMAIL_PUBSUB_TOPIC`

Frontend environment template: `frontend/.env.example`.

Important frontend variable:

- `VITE_API_BASE_URL`

Local service URLs from the README:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Health check: `http://localhost:8000/health`

## Dependency Context

Backend stack:

- FastAPI
- Uvicorn
- SQLAlchemy
- psycopg
- Alembic
- Pydantic and pydantic-settings
- Google API and OAuth libraries
- pdfplumber
- pandas
- python-jose
- passlib

Frontend stack:

- React
- TypeScript
- Vite
- Recharts
- lucide-react

## Editing Guidance For Models

- Prefer editing project-owned files, not generated folders or dependency folders.
- Do not edit `frontend/node_modules/`, `frontend/dist/`, Python virtualenvs, or `__pycache__/`.
- Keep backend route behavior aligned with schemas in `backend/app/schemas`.
- Keep frontend API types in `frontend/src/types/index.ts` aligned with backend response schemas.
- When adding a new bank parser, implement a parser in `backend/app/parsers/`, register it in `registry.py`, and update docs if user-facing behavior changes.
- When adding an endpoint, add the FastAPI route under `backend/app/api/`, keep business logic in `backend/app/services/`, and expose a matching frontend client function if the UI needs it.
- When adding UI pages or workflows, update `frontend/src/main.tsx` navigation and reuse the API client rather than calling `fetch` directly from each page.
- If the database model changes, consider whether migrations are needed. The current app creates tables on startup, but production-grade schema changes should use Alembic.

## Current Documentation Gaps

These are useful follow-up docs if the project grows:

- API reference with request and response examples.
- Database schema reference or ER diagram.
- Gmail OAuth setup guide with Google Cloud console steps.
- Parser extension guide for adding banks beyond HDFC.
- Deployment guide for Docker, Pub/Sub, and production environment variables.
