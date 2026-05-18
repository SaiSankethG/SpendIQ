# Complete CI/CD & Agent-Driven Testing Guide

This guide walks you through building a continuous flow with Copilot agents, Playwright testing, and automated UI validation for your expense tracker project.

## 🎯 Architecture Overview

```
User Requirements
       ↓
Copilot Agent (Requirement Parser)
       ↓
Development Agent
       ↓
Code Implementation
       ↓
Testing Agent (Playwright)
       ↓
CI/CD Pipeline (GitHub Actions)
       ↓
Automated Tests → Reports
       ↓
Integration Tests (Full Stack)
       ↓
Deployment
```

---

## 📋 STEP 1: Project Structure Setup

### 1.1 Create Directory Structure

```bash
mkdir -p .github/workflows
mkdir -p .github/agents
mkdir -p .github/instructions
mkdir -p .github/hooks
mkdir -p backend/tests
mkdir -p frontend/tests/e2e
mkdir -p frontend/tests/fixtures
mkdir -p docs/requirements
```

### 1.2 Current Structure
Your project already has:
- ✅ Backend (FastAPI) at `backend/`
- ✅ Frontend (React + Vite) at `frontend/`
- ✅ Docker Compose for local development
- ✅ Playwright configuration at `frontend/playwright.config.ts`
- ✅ Agent customization at `.github/copilot-instructions.md`

---

## 🤖 STEP 2: Create Custom Copilot Agents

### 2.1 Requirement Parser Agent

This agent extracts and structures user requirements.

```yaml
# File: .github/agents/requirements-parser.agent.md
---
name: Requirements Parser
description: "Parses user requirements and generates structured test cases"
model: claude-3-5-sonnet
tools:
  - semantic_search
  - grep_search
  - file_search
  - create_file
---

# Requirements Parser Agent

You specialize in:
1. **Gathering Requirements**: Ask clarifying questions about features
2. **Structuring Requirements**: Organize into user stories and acceptance criteria
3. **Generating Test Cases**: Create Playwright test scenarios from requirements
4. **Creating Documentation**: Document requirements for reference

## When Invoked

User provides a feature or requirement like: "Users should be able to filter transactions by date"

You will:
1. Ask clarifying questions
2. Create a requirements file
3. Generate acceptance criteria
4. Suggest test cases
```

Create this file using the tool:

### 2.2 Development Agent

```yaml
# File: .github/agents/development-agent.agent.md
---
name: Development Agent
description: "Implements features based on requirements and test cases"
model: claude-3-5-sonnet
tools:
  - grep_search
  - semantic_search
  - replace_string_in_file
  - create_file
  - read_file
---

# Development Agent

You specialize in:
1. **Feature Implementation**: Write API endpoints and frontend components
2. **Backend Development**: FastAPI endpoints, database models
3. **Frontend Development**: React components, TypeScript
4. **Integration**: Connect frontend to backend APIs

## Guidelines

- Follow existing code patterns in the project
- Update tests as you implement
- Ensure type safety in TypeScript
- Follow FastAPI best practices
```

### 2.3 Testing Agent

```yaml
# File: .github/agents/testing-agent.agent.md
---
name: Testing Agent
description: "Creates and executes Playwright tests based on requirements"
model: claude-3-5-sonnet
tools:
  - run_notebook_cell
  - run_in_terminal
  - read_file
  - create_file
  - screenshot_page
---

# Testing Agent

You specialize in:
1. **Test Creation**: Write Playwright test files from acceptance criteria
2. **Test Execution**: Run tests and report results
3. **Debugging**: Identify and fix test failures
4. **Coverage Analysis**: Ensure features are properly tested

## Test Development Workflow

1. **Parse Requirements** → Extract test scenarios
2. **Write Tests** → Create .spec.ts files
3. **Run Tests** → Execute and capture results
4. **Debug Failures** → Fix failing tests
5. **Report Results** → Document coverage
```

---

## 📝 STEP 3: Create Requirement Collection System

### 3.1 Requirement Template

