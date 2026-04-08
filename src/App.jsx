import { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import ImportModal from './components/ImportModal';
import Sidebar from './components/Sidebar';
import { persistence } from './persistence';
import { createTask, toggleTaskCompletion } from './models/Task';
import { COUNTDOWN_CONFIG } from './config';
import { exportTasks, generateFileName, downloadFile } from './utils/taskExportImport';
import { getUniqueCategoriesFromTasks } from './utils/categoryUtils';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('today');

  // Load tasks from persistence on mount
  useEffect(() => {
    const savedTasks = persistence.load();
    setTasks(savedTasks);
    setLoaded(true);
  }, []);

  // Save tasks to persistence whenever they change (but skip initial load)
  useEffect(() => {
    if (loaded) {
      persistence.save(tasks);
    }
  }, [tasks, loaded]);

  const addTask = (title, details = '', scheduledDate = null, categories = []) => {
    setTasks([...tasks, createTask(title, details, scheduledDate, categories)]);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
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
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
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

  const handleAddTask = (title, details, scheduledDate, categories) => {
    addTask(title, details, scheduledDate, categories);
    setIsFormOpen(false);
  };

  const categories = getUniqueCategoriesFromTasks(tasks);

  // Get current tab display name
  const getTabDisplayName = () => {
    if (selectedTab === 'today') {
      return 'Today';
    } else if (selectedTab === 'closed') {
      return 'Closed Tasks';
    } else if (selectedTab.startsWith('category:')) {
      return selectedTab.substring('category:'.length);
    }
    return 'Task Planner';
  };

  const handleExport = () => {
    const jsonContent = exportTasks(tasks);
    const fileName = generateFileName();
    downloadFile(jsonContent, fileName);
  };

  const handleImport = (importedTasks) => {
    setTasks(importedTasks);
    setIsImportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar tasks={tasks} selectedTab={selectedTab} onSelectTab={setSelectedTab} />

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
                existingCategories={categories}
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
