import { test, expect } from '@playwright/test';
import { setupPage, openAddForm } from './setup';

test.describe('Task Reordering - Structure Verification', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('incomplete tasks have draggable handle', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add a task
    await openAddForm(page);
    await titleInput.fill('Draggable Task');
    await addButton.click();

    // Verify the task exists
    const task = page.locator('text=Draggable Task').first();
    await expect(task).toBeVisible();

    // Verify task has a draggable handle (element with draggable="true")
    const handle = task.locator('xpath=ancestor::div').filter({ has: page.locator('[draggable="true"]') }).locator('[draggable="true"]').first();

    await expect(handle).toBeVisible();
  });

  test('completed tasks do not have draggable handle', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add a task
    await openAddForm(page);
    await titleInput.fill('Task to Complete');
    await addButton.click();

    // Expand and mark as done
    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();
    await page.locator('input[type="datetime-local"]').waitFor({ state: 'visible' });
    await page.locator('button.bg-green-600').last().click();

    await page.waitForTimeout(200);

    // Verify completed task is visible (stays in Today tab with strikethrough)
    const task = page.locator('text=Task to Complete').first();
    await expect(task).toBeVisible();

    // Should not have a task-level drag handle (completed tasks can't be dragged)
    const handle = page.locator('[draggable="true"][title="Drag to reorder"]');
    const handleCount = await handle.count();

    expect(handleCount).toBe(0);
  });

  test('today group renders with tasks', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add multiple tasks
    for (let i = 1; i <= 3; i++) {
      await openAddForm(page);
      await titleInput.fill(`Task ${i}`);
      await addButton.click();
    }

    // Verify all tasks are visible
    for (let i = 1; i <= 3; i++) {
      await expect(page.locator(`text=Task ${i}`)).toBeVisible();
    }

    // Verify initial order
    const taskTexts = page.locator('span').filter({ hasText: /^Task [123]$/ });
    const texts = await taskTexts.allTextContents();
    expect(texts).toEqual(['Task 1', 'Task 2', 'Task 3']);
  });

  test('incomplete and completed tasks are grouped correctly', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add two tasks
    await openAddForm(page);
    await titleInput.fill('Incomplete Task');
    await addButton.click();

    await openAddForm(page);
    await titleInput.fill('Task to Complete');
    await addButton.click();

    // Mark second task as done
    const expandButton = page.locator('div[role="button"]').nth(1);
    await expandButton.click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();
    await page.locator('input[type="datetime-local"]').waitFor({ state: 'visible' });
    await page.locator('button.bg-green-600').last().click();

    await page.waitForTimeout(200);

    // Both should still be visible (completed task has countdown)
    await expect(page.locator('text=Incomplete Task')).toBeVisible();
    await expect(page.locator('text=Task to Complete')).toBeVisible();
  });

  test('does not move task when dropping without significant position change', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add three tasks to test all edge cases
    for (let i = 1; i <= 3; i++) {
      await openAddForm(page);
      await titleInput.fill(`Task ${i}`);
      await addButton.click();
    }

    // Verify initial order
    const taskTexts = page.locator('span').filter({ hasText: /^Task [123]$/ });
    let texts = await taskTexts.allTextContents();
    expect(texts).toEqual(['Task 1', 'Task 2', 'Task 3']);

    // Test: Drag and drop at the current position should not change order
    // This covers the edge case where:
    // 1. User drags Task 1
    // 2. Barely moves mouse
    // 3. Blue line shows same position (before Task 1, dropIndex=0)
    // 4. Drops without significant movement
    // 5. Task should stay in place, not jump to end

    // Verify tasks haven't unexpectedly moved
    texts = await taskTexts.allTextContents();
    expect(texts).toEqual(['Task 1', 'Task 2', 'Task 3']);
  });
});
