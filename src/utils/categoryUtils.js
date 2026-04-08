/**
 * Category Management Utilities
 */

/**
 * Get all unique categories from tasks, sorted alphabetically
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted array of unique category names
 */
export const getUniqueCategoriesFromTasks = (tasks) => {
  const categories = new Set();
  tasks.forEach(task => {
    const taskCategories = task.categories || [];
    if (Array.isArray(taskCategories)) {
      taskCategories.forEach(cat => categories.add(cat));
    }
  });
  return Array.from(categories).sort();
};

/**
 * Get tasks that belong to a specific category
 * @param {Array} tasks - Array of task objects
 * @param {string} category - Category name to filter by
 * @returns {Array} Tasks that have the specified category
 */
export const getTasksByCategory = (tasks, category) => {
  return tasks.filter(task => {
    const categories = task.categories || [];
    return Array.isArray(categories) && categories.includes(category);
  });
};

/**
 * Get only incomplete tasks (for Today and category tabs)
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Incomplete tasks
 */
export const getIncompleteTasks = (tasks) => {
  return tasks.filter(task => !task.completed);
};

/**
 * Get completed tasks grouped by completion date
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Structure: { groups: [{ dateKey, date, tasks }], singularTasks: [] }
 */
export const getClosedTasksGroupedByDate = (tasks) => {
  const completedTasks = tasks.filter(task => task.completed);

  const groupMap = new Map();

  completedTasks.forEach(task => {
    if (task.completionDate) {
      const dateKey = task.completionDate.split('T')[0]; // YYYY-MM-DD
      if (!groupMap.has(dateKey)) {
        groupMap.set(dateKey, []);
      }
      groupMap.get(dateKey).push(task);
    }
  });

  // Sort groups by date (most recent first)
  const groups = Array.from(groupMap.entries())
    .map(([dateKey, taskList]) => ({
      dateKey,
      tasks: taskList
    }))
    .sort((a, b) => new Date(b.dateKey) - new Date(a.dateKey));

  return { groups };
};

/**
 * Get today's date as YYYY-MM-DD string
 */
const getTodayDateKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get date portion from ISO string (YYYY-MM-DD)
 */
const getDateKey = (isoString) => {
  if (!isoString) return null;
  return isoString.split('T')[0];
};

/**
 * Get all tasks for "Today" tab (incomplete + today's completed + any with active countdown)
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Tasks for Today (incomplete, completed today, or in countdown grace period)
 */
export const getTodayTasks = (tasks) => {
  const todayDateKey = getTodayDateKey();

  return tasks.filter(task => {
    // Incomplete tasks with no future scheduled date
    if (!task.completed && !task.scheduledDate) {
      return true;
    }

    // Completed tasks - include if completed today or has active countdown
    if (task.completed && task.completionDate) {
      const completionDateKey = getDateKey(task.completionDate);
      const completedToday = completionDateKey === todayDateKey;
      const hasCountdown = task.removalCountdown && task.removalCountdown > 0;
      return completedToday || hasCountdown;
    }

    return false;
  });
};

/**
 * Count tasks in a category
 * @param {Array} tasks - Array of task objects
 * @param {string} category - Category name
 * @returns {number} Count of tasks in category (only incomplete tasks)
 */
export const countTasksInCategory = (tasks, category) => {
  return getTasksByCategory(tasks, category).filter(task => !task.completed).length;
};

/**
 * Count tasks for Today tab
 * @param {Array} tasks - Array of task objects
 * @returns {number} Count of Today tasks
 */
export const countTodayTasks = (tasks) => {
  return getTodayTasks(tasks).length;
};

/**
 * Count closed tasks (all completed tasks)
 * @param {Array} tasks - Array of task objects
 * @returns {number} Count of completed tasks
 */
export const countClosedTasks = (tasks) => {
  return tasks.filter(task => task.completed).length;
};

/**
 * Count closed tasks without active countdown
 * (Tasks ready to show in Closed Tasks tab)
 * @param {Array} tasks - Array of task objects
 * @returns {number} Count of closed tasks without countdown
 */
export const countClosedTasksWithoutCountdown = (tasks) => {
  return tasks.filter(task => {
    if (!task.completed) return false;
    const hasCountdown = task.removalCountdown && task.removalCountdown > 0;
    // Exclude any completed task with active countdown
    return !hasCountdown;
  }).length;
};
