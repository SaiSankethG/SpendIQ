---
name: "Playwright Testing Guide"
description: "Use this when: writing end-to-end tests, automating browser interactions, testing the expense tracker frontend, or validating user workflows with Playwright"
applyTo: "frontend/**"
---

# Playwright Testing for Expense Tracker

## Quick Commands

### Run E2E Tests
```bash
npx playwright test
npx playwright test --ui  # Interactive UI mode
npx playwright test --headed  # See browser while running
```

### Run Specific Test
```bash
npx playwright test -g "test name pattern"
```

### Update Snapshots
```bash
npx playwright test --update-snapshots
```

## Test Structure

Place tests in `frontend/tests/e2e/`:
```
frontend/
  tests/
    e2e/
      login.spec.ts
      transactions.spec.ts
      budgets.spec.ts
      imports.spec.ts
```

## Configuration

The `playwright.config.ts` should include:
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

## Best Practices

1. **Use data-testid attributes** - Add `data-testid` to components for reliable selection
2. **Wait for navigation** - Use `waitForURL()` instead of fixed delays
3. **Isolate tests** - Each test should be independent
4. **Use fixtures** - Store test data in `frontend/tests/fixtures/`
5. **Mock external APIs** - Use Playwright's route interception
6. **Run in parallel** - Tests run in parallel by default (faster execution)

## Debugging Tests

```bash
# Run with debug UI
npx playwright test --debug

# Use VS Code extension
# Install: Playwright Test for VSCode

# Log page content
console.log(await page.content());

# Take screenshot at any point
await page.screenshot({ path: 'debug.png' });
```

## Common Selectors for Expense Tracker

| Component | Selector |
|-----------|----------|
| Login button | `button:has-text("Login with Google")` |
| Dashboard | `[data-testid="dashboard"]` |
| Transaction list | `.transaction-item` |
| Add transaction | `button:has-text("Add Transaction")` |
| Budget form | `[data-testid="budget-form"]` |
| Import file input | `#file-input` |
