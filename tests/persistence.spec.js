import { test, expect } from '@playwright/test';
import { openAddForm, markTaskDone } from './setup';

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
    await openAddForm(page);

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
    await openAddForm(page);

    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add tasks
    await titleInput.fill('Task A');
    await button.click();

    await openAddForm(page);
    await titleInput.fill('Task B');
    await button.click();

    // Mark first task as complete
    const expandButtons = page.locator('div[role="button"]');
    await expandButtons.first().click();

    await markTaskDone(page);

    // Both tasks are visible (Task A with strikethrough)
    await expect(page.locator('text=Task A')).toBeVisible();
    await expect(page.locator('text=Task B')).toBeVisible();

    // Reload the page
    await page.reload();

    // Task B should be visible (incomplete)
    await expect(page.locator('text=Task B')).toBeVisible();

    // Task A should still be visible in Today tab (completed today)
    await expect(page.locator('text=Task A')).toBeVisible();

    // Task A should still be marked as complete
    const reloadedTaskA = page.locator('span').filter({ hasText: 'Task A' }).first();
    await expect(reloadedTaskA).toHaveClass(/line-through/);

    // Click on Closed Tasks tab to verify Task A is there too
    const closedTasksTab = page.locator('button:has-text("Closed Tasks")');
    await closedTasksTab.click();

    // Task A should be visible in Closed Tasks
    await expect(page.locator('text=Task A')).toBeVisible();
  });
});
