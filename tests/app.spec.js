import { test, expect } from '@playwright/test';

test.describe('Task Planner App', () => {
  test.beforeEach(async ({ page }) => {
    // Use memory persistence for tests to avoid localStorage interference
    // This runs before the page loads so the app uses in-memory storage
    await page.addInitScript(() => {
      window.__APP_CONFIG__ = { persistence: 'memory' };
    });
    await page.goto('/');
  });

  test('should load the app with the title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Task Planner');
  });

  test('should display empty state message initially', async ({ page }) => {
    await expect(page.locator('text=No tasks yet')).toBeVisible();
  });

  test('should add a new task', async ({ page }) => {
    const input = page.locator('input[placeholder="Add a new task..."]');
    const button = page.locator('button:has-text("Add")');

    await input.fill('Test task');
    await button.click();

    await expect(page.locator('text=Test task')).toBeVisible();
    await expect(input).toHaveValue('');
  });

  test('should add multiple tasks', async ({ page }) => {
    const input = page.locator('input[placeholder="Add a new task..."]');
    const button = page.locator('button:has-text("Add")');

    await input.fill('Task 1');
    await button.click();

    await input.fill('Task 2');
    await button.click();

    await input.fill('Task 3');
    await button.click();

    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 2')).toBeVisible();
    await expect(page.locator('text=Task 3')).toBeVisible();

    // Empty state should not be visible
    await expect(page.locator('text=No tasks yet')).not.toBeVisible();
  });

  test('should mark a task as complete', async ({ page }) => {
    const input = page.locator('input[placeholder="Add a new task..."]');
    const button = page.locator('button:has-text("Add")');

    await input.fill('Test task');
    await button.click();

    const taskText = page.locator('text=Test task');
    const checkbox = page.locator('input[type="checkbox"]').first();

    await expect(taskText).not.toHaveClass(/line-through/);

    await checkbox.click();

    // Check that the task has strikethrough styling
    const taskSpan = page.locator('span:has-text("Test task")');
    await expect(taskSpan).toHaveClass(/line-through/);
  });

  test('should unmark a completed task', async ({ page }) => {
    const input = page.locator('input[placeholder="Add a new task..."]');
    const button = page.locator('button:has-text("Add")');

    await input.fill('Test task');
    await button.click();

    const checkbox = page.locator('input[type="checkbox"]').first();

    // Mark as complete
    await checkbox.click();
    let taskSpan = page.locator('span:has-text("Test task")');
    await expect(taskSpan).toHaveClass(/line-through/);

    // Unmark
    await checkbox.click();
    taskSpan = page.locator('span:has-text("Test task")');
    await expect(taskSpan).not.toHaveClass(/line-through/);
  });

  test('should delete a task', async ({ page }) => {
    const input = page.locator('input[placeholder="Add a new task..."]');
    const button = page.locator('button:has-text("Add")');

    await input.fill('Task to delete');
    await button.click();

    await expect(page.locator('text=Task to delete')).toBeVisible();

    const deleteButton = page.locator('button:has-text("Delete")');
    await deleteButton.click();

    await expect(page.locator('text=Task to delete')).not.toBeVisible();
    await expect(page.locator('text=No tasks yet')).toBeVisible();
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

  test('should handle multiple operations in sequence', async ({ page }) => {
    const input = page.locator('input[placeholder="Add a new task..."]');
    const button = page.locator('button:has-text("Add")');

    // Add 3 tasks
    for (let i = 1; i <= 3; i++) {
      await input.fill(`Task ${i}`);
      await button.click();
    }

    // Verify all tasks exist
    for (let i = 1; i <= 3; i++) {
      await expect(page.locator(`text=Task ${i}`)).toBeVisible();
    }

    // Mark second task as complete
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(1).click();

    // Delete first task
    const deleteButtons = page.locator('button:has-text("Delete")');
    await deleteButtons.first().click();

    // Verify state
    await expect(page.locator('text=Task 1')).not.toBeVisible();
    await expect(page.locator('text=Task 2')).toBeVisible();
    await expect(page.locator('text=Task 3')).toBeVisible();

    // Task 2 should be marked as complete
    const taskSpans = page.locator('span');
    const task2 = taskSpans.filter({ hasText: 'Task 2' }).first();
    await expect(task2).toHaveClass(/line-through/);
  });
});
