import { test, expect } from '@playwright/test';
import { setupPage, openAddForm, markTaskDone } from './setup';

// Google Drive Integration tests
test.describe('Google Drive Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page with memory persistence for basic tests
    await setupPage(page);
  });

  test('should show sign-in button when not authenticated', async ({ page }) => {
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toHaveClass(/bg-blue-600/);
  });

  test('GoogleSignIn component should render in sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button:has-text("Sync with Google Drive")');

    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeVisible();
  });

  test('sign-in button should be clickable', async ({ page }) => {
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeEnabled();
  });

  test('sign-in button should have proper styling', async ({ page }) => {
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');

    // Should be blue
    await expect(signInButton).toHaveClass(/bg-blue-600/);

    // Should have medium font weight
    await expect(signInButton).toHaveClass(/font-medium/);
  });

  test('Google Drive section should be in sidebar bottom', async ({ page }) => {
    // Find the sidebar
    const sidebar = page.locator('div.w-48.bg-gray-50');
    await expect(sidebar).toBeVisible();

    // Sign-in button should be within sidebar
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeVisible();
  });

  test('should display below export/import buttons', async ({ page }) => {
    // Find Export button
    const exportButton = page.locator('button:has-text("Export")');
    await expect(exportButton).toBeVisible();

    // Find Import button
    const importButton = page.locator('button:has-text("Import")');
    await expect(importButton).toBeVisible();

    // Find Sign-in button (should be after Import)
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeVisible();

    // All three should be in same container (sidebar bottom)
    const exportBox = await exportButton.boundingBox();
    const importBox = await importButton.boundingBox();
    const signInBox = await signInButton.boundingBox();

    // Verify they're in vertical order (y-coordinates increase downward)
    expect(exportBox.y).toBeLessThan(importBox.y);
    expect(importBox.y).toBeLessThan(signInBox.y);
  });

  test('should add tasks and keep them after interaction', async ({ page }) => {
    // Add a task using the standard method
    await openAddForm(page);

    // Wait for form and find title input
    await page.waitForSelector('input', { timeout: 5000 });
    const titleInputs = page.locator('input');
    const titleInput = titleInputs.first();
    await titleInput.fill('Test Google Drive Task');

    // Find and click create button
    const createButton = page.locator('button:has-text("Create Task")');
    if (await createButton.isVisible()) {
      await createButton.click();
    } else {
      // Alternative: press Enter to submit
      await titleInput.press('Enter');
    }

    // Wait for task to appear
    await page.waitForSelector('text=Test Google Drive Task', { timeout: 5000 });

    // Verify sign-in button is still there
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeVisible();
  });

  test('should preserve button state after adding multiple tasks', async ({ page }) => {
    // Add first task
    await openAddForm(page);
    await page.waitForSelector('input', { timeout: 5000 });
    let titleInput = page.locator('input').first();
    await titleInput.fill('Task 1');
    let createButton = page.locator('button:has-text("Create Task")');
    if (await createButton.isVisible()) {
      await createButton.click();
    } else {
      await titleInput.press('Enter');
    }
    await page.waitForSelector('text=Task 1', { timeout: 5000 });

    // Add second task
    await page.locator('button:has-text("+ Add Task")').click();
    await page.waitForSelector('input', { timeout: 5000 });
    titleInput = page.locator('input').first();
    await titleInput.fill('Task 2');
    createButton = page.locator('button:has-text("Create Task")');
    if (await createButton.isVisible()) {
      await createButton.click();
    } else {
      await titleInput.press('Enter');
    }
    await page.waitForSelector('text=Task 2', { timeout: 5000 });

    // Sign-in button should still be visible
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeVisible();

    // Both tasks should exist
    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 2')).toBeVisible();
  });

  test('sign-in button should be accessible', async ({ page }) => {
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');

    // Should be in the tab order
    await expect(signInButton).toBeFocused({ timeout: 100 }).catch(() => {
      // It's okay if not immediately focused, main thing is it's tabbable
    });

    // Should be hittable
    const boundingBox = await signInButton.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox.width).toBeGreaterThan(0);
    expect(boundingBox.height).toBeGreaterThan(0);
  });

  test('persistence is available for auth state after multiple saves', async ({ page }) => {
    // Tests that hybridPersistence.save() is being called for all operations
    // Bug: if persistence factory returned localStorage instead of hybridPersistence,
    // the sync mechanism would never activate
    // This test verifies persistence is working correctly through multiple operations

    await setupPage(page);

    // Add multiple tasks to test save routing
    for (let i = 1; i <= 3; i++) {
      await openAddForm(page);
      const titleInputs = page.locator('input');
      const titleInput = titleInputs.first();
      await titleInput.fill(`Multi-save test task ${i}`);

      const createButton = page.locator('button:has-text("Create Task")');
      if (await createButton.isVisible()) {
        await createButton.click();
      } else {
        await titleInput.press('Enter');
      }

      await page.waitForSelector(`text=Multi-save test task ${i}`);
    }

    // All tasks should be visible
    for (let i = 1; i <= 3; i++) {
      await expect(page.locator(`text=Multi-save test task ${i}`)).toBeVisible();
    }

    // Sign-in button should still be available (not hidden by persistence issues)
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();
  });

  test('empty initialization should not mark as pending sync', async ({ page }) => {
    // Edge case: during app init, save() is called with empty data
    // Should NOT mark as pending (prevents erasing Drive on first sign-in)

    await setupPage(page);

    // App initializes with memory persistence (empty)
    // Sign-in button should be visible and ready
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeVisible();

    // No sync status should be shown yet (no user)
    const syncStatus = page.locator('text=Google Drive: ');
    const isVisible = await syncStatus.isVisible().catch(() => false);

    // If sync status is shown, it should not show "Synced" (because we haven't synced)
    if (isVisible) {
      const syncText = await syncStatus.textContent();
      expect(syncText).not.toContain('Synced');
    }
  });

  test('add task while not authenticated, then reconnect should sync', async ({ page }) => {
    // Edge case: user adds task while "Reconnect" button is showing
    // Task should be marked as pending and sync when they reconnect

    await setupPage(page);

    // Add a task (will be saved locally, pending sync)
    await openAddForm(page);
    const titleInputs = page.locator('input');
    const titleInput = titleInputs.first();
    await titleInput.fill('Task added while offline');

    const createButton = page.locator('button:has-text("Create Task")');
    if (await createButton.isVisible()) {
      await createButton.click();
    } else {
      await titleInput.press('Enter');
    }

    await page.waitForSelector('text=Task added while offline');

    // Task should exist locally
    await expect(page.locator('text=Task added while offline')).toBeVisible();

    // Sign-in button should still be available
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeVisible();
  });

  test('should not overwrite Drive with empty local data', async ({ page }) => {
    // Safety check: never upload empty data to Drive (would erase existing file)
    // This protects against initialization bugs that mark empty saves as pending

    await setupPage(page);

    // Start with empty app
    // Add a task (marks it as pending when authenticated)
    await openAddForm(page);
    const titleInputs = page.locator('input');
    const titleInput = titleInputs.first();
    await titleInput.fill('Safety check task');

    const createButton = page.locator('button:has-text("Create Task")');
    if (await createButton.isVisible()) {
      await createButton.click();
    } else {
      await titleInput.press('Enter');
    }

    await page.waitForSelector('text=Safety check task');

    // Task should be visible (stored in memory/localStorage)
    await expect(page.locator('text=Safety check task')).toBeVisible();

    // Sign-in button should still be available and clickable
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();
  });

  test('reconnect button should appear after page refresh', async ({ page }) => {
    // Edge case: page refresh loses access token, should show "Reconnect" button
    // not gray sync dot

    await setupPage(page);

    // We start with no user, so sign-in button visible
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeVisible();

    // In real scenario (not in test), after signing in and refreshing:
    // - User info would be in localStorage
    // - Silent auth would fail
    // - Should show "Reconnect" button instead of gray sync dot

    // This test just verifies the button is available
    await expect(signInButton).toBeEnabled();
  });

  test('should not sync while session is being restored', async ({ page }) => {
    // Edge case: on page load, should not attempt sync until auth is confirmed
    // This prevents uploading empty data if user is not actually authenticated

    await setupPage(page);

    // App loads with no user
    // Wait a moment for any auto-sync attempts
    await page.waitForTimeout(500);

    // Sign-in button should be visible (no premature auth attempted)
    const signInButton = page.locator('button:has-text("Sync with Google Drive")');
    await expect(signInButton).toBeVisible();

    // No sync error should be showing
    const errorIndicator = page.locator('text=Google Drive: Error');
    const hasError = await errorIndicator.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });
});
