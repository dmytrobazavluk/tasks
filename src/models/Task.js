/**
 * Task Model
 *
 * Represents a single task item with metadata about creation, completion, and organization.
 *
 * Structure:
 * {
 *   id: number - unique identifier (timestamp-based)
 *   title: string - task description
 *   completed: boolean - whether task is done
 *   details: string - free-form notes or description (empty by default)
 *   scheduledDate: string|null - ISO date (YYYY-MM-DD) for future scheduling, null for today
 *   categories: string[] - array of category names (can be empty)
 *   addedDate: string - ISO timestamp when task was created
 *   completionDate: string|null - ISO timestamp when task was completed (null if not completed)
 *   removalCountdown: number|null - seconds until task auto-deletes (null if not in countdown)
 * }
 */

/**
 * Get today's date in YYYY-MM-DD format (local time)
 * @returns {string} Today's date as YYYY-MM-DD
 */
const getTodayDateKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if a date is in the future
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @returns {boolean} Whether date is in the future
 */
const isFutureDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00').getTime();
  const today = new Date(getTodayDateKey() + 'T00:00:00').getTime();
  return date > today;
};

/**
 * Normalize scheduled date: reset past/today dates to null
 * @param {string|null} dateStr - ISO date string or null
 * @returns {string|null} Future date or null if today/past
 */
export const normalizeScheduledDate = (dateStr) => {
  if (!dateStr) return null;
  return isFutureDate(dateStr) ? dateStr : null;
};

/**
 * Check if task is scheduled for the future
 * @param {Object} task - Task object
 * @returns {boolean} Whether task has a future scheduledDate
 */
export const isScheduledForFuture = (task) => {
  return task.scheduledDate !== null && isFutureDate(task.scheduledDate);
};

/**
 * Create a new Task
 * @param {string} title - Task description
 * @param {string} details - Free-form notes/description (optional)
 * @param {string|null} scheduledDate - ISO date for future scheduling (optional)
 * @param {string[]} categories - Array of category names (optional)
 * @returns {Object} New task object
 */
export const createTask = (title, details = '', scheduledDate = null, categories = []) => ({
  id: Date.now(),
  title,
  completed: false,
  details: details || '',
  scheduledDate: normalizeScheduledDate(scheduledDate),
  categories: Array.isArray(categories) ? categories.filter(c => c.trim()) : [],
  addedDate: new Date().toISOString(),
  completionDate: null,
});

/**
 * Mark a task as complete or incomplete
 * @param {Object} task - Task to update
 * @param {boolean} completed - Whether task should be marked complete
 * @returns {Object} Updated task object
 */
export const toggleTaskCompletion = (task, completed) => ({
  ...task,
  completed,
  completionDate: completed ? new Date().toISOString() : null,
});

/**
 * Validate task object
 * @param {Object} task - Task to validate
 * @returns {boolean} Whether task is valid
 */
export const isValidTask = (task) => {
  if (!task || typeof task !== 'object') return false;

  const hasValidBasics =
    typeof task.id === 'number' &&
    typeof task.title === 'string' &&
    typeof task.completed === 'boolean' &&
    typeof task.details === 'string' &&
    typeof task.addedDate === 'string' &&
    (task.completionDate === null || typeof task.completionDate === 'string');

  const hasValidScheduling =
    (task.scheduledDate === null || typeof task.scheduledDate === 'string');

  const hasValidCategories =
    Array.isArray(task.categories) &&
    task.categories.every(c => typeof c === 'string');

  return hasValidBasics && hasValidScheduling && hasValidCategories;
};

/**
 * Type definition for Task (JSDoc comment for IDE support)
 * @typedef {Object} Task
 * @property {number} id
 * @property {string} title
 * @property {boolean} completed
 * @property {string} details - Free-form notes/description
 * @property {string|null} scheduledDate - ISO date (YYYY-MM-DD) for future dates or null
 * @property {string[]} categories - Array of category names
 * @property {string} addedDate - ISO timestamp
 * @property {string|null} completionDate - ISO timestamp or null
 */
