# ⚡ Quick Start Guide - 5 Minutes

Get your Copilot agents and Playwright testing up and running in 5 minutes!

## Step 1: Install Dependencies (2 minutes)

```bash
cd /Users/saisankethg/Desktop/expense\ tracker

# Make scripts executable and install everything
./scripts/install-deps.sh
```

This installs:
- ✅ Python dependencies (FastAPI, SQLAlchemy, etc.)
- ✅ Node dependencies (React, Vite, Playwright, etc.)
- ✅ Playwright browsers (Chrome, Firefox, Safari)

## Step 2: Start Development (1 minute)

```bash
# In Terminal 1 - Start database and show instructions
./scripts/dev-setup.sh
```

Output will show commands to run in separate terminals:

```bash
# In Terminal 2 - Start Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

```bash
# In Terminal 3 - Start Frontend
cd frontend
npm run dev
```

Now you have:
- ✅ PostgreSQL running (port 5432)
- ✅ Backend API running (http://localhost:8000)
- ✅ Frontend running (http://localhost:5173)
- ✅ API docs (http://localhost:8000/docs)

## Step 3: Create Your First Feature (2 minutes)

```bash
# Create a new requirement file
./scripts/new-requirement.sh FEAT-001 "Transaction Date Filter"

# Edit it if you want (optional)
# docs/requirements/FEAT-001-transaction-date-filter.md
```

## Step 4: Use the Agents!

### Ask the Requirements Parser:
```
"Help me refine FEAT-001 - Transaction Date Filter"
```

### Ask the Development Agent:
```
"Implement FEAT-001 based on docs/requirements/FEAT-001-transaction-date-filter.md"
```

### Ask the Testing Agent:
```
"Create and run Playwright tests for FEAT-001"
```

## Step 5: See Everything Work Together

```bash
# Run tests for your feature
./scripts/test-feature.sh FEAT-001

# Watch the tests run and see results
# ✅ All tests passed!
```

## 🎯 That's It!

You now have:
- ✅ 3 Copilot Agents (Requirements, Development, Testing)
- ✅ Playwright testing framework
- ✅ CI/CD pipeline ready (GitHub Actions)
- ✅ Example feature to work with
- ✅ Helper scripts for common tasks

---

## 📚 What's Running?

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:5173 | ✅ Running |
| Backend | http://localhost:8000 | ✅ Running |
| API Docs | http://localhost:8000/docs | ✅ Available |
| Database | localhost:5432 | ✅ Running (Docker) |
| Playwright | - | ✅ Installed & Ready |

---

## 🤖 Agent Commands

### Create Requirements
```bash
./scripts/new-requirement.sh FEAT-002 "Budget Notifications"
```

### Test a Feature
```bash
./scripts/test-feature.sh FEAT-001           # Run tests
./scripts/test-feature.sh FEAT-001 --debug   # Debug mode
./scripts/test-feature.sh FEAT-001 --headed  # See browser
./scripts/test-feature.sh FEAT-001 --ui      # Interactive UI
```

### View Test Reports
```bash
cd frontend
npm run test:report
```

---

## 💬 Try These Prompts

### Prompt 1: Requirements
```
"Create a feature for users to set spending alerts when they exceed budget limits"
```

### Prompt 2: Implementation
```
"Implement the budget alert feature based on the requirements"
```

### Prompt 3: Testing
```
"Write Playwright tests for the budget alert feature"
```

---

## 🆘 Troubleshooting

**Port 5173 already in use?**
```bash
# Kill the process
lsof -ti:5173 | xargs kill -9
npm run dev
```

**Port 8000 already in use?**
```bash
# Kill the process
lsof -ti:8000 | xargs kill -9
uvicorn app.main:app --reload
```

**Database not connecting?**
```bash
# Restart Docker services
docker compose down
docker compose up -d db
```

**Playwright tests not running?**
```bash
cd frontend
npx playwright install --with-deps
npm run test
```

---

## 📖 Next Steps

1. ✅ Follow steps 1-5 above
2. 📖 Read [COMPLETE_CI_CD_GUIDE.md](COMPLETE_CI_CD_GUIDE.md) for detailed setup
3. 📖 Read [.github/AGENTS.md](.github/AGENTS.md) for agent workflows
4. 🚀 Start building features with the agents!
5. 📤 Push to GitHub to trigger CI/CD pipeline

---

**You're ready! Start with:**
```bash
./scripts/new-requirement.sh FEAT-DEMO "My First Feature"
```

Then ask a Copilot agent to help you!
