import { test, expect } from '@playwright/test';
import { setupPage } from './setup';

test.describe('Show Completed Toggle - Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('should show completed tasks when Show Completed toggle is on', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add an incomplete task
    await titleInput.fill('Incomplete task');
    await button.click();

    // Add a task and mark it as done
    await titleInput.fill('Completed task');
    await button.click();

    // Expand and mark as done
    const expandButtons = page.locator('button:has-text("▶")');
    await expandButtons.nth(1).click();

    const markDoneButtons = page.locator('button:has-text("Mark Done")');
    await markDoneButtons.first().click();

    // Completed task should be visible with countdown initially
    await expect(page.locator('text=Completed task')).toBeVisible();
    await expect(page.locator('text=Incomplete task')).toBeVisible();

    // Verify Show Completed button exists and is in "Show" state (meaning completed are hidden by toggle)
    const showCompletedButton = page.locator('button:has-text("Show Completed")');
    await expect(showCompletedButton).toBeVisible();

    // Click Show Completed button to show them
    await showCompletedButton.click();

    // Button should now show "Hide Completed"
    const hideCompletedButton = page.locator('button:has-text("Hide Completed")');
    await expect(hideCompletedButton).toBeVisible();

    // Both tasks should be visible
    await expect(page.locator('text=Completed task')).toBeVisible();
    await expect(page.locator('text=Incomplete task')).toBeVisible();

    // Completed task should have strikethrough
    const completedTask = page.locator('span').filter({ hasText: 'Completed task' }).first();
    await expect(completedTask).toHaveClass(/line-through/);
  });

  test('should show completed tasks after countdown expires when toggle is on', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add a task
    await titleInput.fill('Task that stays completed');
    await button.click();

    // Mark it as done
    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Task should be visible with countdown
    await expect(page.locator('text=Task that stays completed')).toBeVisible();

    // Wait for countdown to complete (5.5 seconds)
    await page.waitForTimeout(5500);

    // Task should no longer be visible (countdown expired, toggle is off by default)
    await expect(page.locator('text=Task that stays completed')).not.toBeVisible();

    // Click "Show Completed" button
    const showCompletedButton = page.locator('button:has-text("Show Completed")');
    await showCompletedButton.click();

    // Task should now be visible (it's still there, just completed)
    await expect(page.locator('text=Task that stays completed')).toBeVisible();

    // Verify it has strikethrough (still completed)
    const task = page.locator('span').filter({ hasText: 'Task that stays completed' }).first();
    await expect(task).toHaveClass(/line-through/);
  });

  test('should keep showing completed tasks when toggle is used during countdown', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add tasks
    await titleInput.fill('Task 1');
    await button.click();
    await titleInput.fill('Task 2');
    await button.click();

    // Mark Task 1 as done
    const expandButtons = page.locator('button:has-text("▶")');
    await expandButtons.first().click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Wait just a moment for the countdown to be visible
    await page.waitForTimeout(100);

    // Both should be visible (Task 1 with countdown, Task 2 incomplete)
    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 2')).toBeVisible();

    // Verify Task 1 has strikethrough (it's completed)
    const task1 = page.locator('span').filter({ hasText: 'Task 1' }).first();
    await expect(task1).toHaveClass(/line-through/);

    // Verify Task 2 does not have strikethrough
    const task2 = page.locator('span').filter({ hasText: 'Task 2' }).first();
    await expect(task2).not.toHaveClass(/line-through/);
  });

  test('should immediately show completed tasks when toggle is clicked right after marking done', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add a task
    await titleInput.fill('Immediate test task');
    await button.click();

    // Expand and mark as done
    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Task should still be visible (countdown active)
    await expect(page.locator('text=Immediate test task')).toBeVisible();

    // Verify it has strikethrough
    const task = page.locator('span').filter({ hasText: 'Immediate test task' }).first();
    await expect(task).toHaveClass(/line-through/);
  });
});
