/**
 * Task Grouping Utilities (Tab-based)
 *
 * Groups tasks based on selected tab:
 * - "Today": All incomplete + today's completed tasks (excluding scheduled tasks)
 * - "Future": All scheduled tasks (both 'soon' and 'specific' date tasks)
 * - Categories: Tasks with that category, grouped by scheduledDate
 * - "Closed Tasks": All completed tasks, grouped by completionDate
 */

import { hasAnyFutureScheduling } from '../models/Task';

/**
 * Get today's date in YYYY-MM-DD format (local time)
 */
export const getTodayDateKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Extract date portion (YYYY-MM-DD) from ISO datetime string
 * @param {string} isoDateString - ISO 8601 datetime string
 * @returns {string} Date in YYYY-MM-DD format
 */
export const getDateKey = (isoDateString) => {
  if (!isoDateString) return null;
  return isoDateString.split('T')[0];
};

/**
 * Check if a date is today (in local time)
 * @param {string} isoDateString - ISO 8601 datetime string
 * @returns {boolean} True if date is today
 */
export const isToday = (isoDateString) => {
  if (!isoDateString) return false;
  return getDateKey(isoDateString) === getTodayDateKey();
};

/**
 * Group tasks by scheduled date (for future dates view)
 * @param {Array} taskList - Tasks to group
 * @returns {Array} Groups: [{ dateKey, tasks }] sorted chronologically
 */
const groupByScheduledDate = (taskList) => {
  const groups = {};
  const todayKey = getTodayDateKey();

  taskList.forEach(task => {
    const dateKey = task.scheduledDate || todayKey;
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(task);
  });

  return Object.entries(groups)
    .map(([dateKey, tasks]) => ({ dateKey, tasks }))
    .sort((a, b) => {
      if (a.dateKey === todayKey) return -1; // Today first
      if (b.dateKey === todayKey) return 1;
      return new Date(a.dateKey) - new Date(b.dateKey); // Chronologically
    });
};

/**
 * Group tasks by completion date (for Closed Tasks tab)
 * @param {Array} taskList - Completed tasks to group
 * @returns {Array} Groups: [{ dateKey, tasks }] sorted by date (most recent first)
 */
const groupByCompletionDate = (taskList) => {
  const groups = {};

  taskList.forEach(task => {
    if (task.completionDate) {
      const dateKey = getDateKey(task.completionDate);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(task);
    }
  });

  return Object.entries(groups)
    .map(([dateKey, tasks]) => ({ dateKey, tasks }))
    .sort((a, b) => new Date(b.dateKey) - new Date(a.dateKey)); // Most recent first
};

/**
 * Get tasks for "Today" tab
 * (Incomplete + today's completed + any completed with active countdown, excluding scheduled tasks)
 * @param {Array} tasks - All tasks
 * @returns {Array} Groups: [{ dateKey, tasks }]
 */
export const getTasksForToday = (tasks) => {
  const todayDate = getTodayDateKey();
  const todayTasks = tasks.filter(task => {
    // Exclude any task with future scheduling (soon or specific date)
    if (hasAnyFutureScheduling(task)) return false;

    // Incomplete tasks
    if (!task.completed) return true;

    // Completed tasks - include if:
    // 1. Completed today, OR
    // 2. Has active countdown (grace period - keep visible)
    if (task.completionDate) {
      const completedToday = getDateKey(task.completionDate) === todayDate;
      const hasCountdown = task.removalCountdown && task.removalCountdown > 0;
      if (completedToday || hasCountdown) return true;
    }
    return false;
  });

  // Group by date (Today only)
  return [{ dateKey: todayDate, tasks: todayTasks }];
};

/**
 * Get tasks for "Future" tab
 * (All tasks marked as scheduled: 'soon' or 'specific' date)
 * Groups: First "Some time in the future" tasks, then specific date tasks in descending order
 * @param {Array} tasks - All tasks
 * @returns {Array} Groups: [{ dateKey, label, tasks }]
 */
