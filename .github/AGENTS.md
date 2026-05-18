---
name: "Expense Tracker Development Agents"
description: "Multi-agent workflow for requirements, development, and testing"
---

# 🤖 Expense Tracker Development Agents

This file orchestrates three specialized Copilot agents for building features with Playwright testing.

## 📋 Available Agents

### 1. Requirements Parser Agent
**File**: `.github/agents/requirements-parser.agent.md`

**Use When**: 
- User describes a new feature they want built
- Need to structure requirements into testable criteria
- Creating feature documentation

**Example Prompts**:
- "Users want to be able to categorize transactions - help me define this feature"
- "Create a requirement for bulk transaction import"
- "Define test cases for the budget notification feature"

**Output**:
- Structured requirement file in `docs/requirements/`
- Clear acceptance criteria
- Test scenarios
- Implementation suggestions

---

### 2. Development Agent
**File**: `.github/agents/development-agent.agent.md`

**Use When**:
- Ready to implement a feature
- Need to write backend API or frontend components
- Fixing bugs or making changes to existing code

**Example Prompts**:
- "Implement FEAT-001 from docs/requirements/FEAT-001-transaction-date-filter.md"
- "Add a new API endpoint for batch transaction updates"
- "Create a React component for budget tracking"
- "Fix the authentication flow in the frontend"

**Output**:
- Updated backend code (FastAPI endpoints, models, services)
- Updated frontend code (React components, TypeScript)
- Code follows project patterns and standards
- Changes are tested and working

---

### 3. Testing Agent
**File**: `.github/agents/testing-agent.agent.md`

**Use When**:
- Need to create Playwright tests for a feature
- Running tests and debugging failures
- Creating test fixtures and test data
- Generating test reports

**Example Prompts**:
- "Create Playwright tests for FEAT-001 based on the acceptance criteria"
- "Run the transaction filter tests and show me the results"
- "Debug why the date filter test is failing"
- "Generate E2E tests for the complete authentication flow"

**Output**:
- Test files (`.spec.ts`) in `frontend/tests/e2e/`
- Test execution results and reports
- Screenshots and videos of test failures
- Debugging insights

---

## 🔄 Typical Workflow

```
┌─────────────────────────────────────┐
│  User: "I want users to filter      │
│  transactions by date"              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Requirements Parser Agent           │
│ - Asks clarifying questions         │
│ - Creates requirement file          │
│ - Generates test scenarios          │
└─────────────────────────────────────┘
              ↓
        FEAT-001-transaction-date-filter.md
        ├─ User Story
        ├─ Acceptance Criteria (5 items)
        └─ Test Scenarios (3 types)
              ↓
┌─────────────────────────────────────┐
│ Development Agent                   │
│ - Reads requirement file            │
│ - Implements backend API            │
│ - Creates frontend components       │
│ - Updates database schema           │
└─────────────────────────────────────┘
              ↓
        ✅ Feature implemented
        ├─ Backend: GET /api/transactions?start_date=X&end_date=Y
        ├─ Frontend: DateRangeFilter.tsx component
        └─ Database: Index on created_date
              ↓
┌─────────────────────────────────────┐
│ Testing Agent                       │
│ - Reads requirement file            │
│ - Creates test file (.spec.ts)      │
│ - Runs tests                        │
│ - Reports results                   │
└─────────────────────────────────────┘
              ↓
        ✅ All tests passed
        ├─ 5 tests for acceptance criteria
        ├─ 3 edge case tests
        ├─ HTML report generated
        └─ Screenshots captured
              ↓
┌─────────────────────────────────────┐
│ GitHub Actions CI/CD Pipeline       │
│ - Triggered on git push             │
│ - Runs all tests                    │
│ - Builds Docker images              │
│ - Deploys to production (on main)   │
└─────────────────────────────────────┘
              ↓
        ✅ Feature in Production
```

---

## 🎯 Multi-Agent Conversation Pattern

### Step 1: Parse Requirements (5-10 min)

**You**: "I want users to be able to bulk import transactions from CSV"

