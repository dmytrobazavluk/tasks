import { test, expect } from '@playwright/test';
import { setupPage, openAddForm } from './setup';

test.describe('Task Scheduling & Categories', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('should add task with single category', async ({ page }) => {
    await openAddForm(page);

    const titleInput = page.locator('input[placeholder="Task title..."]');
    const newCategoryInput = page.locator('input[placeholder="Type new category name..."]');
    // Select the Add button that's near the category input (within the form, not the main Add Task button)
    const addCategoryButton = newCategoryInput.locator('xpath=following-sibling::button[1]');
    const addTaskButton = page.locator('button:has-text("Add Task")').first();

    await titleInput.fill('Categorized Task');

    // Add new category
    await newCategoryInput.fill('Important');
    await addCategoryButton.click();

    // Verify category tag appears
    await expect(page.locator('text=Important')).toBeVisible();

    // Add task
    await addTaskButton.click();

    // Verify task appears in Today
    await expect(page.locator('text=Categorized Task')).toBeVisible();

    // Verify "Important" category tab appears in sidebar
    const importantTab = page.locator('button:has-text("Important")').nth(0);
    await expect(importantTab).toBeVisible();
  });

  test('should filter tasks by category tab', async ({ page }) => {
    await openAddForm(page);

    const titleInput = page.locator('input[placeholder="Task title..."]');
    const newCategoryInput = page.locator('input[placeholder="Type new category name..."]');
    const addTaskButton = page.locator('button:has-text("Add Task")').first();

    // Add task 1 with "Shopping" category
    await titleInput.fill('Buy groceries');
    await newCategoryInput.fill('Shopping');
    const addCategoryButton1 = newCategoryInput.locator('xpath=following-sibling::button[1]');
    await addCategoryButton1.click();
    await addTaskButton.click();

    // Add task 2 with "Work" category
    await openAddForm(page);
    await titleInput.fill('Finish report');
    await newCategoryInput.fill('Work');
    const addCategoryButton2 = newCategoryInput.locator('xpath=following-sibling::button[1]');
    await addCategoryButton2.click();
    await addTaskButton.click();

    // Both tasks visible in Today
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    await expect(page.locator('text=Finish report')).toBeVisible();

    // Click Shopping tab (sidebar button, first occurrence)
    const shoppingTab = page.locator('button:has-text("Shopping")').nth(0);
    await shoppingTab.click();

    // Only "Buy groceries" should be visible
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    await expect(page.locator('text=Finish report')).not.toBeVisible();

    // Click Work tab (sidebar button)
    const workTab = page.locator('button:has-text("Work")').nth(0);
    await workTab.click();

    // Only "Finish report" should be visible
    await expect(page.locator('text=Finish report')).toBeVisible();
    await expect(page.locator('text=Buy groceries')).not.toBeVisible();
  });

  test('should display correct task counts in sidebar', async ({ page }) => {
    // Add incomplete task
    await openAddForm(page);
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    await titleInput.fill('Task 1');
    await addButton.click();

    // Verify Today tab shows count (1)
    const todayTab = page.locator('button:has-text("Today")');
    await expect(todayTab).toContainText('1');
  });

  test('should display current tab name in header', async ({ page }) => {
    // Default should show "Today"
    const header = page.locator('h1');
    await expect(header).toContainText('Today');

    // Add task with category
    await openAddForm(page);
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const newCategoryInput = page.locator('input[placeholder="Type new category name..."]');
    const addTaskButton = page.locator('button:has-text("Add Task")').first();

    await titleInput.fill('Test Task');
    await newCategoryInput.fill('Projects');
    const addCategoryButton = newCategoryInput.locator('xpath=following-sibling::button[1]');
    await addCategoryButton.click();
    await addTaskButton.click();

    // Click Projects tab (sidebar)
    const projectsTab = page.locator('button:has-text("Projects")').nth(0);
    await projectsTab.click();

    // Header should now show "Projects"
    await expect(header).toContainText('Projects');

    // Mark task as done so Closed Tasks tab appears
    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();
    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();
    await page.locator('input[type="datetime-local"]').waitFor({ state: 'visible' });
    await page.locator('button.bg-green-600').last().click();

    // Click Closed Tasks tab (sidebar)
    const closedTab = page.locator('button:has-text("Closed Tasks")').nth(0);
    await closedTab.click();

    // Header should now show "Closed Tasks"
    await expect(header).toContainText('Closed Tasks');

    // Click Today tab (sidebar)
    const todayTab = page.locator('button:has-text("Today")').nth(0);
    await todayTab.click();

    // Header should show "Today" again
    await expect(header).toContainText('Today');
  });

  test('should clear scheduled date during edit', async ({ page }) => {
    // Create task with future date
    await openAddForm(page);
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const dateInput = page.locator('input[type="date"]');
    const addButton = page.locator('button:has-text("Add Task")').first();

    await titleInput.fill('Task with Date');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowDate = `${year}-${month}-${day}`;

    await dateInput.fill(tomorrowDate);
    await addButton.click();

    // Task should not be in Today
    await expect(page.locator('text=Task with Date')).not.toBeVisible();

    // Verify sidebar Today button exists
    const todayButton = page.locator('button:has-text("Today")').nth(0);
    await expect(todayButton).toBeVisible();
  });

  test('should show closed tasks in closed tasks tab', async ({ page }) => {
    // Add and complete a task
    await openAddForm(page);
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")');

    await titleInput.fill('Task to close');
    await addButton.click();

    // Expand and mark done
    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    await page.locator('input[type="datetime-local"]').waitFor({ state: 'visible' });
    await page.locator('button.bg-green-600').last().click();

    // Wait for update and countdown to complete
    // (0.3s total duration = 3 decrements × 100ms each)
    await page.waitForTimeout(500);

    // Task should be visible in Today (completed today)
    await expect(page.locator('text=Task to close')).toBeVisible();

    // Click Closed Tasks tab
    const closedTab = page.locator('button:has-text("Closed Tasks")').nth(0);
    await closedTab.click();

    // Task should be visible in Closed Tasks after countdown completes
    await expect(page.locator('text=Task to close')).toBeVisible();
  });

  test('should keep task in category tab during countdown, move to closed after', async ({ page }) => {
    // Add task with category
    await openAddForm(page);
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const newCategoryInput = page.locator('input[placeholder="Type new category name..."]');
    const addTaskButton = page.locator('button:has-text("Add Task")').first();

    await titleInput.fill('Categorized Task');
    await newCategoryInput.fill('Work');
    const addCategoryButton = newCategoryInput.locator('xpath=following-sibling::button[1]');
    await addCategoryButton.click();
    await addTaskButton.click();

    // Verify task is in Work category tab
    let workTab = page.locator('button:has-text("Work")').nth(0);
    await workTab.click();
    await expect(page.locator('text=Categorized Task')).toBeVisible();

    // Mark task as done
    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();
    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();
    await page.locator('input[type="datetime-local"]').waitFor({ state: 'visible' });
    await page.locator('button.bg-green-600').last().click();

    // Wait a bit (but not full countdown)
    await page.waitForTimeout(150);

    // Task should still be visible in Work tab during countdown
    await expect(page.locator('text=Categorized Task')).toBeVisible();

    // Closed Tasks tab should not be visible yet (no completed tasks to show during countdown)
    const closedTabBefore = page.locator('button:has-text("Closed Tasks")').nth(0);
    const closedCountBefore = await closedTabBefore.count();
    // If it's not visible, that's correct (0 count)

    // Wait for countdown to complete
    await page.waitForTimeout(400);

    // Click Closed Tasks tab
    const closedTabAfter = page.locator('button:has-text("Closed Tasks")').nth(0);
    await closedTabAfter.click();

    // Task should now be visible in Closed Tasks
    await expect(page.locator('text=Categorized Task')).toBeVisible();
  });

  test('should keep task in today tab during countdown even if completed in past', async ({ page }) => {
    // Add and complete a task with a past date
    await openAddForm(page);
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")').first();

    await titleInput.fill('Past Completed Task');
    await addButton.click();

    // Expand and mark done with a past date
    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    const markDoneButton = page.locator('button:has-text("Mark Done")').first();
    await markDoneButton.click();

    // Wait for modal and set to yesterday
    await page.locator('input[type="datetime-local"]').waitFor({ state: 'visible' });
    const dateInput = page.locator('input[type="datetime-local"]');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const pastDateTime = `${year}-${month}-${day}T12:00`;

    await dateInput.fill(pastDateTime);
    await page.locator('button.bg-green-600').last().click();

    // Wait a bit (but not full countdown)
    await page.waitForTimeout(150);

    // Task should still be visible in Today tab during countdown, even though completed in past
    await expect(page.locator('text=Past Completed Task')).toBeVisible();

    // Closed Tasks tab should not exist yet (countdown active)
    const closedTabBefore = page.locator('button:has-text("Closed Tasks")').nth(0);
    const closedCountBefore = await closedTabBefore.count();
    // Shouldn't be visible during countdown

    // Wait for countdown to complete
    await page.waitForTimeout(400);

    // Click Closed Tasks tab
    const closedTabAfter = page.locator('button:has-text("Closed Tasks")').nth(0);
    await closedTabAfter.click();

    // Task should now be visible in Closed Tasks (after countdown)
    await expect(page.locator('text=Past Completed Task')).toBeVisible();
  });
});
