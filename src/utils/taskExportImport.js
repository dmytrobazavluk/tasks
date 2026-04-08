import { isValidTask } from '../models/Task';

export const exportTasks = (tasks) => {
  // Create a clean export without runtime state (removalCountdown)
  const exportData = tasks.map(task => ({
    id: task.id,
    title: task.title,
    completed: task.completed,
    details: task.details,
    addedDate: task.addedDate,
    completionDate: task.completionDate
  }));

  return JSON.stringify(exportData, null, 2);
};

export const generateFileName = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `tasks-${year}-${month}-${day}.json`;
};

export const downloadFile = (content, fileName) => {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importTasks = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);

    if (!Array.isArray(data)) {
      throw new Error('Import file must contain an array of tasks');
    }

    if (data.length === 0) {
      throw new Error('Import file contains no tasks');
    }

    // Validate each task
    const invalidTasks = [];
    const validTasks = data.map((task, index) => {
      if (!isValidTask(task)) {
        invalidTasks.push(index);
        return null;
      }
      // Ensure removalCountdown is cleared (runtime state, not persisted)
      return {
        ...task,
        removalCountdown: null
      };
    }).filter(task => task !== null);

    if (validTasks.length === 0) {
      throw new Error('No valid tasks found in import file');
    }

    if (invalidTasks.length > 0) {
      console.warn(`Skipped ${invalidTasks.length} invalid task(s) at index: ${invalidTasks.join(', ')}`);
    }

    return validTasks;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format. Please check your import file.');
    }
    throw error;
  }
};
