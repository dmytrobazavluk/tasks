// In-memory persistence implementation
// Useful for testing and temporary storage
// Data is lost on page reload

import {
  migrateFromStringCategories,
  needsMigration,
  migrateScheduleType,
  needsScheduleTypeMigration
} from './migrations';

let store = { tasks: [], categories: [] };

export const memoryPersistence = {
  load: () => {
    let tasks = [...store.tasks];
    let categories = [...store.categories];

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

    // Save migrated data back if needed
    if (needsSave) {
      memoryPersistence.save(tasks, categories);
    }

    return { tasks, categories };
  },

  save: (tasks, categories = []) => {
    store = {
      tasks: [...tasks],
      categories: [...categories]
    };
  },

  clear: () => {
    store = { tasks: [], categories: [] };
  },
};
