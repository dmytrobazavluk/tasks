import GoogleSignIn from './GoogleSignIn';
import { useState } from 'react';
import {
  countTodayTasks,
  countFutureTasks,
  countTasksInCategoryId,
  getUniqueCategoriesFromTasks,
  countClosedTasksWithoutCountdown,
  getCategoryById
} from '../utils/categoryUtils';
import {
  getUniqueProjectsFromTasks,
  countTasksInProjectId,
  countTasksWithoutProject
} from '../utils/projectUtils';

export default function Sidebar({
  tasks,
  categories,
  projects,
  selectedTab,
  onSelectTab,
  onExport,
  onImport,
  driveUser,
  syncStatus,
  workspaces,
  activeWorkspaceId,
  onDriveSignIn,
  onDriveSignOut,
  onSelectWorkspace,
  onCreateWorkspace,
}) {
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const categoryNames = getUniqueCategoriesFromTasks(tasks, categories);
  const uniqueProjects = getUniqueProjectsFromTasks(tasks, projects);
  const todayCount = countTodayTasks(tasks);
  const futureCount = countFutureTasks(tasks);
  const noProjectCount = countTasksWithoutProject(tasks);
  const closedCount = countClosedTasksWithoutCountdown(tasks);

  return (
    <div className="w-full md:w-48 bg-gray-50 border-r border-gray-200 p-3 md:p-4 overflow-y-auto">
      <div className="space-y-1">
        {/* Today Tab */}
        <button
          onClick={() => onSelectTab('today')}
          className={`w-full text-left px-3 md:px-4 py-2 md:py-2 rounded-md transition text-xs md:text-sm font-medium ${
            selectedTab === 'today'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          Today <span className="float-right">({todayCount})</span>
        </button>

        {/* Future Tab */}
        {futureCount > 0 && (
          <button
            onClick={() => onSelectTab('future')}
            className={`w-full text-left px-3 md:px-4 py-2 md:py-2 rounded-md transition text-xs md:text-sm font-medium ${
              selectedTab === 'future'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Future <span className="float-right">({futureCount})</span>
          </button>
        )}

        {/* Divider before projects */}
        {(uniqueProjects.length > 0 || noProjectCount > 0) && (
          <div className="my-2 border-t border-gray-300"></div>
        )}

        {/* Projects Header and Tabs */}
        {(uniqueProjects.length > 0 || noProjectCount > 0) && (
          <>
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="w-full text-left px-3 md:px-4 py-2 md:py-2 text-xs font-semibold text-gray-600 uppercase flex items-center justify-between hover:bg-gray-100 rounded transition"
            >
              Projects
              <span className="text-xs">{projectsExpanded ? '▼' : '▶'}</span>
            </button>
            {projectsExpanded && (
              <>
                {uniqueProjects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => onSelectTab(`project:${project.id}`)}
                    className={`w-full text-left px-3 md:px-4 py-2 md:py-2 rounded-md transition text-xs md:text-sm font-medium ${
                      selectedTab === `project:${project.id}`
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {project.name} <span className="float-right">({countTasksInProjectId(tasks, project.id)})</span>
                  </button>
                ))}
                <button
                  onClick={() => onSelectTab('no-project')}
                  className={`w-full text-left px-3 md:px-4 py-2 md:py-2 rounded-md transition text-xs md:text-sm font-medium ${
                    selectedTab === 'no-project'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  No Project <span className="float-right">({noProjectCount})</span>
                </button>
              </>
            )}
          </>
        )}

        {/* Divider before categories */}
        {categoryNames.length > 0 && (
          <div className="my-2 border-t border-gray-300"></div>
        )}

        {/* Categories Header and Tabs */}
        {categoryNames.length > 0 && (
          <>
            <button
              onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              className="w-full text-left px-3 md:px-4 py-2 md:py-2 text-xs font-semibold text-gray-600 uppercase flex items-center justify-between hover:bg-gray-100 rounded transition"
            >
              Categories
              <span className="text-xs">{categoriesExpanded ? '▼' : '▶'}</span>
            </button>
            {categoriesExpanded && (
              <>
                {categoryNames.map(categoryName => {
                  // Find the category object by name to get its ID
                  const categoryObj = categories.find(cat => cat.name === categoryName);
                  if (!categoryObj) return null;

                  return (
                    <button
                      key={categoryObj.id}
                      onClick={() => onSelectTab(`category:${categoryObj.id}`)}
                      className={`w-full text-left px-3 md:px-4 py-2 md:py-2 rounded-md transition text-xs md:text-sm font-medium ${
                        selectedTab === `category:${categoryObj.id}`
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {categoryName} <span className="float-right">({countTasksInCategoryId(tasks, categoryObj.id)})</span>
                    </button>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* Divider before closed tasks */}
        {closedCount > 0 && (
          <div className="my-2 border-t border-gray-300"></div>
        )}

        {/* Closed Tasks Tab */}
        {closedCount > 0 && (
          <button
            onClick={() => onSelectTab('closed')}
            className={`w-full text-left px-3 md:px-4 py-2 md:py-2 rounded-md transition text-xs md:text-sm font-medium ${
              selectedTab === 'closed'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Closed Tasks <span className="float-right">({closedCount})</span>
          </button>
        )}
      </div>

      {/* Export/Import/Google Drive Buttons at Bottom */}
      <div className="mt-6 pt-4 border-t border-gray-300 space-y-2">
        <button
          onClick={onExport}
          className="w-full px-3 md:px-4 py-2 md:py-2 text-xs md:text-sm font-medium bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
          title="Download tasks as JSON"
        >
          Export
        </button>
        <button
          onClick={onImport}
          className="w-full px-3 md:px-4 py-2 md:py-2 text-xs md:text-sm font-medium bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
          title="Upload JSON file to replace tasks"
        >
          Import
        </button>
        <div className="pt-2 border-t border-gray-300">
          <GoogleSignIn
            user={driveUser}
            syncStatus={syncStatus}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            onSignIn={onDriveSignIn}
            onSignOut={onDriveSignOut}
            onSelectWorkspace={onSelectWorkspace}
            onCreateWorkspace={onCreateWorkspace}
          />
        </div>
      </div>
    </div>
  );
}
