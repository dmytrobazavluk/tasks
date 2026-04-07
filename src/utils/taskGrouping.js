/**
 * Task Grouping Utilities
 *
 * Groups tasks by date:
 * - All incomplete tasks → "Today" group
 * - All completed tasks → grouped by completion date
 * - Within "Today": incomplete first, then completed
 * - Past dates ordered most recent first
 */

/**
 * Get today's date in YYYY-MM-DD format (local time)
 */
const getTodayDateKey = () => {
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
 * Group tasks by date
 *
 * Returns:
 * {
 *   today: [tasks],  // All incomplete + today's completed tasks
 *   pastDates: [
 *     { dateKey: "2026-04-05", tasks: [...] },
 *     { dateKey: "2026-04-04", tasks: [...] },
 *     ...
 *   ]
 * }
 *
 * @param {Array} tasks - Array of task objects
 * @param {boolean} showCompleted - Whether to show completed tasks
 * @returns {Object} Grouped tasks object
 */
export const getTaskGroups = (tasks, showCompleted) => {
  const todayDateKey = getTodayDateKey();
  const todayTasks = [];
  const pastGroups = {};

  // Distribute tasks into groups
  tasks.forEach(task => {
    if (!task.completed) {
      // All incomplete tasks go to Today
      todayTasks.push(task);
    } else if (!showCompleted && task.removalCountdown && task.removalCountdown > 0) {
      // Completed tasks in countdown also go to Today (when toggle is OFF)
      todayTasks.push(task);
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
