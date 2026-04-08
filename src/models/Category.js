/**
 * Category Model
 * Explicit entity for task categories with id and name
 */

/**
 * Generate a unique ID for a category
 * Uses crypto.randomUUID if available, falls back to timestamp + random
 */
function generateUniqueId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new Category entity
 * @param {string} name - Category name
 * @returns {Object} Category with id and name
 */
export function createCategory(name) {
  return {
    id: generateUniqueId(),
    name: name.trim()
  };
}

/**
 * Validate a category object
 * @param {Object} category - Category to validate
 * @returns {boolean} True if valid category
 */
export function isValidCategory(category) {
  return (
    category &&
    typeof category.id === 'string' &&
    category.id.length > 0 &&
    typeof category.name === 'string' &&
    category.name.length > 0
  );
}
