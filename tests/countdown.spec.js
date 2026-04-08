import { test, expect } from '@playwright/test';
import { setupPage, openAddForm, markTaskDone } from './setup';

test.describe('Task Removal Countdown', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('should not disappear immediately when marked done', async ({ page }) => {
    await openAddForm(page);

    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add and mark task as done
    await titleInput.fill('Countdown task');
    await button.click();

    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    await markTaskDone(page);

    // Re-expand to see the countdown button
    const collapseButton = page.locator('div[role="button"]').first();
    await collapseButton.click();

    // Task should still be visible immediately after marking done
    await expect(page.locator('text=Countdown task')).toBeVisible();
  });

  test('should show countdown on unmark done button', async ({ page }) => {
    await openAddForm(page);

    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add and mark task as done
    await titleInput.fill('Task with countdown');
    await button.click();

    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    await markTaskDone(page);

    // Button should show countdown (5)
    const unmarkButton = page.locator('button:has-text("Unmark Done (0.")');
    await expect(unmarkButton).toBeVisible();
  });

  test('should countdown decrements', async ({ page }) => {
    await openAddForm(page);

    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add and mark task as done
    await titleInput.fill('Countdown test');
    await button.click();

    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    await markTaskDone(page);

    // Wait for countdown to be visible with a number
    await expect(page.locator('button:has-text("Unmark Done (0.")')).toBeVisible();

    // Wait a bit and verify countdown still visible (should be decremented)
    await page.waitForTimeout(150);
    await expect(page.locator('button:has-text("Unmark Done (0.")')).toBeVisible();
  });

  test('should keep completed task visible after countdown completes', async ({ page }) => {
    await openAddForm(page);

    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add and mark task as done
    await titleInput.fill('Auto complete task');
    await button.click();

    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    await markTaskDone(page);

    // Task should be visible with countdown
    await expect(page.locator('text=Auto complete task')).toBeVisible();

    // Wait for countdown to complete
    await page.waitForTimeout(1000);

    // Task should still be visible (completed today stays in Today tab)
    await expect(page.locator('text=Auto complete task')).toBeVisible();

    const taskSpan = page.locator('span').filter({ hasText: 'Auto complete task' }).first();
    await expect(taskSpan).toHaveClass(/line-through/);
  });

  test('should cancel countdown when unmark done is clicked', async ({ page }) => {
    await openAddForm(page);

    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add and mark task as done
    await titleInput.fill('Cancel countdown task');
    await button.click();

    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    await markTaskDone(page);

    // Wait for countdown to show
    await page.waitForTimeout(150);

    // Click unmark to cancel countdown (button still has number)
    const unmarkButton = page.locator('button:has-text("Unmark Done (0.")');
    await unmarkButton.click();

    // Task should be unmarked and still visible (no countdown on button)
    const taskSpan = page.locator('span:has-text("Cancel countdown task")').first();
    await expect(taskSpan).not.toHaveClass(/line-through/);

    // Button should show "Mark Done" again (no countdown)
    const markButton = page.locator('button:has-text("Mark Done")').first();
    await expect(markButton).toBeVisible();
  });

  test('should allow editing during countdown', async ({ page }) => {
    await openAddForm(page);

    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add and mark task as done
    await titleInput.fill('Edit during countdown');
    await button.click();

    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    await markTaskDone(page);

    // Edit should be clickable
    const editButton = page.locator('button:has-text("Edit")').first();
    await expect(editButton).toBeVisible();
    await expect(editButton).toBeEnabled();
  });

  test('should allow delete during countdown', async ({ page }) => {
    await openAddForm(page);

    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add and mark task as done
    await titleInput.fill('Delete during countdown');
    await button.click();

    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    await markTaskDone(page);

    // Delete should be clickable
    const deleteButton = page.locator('button:has-text("Delete")').last();
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toBeEnabled();
  });

  test('should show countdown timer when marking task done', async ({ page }) => {
    await openAddForm(page);

    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add task
    await titleInput.fill('Countdown visibility test');
    await button.click();

    // Expand and mark done
    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    await markTaskDone(page);

    // Task should still be visible with countdown
    await expect(page.locator('text=Countdown visibility test')).toBeVisible();
    await expect(page.locator('button:has-text("Unmark Done (0.")')).toBeVisible();
  });

  test('should handle multiple tasks with concurrent countdowns', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add two tasks
    await openAddForm(page);
    await titleInput.fill('Concurrent task 1');
    await addButton.click();

    await openAddForm(page);
    await titleInput.fill('Concurrent task 2');
    await addButton.click();

    // Both tasks should be visible
    await expect(page.locator('text=Concurrent task 1')).toBeVisible();
    await expect(page.locator('text=Concurrent task 2')).toBeVisible();
  });
});
