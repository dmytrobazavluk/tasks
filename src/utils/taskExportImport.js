import { isValidTask } from '../models/Task';

export const exportTasks = (tasks, categories = [], projects = []) => {
  const exportData = {
    version: 1,
    tasks: tasks.map(task => ({
      id: task.id,
      title: task.title,
      completed: task.completed,
      details: task.details,
      scheduleType: task.scheduleType || 'none',
      scheduledDate: task.scheduledDate,
      categoryIds: task.categoryIds || [],
      projectIds: task.projectIds || [],
      addedDate: task.addedDate,
      completionDate: task.completionDate
    })),
    categories: categories.map(cat => ({
      id: cat.id,
      name: cat.name
    })),
    projects: projects.map(proj => ({
      id: proj.id,
      name: proj.name
    }))
  };

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

/**
 * Import tasks, categories, and projects from JSON
 * @param {string} jsonString - JSON string to import
 * @returns {Object} { tasks, categories, projects } all arrays
 */
export const importTasks = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);

    // Handle both old format (array of tasks) and new format (object with version, tasks, categories, projects)
    let tasks = [];
    let categories = [];
    let projects = [];

    if (Array.isArray(data)) {
      // Old format: direct array of tasks
      tasks = data;
      categories = [];
      projects = [];
    } else if (data && typeof data === 'object' && data.tasks) {
      // New format: { version, tasks, categories, projects }
      tasks = data.tasks;
      categories = data.categories || [];
      projects = data.projects || [];
    } else {
      throw new Error('Import file must contain tasks');
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('Import file contains no tasks');
    }

    // Validate each task and handle backward compatibility
    const invalidTasks = [];
    const validTasks = tasks.map((task, index) => {
      if (!isValidTask(task)) {
        invalidTasks.push(index);
        return null;
      }

      // Handle backward compatibility: convert old 'categories' property to 'categoryIds'
      let categoryIds = task.categoryIds || [];
      if (task.categories && Array.isArray(task.categories) && task.categories.length > 0) {
        // Old format had string array of category names
        // For import, we'll keep them as empty since we can't map old names to new IDs
        // The migration should happen in persistence layer
        categoryIds = [];
      }

      // Ensure removalCountdown is cleared (runtime state, not persisted)
      return {
        ...task,
        removalCountdown: null,
        categoryIds: categoryIds,
        projectIds: task.projectIds || [],
        scheduledDate: task.scheduledDate || null
      };
    }).filter(task => task !== null);

    if (validTasks.length === 0) {
      throw new Error('No valid tasks found in import file');
    }

    if (invalidTasks.length > 0) {
      console.warn(`Skipped ${invalidTasks.length} invalid task(s) at index: ${invalidTasks.join(', ')}`);
    }

    // Validate categories if present
    const validCategories = (Array.isArray(categories) ? categories : []).filter(cat => {
      return cat && typeof cat.id === 'string' && typeof cat.name === 'string';
    });

    // Validate projects if present
    const validProjects = (Array.isArray(projects) ? projects : []).filter(proj => {
      return proj && typeof proj.id === 'string' && typeof proj.name === 'string';
    });

    return { tasks: validTasks, categories: validCategories, projects: validProjects };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format. Please check your import file.');
    }
    throw error;
  }
};
