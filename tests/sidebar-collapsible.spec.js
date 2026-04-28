import { test, expect } from '@playwright/test';
import { setupPage, openAddForm } from './setup';

test.describe('Sidebar Collapsible Sections', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('PROJECTS section is collapsed by default', async ({ page }) => {
    // Add a task with a project
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Project Task');

    // Add project directly to the input field
    const newProjectInput = page.locator('input[placeholder="Type new project name..."]');
    const addProjectButton = newProjectInput.locator('xpath=following-sibling::button[1]');
    await newProjectInput.fill('Work');
    await addProjectButton.click();

    // Submit form
    await page.click('button:has-text("Add Task")');

    // Check PROJECTS header is visible
    const projectsHeader = page.locator('button').filter({ hasText: /Projects/ });
    await expect(projectsHeader).toBeVisible();

    // Check that project items are NOT visible (collapsed)
    const workProject = page.locator('button').filter({ hasText: /Work \(/ });
    await expect(workProject).not.toBeVisible();

    // Check that "No Project" is NOT visible (collapsed)
    const noProjectBtn = page.locator('button').filter({ hasText: /No Project/ });
    await expect(noProjectBtn).not.toBeVisible();
  });

  test('CATEGORIES section is collapsed by default', async ({ page }) => {
    // Add a task with a category
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Category Task');

    // Add category directly
    const newCategoryInput = page.locator('input[placeholder="Type new category name..."]');
    const addCategoryButton = newCategoryInput.locator('xpath=following-sibling::button[1]');
    await newCategoryInput.fill('Work');
    await addCategoryButton.click();

    // Submit form
    await page.click('button:has-text("Add Task")');

    // Check CATEGORIES header is visible
    const categoriesHeader = page.locator('button').filter({ hasText: /Categories/ });
    await expect(categoriesHeader).toBeVisible();

    // Check that category items are NOT visible (collapsed)
    const workCategory = page.locator('button').filter({ hasText: /Work \(/ });
    await expect(workCategory).not.toBeVisible();
  });

  test('clicking PROJECTS header expands the section', async ({ page }) => {
    // Add a task with a project
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Project Task');

    const newProjectInput = page.locator('input[placeholder="Type new project name..."]');
    const addProjectButton = newProjectInput.locator('xpath=following-sibling::button[1]');
    await newProjectInput.fill('Work');
    await addProjectButton.click();
    await page.click('button:has-text("Add Task")');

    // Click PROJECTS header to expand
    const projectsHeader = page.locator('button').filter({ hasText: /Projects/ });
    await projectsHeader.click();

    // Check that project items ARE now visible
    const workProject = page.locator('button').filter({ hasText: /Work \(/ });
    await expect(workProject).toBeVisible();

    // Check arrow indicator shows expanded state (▼)
    const arrow = projectsHeader.locator('span').last();
    const arrowText = await arrow.textContent();
    expect(arrowText).toBe('▼');
  });

  test('clicking CATEGORIES header expands the section', async ({ page }) => {
    // Add a task with a category
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Category Task');

    const newCategoryInput = page.locator('input[placeholder="Type new category name..."]');
    const addCategoryButton = newCategoryInput.locator('xpath=following-sibling::button[1]');
    await newCategoryInput.fill('Work');
    await addCategoryButton.click();
    await page.click('button:has-text("Add Task")');

    // Click CATEGORIES header to expand
    const categoriesHeader = page.locator('button').filter({ hasText: /Categories/ });
    await categoriesHeader.click();

    // Check that category items ARE now visible
    const workCategory = page.locator('button').filter({ hasText: /Work \(/ });
    await expect(workCategory).toBeVisible();

    // Check arrow indicator shows expanded state (▼)
    const arrow = categoriesHeader.locator('span').last();
    const arrowText = await arrow.textContent();
    expect(arrowText).toBe('▼');
  });

  test('clicking PROJECTS header again collapses the section', async ({ page }) => {
    // Add a task with a project
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Project Task');

    const newProjectInput = page.locator('input[placeholder="Type new project name..."]');
    const addProjectButton = newProjectInput.locator('xpath=following-sibling::button[1]');
    await newProjectInput.fill('Work');
    await addProjectButton.click();
    await page.click('button:has-text("Add Task")');

    // Click to expand
    const projectsHeader = page.locator('button').filter({ hasText: /Projects/ });
    await projectsHeader.click();

    // Verify it's expanded
    let workProject = page.locator('button').filter({ hasText: /Work \(/ });
    await expect(workProject).toBeVisible();

    // Click again to collapse
    await projectsHeader.click();

    // Verify it's collapsed
    workProject = page.locator('button').filter({ hasText: /Work \(/ });
    await expect(workProject).not.toBeVisible();

    // Check arrow indicator shows collapsed state (▶)
    const arrow = projectsHeader.locator('span').last();
    const arrowText = await arrow.textContent();
    expect(arrowText).toBe('▶');
  });

  test('clicking CATEGORIES header again collapses the section', async ({ page }) => {
    // Add a task with a category
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Category Task');

    const newCategoryInput = page.locator('input[placeholder="Type new category name..."]');
    const addCategoryButton = newCategoryInput.locator('xpath=following-sibling::button[1]');
    await newCategoryInput.fill('Work');
    await addCategoryButton.click();
    await page.click('button:has-text("Add Task")');

    // Click to expand
    const categoriesHeader = page.locator('button').filter({ hasText: /Categories/ });
    await categoriesHeader.click();

    // Verify it's expanded
    let workCategory = page.locator('button').filter({ hasText: /Work \(/ });
    await expect(workCategory).toBeVisible();

    // Click again to collapse
    await categoriesHeader.click();

    // Verify it's collapsed
    workCategory = page.locator('button').filter({ hasText: /Work \(/ });
    await expect(workCategory).not.toBeVisible();

    // Check arrow indicator shows collapsed state (▶)
    const arrow = categoriesHeader.locator('span').last();
    const arrowText = await arrow.textContent();
    expect(arrowText).toBe('▶');
  });

  test('"No Project" button is inside PROJECTS section when expanded', async ({ page }) => {
    // Add one task with a project and one without
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Project Task');

    const newProjectInput = page.locator('input[placeholder="Type new project name..."]');
    const addProjectButton = newProjectInput.locator('xpath=following-sibling::button[1]');
    await newProjectInput.fill('Work');
    await addProjectButton.click();
    await page.click('button:has-text("Add Task")');

    // Add task without project
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'No Project Task');
    await page.click('button:has-text("Add Task")');

    // Initially "No Project" should be hidden
    const noProjectBtn = page.locator('button').filter({ hasText: /No Project/ });
    await expect(noProjectBtn).not.toBeVisible();

    // Expand PROJECTS
    const projectsHeader = page.locator('button').filter({ hasText: /Projects/ });
    await projectsHeader.click();

    // Now "No Project" should be visible
    await expect(noProjectBtn).toBeVisible();
  });

  test('multiple projects show when PROJECTS is expanded', async ({ page }) => {
    // Add tasks with different projects
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Task 1');

    let newProjectInput = page.locator('input[placeholder="Type new project name..."]');
    let addProjectButton = newProjectInput.locator('xpath=following-sibling::button[1]');
    await newProjectInput.fill('Work');
    await addProjectButton.click();
    await page.click('button:has-text("Add Task")');

    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Task 2');

    newProjectInput = page.locator('input[placeholder="Type new project name..."]');
    addProjectButton = newProjectInput.locator('xpath=following-sibling::button[1]');
    await newProjectInput.fill('Personal');
    await addProjectButton.click();
    await page.click('button:has-text("Add Task")');

    // Expand PROJECTS
    const projectsHeader = page.locator('button').filter({ hasText: /Projects/ });
    await projectsHeader.click();

    // Both projects should be visible
    const workProject = page.locator('button').filter({ hasText: /Work \(/ });
    const personalProject = page.locator('button').filter({ hasText: /Personal \(/ });

    await expect(workProject).toBeVisible();
    await expect(personalProject).toBeVisible();

    // Collapse and verify both are hidden
    await projectsHeader.click();
    await expect(workProject).not.toBeVisible();
    await expect(personalProject).not.toBeVisible();
  });

  test('multiple categories show when CATEGORIES is expanded', async ({ page }) => {
    // Add tasks with different categories
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Task 1');

    let newCategoryInput = page.locator('input[placeholder="Type new category name..."]');
    let addCategoryButton = newCategoryInput.locator('xpath=following-sibling::button[1]');
    await newCategoryInput.fill('Work');
    await addCategoryButton.click();
    await page.click('button:has-text("Add Task")');

    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Task 2');

    newCategoryInput = page.locator('input[placeholder="Type new category name..."]');
    addCategoryButton = newCategoryInput.locator('xpath=following-sibling::button[1]');
    await newCategoryInput.fill('Personal');
    await addCategoryButton.click();
    await page.click('button:has-text("Add Task")');

    // Expand CATEGORIES
    const categoriesHeader = page.locator('button').filter({ hasText: /Categories/ });
    await categoriesHeader.click();

    // Both categories should be visible
    const workCategory = page.locator('button').filter({ hasText: /Work \(/ });
    const personalCategory = page.locator('button').filter({ hasText: /Personal \(/ });

    await expect(workCategory).toBeVisible();
    await expect(personalCategory).toBeVisible();

    // Collapse and verify both are hidden
    await categoriesHeader.click();
    await expect(workCategory).not.toBeVisible();
    await expect(personalCategory).not.toBeVisible();
  });

  test('can still select tabs when sections are expanded', async ({ page }) => {
    // Add a task with a project
    await openAddForm(page);
    await page.fill('input[placeholder="Task title..."]', 'Project Task');

    const newProjectInput = page.locator('input[placeholder="Type new project name..."]');
    const addProjectButton = newProjectInput.locator('xpath=following-sibling::button[1]');
    await newProjectInput.fill('Work');
    await addProjectButton.click();
    await page.click('button:has-text("Add Task")');

    // Expand PROJECTS
    const projectsHeader = page.locator('button').filter({ hasText: /Projects/ });
    await projectsHeader.click();

    // Click on the Work project
    const workProject = page.locator('button').filter({ hasText: /Work \(/ });
    await workProject.click();

    // Verify we're on the Work project tab
    // The work project button should be highlighted (selected state)
    const classValue = await workProject.evaluate(el => el.className);
    expect(classValue).toContain('bg-blue-600');
  });
});
