import { test, expect } from '@playwright/test';
import { setupPage, openAddForm } from './setup';

test.describe('Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('should not add empty task', async ({ page }) => {
    await openAddForm(page);

    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    await button.click();

    await expect(page.locator('text=No tasks yet')).toBeVisible();
  });

  test('should not add task with only whitespace', async ({ page }) => {
    await openAddForm(page);

    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    await titleInput.fill('   ');
    await button.click();

    await expect(page.locator('text=No tasks yet')).toBeVisible();
  });

  test('should clear inputs after adding task', async ({ page }) => {
    await openAddForm(page);

    const titleInput = page.locator('input[placeholder="Task title..."]');
    const detailsInput = page.locator('textarea[placeholder*="Add details or notes"]');
    const button = page.locator('button:has-text("Add Task")');

    await titleInput.fill('New task');
    await detailsInput.fill('Task details');
    await button.click();

    // Task should be visible after adding
    await expect(page.locator('text=New task')).toBeVisible();

    // Form should close after adding task and reset for next add
    await openAddForm(page);
    const titleInputAfterClose = page.locator('input[placeholder="Task title..."]');
    const detailsInputAfterClose = page.locator('textarea[placeholder*="Add details or notes"]');
    await expect(titleInputAfterClose).toHaveValue('');
    await expect(detailsInputAfterClose).toHaveValue('');
  });
});
