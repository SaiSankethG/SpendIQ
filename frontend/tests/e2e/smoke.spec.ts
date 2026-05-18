import { test, expect } from '@playwright/test';

test.describe('Authentication & Navigation', () => {
  test('should display login page on initial load', async ({ page }) => {
    await page.goto('/');
    
    // Check for login button
    const loginButton = page.locator('button:has-text("Login")');
    await expect(loginButton).toBeVisible({ timeout: 5000 });
  });

  test('should have proper page title', async ({ page }) => {
    await page.goto('/');
    
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should navigate to different pages', async ({ page }) => {
    await page.goto('/');
    
    // This test demonstrates navigation patterns
    // Add specific navigation tests based on your app structure
    const currentUrl = page.url();
    expect(currentUrl).toContain('localhost');
  });
});

test.describe('UI Components', () => {
  test('should render main layout components', async ({ page }) => {
    await page.goto('/');
    
    // Check if main container exists
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });

  test('should have responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const mainContent = page.locator('body');
    await expect(mainContent).toBeVisible();
  });
});
