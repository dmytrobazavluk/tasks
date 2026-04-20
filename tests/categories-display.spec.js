import { test, expect } from '@playwright/test';
import { setupPage, openAddForm } from './setup';

test.describe('Categories Display in Task Details', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('should display categories as comma-separated list', async ({ page }) => {
    // Add a task with a category
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Test Task');

    // Add category
    await page.locator('text=Categories').first().click();
    await page.fill('input[placeholder="Type new category name..."]', 'Work');
    await page.click('button:has-text("Add")');

    // Submit form
    await page.click('button:has-text("Add Task")');

    // Expand task
    await page.click('text=Test Task');

    // Verify categories appear after Categories: label in metadata
    const categoryText = page.locator('text=Categories: Work');
    await expect(categoryText).toBeVisible();
  });

  test('should display multiple categories comma-separated', async ({ page }) => {
    // Add task with multiple categories
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Multi-category Task');

    // Add first category
    await page.locator('text=Categories').first().click();
    await page.fill('input[placeholder="Type new category name..."]', 'Work');
    await page.click('button:has-text("Add")');

    // Add second category
    await page.fill('input[placeholder="Type new category name..."]', 'Urgent');
    await page.click('button:has-text("Add")');

    // Submit form
    await page.click('button:has-text("Add Task")');

    // Expand task
    await page.click('text=Multi-category Task');

    // Verify both categories appear comma-separated
    const categoryText = page.locator('text=Categories: Work, Urgent');
    await expect(categoryText).toBeVisible();
  });

  test('should not display categories section when task has no categories', async ({ page }) => {
    // Add task without categories
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'No Category Task');
    await page.click('button:has-text("Add Task")');

    // Expand task
    await page.click('text=No Category Task');

    // Check Categories label is NOT displayed
    const categoriesLabel = page.locator('text=Categories:');
    await expect(categoriesLabel).not.toBeVisible();

    // But Added should be visible
    const addedLabel = page.locator('text=Added:');
    await expect(addedLabel).toBeVisible();
  });

  test('should be on same line as Added with comma separator', async ({ page }) => {
    // Add task with category
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Separator Task');

    await page.locator('text=Categories').first().click();
    await page.fill('input[placeholder="Type new category name..."]', 'Important');
    await page.click('button:has-text("Add")');
    await page.click('button:has-text("Add Task")');

    // Expand task
    await page.click('text=Separator Task');

    // Get the page content to verify structure
    const pageContent = await page.content();

    // Should contain Added and Categories on same line with comma
    expect(pageContent).toContain('Added:');
    expect(pageContent).toContain('Categories:');
    expect(pageContent).toContain('Important');

    // Verify comma is present between them
    expect(pageContent).toMatch(/Added:.*?,.*Categories:/);
  });

  test('should display categories in category filtered view', async ({ page }) => {
    // Add task with category
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Category Test');

    await page.locator('text=Categories').first().click();
    await page.fill('input[placeholder="Type new category name..."]', 'Work');
    await page.click('button:has-text("Add")');
    await page.click('button:has-text("Add Task")');

    // Switch to Work category tab in sidebar
    const workTab = page.locator('button').filter({ hasText: /^Work \(\d+\)$/ }).first();
    await workTab.click();

    // Expand task
    await page.click('text=Category Test');

    // Check categories displayed in filtered view
    const categoryText = page.locator('text=Categories: Work');
    await expect(categoryText).toBeVisible();
  });
});
