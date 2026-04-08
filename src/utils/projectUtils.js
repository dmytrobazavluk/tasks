/**
 * Project Management Utilities
 * Works with explicit Project entities (id, name)
 */

import { hasAnyFutureScheduling } from '../models/Task';

/**
 * Get project by ID
 * @param {Array} projects - Array of Project objects
 * @param {string} projectId - Project ID to find
 * @returns {Object|null} Project object or null if not found
 */
export const getProjectById = (projects, projectId) => {
  return projects.find(proj => proj.id === projectId) || null;
};

/**
 * Get all unique projects used in tasks, sorted alphabetically by name
 * @param {Array} tasks - Array of task objects
 * @param {Array} projects - Array of Project objects
 * @returns {Array} Sorted array of unique Project objects used in tasks
 */
export const getUniqueProjectsFromTasks = (tasks, projects) => {
  const projectIds = new Set();
  tasks.forEach(task => {
    const pIds = task.projectIds || [];
    if (Array.isArray(pIds)) {
      pIds.forEach(id => {
        const project = getProjectById(projects, id);
        if (project) {
          projectIds.add(id);
        }
      });
    }
  });
  // Return sorted by project name
  return Array.from(projectIds)
    .map(id => getProjectById(projects, id))
    .filter(p => p !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Get tasks that belong to a specific project by project ID
 * @param {Array} tasks - Array of task objects
 * @param {string} projectId - Project ID to filter by
 * @returns {Array} Tasks that have the specified project ID
 */
export const getTasksByProjectId = (tasks, projectId) => {
  return tasks.filter(task => {
    const projectIds = task.projectIds || [];
    return Array.isArray(projectIds) && projectIds.includes(projectId);
  });
};

/**
 * Count incomplete tasks in a project by ID
 * @param {Array} tasks - Array of task objects
 * @param {string} projectId - Project ID
 * @returns {number} Count of incomplete tasks in project
 */
export const countTasksInProjectId = (tasks, projectId) => {
  return getTasksByProjectId(tasks, projectId).filter(task => !task.completed).length;
};

/**
 * Count all tasks with any project assignment
 * @param {Array} tasks - Array of task objects
 * @returns {number} Count of tasks that have at least one project
 */
export const countProjectTasks = (tasks) => {
  return tasks.filter(task => {
    const projectIds = task.projectIds || [];
    return Array.isArray(projectIds) && projectIds.length > 0 && !task.completed;
  }).length;
};

/**
 * Get project IDs used in tasks
 * @param {Array} tasks - Array of task objects
 * @returns {Set} Set of used project IDs
 */
const getUsedProjectIds = (tasks) => {
  const used = new Set();
  tasks.forEach(task => {
    const projectIds = task.projectIds || [];
    projectIds.forEach(id => used.add(id));
  });
  return used;
};

/**
 * Cleanup orphaned projects (ones not referenced by any task)
 * @param {Array} tasks - All tasks
 * @param {Array} projects - All projects
 * @returns {Array} Filtered projects that are referenced by at least one task
 */
export const cleanupOrphanedProjects = (tasks, projects) => {
  const usedProjectIds = getUsedProjectIds(tasks);
  return projects.filter(project => usedProjectIds.has(project.id));
};