**Requirements Parser**:
- ❓ Asks: "What fields should the CSV have?"
- ❓ Asks: "What if there are duplicate transactions?"
- ❓ Asks: "Should users see import progress?"
- ✅ Creates: `docs/requirements/FEAT-002-bulk-csv-import.md`
- ✅ Lists: 5 acceptance criteria
- ✅ Suggests: 3+ test scenarios

### Step 2: Develop Feature (30-60 min)

**You**: "Implement FEAT-002 based on the requirements"

**Development Agent**:
- 📖 Reads: `docs/requirements/FEAT-002-bulk-csv-import.md`
- 🔧 Implements: Backend endpoint for `/api/imports/csv`
- 🎨 Creates: `ImportCSV.tsx` React component
- 📊 Updates: Database schema if needed
- ✅ Tests: Manually verifies feature works
- 📝 Reports: "✅ FEAT-002 implemented and ready for testing"

### Step 3: Create & Run Tests (20-40 min)

**You**: "Create Playwright tests for FEAT-002"

**Testing Agent**:
- 📖 Reads: `docs/requirements/FEAT-002-bulk-csv-import.md`
- 🧪 Creates: `frontend/tests/e2e/bulk-csv-import.spec.ts` with:
  - ✅ Valid CSV upload and verification
  - ✅ Invalid CSV error handling
  - ✅ Duplicate detection
  - ✅ Progress indicator display
  - ✅ Success/error messages
- 🚀 Runs: `npm run test -- bulk-csv-import.spec.ts`
- 📊 Reports: "✅ All 5 tests passed" with screenshots

### Step 4: Deploy (Automatic via CI/CD)

**Push to GitHub**:
```bash
git add .
git commit -m "feat: implement FEAT-002 - bulk CSV import"
git push
```

**GitHub Actions**:
1. ✅ Runs backend linting and checks
2. ✅ Runs frontend TypeScript check
3. ✅ Builds frontend production bundle
4. ✅ Starts PostgreSQL and backend
5. ✅ Runs **ALL Playwright tests** (including FEAT-002)
6. ✅ Generates test reports
7. ✅ Builds Docker images
8. ✅ Deploys to production (on main branch)

---

## 🚀 Commands Reference

### Quick Setup
```bash
# Make scripts executable and install dependencies
./scripts/install-deps.sh

# Start development environment (PostgreSQL + docs about running services)
./scripts/dev-setup.sh
```

### Create New Feature
```bash
# Step 1: Create requirement file
./scripts/new-requirement.sh FEAT-002 "Feature Name"

# Then edit the file to add details
# docs/requirements/FEAT-002-feature-name.md
```

### Test a Feature
```bash
# Run tests for a specific feature
./scripts/test-feature.sh FEAT-001

# Debug mode (step through)
./scripts/test-feature.sh FEAT-001 --debug

# See browser while running
./scripts/test-feature.sh FEAT-001 --headed

# Interactive UI mode
./scripts/test-feature.sh FEAT-001 --ui
```

### Manual Testing
```bash
# Start backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload

# Start frontend (in another terminal)
cd frontend
npm run dev

# Run all Playwright tests
cd frontend
npm run test

# View test report
npm run test:report
```

---

## 💬 Agent Usage Examples

### Example 1: Add Search Feature

```
You: "I want users to search transactions by merchant name with autocomplete suggestions"

Requirements Parser:
- Creates: docs/requirements/FEAT-003-merchant-search.md
- Defines: 6 acceptance criteria
- Suggests: 4 test scenarios

Development Agent:
- Implements: Backend full-text search
- Creates: SearchBox.tsx component with autocomplete
- Updates: API endpoint with /search parameter

Testing Agent:
- Creates: merchant-search.spec.ts
- Tests: Search box visibility, autocomplete, select result
- Reports: ✅ All tests passed
```

### Example 2: Fix Authentication

```
You: "The Google OAuth login is broken, debug it"

Development Agent:
- Identifies: Issue in auth flow
- Checks: Google API credentials
- Fixes: Backend authentication endpoint
- Tests: Manual verification

Testing Agent:
- Runs: Authentication tests
- Identifies: Specific failure point
- Debugs: Step-by-step with screenshots
- Reports: Root cause and fix
```

### Example 3: Performance Optimization

