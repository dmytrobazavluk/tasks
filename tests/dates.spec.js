import { test, expect } from '@playwright/test';
import { setupPage } from './setup';

test.describe('Date Display', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('should display added date on tasks', async ({ page }) => {
    const input = page.locator('input[placeholder="Add a new task..."]');
    const button = page.locator('button:has-text("Add")');

    // Add a task
    await input.fill('Task with date');
    await button.click();

    // Verify added date is displayed
    const addedDateText = page.locator('text=Added:');
    await expect(addedDateText).toBeVisible();
  });

  test('should not display completion date for incomplete tasks', async ({ page }) => {
    const input = page.locator('input[placeholder="Add a new task..."]');
    const button = page.locator('button:has-text("Add")');

    // Add a task (incomplete by default)
    await input.fill('Incomplete task');
    await button.click();

    // Verify completion date is NOT displayed
    const completedText = page.locator('text=Completed:');
    await expect(completedText).not.toBeVisible();
  });

  test('should display completion date when task is marked complete', async ({ page }) => {
    const input = page.locator('input[placeholder="Add a new task..."]');
    const button = page.locator('button:has-text("Add")');

    // Add a task
    await input.fill('Task to complete');
    await button.click();

    // Mark as complete
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.click();

    // Verify completion date is displayed
    const completedText = page.locator('text=Completed:');
    await expect(completedText).toBeVisible();
  });

  test('should hide completion date when task is marked incomplete again', async ({ page }) => {
    const input = page.locator('input[placeholder="Add a new task..."]');
    const button = page.locator('button:has-text("Add")');

    // Add a task
    await input.fill('Toggle completion');
    await button.click();

    // Mark as complete
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.click();

    // Verify completion date is shown
    let completedText = page.locator('text=Completed:');
    await expect(completedText).toBeVisible();

    // Mark as incomplete
    await checkbox.click();

    // Verify completion date is hidden
    completedText = page.locator('text=Completed:');
    await expect(completedText).not.toBeVisible();
  });
});
