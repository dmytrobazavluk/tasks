import { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import ImportModal from './components/ImportModal';
import Sidebar from './components/Sidebar';
import { persistence } from './persistence';
import { createTask, toggleTaskCompletion } from './models/Task';
import { createCategory } from './models/Category';
import { COUNTDOWN_CONFIG } from './config';
import { exportTasks, generateFileName, downloadFile } from './utils/taskExportImport';
import { getUniqueCategoriesFromTasks, cleanupOrphanedCategories } from './utils/categoryUtils';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('today');

  // Load tasks and categories from persistence on mount
  useEffect(() => {
    const { tasks: savedTasks, categories: savedCategories } = persistence.load();
    setTasks(savedTasks);
    setCategories(savedCategories);
    setLoaded(true);
  }, []);

  // Save tasks and categories to persistence whenever they change (but skip initial load)
  useEffect(() => {
    if (loaded) {
      persistence.save(tasks, categories);
    }
  }, [tasks, categories, loaded]);

  const addTask = (title, details = '', scheduleType = 'none', scheduledDate = null, categoryNames = []) => {
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

    setCategories(newCategories);
    setTasks([...tasks, createTask(title, details, scheduleType, scheduledDate, categoryIds)]);
  };

  const deleteTask = (id) => {
    const newTasks = tasks.filter(task => task.id !== id);
    setTasks(newTasks);
    // Cleanup orphaned categories
    const cleanedCategories = cleanupOrphanedCategories(newTasks, categories);
    setCategories(cleanedCategories);
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

    setCategories(newCategories);
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

  const handleAddTask = (title, details, scheduleType, scheduledDate, categoryNames) => {
    addTask(title, details, scheduleType, scheduledDate, categoryNames);
    setIsFormOpen(false);
  };

  const categoryNames = getUniqueCategoriesFromTasks(tasks, categories);

  // Get current tab display name
  const getTabDisplayName = () => {
    if (selectedTab === 'today') {
      return 'Today';
    } else if (selectedTab === 'closed') {
      return 'Closed Tasks';
    } else if (selectedTab.startsWith('category:')) {
      const categoryId = selectedTab.substring('category:'.length);
      const category = categories.find(cat => cat.id === categoryId);
      return category ? category.name : 'Unknown Category';
    }
    return 'Task Planner';
  };

  const handleExport = () => {
    const jsonContent = exportTasks(tasks, categories);
    const fileName = generateFileName();
    downloadFile(jsonContent, fileName);
  };

  const handleImport = (importedTasks, importedCategories = []) => {
    setTasks(importedTasks);
    setCategories(importedCategories);
    setIsImportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar tasks={tasks} categories={categories} selectedTab={selectedTab} onSelectTab={setSelectedTab} />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h1 className="text-xl font-bold text-gray-800">{getTabDisplayName()}</h1>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  title="Download tasks as JSON"
                >
                  Export
                </button>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                  title="Upload JSON file to replace tasks"
                >
                  Import
                </button>
              </div>
            </div>

            <TaskList
              tasks={tasks}
              categories={categories}
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
              />
            )}

            {!isFormOpen && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
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
