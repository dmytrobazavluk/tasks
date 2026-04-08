// In-memory persistence implementation
// Useful for testing and temporary storage
// Data is lost on page reload

import { migrateFromStringCategories, needsMigration } from './migrations';

let store = { tasks: [], categories: [] };

export const memoryPersistence = {
  load: () => {
    let tasks = [...store.tasks];
    let categories = [...store.categories];

    // Handle migration from old format (task.categories as strings)
    if (needsMigration(tasks)) {
      const migrated = migrateFromStringCategories(tasks);
      tasks = migrated.tasks;
      categories = migrated.categories;
      // Save migrated data back
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