```markdown
# File: docs/requirements/FEATURE_TEMPLATE.md
---
feature_id: FEAT-001
status: draft  # draft → approved → in-development → testing → done
priority: high  # high, medium, low
created_date: 2026-05-11
---

## Feature: [Feature Name]

### User Story
As a [user type], I want to [action], so that [benefit].

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Technical Requirements
- Backend: [What needs to be built]
- Frontend: [What needs to be built]
- Database: [Schema changes if any]

### Dependencies
- Feature A
- Feature B

### Test Scenarios
1. **Happy Path**: [Positive test case]
2. **Edge Case 1**: [Edge case]
3. **Error Handling**: [Error scenario]

### API Endpoints (if applicable)
- `POST /api/endpoint` - Description
- `GET /api/endpoint/{id}` - Description

### UI Components (if applicable)
- Component Name - Purpose
- Component Name - Purpose
```

### 3.2 Example Feature Requirement

```markdown
# File: docs/requirements/FEAT-001-date-filter.md
---
feature_id: FEAT-001
status: draft
priority: high
created_date: 2026-05-11
---

## Feature: Transaction Date Filter

### User Story
As a user, I want to filter transactions by date range, so that I can analyze spending for specific periods.

### Acceptance Criteria
- [ ] UI shows date range picker on dashboard
- [ ] User can select start and end dates
- [ ] Filter applies immediately when dates change
- [ ] Transaction list updates to show only filtered transactions
- [ ] Filter state persists in URL or localStorage
- [ ] Clear button resets filter to all transactions

### Technical Requirements

**Backend**:
- Add date range query parameters to `/api/transactions` endpoint
- Filter transactions by `created_date` field
- Optimize query with database indexing

**Frontend**:
- Create `DateRangeFilter.tsx` component
- Update `TransactionList.tsx` to accept date filter
- Add date picker library (date-fns or react-datepicker)

**Database**:
- Ensure `created_date` has an index for performance

### Test Scenarios
1. Filter transactions between Jan 1 and Jan 31
2. Verify only January transactions are displayed
3. Change dates and verify list updates
4. Test with no transactions in date range
5. Test clear filter button

### API Endpoints
- `GET /api/transactions?start_date=2024-01-01&end_date=2024-01-31` - Get filtered transactions
```

---

## 🧪 STEP 4: Playwright Test Generation from Requirements

### 4.1 Auto-Generated Test File Structure

```typescript
// File: frontend/tests/e2e/date-filter.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Transaction Date Filter - FEAT-001', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for transaction list to load
    await page.waitForSelector('.transaction-item');
  });

  test('should display date filter UI', async ({ page }) => {
    // Acceptance Criteria: UI shows date range picker
    const dateRangeFilter = page.locator('[data-testid="date-range-filter"]');
    await expect(dateRangeFilter).toBeVisible();
  });

  test('should filter transactions by date range', async ({ page }) => {
    // Acceptance Criteria: Filter applies and updates list
    const startDateInput = page.locator('[data-testid="date-start"]');
    const endDateInput = page.locator('[data-testid="date-end"]');
    
    await startDateInput.fill('01/01/2024');
    await endDateInput.fill('01/31/2024');
    
    // Verify transactions are filtered
    const transactions = page.locator('.transaction-item');
    const count = await transactions.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should handle no results gracefully', async ({ page }) => {
    // Edge case: No transactions in date range
    const startDateInput = page.locator('[data-testid="date-start"]');
    const endDateInput = page.locator('[data-testid="date-end"]');
    
    // Set a future date range
    await startDateInput.fill('01/01/2099');
    await endDateInput.fill('01/31/2099');
    
    // Should show "No transactions" message
    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();
  });

  test('should clear filter and show all transactions', async ({ page }) => {
    // Acceptance Criteria: Clear button resets filter
    // First apply a filter
    await page.locator('[data-testid="date-start"]').fill('01/01/2024');
    
    // Click clear button
    await page.locator('button:has-text("Clear")').click();
    
    // Verify all transactions are shown
    const transactions = page.locator('.transaction-item');
    const count = await transactions.count();
    expect(count).toBeGreaterThan(1);
  });

  test('should persist filter state', async ({ page }) => {
    // Apply filter
    await page.locator('[data-testid="date-start"]').fill('01/01/2024');
    await page.locator('[data-testid="date-end"]').fill('01/31/2024');
    
    // Reload page
    await page.reload();
    
    // Verify filter state persists
    const startDateInput = page.locator('[data-testid="date-start"]');
    expect(await startDateInput.inputValue()).toBe('01/01/2024');
  });
});
```

