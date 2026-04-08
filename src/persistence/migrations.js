/**
 * Data Migration Utilities
 * Handles backward compatibility when migrating from old data formats
 */

import { createCategory } from '../models/Category';

/**
 * Migrate tasks from old format (task.categories as strings)
 * to new format (task.categoryIds + separate categories)
 * @param {Array} tasks - Old tasks with categories: string[]
 * @returns {Object} { tasks: migratedTasks, categories: newCategories }
 */
export function migrateFromStringCategories(tasks) {
  const categoryMap = new Map(); // Map: categoryName -> Category object
  const migratedTasks = [];

  tasks.forEach(task => {
    const migratedTask = { ...task };

    // Handle categoryIds - either old categories (strings) or already new format
    const categoryNames = task.categories || [];
    if (Array.isArray(categoryNames) && categoryNames.length > 0) {
      // Convert string category names to IDs
      migratedTask.categoryIds = categoryNames
        .filter(name => typeof name === 'string' && name.trim())
        .map(name => {
          const trimmedName = name.trim();
          // Reuse existing category if we've seen this name before
          if (!categoryMap.has(trimmedName)) {
            categoryMap.set(trimmedName, createCategory(trimmedName));
          }
          return categoryMap.get(trimmedName).id;
        });
    } else {
      // Already using new format or no categories
      migratedTask.categoryIds = migratedTask.categoryIds || [];
    }

    // Remove old categories property
    delete migratedTask.categories;

    migratedTasks.push(migratedTask);
  });

  return {
    tasks: migratedTasks,
    categories: Array.from(categoryMap.values())
  };
}

/**
 * Check if tasks need migration (old format detected)
 * @param {Array} tasks - Tasks to check
 * @returns {boolean} True if any task uses old string categories format
 */
export function needsMigration(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) return false;

  return tasks.some(task => {
    // Check if task has old 'categories' property with string values
    return (
      task.categories &&
      Array.isArray(task.categories) &&
      task.categories.length > 0 &&
      typeof task.categories[0] === 'string'
    );
  });
}

/**
 * Migrate tasks to new scheduleType field (v2.1.0)
 * Old tasks without scheduleType: if has scheduledDate, set to 'specific', else 'none'
 * @param {Array} tasks - Tasks to migrate
 * @returns {Array} Tasks with scheduleType field
 */
export function migrateScheduleType(tasks) {
  return tasks.map(task => {
    if (task.scheduleType !== undefined) {
      // Already migrated
      return task;
    }

    // Old format: infer scheduleType from scheduledDate
    const scheduleType = task.scheduledDate ? 'specific' : 'none';

    return {
      ...task,
      scheduleType
    };
  });
}

/**
 * Check if tasks need schedule type migration
 * @param {Array} tasks - Tasks to check
 * @returns {boolean} True if any task lacks scheduleType field
 */
export function needsScheduleTypeMigration(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) return false;
  return tasks.some(task => task.scheduleType === undefined);
}

/**
 * Cleanup orphaned categories (ones not referenced by any task)
 * @param {Array} tasks - All tasks
 * @param {Array} categories - All categories
 * @returns {Array} Filtered categories that are referenced by at least one task
 */
export function cleanupOrphanedCategories(tasks, categories) {
  const usedCategoryIds = new Set();

  tasks.forEach(task => {
    const categoryIds = task.categoryIds || [];
    categoryIds.forEach(id => usedCategoryIds.add(id));
  });

  return categories.filter(category => usedCategoryIds.has(category.id));
}
