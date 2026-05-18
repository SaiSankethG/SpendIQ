# Architecture

This document explains the application architecture in enough depth for developers to extend or debug the system. For a compact repository map and model handoff notes, see `docs/model-context.md`.

## System Overview

The project is a personal expense tracker with Google login, Gmail transaction import, optional PDF statement import, editable transactions, budgets, and analytics.

```text
Browser
  |
  | React + TypeScript UI
  | Bearer JWT stored in localStorage
  v
FastAPI backend
  |
  +-- Auth and profile APIs
  +-- Gmail sync APIs
  +-- PDF import APIs
  +-- Transaction APIs
  +-- Budget APIs
  +-- Analytics APIs
  |
  | SQLAlchemy ORM
  v
PostgreSQL

External systems:
  - Google OAuth
  - Gmail API
  - Google Pub/Sub, planned for Gmail push delivery
```

At runtime, the frontend never talks directly to Google, Gmail, or PostgreSQL. It talks only to the FastAPI backend. The backend owns authentication, Google OAuth token storage, Gmail access, parsing, deduplication, transaction persistence, budget calculations, and analytics aggregation.

## Repository Layers

```text
backend/app/
|-- main.py              FastAPI app creation, CORS, router mounting, startup table creation
|-- api/                 HTTP route handlers
|-- core/                settings and security helpers
|-- db/                  SQLAlchemy engine/session/base setup
|-- models/              database entities and enums
|-- parsers/             bank-specific email parsing
|-- schemas/             Pydantic request/response models
`-- services/            business logic used by API routes

frontend/src/
|-- main.tsx             app bootstrap, auth token capture, page navigation
|-- api/client.ts        typed backend client functions
|-- pages/               UI screens
|-- types/index.ts       TypeScript API/domain types
`-- styles.css           global UI styling
```

The intended dependency direction is:

```text
API routes -> services -> models/db/parsers
schemas -> API boundaries
frontend pages -> frontend api client -> backend APIs
```

Keep route handlers thin. New business behavior should generally live in `backend/app/services/`, with route handlers responsible for authentication, request parsing, and response mapping.

## Backend Request Lifecycle

1. A frontend request reaches a FastAPI route under `/api`.
2. Protected routes use `get_current_user` from `backend/app/api/deps.py`.
3. `get_current_user` reads the bearer token, decodes it with helpers in `backend/app/core/security.py`, and loads the user from the database.
4. The route creates or calls a service class from `backend/app/services/`.
5. Services query or mutate SQLAlchemy models from `backend/app/models/entities.py`.
6. The route returns Pydantic schemas from `backend/app/schemas/`.

The app entry point is `backend/app/main.py`. It configures CORS with `FRONTEND_BASE_URL`, creates database tables on startup with `Base.metadata.create_all(bind=engine)`, exposes `/health`, and mounts these routers:

- `/api/auth`
- `/api/profile`
- `/api/gmail`
- `/api/imports`
- `/api/transactions`
- `/api/analytics`
- `/api/budgets`

## Frontend Request Lifecycle

1. `frontend/src/main.tsx` starts the React app.
2. If the URL has a `token` query parameter after OAuth callback, it stores it in `localStorage` as `expense_tracker_token`.
3. The app calls `getProfile()` from `frontend/src/api/client.ts`.
4. If the profile call succeeds, the authenticated app shell renders.
5. If the profile call fails, `LoginPage` renders.
6. Pages call typed functions in `api/client.ts`; the client attaches the bearer token and sends requests to `VITE_API_BASE_URL`.

The frontend currently uses local component state for navigation instead of a router library. The page key is stored in `main.tsx`, and the sidebar switches between dashboard, imports, budgets, settings, and profile pages.

## Authentication And Identity

There are two authentication paths:

- Development login through `POST /api/auth/dev-login`.
- Google OAuth through `/api/auth/google/login` and `/api/auth/google/callback`.

Google OAuth flow:

1. Frontend asks the backend for a Google authorization URL.
2. User signs in and grants scopes.
3. Google redirects to the backend callback.
4. Backend creates or updates the `User` row.
5. Backend stores Google OAuth credentials in `OAuthToken`.
6. Backend creates an app JWT and redirects back to the frontend with `?token=...`.
7. Frontend stores the JWT and uses it for future API calls.

The Gmail integration requires these scopes:

