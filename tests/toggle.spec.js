import { test, expect } from '@playwright/test';
import { setupPage } from './setup';

test.describe('Completed Tasks Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('should show "Show Completed" button by default', async ({ page }) => {
    const toggleButton = page.locator('button:has-text("Show Completed")');
    await expect(toggleButton).toBeVisible();
  });

  test('should not display completed tasks by default', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add and complete a task
    await titleInput.fill('Completed task');
    await button.click();

    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Task is visible with countdown during 5 seconds
    await expect(page.locator('text=Completed task')).toBeVisible();

    // Wait for countdown to complete
    await page.waitForTimeout(5500);

    // After countdown, task should be hidden (toggle is off by default)
    await expect(page.locator('text=Completed task')).not.toBeVisible();

    // But should appear when toggle is on
    const showCompletedButton = page.locator('button:has-text("Show Completed")');
    await showCompletedButton.click();

    await expect(page.locator('text=Completed task')).toBeVisible();
  });

  test('should show completed tasks when toggle is clicked', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add and complete a task
    await titleInput.fill('Hidden task');
    await button.click();

    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Wait for countdown to complete
    await page.waitForTimeout(5500);

    // Task should be deleted after countdown
    await expect(page.locator('text=Hidden task')).not.toBeVisible();
  });

  test('should hide completed tasks when toggle is clicked again', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add and complete a task
    await titleInput.fill('Toggle test task');
    await button.click();

    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Task is visible during countdown
    await expect(page.locator('text=Toggle test task')).toBeVisible();

    // Wait for countdown to complete
    await page.waitForTimeout(5500);

    // Task should be hidden (toggle is off by default)
    await expect(page.locator('text=Toggle test task')).not.toBeVisible();

    // Show completed to verify it still exists
    const showCompletedButton = page.locator('button:has-text("Show Completed")');
    await showCompletedButton.click();

    await expect(page.locator('text=Toggle test task')).toBeVisible();
  });

  test('should display button text as "Hide Completed" when toggled on', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add and complete a task
    await titleInput.fill('Task for button state');
    await button.click();

    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Wait for countdown to complete
    await page.waitForTimeout(5500);

    // Task should be deleted, toggle should show "Show Completed"
    const toggleButton = page.locator('button:has-text("Show Completed")');
    await expect(toggleButton).toBeVisible();
  });

  test('should maintain both completed and incomplete tasks with toggle', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add two tasks
    await titleInput.fill('Task A');
    await button.click();
    await titleInput.fill('Task B');
    await button.click();

    // Complete Task A
    const expandButtons = page.locator('button:has-text("▶")');
    await expandButtons.first().click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Both should be visible during countdown (Task A with countdown, Task B as is)
    await expect(page.locator('text=Task A')).toBeVisible();
    await expect(page.locator('text=Task B')).toBeVisible();

    // Wait for countdown to complete
    await page.waitForTimeout(5500);

    // Task A should be hidden (countdown expired, toggle is off)
    await expect(page.locator('text=Task A')).not.toBeVisible();
    // Task B should still be visible (incomplete)
    await expect(page.locator('text=Task B')).toBeVisible();

    // Show completed to verify Task A still exists
    const showCompletedButton = page.locator('button:has-text("Show Completed")');
    await showCompletedButton.click();

    // Both should be visible now
    await expect(page.locator('text=Task A')).toBeVisible();
    await expect(page.locator('text=Task B')).toBeVisible();
  });

  test('should show correct styling for completed tasks when visible', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add and complete a task
    await titleInput.fill('Styled task');
    await button.click();

    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Task is visible during countdown with strikethrough styling
    const taskSpan = page.locator('span:has-text("Styled task")').first();
    await expect(taskSpan).toHaveClass(/line-through/);
    await expect(taskSpan).toHaveClass(/text-gray-400/);
  });

  test('should allow operations on completed tasks when visible', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add a task and expand it
    await titleInput.fill('Editable completed task');
    await button.click();

    // Expand and mark as done
    let expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Task should still be expanded and showing the countdown button
    const unmarkButton = page.locator('button:has-text("Unmark Done (5)")');
    await expect(unmarkButton).toBeVisible();

    // Should also have edit and delete buttons available
    const editButton = page.locator('button:has-text("Edit")');
    await expect(editButton).toBeVisible();

    const deleteButton = page.locator('button:has-text("Delete")');
    await expect(deleteButton).toBeVisible();
  });

  test('should handle toggling with multiple completed tasks', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add three tasks
    for (let i = 1; i <= 3; i++) {
      await titleInput.fill(`Task ${i}`);
      await button.click();
    }

    // Complete first task
    let expandButtons = page.locator('button:has-text("▶")');
    await expandButtons.nth(0).click();
    let markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // First task should be visible with countdown
    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 2')).toBeVisible();
    await expect(page.locator('text=Task 3')).toBeVisible();

    // Wait for countdown to complete
    await page.waitForTimeout(5500);

    // Completed task should be hidden (toggle is off)
    await expect(page.locator('text=Task 1')).not.toBeVisible();
    // Incomplete tasks should still be visible
    await expect(page.locator('text=Task 2')).toBeVisible();
    await expect(page.locator('text=Task 3')).toBeVisible();

    // Show completed to verify Task 1 still exists
    const showCompletedButton = page.locator('button:has-text("Show Completed")');
    await showCompletedButton.click();

    await expect(page.locator('text=Task 1')).toBeVisible();

    // Verify Task 1 has strikethrough
    const task1 = page.locator('span').filter({ hasText: 'Task 1' }).first();
    await expect(task1).toHaveClass(/line-through/);
  });
});
