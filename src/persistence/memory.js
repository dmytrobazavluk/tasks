// In-memory persistence implementation
// Useful for testing and temporary storage
// Data is lost on page reload

import {
  migrateFromStringCategories,
  needsMigration,
  migrateScheduleType,
  needsScheduleTypeMigration,
  migrateProjectIds,
  needsProjectIdsMigration
} from './migrations';

let store = { tasks: [], categories: [], projects: [] };

export const memoryPersistence = {
  load: () => {
    let tasks = [...store.tasks];
    let categories = [...store.categories];
    let projects = [...store.projects];

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

    // Handle migration to add projectIds field
    if (needsProjectIdsMigration(tasks)) {
      tasks = migrateProjectIds(tasks);
      needsSave = true;
    }

    // Save migrated data back if needed
    if (needsSave) {
      memoryPersistence.save(tasks, categories, projects);
    }

    return { tasks, categories, projects };
  },

  save: (tasks, categories = [], projects = []) => {
    store = {
      tasks: [...tasks],
      categories: [...categories],
      projects: [...projects]
    };
  },

  clear: () => {
    store = { tasks: [], categories: [], projects: [] };
  },
};