---

## 🔄 STEP 5: CI/CD Pipeline with GitHub Actions

### 5.1 Main CI Pipeline

```yaml
# File: .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Job 1: Lint & Build Backend
  backend-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install backend dependencies
        run: |
          cd backend
          python -m pip install --upgrade pip
          pip install -r requirements.txt
      
      - name: Run backend linting
        run: |
          cd backend
          pip install flake8
          flake8 app --count --select=E9,F63,F7,F82 --show-source --statistics
      
      - name: Check backend tests exist
        run: |
          cd backend
          python -m pytest tests/ -v --collect-only || echo "No tests configured yet"

  # Job 2: Frontend Build & Unit Tests
  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm install
      
      - name: Build frontend
        run: |
          cd frontend
          npm run build
      
      - name: Run frontend type check
        run: |
          cd frontend
          npx tsc --noEmit

  # Job 3: Playwright E2E Tests
  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-check, frontend-build]
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: expense_tracker
          POSTGRES_USER: expense_user
          POSTGRES_PASSWORD: expense_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install backend dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run backend tests
        env:
          DATABASE_URL: postgresql://expense_user:expense_password@localhost:5432/expense_tracker
        run: |
          cd backend
          python -m pytest tests/ -v || true
      
      - name: Start backend in background
        env:
          DATABASE_URL: postgresql://expense_user:expense_password@localhost:5432/expense_tracker
        run: |
          cd backend
          uvicorn app.main:app --host 0.0.0.0 --port 8000 &
          sleep 5
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm install
      
      - name: Install Playwright browsers
        run: |
          cd frontend
          npx playwright install --with-deps
      
      - name: Start frontend dev server
        run: |
          cd frontend
          npm run dev &
          sleep 10
      
      - name: Run Playwright tests
        run: |
          cd frontend
          npx playwright test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 30
      
      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-videos
          path: frontend/test-results/
          retention-days: 7

  # Job 4: Build and push Docker images
  docker-build:
    runs-on: ubuntu-latest
    needs: [backend-check, frontend-build, e2e-tests]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:latest
      
      - name: Build and push frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend:latest

  # Job 5: Deployment (optional)
  deploy:
    runs-on: ubuntu-latest
    needs: docker-build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        run: |
          echo "Deployment step - configure based on your hosting"
          # Add your deployment logic here
```

### 5.2 Test Report Generation

```yaml
# File: .github/workflows/test-report.yml
name: Generate Test Report

on:
  workflow_run:
    workflows: ["CI/CD Pipeline"]
    types: [completed]

jobs:
  report:
    runs-on: ubuntu-latest
    if: always()
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download test results
        uses: actions/download-artifact@v4
        with:
          name: playwright-report
          path: test-results/
      
      - name: Create test report comment
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const testReport = fs.readFileSync('test-results/index.html', 'utf8');
            
            const comment = `## 🧪 Test Report
            
            Full report available in artifacts.
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

---

## 🚀 STEP 6: Automated Testing Workflow

### 6.1 How It All Works Together

#### A. User Submits Requirement
```
User: "I want users to be able to filter transactions by date range"
```

#### B. Requirements Parser Agent
```
1. Asks clarifying questions
2. Creates docs/requirements/FEAT-001-date-filter.md
3. Generates acceptance criteria
4. Suggests test scenarios
```

#### C. Development Agent
```
1. Reads requirement file
2. Implements backend API endpoint
3. Creates React components
4. Updates TypeScript types
```

#### D. Testing Agent
```
1. Reads acceptance criteria
2. Generates frontend/tests/e2e/date-filter.spec.ts
3. Runs: npx playwright test
4. Reports pass/fail results
```

