import { test, expect } from '@playwright/test';

test.describe('Task Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and use localStorage persistence (not memory)
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  test('should persist tasks across page reload', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add a task
    await titleInput.fill('Persistent task');
    await button.click();
    await expect(page.locator('text=Persistent task')).toBeVisible();

    // Reload the page
    await page.reload();

    // Task should still be there after reload
    await expect(page.locator('text=Persistent task')).toBeVisible();
  });

  test('should persist multiple tasks and their state across reload', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add tasks
    await titleInput.fill('Task A');
    await button.click();
    await titleInput.fill('Task B');
    await button.click();

    // Mark first task as complete
    const expandButtons = page.locator('button:has-text("▶")');
    await expandButtons.first().click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Task A is visible with countdown, Task B is incomplete
    await expect(page.locator('text=Task A')).toBeVisible();
    await expect(page.locator('text=Task B')).toBeVisible();

    // Wait for countdown to complete
    await page.waitForTimeout(5500);

    // Task A should now be hidden (toggle is off)
    await expect(page.locator('text=Task A')).not.toBeVisible();
    // Task B should still be visible
    await expect(page.locator('text=Task B')).toBeVisible();

    // Reload the page
    await page.reload();

    // Task B should be visible (incomplete)
    await expect(page.locator('text=Task B')).toBeVisible();

    // Task A should be hidden (completed, hidden by default)
    await expect(page.locator('text=Task A')).not.toBeVisible();

    // Show completed tasks
    const showCompletedButton = page.locator('button:has-text("Show Completed")');
    await showCompletedButton.click();

    // Both tasks should now be visible
    await expect(page.locator('text=Task A')).toBeVisible();
    await expect(page.locator('text=Task B')).toBeVisible();

    // Task A should still be marked as complete
    const reloadedTaskA = page.locator('span').filter({ hasText: 'Task A' }).first();
    await expect(reloadedTaskA).toHaveClass(/line-through/);
  });
});
