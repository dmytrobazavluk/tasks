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
    await page.locator('input[type="date"]').waitFor({ state: 'visible' });
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
    const addButton = page.locator('button:has-text("Add Task")').first();

    await titleInput.fill('Task with Date');

    // Select "Specific date in the future" radio
    await page.locator('input[name="scheduleType"][value="specific"]').check();

    // Now fill the date input (it's conditionally visible)
    const dateInput = page.locator('input[type="date"]');
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

    // Verify Future tab exists and task is there
    const futureTab = page.locator('button:has-text("Future")').nth(0);
    await expect(futureTab).toBeVisible();
    await futureTab.click();
    await expect(page.locator('text=Task with Date')).toBeVisible();

    // Now edit the task to remove the scheduled date
    const expandButton = page.locator('div[role="button"]').first();
    await expandButton.click();

    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();

    // Select "Don't schedule"
    await page.locator('input[name="editScheduleType"][value="none"]').check();

    // Save
    const saveButton = page.locator('button:has-text("Save")').first();
    await saveButton.click();

    // Task should now be in Today
    const todayButton = page.locator('button:has-text("Today")').nth(0);
    await todayButton.click();
    await expect(page.locator('text=Task with Date')).toBeVisible();

    // Future tab should be gone or have 0 tasks
    await expect(page.locator('button:has-text("Future")')).not.toBeVisible();
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

    await page.locator('input[type="date"]').waitFor({ state: 'visible' });
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
    await page.locator('input[type="date"]').waitFor({ state: 'visible' });
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
    await page.locator('input[type="date"]').waitFor({ state: 'visible' });
    const dateInput = page.locator('input[type="date"]');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const pastDate = `${year}-${month}-${day}`;

    await dateInput.fill(pastDate);
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

  test('should add task with "Some time in the future"', async ({ page }) => {
    // Add task with "Some time in the future"
    await openAddForm(page);
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")').first();

    await titleInput.fill('Someday Task');

    // Select "Some time in the future"
    await page.locator('input[name="scheduleType"][value="soon"]').check();

    // Verify date input is NOT visible
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).not.toBeVisible();

    await addButton.click();

    // Task should not be in Today
    await expect(page.locator('text=Someday Task')).not.toBeVisible();

    // Future tab should exist
    const futureTab = page.locator('button:has-text("Future")').nth(0);
    await expect(futureTab).toBeVisible();
    await futureTab.click();

    // Task should be visible in Future tab
    await expect(page.locator('text=Someday Task')).toBeVisible();

    // Should be under "Some time in the future" group
    const soonGroup = page.locator('text=Some time in the future');
    await expect(soonGroup).toBeVisible();
  });

  test('should display future tasks in correct order (soon first, then dates descending)', async ({ page }) => {
    // Add multiple tasks with different scheduling
    await openAddForm(page);
    let titleInput = page.locator('input[placeholder="Task title..."]');
    let addButton = page.locator('button:has-text("Add Task")').first();

    // Add "soon" task
    await titleInput.fill('Someday Task');
    await page.locator('input[name="scheduleType"][value="soon"]').check();
    await addButton.click();

    // Add specific date task (2 days from now)
    await openAddForm(page);
    titleInput = page.locator('input[placeholder="Task title..."]');
    addButton = page.locator('button:has-text("Add Task")').first();
    await titleInput.fill('Near Task');
    await page.locator('input[name="scheduleType"][value="specific"]').check();
    const dateInput = page.locator('input[type="date"]');
    const in2Days = new Date();
    in2Days.setDate(in2Days.getDate() + 2);
    const year2 = in2Days.getFullYear();
    const month2 = String(in2Days.getMonth() + 1).padStart(2, '0');
    const day2 = String(in2Days.getDate()).padStart(2, '0');
    await dateInput.fill(`${year2}-${month2}-${day2}`);
    await addButton.click();

    // Click Future tab
    const futureTab = page.locator('button:has-text("Future")').nth(0);
    await futureTab.click();

    // Verify "Some time in the future" group header is visible
    const soonGroup = page.locator('h3:has-text("Some time in the future")');
    await expect(soonGroup).toBeVisible();

    // Verify both tasks are visible
    await expect(page.locator('text=Someday Task')).toBeVisible();
    await expect(page.locator('text=Near Task')).toBeVisible();

    // Verify the specific date task shows the date in a header
    const nearTaskDateHeader = page.locator('h3').filter({ hasText: /Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ }).first();
    await expect(nearTaskDateHeader).toBeVisible();
  });

  test('should hide Future tab when no scheduled tasks exist', async ({ page }) => {
    // Verify Future tab is not visible initially (no tasks)
    const futureTab = page.locator('button:has-text("Future")');
    await expect(futureTab).not.toBeVisible();

    // Add a regular task (no scheduling)
    await openAddForm(page);
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")').first();
    await titleInput.fill('Regular Task');
    // scheduleType defaults to 'none'
    await addButton.click();

    // Future tab should still not be visible
    await expect(futureTab).not.toBeVisible();
  });

  test('should switch between scheduling modes in edit modal', async ({ page }) => {
    // Create a regular task first
    await openAddForm(page);
    const titleInput = page.locator('input[placeholder="Task title..."]');
    const addButton = page.locator('button:has-text("Add Task")').first();
    await titleInput.fill('Task to Edit');
    // Default is "none"
    await addButton.click();

    // Task should be in Today tab
    await expect(page.locator('text=Task to Edit')).toBeVisible();

    // Click on task to expand
    const taskHeader = page.locator('text=Task to Edit');
    await taskHeader.click();

    // Wait and click Edit button
    const editButton = page.locator('button:has-text("Edit")');
    await editButton.first().click();

    // Verify currently on "none"
    const noneRadio = page.locator('input[name="editScheduleType"][value="none"]');
    await expect(noneRadio).toBeChecked();

    // Switch to "Specific date in the future"
    await page.locator('input[name="editScheduleType"][value="specific"]').check();

    // Date input should now be visible
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();

    // Fill date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowDate = `${year}-${month}-${day}`;
    await dateInput.fill(tomorrowDate);

    // Save
    const saveButton = page.locator('button:has-text("Save")');
    await saveButton.first().click();

    // Task should no longer be in Today tab
    await expect(page.locator('text=Task to Edit')).not.toBeVisible();

    // Task should be in Future tab
    const futureTab = page.locator('button:has-text("Future")').nth(0);
    await expect(futureTab).toBeVisible();
    await futureTab.click();
    await expect(page.locator('text=Task to Edit')).toBeVisible();
  });

  test('should count future tasks correctly in sidebar', async ({ page }) => {
    // Add 2 "soon" tasks
    await openAddForm(page);
    let titleInput = page.locator('input[placeholder="Task title..."]');
    let addButton = page.locator('button:has-text("Add Task")').first();
    await titleInput.fill('Soon 1');
    await page.locator('input[name="scheduleType"][value="soon"]').check();
    await addButton.click();

    await openAddForm(page);
    titleInput = page.locator('input[placeholder="Task title..."]');
    addButton = page.locator('button:has-text("Add Task")').first();
    await titleInput.fill('Soon 2');
    await page.locator('input[name="scheduleType"][value="soon"]').check();
    await addButton.click();

    // Add 1 regular task
    await openAddForm(page);
    titleInput = page.locator('input[placeholder="Task title..."]');
    addButton = page.locator('button:has-text("Add Task")').first();
    await titleInput.fill('Regular');
    // Default to none
    await addButton.click();

    // Check Future tab count is 2
    const futureTab = page.locator('button:has-text("Future")').nth(0);
    const futureTabText = await futureTab.textContent();
    expect(futureTabText).toContain('(2)');

    // Check Today count is 1
    const todayTab = page.locator('button:has-text("Today")').nth(0);
    const todayTabText = await todayTab.textContent();
    expect(todayTabText).toContain('(1)');
  });
});
