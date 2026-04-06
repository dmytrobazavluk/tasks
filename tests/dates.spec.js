import { test, expect } from '@playwright/test';
import { setupPage } from './setup';

test.describe('Date Display', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('should display added date in expanded details', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add a task
    await titleInput.fill('Task with date');
    await button.click();

    // Dates are hidden by default - expand details
    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    // Verify added date is displayed
    const addedDateText = page.locator('text=Added:');
    await expect(addedDateText).toBeVisible();
  });

  test('should not display completion date for incomplete tasks', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add a task (incomplete by default)
    await titleInput.fill('Incomplete task');
    await button.click();

    // Expand details
    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    // Verify completion date is NOT displayed
    const completedText = page.locator('text=Completed:');
    await expect(completedText).not.toBeVisible();
  });

  test('should display completion date when task is marked complete', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add a task
    await titleInput.fill('Task to complete');
    await button.click();

    // Expand details
    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    // Mark as complete
    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Verify completion date is displayed
    const completedText = page.locator('text=Completed:');
    await expect(completedText).toBeVisible();
  });

  test('should hide completion date when task is marked incomplete again', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add a task
    await titleInput.fill('Toggle completion');
    await button.click();

    // Expand details
    let expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    // Mark as complete
    let markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Verify completion date is shown
    let completedText = page.locator('text=Completed:');
    await expect(completedText).toBeVisible();

    // Mark as incomplete
    let unmarkButton = page.locator('button:has-text("Unmark Done")').first();
    await unmarkButton.click();

    // Verify completion date is hidden
    completedText = page.locator('text=Completed:');
    await expect(completedText).not.toBeVisible();
  });
});
