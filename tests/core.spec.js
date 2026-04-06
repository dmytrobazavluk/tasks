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

    const taskSpan = page.locator('span:has-text("Test task")').first();
    await expect(taskSpan).not.toHaveClass(/line-through/);

    // Expand to show Mark Done button
    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    // Click Mark Done button
    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Task should be visible with countdown during 5 seconds
    await expect(page.locator('text=Test task')).toBeVisible();

    // Check that the task has strikethrough styling (visible during countdown)
    await expect(taskSpan).toHaveClass(/line-through/);

    // Wait for countdown to complete
    await page.waitForTimeout(5500);

    // Task should be hidden (toggle is off by default)
    await expect(page.locator('text=Test task')).not.toBeVisible();

    // But should appear when toggle is on
    const showCompletedButton = page.locator('button:has-text("Show Completed")');
    await showCompletedButton.click();

    await expect(page.locator('text=Test task')).toBeVisible();
    await expect(taskSpan).toHaveClass(/line-through/);
  });

  test('should unmark a completed task', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    await titleInput.fill('Test task');
    await button.click();

    // Expand to show Mark Done button
    let expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    // Mark as complete
    let markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Task is visible with countdown
    await expect(page.locator('text=Test task')).toBeVisible();

    let taskSpan = page.locator('span:has-text("Test task")').first();
    await expect(taskSpan).toHaveClass(/line-through/);

    // Expand to show Unmark Done button (task stays expanded since we just marked it done while expanded)
    const unmarkButton = page.locator('button:has-text("Unmark Done (5)")');
    await expect(unmarkButton).toBeVisible();

    // Click Unmark Done button to cancel countdown
    await unmarkButton.click();

    // Task should now be unmarked
    await expect(taskSpan).not.toHaveClass(/line-through/);
  });

  test('should delete a task', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const button = page.locator('button:has-text("Add Task")');

    await titleInput.fill('Task to delete');
    await button.click();

    await expect(page.locator('text=Task to delete')).toBeVisible();

    // Expand to show delete button
    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    // Click delete button to show confirmation
    const deleteButton = page.locator('button:has-text("Delete")').first();
    await deleteButton.click();

    // Confirm deletion in the modal
    const confirmDeleteButton = page.locator('button:has-text("Delete")').last();
    await confirmDeleteButton.click();

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

    // Verify all tasks exist initially
    for (let i = 1; i <= 3; i++) {
      await expect(page.locator(`text=Task ${i}`)).toBeVisible();
    }

    // Mark second task as complete
    // Need to expand second task
    const expandButtons = page.locator('button:has-text("▶")');
    await expandButtons.nth(1).click();

    const markDoneButtons = page.locator('button:has-text("Mark Done")');
    await markDoneButtons.nth(0).click();

    // Task 2 is visible with countdown
    await expect(page.locator('text=Task 2')).toBeVisible();

    // Wait for countdown to complete
    await page.waitForTimeout(5500);

    // Task 2 should now be hidden (countdown expired, toggle is off)
    await expect(page.locator('text=Task 2')).not.toBeVisible();

    // Delete first task - need to expand it first
    const expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    const deleteButton = page.locator('button:has-text("Delete")').first();
    await deleteButton.click();

    // Confirm deletion in the modal (click the red delete button)
    const confirmDeleteButton = page.locator('button.bg-red-600:has-text("Delete")');
    await confirmDeleteButton.click();

    // Verify Task 1 is deleted and Task 3 remains
    await expect(page.locator('text=Task 1')).not.toBeVisible();
    await expect(page.locator('text=Task 3')).toBeVisible();

    // Show completed tasks to verify Task 2 is still there and marked complete
    const showCompletedButton = page.locator('button:has-text("Show Completed")');
    await showCompletedButton.click();

    await expect(page.locator('text=Task 2')).toBeVisible();
    const task2 = page.locator('span').filter({ hasText: 'Task 2' }).first();
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
    let expandButton = page.locator('button:has-text("▶")').first();
    await expandButton.click();

    // Click Edit button
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();

    // Fill in the details in the edit form
    const editDetailsTextarea = page.locator('textarea[placeholder="Add notes or description..."]').first();
    await editDetailsTextarea.fill('This is my task description');

    // Save changes
    const saveButton = page.locator('button:has-text("Save")').first();
    await saveButton.click();

    // Details should be visible in read-only form after save
    const detailsDisplay = page.locator('text=This is my task description');
    await expect(detailsDisplay).toBeVisible();
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

    // Click Edit button
    let editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();

    // Add initial details
    let detailsTextarea = page.locator('textarea[placeholder="Add notes or description..."]').first();
    await detailsTextarea.fill('Initial details');

    // Edit the details
    await detailsTextarea.clear();
    await detailsTextarea.fill('Updated details');

    // Verify the update in the form
    await expect(detailsTextarea).toHaveValue('Updated details');

    // Save changes
    const saveButton = page.locator('button:has-text("Save")').first();
    await saveButton.click();
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

    // Verify the details are displayed in read-only form
    const detailsDisplay = page.locator('text=These are my task notes');
    await expect(detailsDisplay).toBeVisible();
  });
});