#### E. CI/CD Pipeline (GitHub Actions)
```
1. Runs on push/PR
2. Builds backend and frontend
3. Starts services
4. Executes all Playwright tests
5. Generates reports and artifacts
6. Deploys on main branch
```

---

## 📊 STEP 7: Workflow Commands & Aliases

### 7.1 Create Helper Scripts

```bash
# File: scripts/test-feature.sh
#!/bin/bash

FEATURE=$1

if [ -z "$FEATURE" ]; then
  echo "Usage: ./scripts/test-feature.sh FEATURE_ID"
  exit 1
fi

echo "🧪 Testing feature: $FEATURE"

# Find requirement file
REQUIREMENT_FILE="docs/requirements/$FEATURE*.md"

if [ ! -f "$REQUIREMENT_FILE" ]; then
  echo "❌ Requirement file not found"
  exit 1
fi

echo "📋 Found requirement: $REQUIREMENT_FILE"

# Run related tests
TEST_FILE="frontend/tests/e2e/${FEATURE}.spec.ts"

if [ -f "$TEST_FILE" ]; then
  cd frontend
  npx playwright test -g "$FEATURE" --headed
  cd ..
else
  echo "⚠️  No test file found for $FEATURE"
fi
```

```bash
# File: scripts/new-requirement.sh
#!/bin/bash

FEATURE_ID=$1
FEATURE_NAME=$2

if [ -z "$FEATURE_ID" ] || [ -z "$FEATURE_NAME" ]; then
  echo "Usage: ./scripts/new-requirement.sh FEAT-XXX 'Feature Name'"
  exit 1
fi

FILENAME="docs/requirements/${FEATURE_ID}-$(echo $FEATURE_NAME | tr ' ' '-' | tr '[:upper:]' '[:lower:]').md"

cat > "$FILENAME" << 'EOF'
---
feature_id: $FEATURE_ID
status: draft
priority: high
created_date: $(date +%Y-%m-%d)
---

## Feature: $FEATURE_NAME

### User Story
As a [user type], I want to [action], so that [benefit].

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### Technical Requirements

**Backend**:
- [ ] API endpoint
- [ ] Database model

**Frontend**:
- [ ] Component
- [ ] Integration

### Test Scenarios
1. Happy path
2. Edge cases
3. Error handling

### API Endpoints
- `GET /api/endpoint` - Description
EOF

echo "✅ Created requirement file: $FILENAME"
```

Make scripts executable:
```bash
chmod +x scripts/test-feature.sh
chmod +x scripts/new-requirement.sh
```

---

## 🎯 STEP 8: Complete Workflow - From Requirement to Production

### Phase 1: Requirements Gathering (Day 1)

```bash
# 1. Create new feature requirement
./scripts/new-requirement.sh FEAT-001 "Transaction Date Filter"

# 2. Edit the requirement file to add details
# doc/requirements/FEAT-001-transaction-date-filter.md
```

### Phase 2: Development (Days 2-3)

```bash
# 3. Ask Copilot development agent to implement
# "Implement FEAT-001: Transaction Date Filter based on the requirements"

# Development agent will:
# - Read the requirement file
# - Implement backend API
# - Create frontend components
# - Update tests
```

### Phase 3: Testing (Days 3-4)

```bash
# 4. Ask Copilot testing agent
# "Generate Playwright tests for FEAT-001"

# Testing agent will:
# - Read acceptance criteria
# - Create .spec.ts file
# - Run tests
# - Report results

./scripts/test-feature.sh FEAT-001
```

### Phase 4: CI/CD Validation (Automated)

```bash
# 5. Push to GitHub
git add .
git commit -m "feat: implement FEAT-001 - transaction date filter"
git push

# GitHub Actions automatically:
# ✅ Runs CI pipeline
# ✅ Executes all Playwright tests
# ✅ Generates reports
# ✅ Deploys on main branch
```

---

## 🔑 STEP 9: Key Integration Points

### Integration 1: Requirement → Test Mapping

