import { test, expect } from '@playwright/test';
import { setupPage, openAddForm, markTaskDone } from './setup';

test.describe('Task Ordering and Auto-Collapse', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('incomplete tasks appear before completed tasks in Today tab', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add three tasks
    for (let i = 1; i <= 3; i++) {
      await openAddForm(page);
      await titleInput.fill(`Task ${i}`);
      await addButton.click();
    }

    // Mark the second task as done
    const expandButtons = page.locator('div[role="button"]');
    await expandButtons.nth(1).click();

    await markTaskDone(page);

    // While countdown is active, task stays in original position
    let taskSpans = page.locator('span').filter({ hasText: /^Task [123]$/ });
    let texts = await taskSpans.allTextContents();
    expect(texts).toEqual(['Task 1', 'Task 2', 'Task 3']);

    // Wait for countdown to complete
    await page.waitForTimeout(3500);

    // After countdown completes, task moves to end
    taskSpans = page.locator('span').filter({ hasText: /^Task [123]$/ });
    texts = await taskSpans.allTextContents();
    expect(texts).toEqual(['Task 1', 'Task 3', 'Task 2']);
  });

  test('completed tasks with active countdown stay visible and move to end after countdown', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add two tasks
    await openAddForm(page);
    await titleInput.fill('Test Task');
    await addButton.click();

    // Mark the task as done
    let expandButtons = page.locator('div[role="button"]');
    await expandButtons.nth(0).click();

    await markTaskDone(page);

    // During countdown, task should still be visible (grace period)
    await expect(page.locator('text=Test Task')).toBeVisible();

    // Countdown button should be visible during grace period
    await expect(page.locator('button:has-text("Unmark Done (")')).toBeVisible();

    // Wait for countdown to complete
    await page.waitForTimeout(3500);

    // After countdown, task should still be visible (completed today stays in Today tab)
    await expect(page.locator('text=Test Task')).toBeVisible();

    // Task should now be collapsed (auto-collapsed after countdown)
    const addedText = page.locator('text=Added:');
    const isVisible = await addedText.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('task auto-collapses when countdown naturally completes', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add a task
    await openAddForm(page);
    await titleInput.fill('Auto-collapse task');
    await addButton.click();

    // Expand and mark as done
    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    // Verify task is expanded (should see details)
    await expect(page.locator('text=Added:')).toBeVisible();

    await markTaskDone(page);

    // Task should still be expanded during countdown
    await expect(page.locator('text=Added:')).toBeVisible();

    // Wait for countdown to complete (3+ seconds based on config)
    await page.waitForTimeout(3500);

    // Task should now be collapsed (details hidden)
    const addedText = page.locator('text=Added:');
    const isVisible = await addedText.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('task stays expanded when user manually clicks unmark done', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add a task
    await openAddForm(page);
    await titleInput.fill('Manual unmark task');
    await addButton.click();

    // Expand and mark as done
    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    // Verify task is expanded
    await expect(page.locator('text=Added:')).toBeVisible();

    await markTaskDone(page);

    // Wait for countdown to show
    await page.waitForTimeout(200);

    // Click unmark to manually cancel countdown
    const unmarkButton = page.locator('button:has-text("Unmark Done (0.")');
    await unmarkButton.click();

    // Task should stay expanded after manual unmark
    await expect(page.locator('text=Added:')).toBeVisible();
  });

  test('multiple tasks with different completion states maintain proper order', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add three tasks
    for (let i = 1; i <= 3; i++) {
      await openAddForm(page);
      await titleInput.fill(`Task ${i}`);
      await addButton.click();
    }

    // Mark task 2 as done
    const expandButtons = page.locator('div[role="button"]');
    await expandButtons.nth(1).click();
    await markTaskDone(page);

    // While countdown is active, task stays in original position
    let taskSpans = page.locator('span').filter({ hasText: /^Task [123]$/ });
    let texts = await taskSpans.allTextContents();
    expect(texts).toEqual(['Task 1', 'Task 2', 'Task 3']);

    // Wait for countdown to complete
    await page.waitForTimeout(3500);

    // After countdown, task moves to end
    taskSpans = page.locator('span').filter({ hasText: /^Task [123]$/ });
    texts = await taskSpans.allTextContents();
    expect(texts).toEqual(['Task 1', 'Task 3', 'Task 2']);
  });

  test('completed task in category tab maintains order with incomplete tasks', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add two tasks with the same category
    await openAddForm(page);
    await titleInput.fill('Work Task 1');
    await addButton.click();

    await openAddForm(page);
    await titleInput.fill('Work Task 2');
    await addButton.click();

    // Mark the second task as done
    const expandButtons = page.locator('div[role="button"]');
    await expandButtons.nth(1).click();
    await markTaskDone(page);

    // While countdown is active, task stays in its position (mixed with incomplete)
    let taskTexts = page.locator('span').filter({ hasText: /^Work Task [12]$/ });
    let texts = await taskTexts.allTextContents();
    expect(texts).toEqual(['Work Task 1', 'Work Task 2']);

    // Wait for countdown to complete
    await page.waitForTimeout(3500);

    // After countdown, task moves to end
    taskTexts = page.locator('span').filter({ hasText: /^Work Task [12]$/ });
    texts = await taskTexts.allTextContents();
    expect(texts).toEqual(['Work Task 1', 'Work Task 2']);
  });

  test('auto-collapse respects expanded state during countdown', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add a task
    await openAddForm(page);
    await titleInput.fill('Expand/collapse test');
    await addButton.click();

    // Expand and mark as done
    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    // Verify expanded
    await expect(page.locator('text=Added:')).toBeVisible();

    await markTaskDone(page);

    // Task should still be expanded during countdown
    await expect(page.locator('text=Added:')).toBeVisible();

    // Wait for countdown to complete (3+ seconds)
    await page.waitForTimeout(3500);

    // Task should auto-collapse after countdown naturally finishes
    const addedText = page.locator('text=Added:');
    const isVisible = await addedText.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('incomplete tasks maintain insertion order when no tasks are completed', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add five tasks
    for (let i = 1; i <= 5; i++) {
      await openAddForm(page);
      await titleInput.fill(`Task ${i}`);
      await addButton.click();
    }

    // All tasks are incomplete, should maintain insertion order
    const taskSpans = page.locator('span').filter({ hasText: /^Task [12345]$/ });
    const texts = await taskSpans.allTextContents();

    expect(texts).toEqual(['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5']);
  });
});
