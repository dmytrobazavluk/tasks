/**
 * Category Management Utilities
 * Works with explicit Category entities (id, name)
 */

import { hasAnyFutureScheduling } from '../models/Task';

/**
 * Get category by ID
 * @param {Array} categories - Array of Category objects
 * @param {string} categoryId - Category ID to find
 * @returns {Object|null} Category object or null if not found
 */
export const getCategoryById = (categories, categoryId) => {
  return categories.find(cat => cat.id === categoryId) || null;
};

/**
 * Get all unique category names used in tasks, sorted alphabetically
 * @param {Array} tasks - Array of task objects
 * @param {Array} categories - Array of Category objects
 * @returns {Array} Sorted array of unique category names (strings)
 */
export const getUniqueCategoriesFromTasks = (tasks, categories) => {
  const categoryNames = new Set();
  tasks.forEach(task => {
    const categoryIds = task.categoryIds || [];
    if (Array.isArray(categoryIds)) {
      categoryIds.forEach(id => {
        const category = getCategoryById(categories, id);
        if (category) {
          categoryNames.add(category.name);
        }
      });
    }
  });
  return Array.from(categoryNames).sort();
};

/**
 * Get tasks that belong to a specific category by category ID
 * @param {Array} tasks - Array of task objects
 * @param {string} categoryId - Category ID to filter by
 * @returns {Array} Tasks that have the specified category ID
 */
export const getTasksByCategoryId = (tasks, categoryId) => {
  return tasks.filter(task => {
    const categoryIds = task.categoryIds || [];
    return Array.isArray(categoryIds) && categoryIds.includes(categoryId);
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
 * Get all tasks for "Today" tab (incomplete + today's completed + any with active countdown, excluding scheduled)
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Tasks for Today (incomplete non-scheduled, completed today, or in countdown grace period)
 */
export const getTodayTasks = (tasks) => {
  const todayDateKey = getTodayDateKey();

  return tasks.filter(task => {
    // Exclude any task with future scheduling (soon or specific date)
    if (hasAnyFutureScheduling(task)) return false;

    // Incomplete tasks
    if (!task.completed) {
      return true;
    }

    // Completed tasks - include if completed today or has active countdown
    if (task.completionDate) {
      const completionDateKey = getDateKey(task.completionDate);
      const completedToday = completionDateKey === todayDateKey;
      const hasCountdown = task.removalCountdown && task.removalCountdown > 0;
      return completedToday || hasCountdown;
    }

    return false;
  });
};

/**
 * Count incomplete tasks in a category by ID
 * @param {Array} tasks - Array of task objects
 * @param {string} categoryId - Category ID
 * @returns {number} Count of incomplete tasks in category
 */
export const countTasksInCategoryId = (tasks, categoryId) => {
  return getTasksByCategoryId(tasks, categoryId).filter(task => !task.completed).length;
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
 * Count tasks for Future tab (scheduled tasks)
 * @param {Array} tasks - Array of task objects
 * @returns {number} Count of future scheduled tasks
 */
export const countFutureTasks = (tasks) => {
  return tasks.filter(task => !task.completed && hasAnyFutureScheduling(task)).length;
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

/**
 * Get category IDs used in tasks
 * @param {Array} tasks - Array of task objects
 * @returns {Set} Set of used category IDs
 */
const getUsedCategoryIds = (tasks) => {
  const used = new Set();
  tasks.forEach(task => {
    const categoryIds = task.categoryIds || [];
    categoryIds.forEach(id => used.add(id));
  });
  return used;
};

/**
 * Cleanup orphaned categories (ones not referenced by any task)
 * @param {Array} tasks - All tasks
 * @param {Array} categories - All categories
 * @returns {Array} Filtered categories that are referenced by at least one task
 */
export const cleanupOrphanedCategories = (tasks, categories) => {
  const usedCategoryIds = getUsedCategoryIds(tasks);
  return categories.filter(category => usedCategoryIds.has(category.id));
};