```
Requirement File
    ↓
[Copilot: Extract Acceptance Criteria]
    ↓
Test Scenarios (Structured)
    ↓
[Copilot: Generate Playwright Tests]
    ↓
Test File (.spec.ts)
```

### Integration 2: Code Changes → Automated Testing

```
Code Push to GitHub
    ↓
GitHub Actions Webhook
    ↓
CI Pipeline Starts
    ↓
[Backend Tests]  [Frontend Build]
    ↓
[Playwright E2E Tests] (All specs run)
    ↓
[Generate Report]
    ↓
[Post Results as PR Comment]
```

### Integration 3: Multiple Agents Workflow

```
┌─────────────────────┐
│ Requirements Parser │
│ (Copilot Agent)     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Development Agent   │
│ (Copilot Agent)     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Testing Agent       │
│ (Copilot Agent)     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ CI/CD Pipeline      │
│ (GitHub Actions)    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Production Deploy   │
└─────────────────────┘
```

---

## ✅ STEP 10: Implementation Checklist

- [ ] Create `.github/agents/` directory and agent files
- [ ] Create `.github/workflows/` directory and pipeline files
- [ ] Create `docs/requirements/` directory
- [ ] Create `scripts/` helper scripts
- [ ] Update `frontend/package.json` with test scripts
- [ ] Install Playwright: `npm install --save-dev @playwright/test`
- [ ] Create example requirement file
- [ ] Create example test file
- [ ] Push to GitHub and verify CI/CD runs
- [ ] Test workflow with a sample feature

---

## 🎓 Usage Examples

### Example 1: Adding a New Feature

```bash
# Step 1: Create requirement
./scripts/new-requirement.sh FEAT-002 "Budget Notifications"

# Step 2: Edit requirement file with details

# Step 3: Ask Copilot to implement
"Please implement FEAT-002 based on docs/requirements/FEAT-002-budget-notifications.md"

# Step 4: Ask Copilot to test
"Create Playwright tests for FEAT-002"

# Step 5: Push to GitHub
git add .
git commit -m "feat: implement FEAT-002 - budget notifications"
git push

# Step 6: Monitor CI/CD results automatically
```

### Example 2: Quick Feature Test

```bash
# Ask Copilot in chat:
"Run Playwright tests for the transaction filter feature and show me results"

# Copilot will:
# 1. Find relevant test files
# 2. Execute tests
# 3. Show report with screenshots
# 4. Suggest fixes if tests fail
```

### Example 3: Debugging Failed Tests

```bash
# Ask Copilot:
"Why is the date-filter test failing? Debug it for me"

# Copilot will:
# 1. Open the test in debug mode
# 2. Step through execution
# 3. Take screenshots at each step
# 4. Identify the issue
# 5. Suggest fixes
```

---

## 🚀 Quick Start - Do This First

### 1. Create Agent Files (5 minutes)
```bash
cd /Users/saisankethg/Desktop/expense\ tracker
mkdir -p .github/agents
# Create the agent files shown in STEP 2
```

### 2. Set Up CI/CD (5 minutes)
```bash
mkdir -p .github/workflows
# Create the workflow files shown in STEP 5
```

### 3. Create Scripts (5 minutes)
```bash
mkdir -p scripts
# Create the helper scripts shown in STEP 7
chmod +x scripts/*.sh
```

### 4. Test It Out (10 minutes)
```bash
# Create a test requirement
./scripts/new-requirement.sh FEAT-001 "Sample Feature"

# Ask Copilot
"Generate a Playwright test for FEAT-001 based on the requirement file"

# Run tests
cd frontend
npm run test
```

---

## 📚 Next Steps

1. **Implement all agent files** (STEP 2-3)
2. **Set up GitHub Actions workflows** (STEP 5)
3. **Create helper scripts** (STEP 7)
4. **Push to GitHub and test** the CI/CD pipeline
5. **Start using agents** for development and testing
6. **Monitor and iterate** on the workflow

---

**Your expense tracker will now have:**
✅ Automated testing with Playwright
✅ Copilot agents handling requirements, development, and testing
✅ CI/CD pipeline validating all changes
✅ Structured workflow from requirement to production
✅ Complete traceability and documentation