- `openid`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth/gmail.readonly`

The app JWT identifies the local application user. The Google OAuth token is separate and is used by the backend only when it needs to call Gmail.

## Data Model

The database model is defined in `backend/app/models/entities.py`.

### User

Represents one signed-in person.

Important fields:

- `id`
- `email`
- `name`
- `avatar_url`
- `default_bank`
- `created_at`

Relationships:

- one `OAuthToken`
- many `Transaction` records

### OAuthToken

Stores the Google OAuth credentials for a user.

Important fields:

- `user_id`, unique
- `access_token`
- `refresh_token`
- `expires_at`
- `scopes`

This table is the bridge between app identity and Gmail access.

### GmailMessage

Tracks Gmail messages that have already been processed.

Important fields:

- `user_id`
- `gmail_message_id`
- `bank`
- `processed_at`
- `raw_text`

The unique constraint on `(user_id, gmail_message_id)` prevents importing the same Gmail message twice.

### Transaction

Stores normalized money movement records.

Important fields:

- `user_id`
- `bank`
- `source`, either `gmail` or `pdf`
- `amount`
- `type`, either `debit` or `credit`
- `merchant`
- `category`
- `transaction_date`
- `reference_id`
- `raw_text`
- `is_ignored`
- `created_at`

Analytics and budget calculations should exclude ignored transactions when the feature expects user-visible totals.

### Budget

Stores one monthly category budget per user.

Important fields:

- `user_id`
- `category`
- `month`
- `amount`

The unique constraint on `(user_id, category, month)` allows upsert behavior.

### CategoryRule

Stores future or custom merchant-to-category rules.

Important fields:

- `user_id`
- `merchant_pattern`
- `category`

The current category service uses built-in keyword rules, but this model provides a natural place to persist custom rules later.

## Core Flows

### Login Flow

```text
User opens frontend
  |
  v
main.tsx checks for token in URL
  |
  +-- token exists -> save to localStorage and clean URL
  |
  v
GET /api/profile
  |
  +-- success -> render authenticated app shell
  |
  +-- failure -> render LoginPage
```

### Gmail Import Flow

```text
User triggers sync in frontend
  |
  v
POST /api/gmail/sync
  |
  v
get_current_user validates app JWT
  |
  v
GmailService loads OAuthToken for user
  |
  v
Gmail API lists candidate messages
  |
  v
For each message:
  - skip if GmailMessage already exists
  - extract text from snippet and MIME parts
  - choose parser from parser_registry
  - parser checks can_parse
  - parser extracts amount, merchant, type, date, reference
  - category_service suggests category
  - create GmailMessage row
  - create Transaction row
  |
  v
Return fetched, created, skipped, parse_skipped, duplicate_skipped
```

Important implementation details:

- `GmailService.build_query()` creates a Gmail search query only for date-range mode.
- `last_n` mode limits the number of listed Gmail messages.
- Deduplication is based on the Gmail message ID, not transaction amount or reference.
- HDFC Gmail parsing currently detects UPI transaction text and extracts debit transactions.
- If the user has no stored OAuth token, sync returns zero counts instead of crashing.

### Gmail Push Strategy

The backend contains placeholders for production Gmail push sync:

- `POST /api/gmail/watch`
- `POST /api/gmail/webhook`

The intended production design is:

1. Configure Google OAuth consent.
2. Add Gmail read-only scope.
3. Create a Google Pub/Sub topic.
4. Call Gmail `watch` for each connected mailbox.
5. Configure Pub/Sub push delivery to `/api/gmail/webhook`.
6. Use a periodic manual or scheduled sync as recovery for missed messages.

The current `watch` implementation returns setup-oriented status and does not yet complete the full Pub/Sub watch registration.

### PDF Import Flow

```text
User uploads PDF from ImportsPage
  |
  v
POST /api/imports/pdf/preview
  |
  v
PDFService opens PDF with pdfplumber
  |
  v
For each extracted table:
  - normalize headers
  - find date, description, debit, and credit columns
  - parse amount and date
  - infer debit or credit
  - suggest category
  - produce TransactionCreate-shaped data
  |
  v
Frontend receives preview rows
```

Current constraints:

- Only structured, table-based PDFs are supported.
- Scanned PDFs and OCR-only statements are not supported.
- Date parsing supports common formats such as `DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY-MM-DD`, and `DD/MM/YY`.
- The parser currently creates HDFC transactions by default.

### Transaction Flow

Transactions can be read and updated through:

- `GET /api/transactions`
- `PATCH /api/transactions/{transaction_id}`

The list endpoint supports filters such as bank, source, start date, and end date. Results are ordered by transaction date descending and creation date descending.

Updates are scoped by both `transaction_id` and `user_id`, so a user cannot update another user's transaction if authentication is working correctly.

### Analytics Flow

```text
DashboardPage
  |
  v
GET /api/analytics/summary
  |
  v
