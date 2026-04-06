// In-memory persistence implementation
// Useful for testing and temporary storage
// Data is lost on page reload

let store = [];

export const memoryPersistence = {
  load: () => [...store],

  save: (tasks) => {
    store = [...tasks];
  },

  clear: () => {
    store = [];
  },
};
