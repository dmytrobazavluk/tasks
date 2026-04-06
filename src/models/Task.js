/**
 * Task Model
 *
 * Represents a single task item with metadata about creation and completion.
 *
 * Structure:
 * {
 *   id: number - unique identifier (timestamp-based)
 *   title: string - task description
 *   completed: boolean - whether task is done
 *   addedDate: string - ISO timestamp when task was created
 *   completionDate: string|null - ISO timestamp when task was completed (null if not completed)
 * }
 */

/**
 * Create a new Task
 * @param {string} title - Task description
 * @returns {Object} New task object
 */
export const createTask = (title) => ({
  id: Date.now(),
  title,
  completed: false,
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
  return (
    task &&
    typeof task.id === 'number' &&
    typeof task.title === 'string' &&
    typeof task.completed === 'boolean' &&
    typeof task.addedDate === 'string' &&
    (task.completionDate === null || typeof task.completionDate === 'string')
  );
};

/**
 * Type definition for Task (JSDoc comment for IDE support)
 * @typedef {Object} Task
 * @property {number} id
 * @property {string} title
 * @property {boolean} completed
 * @property {string} addedDate - ISO timestamp
 * @property {string|null} completionDate - ISO timestamp or null
 */
