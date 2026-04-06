/**
 * Application Configuration
 */

// Countdown configuration (in seconds)
export const COUNTDOWN_CONFIG = {
  // Total duration before task is hidden/completed
  duration: typeof window !== 'undefined' && window.__TEST_COUNTDOWN_DURATION__
    ? window.__TEST_COUNTDOWN_DURATION__
    : 3,

  // Decrement interval (in seconds)
  decrement: 0.1,
};
