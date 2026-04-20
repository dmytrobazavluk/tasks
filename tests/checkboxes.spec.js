import { test, expect } from '@playwright/test';
import { setupPage, openAddForm } from './setup';

test.describe('Task Details Checkboxes', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('should display checkbox content from [] syntax', async ({ page }) => {
    // Add task with checkbox syntax in details
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Checkbox Test');
    await page.fill('textarea', '[] Buy milk\n[x] Pay bills');
    await page.click('button:has-text("Add Task")');

    // Expand task to see details
    await page.click('text=Checkbox Test');

    // Verify checkbox content is displayed
    await expect(page.locator('text=Buy milk')).toBeVisible();
    await expect(page.locator('text=Pay bills')).toBeVisible();
  });

  test('should render mixed checkbox and regular lines', async ({ page }) => {
    // Add task with mixed content
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Mixed Details');
    await page.fill('textarea', '[] Item 1\nJust regular text\n[x] Item 2');
    await page.click('button:has-text("Add Task")');

    // Expand task
    await page.click('text=Mixed Details');

    // All content should be visible
    await expect(page.locator('text=Item 1')).toBeVisible();
    await expect(page.locator('text=Just regular text')).toBeVisible();
    await expect(page.locator('text=Item 2')).toBeVisible();
  });

  test('should persist checkbox state after edit', async ({ page }) => {
    // Add task with checkbox
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Persist Test');
    await page.fill('textarea', '[] Do something');
    await page.click('button:has-text("Add Task")');

    // Expand and edit
    await page.click('text=Persist Test');
    await page.click('button:has-text("Edit")');

    // The details should still show [] format
    const textarea = page.locator('textarea');
    const value = await textarea.inputValue();
    expect(value).toContain('[]');
    expect(value).toContain('Do something');

    // Close without changes
    await page.click('button:has-text("Cancel")');

    // Checkbox content should still be visible
    await expect(page.locator('text=Do something')).toBeVisible();
  });

  test('should support [x] and [X] as checked', async ({ page }) => {
    // Add task with both lowercase and uppercase X
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Case Test');
    await page.fill('textarea', '[x] lowercase\n[X] uppercase');
    await page.click('button:has-text("Add Task")');

    // Expand task
    await page.click('text=Case Test');

    // Both should be visible
    await expect(page.locator('text=lowercase')).toBeVisible();
    await expect(page.locator('text=uppercase')).toBeVisible();
  });

  test('should reflect checkbox changes when opening edit', async ({ page }) => {
    // Add task with unchecked checkbox
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Edit Checkbox Task');
    await page.fill('textarea', '[] Item to check');
    await page.click('button:has-text("Add Task")');

    // Expand task
    await page.click('text=Edit Checkbox Task');

    // Verify initial unchecked state
    await expect(page.locator('text=Item to check')).toBeVisible();

    // Click Edit button
    await page.click('button:has-text("Edit")');

    // Verify the textarea contains the unchecked checkbox syntax
    const textarea = page.locator('textarea');
    const value = await textarea.inputValue();
    expect(value).toContain('[] Item to check');

    // Close edit without changes
    await page.click('button:has-text("Cancel")');

    // Verify back in expanded view
    await expect(page.locator('text=Item to check')).toBeVisible();
  });

  test('should show updated checkbox in edit form after toggle', async ({ page }) => {
    // Add task with unchecked item
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Toggle and Edit');
    await page.fill('textarea', '[] Task item');
    await page.click('button:has-text("Add Task")');

    // Expand task
    await page.click('text=Toggle and Edit');

    // Verify item is displayed
    await expect(page.locator('text=Task item')).toBeVisible();

    // Click Edit to open form
    await page.click('button:has-text("Edit")');

    // Verify checkbox is unchecked in form
    const textarea = page.locator('textarea');
    let value = await textarea.inputValue();
    expect(value).toContain('[] Task item');

    // Cancel and try toggling
    await page.click('button:has-text("Cancel")');

    // Now find and click the checkbox to toggle it
    const checkboxContainer = page.locator('div').filter({ hasText: 'Task item' });
    const checkbox = checkboxContainer.locator('input[type="checkbox"]').first();
    await checkbox.check();

    // Wait for update
    await page.waitForTimeout(300);

    // Open edit again
    await page.click('button:has-text("Edit")');

    // Now it should show [x]
    value = await textarea.inputValue();
    expect(value).toContain('[x] Task item');

    // Save
    await page.click('button:has-text("Save")');

    // Verify checkbox stays checked
    await expect(checkboxContainer.locator('input[type="checkbox"]')).toBeChecked();
  });

  test('should maintain multiple checkbox states through edit', async ({ page }) => {
    // Add task with multiple checkboxes
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Multi Edit Task');
    await page.fill('textarea', '[] First\n[x] Second\n[] Third');
    await page.click('button:has-text("Add Task")');

    // Expand and verify initial state
    await page.click('text=Multi Edit Task');
    await expect(page.locator('text=First')).toBeVisible();
    await expect(page.locator('text=Second')).toBeVisible();
    await expect(page.locator('text=Third')).toBeVisible();

    // Click Edit
    await page.click('button:has-text("Edit")');

    // Verify all checkbox states in textarea
    const textarea = page.locator('textarea');
    let value = await textarea.inputValue();
    expect(value).toContain('[] First');
    expect(value).toContain('[x] Second');
    expect(value).toContain('[] Third');

    // Cancel and verify still displayed
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=First')).toBeVisible();
    await expect(page.locator('text=Second')).toBeVisible();
    await expect(page.locator('text=Third')).toBeVisible();
  });

  test('should handle toggling multiple checkboxes', async ({ page }) => {
    // Add task with multiple checkboxes
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Toggle Multiple');
    await page.fill('textarea', '[] One\n[] Two\n[] Three');
    await page.click('button:has-text("Add Task")');

    // Expand
    await page.click('text=Toggle Multiple');

    // Get all checkboxes
    const allCheckboxes = page.locator('input[type="checkbox"]');

    // Toggle first and third
    await allCheckboxes.nth(0).check();
    await allCheckboxes.nth(2).check();

    // Wait for updates
    await page.waitForTimeout(300);

    // Open edit
    await page.click('button:has-text("Edit")');

    // Verify states
    const textarea = page.locator('textarea');
    const value = await textarea.inputValue();
    expect(value).toContain('[x] One');
    expect(value).toContain('[] Two');
    expect(value).toContain('[x] Three');

    // Cancel
    await page.click('button:has-text("Cancel")');
  });
});
