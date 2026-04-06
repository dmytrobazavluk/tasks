/**
 * Common test setup and utilities
 */

/**
 * Standard page setup for tests using memory persistence
 */
export const setupPage = async (page) => {
  // Use memory persistence for tests to avoid localStorage interference
  // Set countdown duration to 0.3 seconds for faster tests
  await page.addInitScript(() => {
    window.__APP_CONFIG__ = { persistence: 'memory' };
    window.__TEST_COUNTDOWN_DURATION__ = 0.3;
  });
  await page.goto('/');
};

/**
 * Open the add task form
 */
export const openAddForm = async (page) => {
  const addButton = page.locator('button:has-text("Add Task")').first();
  await addButton.click();
};
