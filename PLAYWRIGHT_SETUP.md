# Playwright Integration with Copilot Agent

This document explains how to use Playwright with the Copilot agent for browser automation, testing, and validation of the expense tracker application.

## 📋 Setup Overview

The integration includes:
- **MCP Server Configuration**: Playwright exposed as a Model Context Protocol server
- **Agent Customization**: Instructions for the Copilot agent to understand Playwright capabilities
- **Test Framework**: Playwright configuration and example tests
- **Package Dependencies**: Playwright test runner and related tools

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This installs `@playwright/test` and configures Playwright for the project.

### 2. Start the Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 3. Run Tests via Copilot

Ask the agent:
- "Run Playwright tests for the frontend"
- "Test the login flow with Playwright"
- "Automate a transaction import test"
- "Validate the budget page UI"

## 📁 Project Structure

```
frontend/
├── playwright.config.ts          # Playwright configuration
├── tests/
│   ├── e2e/
│   │   ├── smoke.spec.ts        # Basic smoke tests
│   │   └── features.spec.ts     # Feature-specific tests
│   └── fixtures/                # Test data and fixtures
├── package.json                 # Updated with Playwright dependency
└── ...
```

```
.github/
├── mcp-servers/
│   └── playwright.json          # MCP server config
├── copilot-instructions.md      # Agent customization
└── instructions/
    └── playwright-testing.instructions.md  # Testing guide
```

## 💻 Available Commands

### Run Tests
```bash
npm run test                 # Run all tests
npm run test:ui            # Interactive UI mode
npm run test:headed        # See browser while running
npm run test:debug         # Debug mode with step-through
npm run test:report        # View test report
```

### Filter Tests
```bash
npm run test -- -g "smoke"          # Run tests matching pattern
npm run test -- --project=chromium  # Run on specific browser
```

## 🎯 What the Agent Can Do

### 1. **Browser Automation**
```
"Automate clicking the login button and take a screenshot"
"Fill out the transaction form and submit it"
"Navigate through all pages of the app"
```

### 2. **Functional Testing**
```
"Test if the transaction import works with a CSV file"
"Verify the budget creation flow"
"Validate that filters work on the transaction list"
```

### 3. **E2E Test Creation**
```
"Create a Playwright test for the complete login flow"
"Write a test that imports a transaction and verifies it appears"
"Generate a test suite for the budgets feature"
```

### 4. **Visual Validation**
```
"Take screenshots of all pages in mobile view"
"Check if the app is responsive at 375px width"
"Compare layouts between desktop and mobile"
```

### 5. **Regression Testing**
```
"Run all tests and report failures"
"Create snapshots for visual regression testing"
"Test authentication flow across different browsers"
```

## 🔧 How to Use with Copilot

### Example 1: Test the Dashboard
```
You: "Test if the dashboard loads correctly with Playwright"

Copilot will:
1. Open the page at http://localhost:5173
2. Check for main content
3. Take screenshots
4. Report results
```

### Example 2: Create an E2E Test
```
You: "Write a Playwright test for the transaction import feature"

Copilot will:
1. Create a test file in tests/e2e/
2. Set up the test structure
3. Add steps to upload and verify import
4. Make it ready to run
```

### Example 3: Debug a Feature
```
You: "Use Playwright to debug why the login isn't working"

Copilot will:
1. Open the page
2. Attempt login
3. Capture network activity
4. Take screenshots at each step
5. Report what's happening
```

## 🌐 Multi-Browser Testing

The configuration tests across:
- **Desktop**: Chromium, Firefox, WebKit (Safari)
- **Mobile**: Pixel 5 (Chrome), iPhone 12 (Safari)

To test on a specific browser:
```bash
npm run test -- --project=firefox
npm run test -- --project="Mobile Chrome"
```

## 📊 Test Reports

After running tests, view reports with:
```bash
npm run test:report
```

Reports include:
- ✅ Passed/Failed test breakdown
- 📸 Screenshots of failures
- 🎬 Video recordings (if enabled)
- 📝 Test traces for debugging

## 🔍 Debugging Tips

1. **Run with UI Mode** (Recommended for development):
   ```bash
   npm run test:ui
   ```
   Opens an interactive UI where you can:
   - Run individual tests
   - Step through each action
   - Inspect page state
   - View network activity

2. **Debug Specific Test**:
   ```bash
   npm run test:debug -- tests/e2e/smoke.spec.ts
   ```

3. **View Full Page Content**:
   The agent can extract and analyze page HTML, CSS, and JavaScript state.

## 🛠️ Customization

### Add Test Data
Place fixture files in `frontend/tests/fixtures/`:
- CSV files for import tests
- JSON data for mocking responses
- Images for upload tests

### Extend Configuration
Edit `frontend/playwright.config.ts` to:
- Add more browsers/devices
- Change timeouts
- Configure custom reporters
- Add environment variables

### Create Custom Matchers
The agent can help you create custom assertions for your app's specific needs.

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase `timeout` in playwright.config.ts |
| Port 5173 in use | Kill existing dev server or change port |
| Element not found | Check selectors match actual UI elements |
| Auth fails in tests | Mock authentication or use test credentials |
| Screenshots are blank | Ensure app is running and accessible |

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Selector Guide](https://playwright.dev/docs/locators)
- [Best Practices](https://playwright.dev/docs/best-practices)

## 🤖 Copilot Integration Features

The agent can:
- ✅ Write and update tests
- ✅ Run tests and interpret results
- ✅ Take screenshots and analyze UI
- ✅ Navigate complex workflows
- ✅ Debug test failures
- ✅ Generate test reports
- ✅ Create test fixtures
- ✅ Validate API responses through UI

## 🎓 Next Steps

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Ask Copilot to run tests or automate workflows
4. Review test reports and results
5. Extend tests for your specific needs

---

**Happy Testing! 🎉**

Use `/help playwright` in Copilot chat to get quick references while working.
