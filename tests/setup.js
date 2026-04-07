/**
 * Common test setup and utilities
 */

/**
 * Standard page setup for tests using memory persistence
 */
export const setupPage = async (page, countdownDuration = 0.3) => {
  // Use memory persistence for tests to avoid localStorage interference
  // Set countdown duration (default 0.3s for faster tests, can be overridden)
  await page.addInitScript(({ duration }) => {
    window.__APP_CONFIG__ = { persistence: 'memory' };
    window.__TEST_COUNTDOWN_DURATION__ = duration;
  }, { duration: countdownDuration });
  await page.goto('/');
};

/**
 * Open the add task form
 */
export const openAddForm = async (page) => {
  const addButton = page.locator('button:has-text("Add Task")').first();
  await addButton.click();
};

/**
 * Mark a task as done by clicking Mark Done and confirming the date/time modal
 */
export const markTaskDone = async (page) => {
  let maxRetries = 3;
  let lastError;

  while (maxRetries > 0) {
    try {
      // Small initial wait for DOM to settle
      await page.waitForTimeout(100);

      // Wait for Mark Done button to be available
      const markDoneButton = page.locator('button:has-text("Mark Done")').first();
      await markDoneButton.waitFor({ state: 'visible', timeout: 5000 });

      // Click it with a delay to simulate natural interaction
      await markDoneButton.click({ delay: 100 });

      // Wait a moment for modal to render
      await page.waitForTimeout(200);

      // Check if modal appeared (look for the datetime input)
      const modalInput = page.locator('input[type="datetime-local"]');
      await modalInput.waitFor({ state: 'visible', timeout: 3000 });

      // Modal is here, now click Confirm
      const confirmButton = page.locator('button.bg-green-600').last();
      await confirmButton.waitFor({ state: 'visible', timeout: 2000 });
      await confirmButton.click();

      // Success, exit retry loop
      return;
    } catch (error) {
      lastError = error;
      maxRetries--;
      if (maxRetries > 0) {
        // Retry with a longer wait
        await page.waitForTimeout(500);
      }
    }
  }

  // If we got here, all retries failed
  throw new Error(`Failed to mark task done after 3 attempts: ${lastError?.message}`);
};
