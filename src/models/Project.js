/**
 * Project Model
 *
 * Represents a project that tasks can be organized by.
 * Projects are explicit entities with id and name properties.
 * Tasks can belong to multiple projects (many-to-many relationship).
 *
 * Structure:
 * {
 *   id: string - UUID identifier
 *   name: string - project name (required)
 * }
 */

/**
 * Create a new Project
 * @param {string} name - Project name
 * @returns {Object} New project object with UUID id
 */
export const createProject = (name) => {
  // Generate UUID using crypto if available, fallback to timestamp-based
  let id;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    id = crypto.randomUUID();
  } else {
    // Fallback for older browsers
    id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  return {
    id,
    name: name.trim()
  };
};

/**
 * Validate project object
 * @param {Object} project - Project to validate
 * @returns {boolean} Whether project is valid
 */
export const isValidProject = (project) => {
  return (
    project &&
    typeof project.id === 'string' &&
    project.id.length > 0 &&
    typeof project.name === 'string' &&
    project.name.length > 0
  );
};

/**
 * Type definition for Project (JSDoc comment for IDE support)
 * @typedef {Object} Project
 * @property {string} id - UUID identifier
 * @property {string} name - Project name
 */