export const getTasksForFutureTab = (tasks) => {
  // Separate soon and specific tasks
  const soonTasks = tasks.filter(task => task.scheduleType === 'soon' && !task.completed);

  const specificTasks = tasks.filter(
    task => task.scheduleType === 'specific' && task.scheduledDate && !task.completed
  );

  // Group specific date tasks by date
  const groupsByDate = {};
  specificTasks.forEach(task => {
    const dateKey = task.scheduledDate;
    if (!groupsByDate[dateKey]) {
      groupsByDate[dateKey] = [];
    }
    groupsByDate[dateKey].push(task);
  });

  // Build groups array: 'soon' first, then dates in descending order
  const groups = [];

  // Add "Some time in the future" group if there are any
  if (soonTasks.length > 0) {
    groups.push({
      dateKey: 'soon',
      tasks: soonTasks
    });
  }

  // Add specific date groups in descending order (newest/nearest first)
  Object.entries(groupsByDate)
    .sort((a, b) => new Date(b[0]) - new Date(a[0])) // Descending date order
    .forEach(([dateKey, groupTasks]) => {
      groups.push({
        dateKey,
        tasks: groupTasks
      });
    });

  return groups;
};

/**
 * Get tasks for a specific category tab
 * (Grouped by scheduledDate chronologically)
 * @param {Array} tasks - All tasks
 * @param {string|Object} categoryId - Category ID (string) or Category object with id property
 * @returns {Array} Groups: [{ dateKey, tasks }] sorted chronologically
 */
export const getTasksForCategory = (tasks, categoryId) => {
  // Handle both string ID and object with id property
  const id = typeof categoryId === 'string' ? categoryId : categoryId?.id;

  const categoryTasks = tasks.filter(task => {
    const categoryIds = task.categoryIds || [];
    return Array.isArray(categoryIds) && categoryIds.includes(id);
  });

  return groupByScheduledDate(categoryTasks);
};

/**
 * Get tasks for a specific project tab
 * (Grouped by scheduledDate chronologically)
 * @param {Array} tasks - All tasks
 * @param {string|Object} projectId - Project ID (string) or Project object with id property
 * @returns {Array} Groups: [{ dateKey, tasks }] sorted chronologically
 */
export const getTasksForProjectTab = (tasks, projectId) => {
  // Handle both string ID and object with id property
  const id = typeof projectId === 'string' ? projectId : projectId?.id;

  const projectTasks = tasks.filter(task => {
    const projectIds = task.projectIds || [];
    return Array.isArray(projectIds) && projectIds.includes(id);
  });

  return groupByScheduledDate(projectTasks);
};

/**
 * Get tasks for "Closed Tasks" tab
 * (Completed tasks without active countdown)
 * @param {Array} tasks - All tasks
 * @returns {Array} Groups: [{ dateKey, tasks }] sorted by date (most recent first)
 */
export const getTasksForClosedTab = (tasks) => {
  // Include only completed tasks that have finished their countdown
  // Tasks with active countdown stay in their original tab (Today or category)
  const closedTasks = tasks.filter(task => {
    if (!task.completed) return false;
    const hasCountdown = task.removalCountdown && task.removalCountdown > 0;
    // Exclude any task with active countdown
    return !hasCountdown;
  });

  return groupByCompletionDate(closedTasks);
};

/**
 * Legacy function for backward compatibility
 * Groups tasks by date (old "Today/PastDates" structure)
 * @param {Array} tasks - Array of task objects
 * @param {boolean} showCompleted - Ignored (kept for compatibility)
 * @returns {Object} { today, pastDates } - Old structure
 */
export const getTaskGroups = (tasks, showCompleted) => {
  const todayDateKey = getTodayDateKey();
  const todayTasks = [];
  const pastGroups = {};

  // Distribute tasks into groups
  tasks.forEach(task => {
    if (!task.completed) {
      // All incomplete tasks without future scheduled date go to Today
      if (!task.scheduledDate) {
        todayTasks.push(task);
      }
    } else if (task.completionDate) {
      // Completed tasks go to their completion date group
      const dateKey = getDateKey(task.completionDate);

      // Today's completed tasks go to Today group
      if (dateKey === todayDateKey) {
        todayTasks.push(task);
      } else {
        // Past completed tasks go to past date groups
        if (!pastGroups[dateKey]) {
          pastGroups[dateKey] = [];
        }
        pastGroups[dateKey].push(task);
      }
    }
  });

  // Sort Today group: incomplete first, then completed
  const todayIncomplete = todayTasks.filter(t => !t.completed);
  const todayCompleted = todayTasks.filter(t => t.completed);

  // Convert past groups to array and sort by date (most recent first)
  const pastDatesArray = Object.entries(pastGroups)
    .map(([dateKey, groupTasks]) => ({ dateKey, tasks: groupTasks }))
    .sort((a, b) => new Date(b.dateKey) - new Date(a.dateKey));

  return {
    today: [...todayIncomplete, ...todayCompleted],
    pastDates: pastDatesArray
  };
};