```
You: "The transaction list is slow when there are 10,000 transactions"

Development Agent:
- Adds: Database indexes on created_date, category
- Implements: Pagination in API
- Optimizes: Frontend list rendering

Testing Agent:
- Creates: Performance test with 10,000 transactions
- Verifies: Page loads in < 2 seconds
- Reports: ✅ Performance improved by 4x
```

---

## 📊 Agent Capabilities Matrix

| Capability | Requirements Parser | Development Agent | Testing Agent |
|------------|-------------------|-------------------|---------------|
| Create requirements | ✅ | ❌ | ❌ |
| Implement code | ❌ | ✅ | ❌ |
| Write tests | ⚠️ (suggest) | ❌ | ✅ |
| Run tests | ❌ | ⚠️ (manual) | ✅ |
| Debug failures | ❌ | ✅ | ✅ |
| Take screenshots | ❌ | ❌ | ✅ |
| Generate reports | ⚠️ (outline) | ⚠️ (verify) | ✅ |
| Database changes | ❌ | ✅ | ❌ |
| API design | ⚠️ (suggest) | ✅ | ❌ |

---

## ✅ Best Practices

### For Requirements Parser
✅ Ask clarifying questions before creating requirement
✅ Define clear acceptance criteria (they become tests)
✅ Suggest test scenarios alongside requirements
✅ Link to existing similar features

### For Development Agent
✅ Read requirement file completely before implementing
✅ Follow existing code patterns in the project
✅ Add data-testid attributes for Playwright tests
✅ Test manually before saying "done"
✅ Write clean, documented code

### For Testing Agent
✅ Read acceptance criteria before writing tests
✅ Use data-testid selectors (not fragile selectors)
✅ Test happy path, edge cases, and error handling
✅ Run tests and capture failures
✅ Generate reports with screenshots

---

## 🔗 Related Documentation

- **[COMPLETE_CI_CD_GUIDE.md](COMPLETE_CI_CD_GUIDE.md)** - Detailed step-by-step setup guide
- **[PLAYWRIGHT_SETUP.md](PLAYWRIGHT_SETUP.md)** - Playwright configuration and commands
- **.github/agents/** - Individual agent files
- **.github/workflows/** - GitHub Actions CI/CD pipelines
- **docs/requirements/** - Feature requirement files
- **frontend/tests/e2e/** - Playwright test files
- **scripts/** - Helper scripts for development

---

## 🎓 Tutorial: Build a Complete Feature with Agents

### Phase 1: Requirements (10 min)

```bash
# Create a new requirement
./scripts/new-requirement.sh FEAT-DEMO "Sample Feature"

# Open and edit the requirement file
docs/requirements/FEAT-DEMO-sample-feature.md
```

### Phase 2: Development (30 min)

```
You: "Implement FEAT-DEMO according to the requirements"

Development Agent will:
- Read the requirement file
- Implement backend changes
- Create frontend components
- Verify everything works
```

### Phase 3: Testing (20 min)

```
You: "Create and run Playwright tests for FEAT-DEMO"

Testing Agent will:
- Create test file
- Run tests
- Show results
```

### Phase 4: Deploy (Automatic)

```bash
git add .
git commit -m "feat: implement FEAT-DEMO"
git push
```

**GitHub Actions automatically:**
- Runs all tests
- Builds Docker images
- Deploys to production

---

## 🆘 Troubleshooting

**Q: Agent not responding to my request?**
A: Make sure your prompt mentions the specific feature or file. E.g., "Implement FEAT-001" instead of "implement something"

**Q: Test file was created but not in the right place?**
A: Tests should be in `frontend/tests/e2e/` with `.spec.ts` extension

**Q: How do I know when an agent is done?**
A: Agent will provide a ✅ "Done" message or specific results/reports

**Q: Can I run multiple agents in parallel?**
A: Yes! You can ask: "In parallel, implement FEAT-001 and create tests for FEAT-001"

---

**Ready to build? Start with:**
```bash
./scripts/new-requirement.sh FEAT-001 "Your Feature Name"
```

Then ask the Requirements Parser to help refine the requirement file, Development Agent to implement it, and Testing Agent to create and run tests!
