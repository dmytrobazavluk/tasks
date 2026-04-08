import { test, expect } from '@playwright/test';
import { setupPage, openAddForm } from './setup';

test.describe('Export/Import Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('should have export and import buttons', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export")');
    const importButton = page.locator('button:has-text("Import")');

    await expect(exportButton).toBeVisible();
    await expect(importButton).toBeVisible();
  });

  test('should export button be clickable', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add a task
    await openAddForm(page);
    await titleInput.fill('Task 1');
    await addButton.click();

    const exportButton = page.locator('button:has-text("Export")');
    // Just verify it's clickable without errors
    await expect(exportButton).toBeEnabled();
  });

  test('should import tasks from JSON file', async ({ page }) => {
    // First, add initial task
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    await openAddForm(page);
    await titleInput.fill('Original Task');
    await addButton.click();

    // Prepare import data
    const importData = [
      {
        id: 1234567890,
        title: 'Imported Task 1',
        completed: false,
        details: 'Details for imported task',
        addedDate: new Date().toISOString(),
        completionDate: null
      },
      {
        id: 1234567891,
        title: 'Imported Task 2',
        completed: true,
        details: '',
        addedDate: new Date().toISOString(),
        completionDate: new Date().toISOString()
      }
    ];

    // Create a temporary file with the import data
    const fileBuffer = Buffer.from(JSON.stringify(importData));
    const fileName = 'test-import.json';

    // Upload file through import modal
    const importTopButton = page.locator('button[title="Upload JSON file to replace tasks"]');
    await importTopButton.click();

    // Wait for modal to appear
    await expect(page.locator('h2:has-text("Import Tasks")')).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: 'application/json',
      buffer: fileBuffer
    });

    // Wait for file to be selected and show filename
    await expect(page.locator('text=test-import.json')).toBeVisible();

    // Click import button in the modal (last one)
    const importButton = page.locator('button:has-text("Import")').last();
    await importButton.click();

    // Wait for import to complete and modal to close
    await page.waitForTimeout(500);

    // Verify modal is closed
    await expect(page.locator('h2:has-text("Import Tasks")')).not.toBeVisible();

    // Verify original task is gone
    await expect(page.locator('text=Original Task')).not.toBeVisible();

    // Verify imported incomplete task is visible
    await expect(page.locator('text=Imported Task 1')).toBeVisible();

    // Show completed to see Task 2
    const showCompletedButton = page.locator('button:has-text("Show Completed")');
    await showCompletedButton.click();

    // Now Imported Task 2 (completed) should be visible
    await expect(page.locator('text=Imported Task 2')).toBeVisible();
  });

  test('should show error for invalid JSON import', async ({ page }) => {
    const importTopButton = page.locator('button[title="Upload JSON file to replace tasks"]');
    await importTopButton.click();

    // Wait for modal
    await expect(page.locator('h2:has-text("Import Tasks")')).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    const invalidJson = 'not valid json {]';

    await fileInput.setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from(invalidJson)
    });

    // Click import
    const importButton = page.locator('button:has-text("Import")').last();
    await importButton.click();

    // Verify error message appears
    await expect(page.locator('text=Invalid JSON format')).toBeVisible();

    // Modal should still be open
    await expect(page.locator('h2:has-text("Import Tasks")')).toBeVisible();
  });

  test('should show error for invalid task structure', async ({ page }) => {
    const importTopButton = page.locator('button[title="Upload JSON file to replace tasks"]');
    await importTopButton.click();

    // Wait for modal
    await expect(page.locator('h2:has-text("Import Tasks")')).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    const invalidData = JSON.stringify([
      {
        title: 'Task without id'
        // Missing required fields
      }
    ]);

    await fileInput.setInputFiles({
      name: 'invalid-structure.json',
      mimeType: 'application/json',
      buffer: Buffer.from(invalidData)
    });

    // Click import
    const importButton = page.locator('button:has-text("Import")').last();
    await importButton.click();

    // Verify error message appears
    await expect(page.locator('text=No valid tasks found')).toBeVisible();

    // Modal should still be open
    await expect(page.locator('h2:has-text("Import Tasks")')).toBeVisible();
  });

  test('should cancel import without changing tasks', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    // Add initial task
    await openAddForm(page);
    await titleInput.fill('Original Task');
    await addButton.click();

    // Open import modal
    const importTopButton = page.locator('button[title="Upload JSON file to replace tasks"]');
    await importTopButton.click();

    // Wait for modal
    await expect(page.locator('h2:has-text("Import Tasks")')).toBeVisible();

    // Click cancel
    const cancelButton = page.locator('button:has-text("Cancel")').last();
    await cancelButton.click();

    // Modal should be closed
    await expect(page.locator('h2:has-text("Import Tasks")')).not.toBeVisible();

    // Original task should still be there
    await expect(page.locator('text=Original Task')).toBeVisible();
  });

  test('should require file selection before import', async ({ page }) => {
    const importTopButton = page.locator('button[title="Upload JSON file to replace tasks"]');
    await importTopButton.click();

    // Wait for modal
    await expect(page.locator('h2:has-text("Import Tasks")')).toBeVisible();

    // Try to click import without selecting file
    const importButton = page.locator('button:has-text("Import")').last();
    expect(importButton).toBeDisabled();

    // Cancel
    const cancelButton = page.locator('button:has-text("Cancel")').last();
    await cancelButton.click();
  });
});
