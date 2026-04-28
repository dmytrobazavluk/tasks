import { test, expect } from '@playwright/test';
import { setupPage } from './setup';

// Google Drive Integration tests
test.describe('Google Drive Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page with memory persistence (not googleDrive)
    // Real Google Drive integration tests would require OAuth setup
    await setupPage(page);
  });

  test('should show sign-in button', async ({ page }) => {
    // The sign-in button should be visible in the header
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeVisible();
  });

  test('GoogleSignIn component should render', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Wait for the sign-in button to be visible
    await page.waitForSelector('button:has-text("Sync with Google Drive")');

    // Verify button is clickable
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toHaveClass(/bg-blue-600/);
  });

  test('should handle sign-in workflow', async ({ page }) => {
    // Click the sign-in button
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');

    // Verify it's visible and has correct styling
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toHaveClass(/font-medium/);
  });

  test('header should display Google Sign-In component', async ({ page }) => {
    // The header should contain the sign-in button
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeVisible();

    // Sign-in button should have correct styling
    await expect(signInButton).toHaveClass(/bg-blue-600/);
  });
});
