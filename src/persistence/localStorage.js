// Browser localStorage implementation
// Persists tasks and categories to the browser's local storage

import {
  migrateFromStringCategories,
  needsMigration,
  migrateScheduleType,
  needsScheduleTypeMigration
} from './migrations';

const TASKS_STORAGE_KEY = 'taskplanner_tasks';
const CATEGORIES_STORAGE_KEY = 'taskplanner_categories';

export const localStoragePersistence = {
  load: () => {
    try {
      const tasksStored = localStorage.getItem(TASKS_STORAGE_KEY);
      const categoriesStored = localStorage.getItem(CATEGORIES_STORAGE_KEY);

      let tasks = tasksStored ? JSON.parse(tasksStored) : [];
      let categories = categoriesStored ? JSON.parse(categoriesStored) : [];

      let needsSave = false;

      // Handle migration from old format (task.categories as strings)
      if (needsMigration(tasks)) {
        const migrated = migrateFromStringCategories(tasks);
        tasks = migrated.tasks;
        categories = migrated.categories;
        needsSave = true;
      }

      // Handle migration to add scheduleType field
      if (needsScheduleTypeMigration(tasks)) {
        tasks = migrateScheduleType(tasks);
        needsSave = true;
      }

      // Save migrated data back to localStorage if needed
      if (needsSave) {
        localStoragePersistence.save(tasks, categories);
      }

      return { tasks, categories };
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return { tasks: [], categories: [] };
    }
  },

  save: (tasks, categories = []) => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(TASKS_STORAGE_KEY);
      localStorage.removeItem(CATEGORIES_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },
};