AnalyticsService.summary()
  |
  +-- total debit
  +-- total credit
  +-- net flow
  +-- category debit breakdown
  +-- monthly debit trend
  +-- top debit merchants
  +-- credit/debit ratio chart points
  |
  v
Dashboard charts and metric cards
```

Analytics filters by:

- user
- bank
- optional start date
- optional end date
- `is_ignored = false`

Analytics currently focuses on debit spending for category, merchant, and trend breakdowns.

### Budget Flow

```text
BudgetsPage
  |
  +-- POST /api/budgets       create or update budget
  |
  `-- GET /api/budgets/status get month status
```

Budget storage normalizes the incoming month to the first day of the month. Budget status calculates actual debit spending for the same category between the first and last day of that month.

Returned status includes:

- category
- month
- budget
- actual
- remaining
- used_percent

## Parser Architecture

Bank email parsing is intentionally isolated under `backend/app/parsers`.

```text
BankEmailParser
  |
  +-- can_parse(text) -> bool
  |
  `-- parse(text, received_date) -> ParsedTransaction

ParserRegistry
  |
  `-- bank name -> parser instance
```

The current parser is `HDFCEmailParser`. It:

- checks for HDFC/UPI-like phrases
- extracts amount using a rupee/INR regex
- extracts merchant from text after `to`
- extracts reference IDs from reference-like phrases
- uses the Gmail received date as the transaction date
- returns debit transactions

To add another bank:

1. Create a parser implementing `BankEmailParser`.
2. Add bank-specific detection in `can_parse`.
3. Return a `ParsedTransaction` from `parse`.
4. Register the parser in `backend/app/parsers/registry.py`.
5. Update frontend bank options if the UI exposes the new bank.
6. Add tests or sample fixtures for realistic bank email formats.

## Category Architecture

`CategoryService` currently uses static keyword matching:

- Food
- Travel
- Bills
- Shopping
- Entertainment
- Health
- Uncategorized fallback

The service receives merchant and optional description text, uppercases the combined string, and returns the first matching category. Because category assignment happens during Gmail and PDF import, changing these rules affects only newly imported transactions unless existing transactions are recategorized separately.

## API Surface

Current backend API groups:

```text
GET  /health

POST /api/auth/dev-login
GET  /api/auth/google/login
GET  /api/auth/google/callback

GET  /api/profile

POST /api/gmail/sync
POST /api/gmail/watch
POST /api/gmail/webhook

POST /api/imports/pdf/preview
POST /api/imports/pdf/confirm

GET  /api/transactions
PATCH /api/transactions/{transaction_id}

GET  /api/analytics/summary

POST /api/budgets
GET  /api/budgets/status
```

When adding a new API:

- Put request and response models in `backend/app/schemas/` when they cross the HTTP boundary.
- Keep the route in `backend/app/api/`.
- Put reusable business logic in `backend/app/services/`.
- Add a function in `frontend/src/api/client.ts` if the frontend needs it.
- Add or update TypeScript types in `frontend/src/types/index.ts`.

## Configuration

Backend configuration comes from `backend/.env`, based on `backend/.env.example`.

Important variables:

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

Frontend configuration comes from `frontend/.env`, based on `frontend/.env.example`.

Important variable:

- `VITE_API_BASE_URL`

Local defaults:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API base URL: `http://localhost:8000/api`
- Health check: `http://localhost:8000/health`

## Deployment Shape

`docker-compose.yml` defines:

- `db` - PostgreSQL 16 Alpine with persistent volume.
- `backend` - FastAPI container built from `backend/Dockerfile`.
- `frontend` - frontend container built from `frontend/Dockerfile`.

In local development, the README starts the database with Docker and runs backend/frontend processes directly. In a fuller production deployment, the backend must also be reachable by Google OAuth callbacks and Pub/Sub push delivery.

## Current Limitations

- Database tables are created on startup. Alembic is installed, but migrations are not yet the primary schema-management path.
- Gmail watch and webhook endpoints exist, but full Pub/Sub watch handling is not implemented yet.
- Gmail parsing is currently HDFC-focused.
- PDF parsing supports structured tables only, not scanned statements.
- Category assignment uses static keyword rules, not learned or user-specific rules.
- The frontend uses local navigation state rather than URL-based routing.

## Developer Extension Checklist

Use this checklist when changing architecture-sensitive behavior:

- Does the backend schema change require an Alembic migration?
- Does a new response shape require updates in both Pydantic schemas and TypeScript types?
- Does a new UI workflow need a typed API client function?
- Does a new import source need deduplication logic?
- Does a new parser have sample messages and failure cases?
- Should analytics or budgets ignore the new data by default?
- Does the feature need new environment variables documented in `.env.example` and this file?
