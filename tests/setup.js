/**
 * Common test setup and utilities
 */

/**
 * Standard page setup for tests using memory persistence
 */
export const setupPage = async (page) => {
  // Use memory persistence for tests to avoid localStorage interference
  await page.addInitScript(() => {
    window.__APP_CONFIG__ = { persistence: 'memory' };
  });
  await page.goto('/');
};
