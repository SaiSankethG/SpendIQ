---
description: "Enable Copilot agent to use Playwright for browser testing, automation, and E2E testing of the expense tracker frontend"
---

# Playwright Integration for Copilot

You have access to Playwright browser automation tools for:
- **Frontend Testing**: Test the React/Vite frontend in `frontend/`
- **End-to-End Testing**: Automate complete user workflows
- **Browser Automation**: Control browsers for testing expense tracker functionality
- **API Testing**: Validate backend endpoints through UI interactions

## Available Playwright Capabilities

When working with the frontend, you can:
- Open browser pages and navigate to URLs
- Click elements, fill forms, and interact with the UI
- Take screenshots and capture page state
- Extract and validate page content
- Test responsive behavior across viewports
- Validate Google authentication flows
- Test transaction imports and budget tracking features

## Frontend Structure (Target for Testing)
- `frontend/src/pages/` - Page components (Dashboard, Login, Imports, etc.)
- `frontend/src/components/` - Reusable components
- `frontend/src/api/` - API client integration
- `frontend/index.html` - Main HTML entry point

## Backend Endpoints (Available for Testing)
- **Authentication**: `/api/auth/*` - Google OAuth flows
- **Transactions**: `/api/transactions/*` - CRUD operations
- **Budgets**: `/api/budgets/*` - Budget management
- **Analytics**: `/api/analytics/*` - Spending insights
- **Imports**: `/api/imports/*` - PDF/CSV import functionality

## When to Use Playwright

✅ **Use Playwright for:**
- Testing complete user journeys
- Validating UI state changes
- Testing form submissions and validations
- Capturing visual regressions
- Testing responsive design
- Automating data entry for testing

❌ **Don't use Playwright for:**
- Simple unit tests (use Jest/Vitest)
- Component logic tests (use React Testing Library)
- API-only testing (use curl/fetch directly)
- Performance benchmarking (use dedicated tools)
