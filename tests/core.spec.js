import { test, expect } from '@playwright/test';
import { setupPage } from './setup';

test.describe('Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('should load the app with the title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Task Planner');
  });

  test('should display empty state message initially', async ({ page }) => {
    await expect(page.locator('text=No tasks yet')).toBeVisible();
  });

  test('should add a new task', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    await titleInput.fill('Test task');
    await button.click();

    await expect(page.locator('text=Test task')).toBeVisible();
    await expect(titleInput).toHaveValue('');
  });

  test('should add multiple tasks', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    await titleInput.fill('Task 1');
    await button.click();

    await titleInput.fill('Task 2');
    await button.click();

    await titleInput.fill('Task 3');
    await button.click();

    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 2')).toBeVisible();
    await expect(page.locator('text=Task 3')).toBeVisible();

    // Empty state should not be visible
    await expect(page.locator('text=No tasks yet')).not.toBeVisible();
  });

  test('should mark a task as complete', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    await titleInput.fill('Test task');
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
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    await titleInput.fill('Test task');
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
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    await titleInput.fill('Task to delete');
    await button.click();

    await expect(page.locator('text=Task to delete')).toBeVisible();

    const deleteButton = page.locator('button:has-text("Delete")');
    await deleteButton.click();

    await expect(page.locator('text=Task to delete')).not.toBeVisible();
    await expect(page.locator('text=No tasks yet')).toBeVisible();
  });

  test('should handle multiple operations in sequence', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add 3 tasks
    for (let i = 1; i <= 3; i++) {
      await titleInput.fill(`Task ${i}`);
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

  test('should expand and collapse task details', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add a task
    await titleInput.fill('Task with expandable details');
    await button.click();

    // Details should be hidden initially (collapse button shows ▶)
    let expandButton = page.locator('button:has-text("▶")').first();
    await expect(expandButton).toBeVisible();

    // Added date should not be visible yet
    let addedDateText = page.locator('text=Added:');
    await expect(addedDateText).not.toBeVisible();

    // Click to expand
    await expandButton.click();

    // Expand button should now show ▼
    let collapseButton = page.locator('button:has-text("▼")').first();
    await expect(collapseButton).toBeVisible();

    // Added date should now be visible
    addedDateText = page.locator('text=Added:');
    await expect(addedDateText).toBeVisible();

    // Click to collapse
    await collapseButton.click();

    // Expand button should show ▶ again
    expandButton = page.locator('button:has-text("▶")').first();
    await expect(expandButton).toBeVisible();

    // Added date should be hidden again
    addedDateText = page.locator('text=Added:');
    await expect(addedDateText).not.toBeVisible();
  });

  test('should add and edit task details', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add a task
    await titleInput.fill('Task with details');
    await button.click();

    // Expand details
    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    // Find and fill the details textarea
    const detailsTextarea = page.locator('textarea[placeholder="Add notes or description..."]').first();
    await detailsTextarea.fill('This is my task description');

    // Verify details were saved by checking they're still visible
    await expect(detailsTextarea).toHaveValue('This is my task description');

    // Collapse and expand again to verify persistence
    const collapseButton = page.locator('button:has-text("▼")').first();
    await collapseButton.click();

    const newExpandButton = page.locator('button:has-text("▶")').first();
    await newExpandButton.click();

    // Details should still be there
    const detailsTextarea2 = page.locator('textarea[placeholder="Add notes or description..."]').first();
    await expect(detailsTextarea2).toHaveValue('This is my task description');
  });

  test('should update task details in real-time', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    // Add a task
    await titleInput.fill('Task for editing');
    await button.click();

    // Expand details
    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    // Add initial details
    const detailsTextarea = page.locator('textarea[placeholder="Add notes or description..."]').first();
    await detailsTextarea.fill('Initial details');

    // Edit the details
    await detailsTextarea.clear();
    await detailsTextarea.fill('Updated details');

    // Verify the update
    await expect(detailsTextarea).toHaveValue('Updated details');
  });

  test('should add task details when creating a new task', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const detailsInput = page.locator('textarea[placeholder*="Add details or notes"]');
    const button = page.locator('button:has-text("Add Task")');

    // Fill in task title and details
    await titleInput.fill('Task with initial details');
    await detailsInput.fill('These are my task notes');
    await button.click();

    // Verify task was created
    await expect(page.locator('text=Task with initial details')).toBeVisible();

    // Expand the task to verify details were saved
    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    // Verify the details are there
    const detailsTextarea = page.locator('textarea[placeholder="Add notes or description..."]').first();
    await expect(detailsTextarea).toHaveValue('These are my task notes');
  });
});
