`import { test, expect } from '@playwright/test';
import { setupPage } from './setup';

test.describe('Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('should not add empty task', async ({ page }) => {
    const input = page.locator('input[placeholder="Add a new task..."]');
    const button = page.locator('button:has-text("Add")');

    await button.click();

    await expect(page.locator('text=No tasks yet')).toBeVisible();
  });

  test('should not add task with only whitespace', async ({ page }) => {
    const input = page.locator('input[placeholder="Add a new task..."]');
    const button = page.locator('button:has-text("Add")');

    await input.fill('   ');
    await button.click();

    await expect(page.locator('text=No tasks yet')).toBeVisible();
  });

  test('should clear input after adding task', async ({ page }) => {
    const input = page.locator('input[placeholder="Add a new task..."]');
    const button = page.locator('button:has-text("Add")');

    await input.fill('New task');
    await button.click();

    await expect(input).toHaveValue('');
  });
});
