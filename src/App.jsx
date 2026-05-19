import { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import ImportModal from './components/ImportModal';
import Sidebar from './components/Sidebar';
import { persistence, hybridPersistence } from './persistence';
import { createTask, toggleTaskCompletion } from './models/Task';
import { createCategory } from './models/Category';
import { createProject } from './models/Project';
import { COUNTDOWN_CONFIG } from './config';
import { exportTasks, generateFileName, downloadFile } from './utils/taskExportImport';
import { getUniqueCategoriesFromTasks, cleanupOrphanedCategories } from './utils/categoryUtils';
import { getUniqueProjectsFromTasks, cleanupOrphanedProjects } from './utils/projectUtils';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('today');
  const [driveUser, setDriveUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load tasks, categories, and projects from persistence on mount
  useEffect(() => {
    const { tasks: savedTasks, categories: savedCategories, projects: savedProjects } = persistence.load();
    setTasks(savedTasks);
    setCategories(savedCategories);
    setProjects(savedProjects);
    setLoaded(true);

    // Set up Google Drive callbacks for hybrid persistence
    if (hybridPersistence) {
      hybridPersistence.onSync = ({ tasks: driveTasks, categories: driveCategories, projects: driveProjects }) => {
        setTasks(driveTasks);
        setCategories(driveCategories);
        setProjects(driveProjects);
      };

      hybridPersistence.onSyncStatusChange = setSyncStatus;

      hybridPersistence.onAuthChange = (user) => {
        setDriveUser(user);
      };

      hybridPersistence.onWorkspacesChange = (ws, activeId) => {
        setWorkspaces(ws);
        setActiveWorkspaceId(activeId);
      };

      // Start auto-sync (if authenticated)
      hybridPersistence.startAutoSync();

      // Check if already authenticated
      const user = hybridPersistence.getUser();
      if (user) {
        setDriveUser(user);
      }
    }

    return () => {
      if (hybridPersistence) {
        hybridPersistence.stopAutoSync();
      }
    };
  }, []);

  // Save tasks, categories, and projects to persistence whenever they change (but skip initial load)
  useEffect(() => {
    if (loaded) {
      persistence.save(tasks, categories, projects);
    }
  }, [tasks, categories, projects, loaded]);

  const addTask = (title, details = '', scheduleType = 'none', scheduledDate = null, categoryNames = [], projectNames = []) => {
    // Create new categories for any names that don't exist yet
    const newCategories = [...categories];
    const categoryIds = categoryNames.map(name => {
      const existing = newCategories.find(cat => cat.name === name);
      if (existing) {
        return existing.id;
      }
      // Create new category
      const newCat = createCategory(name);
      newCategories.push(newCat);
      return newCat.id;
    });

    // Create new projects for any names that don't exist yet
    const newProjects = [...projects];
    const projectIds = projectNames.map(name => {
      const existing = newProjects.find(proj => proj.name === name);
      if (existing) {
        return existing.id;
      }
      // Create new project
      const newProj = createProject(name);
      newProjects.push(newProj);
      return newProj.id;
    });

    setCategories(newCategories);
    setProjects(newProjects);
    setTasks([...tasks, createTask(title, details, scheduleType, scheduledDate, categoryIds, projectIds)]);
  };

  const deleteTask = (id) => {
    const newTasks = tasks.filter(task => task.id !== id);
    setTasks(newTasks);
    // Cleanup orphaned categories and projects
    const cleanedCategories = cleanupOrphanedCategories(newTasks, categories);
    const cleanedProjects = cleanupOrphanedProjects(newTasks, projects);
    setCategories(cleanedCategories);
    setProjects(cleanedProjects);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const updatedTask = toggleTaskCompletion(task, !task.completed);
        // When marking as done, start removal countdown
        if (updatedTask.completed && !updatedTask.removalCountdown) {
          // Initialize countdown with configured duration (converted to count of decrements)
          updatedTask.removalCountdown = Math.ceil(COUNTDOWN_CONFIG.duration / COUNTDOWN_CONFIG.decrement);
        } else if (!updatedTask.completed && updatedTask.removalCountdown) {
          // When unmarking, clear countdown
          updatedTask.removalCountdown = null;
        }
        return updatedTask;
      }
      return task;
    }));
  };

  const updateTask = (id, updates) => {
    let newCategories = [...categories];
    let newProjects = [...projects];
    let updatesCopy = { ...updates };

    // Handle categoryNames conversion to categoryIds (similar to addTask)
    if (updates.categoryNames && Array.isArray(updates.categoryNames)) {
      const categoryNames = updates.categoryNames;
      const categoryIds = categoryNames.map(name => {
        const existing = newCategories.find(cat => cat.name === name);
        if (existing) {
          return existing.id;
        }
        // Create new category
        const newCat = createCategory(name);
        newCategories.push(newCat);
        return newCat.id;
      });

      // Replace categoryNames with categoryIds and remove the temporary property
      updatesCopy.categoryIds = categoryIds;
      delete updatesCopy.categoryNames;
    }

    // Handle projectNames conversion to projectIds (similar to categoryNames)
    if (updates.projectNames && Array.isArray(updates.projectNames)) {
      const projectNames = updates.projectNames;
      const projectIds = projectNames.map(name => {
        const existing = newProjects.find(proj => proj.name === name);
        if (existing) {
          return existing.id;
        }
        // Create new project
        const newProj = createProject(name);
        newProjects.push(newProj);
        return newProj.id;
      });

      // Replace projectNames with projectIds and remove the temporary property
      updatesCopy.projectIds = projectIds;
      delete updatesCopy.projectNames;
    }

    setCategories(newCategories);
    setProjects(newProjects);
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, ...updatesCopy } : task
    ));
  };

  const updateTaskDetails = (id, details) => {
    updateTask(id, { details });
  };

  const reorderTasks = (fromIndex, toIndex) => {
    if (fromIndex < 0 || fromIndex >= tasks.length || toIndex < 0 || toIndex > tasks.length) {
      return;
    }

    // Adjust toIndex for array manipulation when moving forward
    let adjustedToIndex = toIndex;
    if (fromIndex < toIndex) {
      adjustedToIndex = toIndex - 1;
    }

    if (fromIndex === adjustedToIndex) {
      return;
    }

    const newTasks = [...tasks];
    const [movedTask] = newTasks.splice(fromIndex, 1);
    newTasks.splice(adjustedToIndex, 0, movedTask);

    setTasks(newTasks);
  };

  const handleAddTask = (title, details, scheduleType, scheduledDate, categoryNames, projectNames = []) => {
    addTask(title, details, scheduleType, scheduledDate, categoryNames, projectNames);
    setIsFormOpen(false);
  };

  const categoryNames = getUniqueCategoriesFromTasks(tasks, categories);
  const projectNames = getUniqueProjectsFromTasks(tasks, projects).map(p => p.name);

  // Get current tab display name
  const getTabDisplayName = () => {
    if (selectedTab === 'today') {
      const today = new Date();
      const month = today.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const day = today.getDate();
      return `Today (${month} ${day})`;
    } else if (selectedTab === 'future') {
      return 'Future';
    } else if (selectedTab === 'closed') {
      return 'Closed Tasks';
    } else if (selectedTab === 'no-project') {
      return 'No Project';
    } else if (selectedTab.startsWith('project:')) {
      const projectId = selectedTab.substring('project:'.length);
      const project = projects.find(proj => proj.id === projectId);
      return project ? project.name : 'Unknown Project';
    } else if (selectedTab.startsWith('category:')) {
      const categoryId = selectedTab.substring('category:'.length);
      const category = categories.find(cat => cat.id === categoryId);
      return category ? category.name : 'Unknown Category';
    }
    return 'Task Planner';
  };

  const handleExport = () => {
    const jsonContent = exportTasks(tasks, categories, projects);
    const fileName = generateFileName();
    downloadFile(jsonContent, fileName);
  };

  const handleImport = (importedTasks, importedCategories = [], importedProjects = []) => {
    setTasks(importedTasks);
    setCategories(importedCategories);
    setProjects(importedProjects);
    setIsImportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col md:flex-row h-screen">
        {/* Sidebar - hidden on mobile, visible on tablet+ */}
        <div className="hidden md:block md:w-48">
          <Sidebar
            tasks={tasks}
            categories={categories}
            projects={projects}
            selectedTab={selectedTab}
            onSelectTab={setSelectedTab}
            onExport={handleExport}
            onImport={() => setIsImportModalOpen(true)}
            driveUser={driveUser}
            syncStatus={syncStatus}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            onDriveSignIn={() => hybridPersistence.signIn()}
            onDriveSignOut={() => hybridPersistence.signOut()}
            onSelectWorkspace={(id) => hybridPersistence.switchWorkspace(id)}
            onCreateWorkspace={(name) => hybridPersistence.createWorkspace(name)}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        <div className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          ></div>
          {/* Drawer */}
          <div className={`absolute inset-y-0 left-0 w-48 bg-gray-50 border-r border-gray-200 z-50 overflow-y-auto transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-full text-right p-4 text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>
            <div className="px-3">
              <Sidebar
                tasks={tasks}
                categories={categories}
                projects={projects}
                selectedTab={selectedTab}
                onSelectTab={(tab) => {
                  setSelectedTab(tab);
                  setSidebarOpen(false);
                }}
                onExport={handleExport}
                onImport={() => {
                  setIsImportModalOpen(true);
                  setSidebarOpen(false);
                }}
                driveUser={driveUser}
                syncStatus={syncStatus}
                workspaces={workspaces}
                activeWorkspaceId={activeWorkspaceId}
                onDriveSignIn={() => hybridPersistence.signIn()}
                onDriveSignOut={() => hybridPersistence.signOut()}
                onSelectWorkspace={(id) => hybridPersistence.switchWorkspace(id)}
                onCreateWorkspace={(name) => hybridPersistence.createWorkspace(name)}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto flex flex-col">
          <div className="max-w-4xl mx-auto w-full p-2 sm:p-3 md:p-6">
            <div className="mb-3 md:mb-4 flex items-center gap-3">
              {/* Hamburger Menu - visible on mobile only */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 flex-shrink-0"
                title="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-800">{getTabDisplayName()}</h1>
            </div>

            <TaskList
              tasks={tasks}
              categories={categories}
              projects={projects}
              selectedTab={selectedTab}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onUpdateDetails={updateTaskDetails}
              onUpdateTask={updateTask}
              onReorderTasks={reorderTasks}
            />

            {isFormOpen && (
              <TaskForm
                onAdd={handleAddTask}
                onClose={() => setIsFormOpen(false)}
                existingCategories={categoryNames}
                existingProjects={projectNames}
              />
            )}

            {!isFormOpen && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="w-full mt-4 md:mt-6 px-4 md:px-6 py-3 text-base md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                + Add Task
              </button>
            )}

            {isImportModalOpen && (
              <ImportModal
                onImport={handleImport}
                onCancel={() => setIsImportModalOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
