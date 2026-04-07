import { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import { persistence } from './persistence';
import { createTask, toggleTaskCompletion } from './models/Task';
import { COUNTDOWN_CONFIG } from './config';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

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

  // Clear countdowns when "show completed" is turned on
  useEffect(() => {
    if (showCompleted) {
      setTasks(tasks.map(task => ({
        ...task,
        removalCountdown: null
      })));
    }
  }, [showCompleted]);

  const addTask = (title, details = '') => {
    setTasks([...tasks, createTask(title, details)]);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const updatedTask = toggleTaskCompletion(task, !task.completed);
        // When marking as done, start removal countdown only if "show completed" is off
        if (updatedTask.completed && !updatedTask.removalCountdown && !showCompleted) {
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

  // Show incomplete tasks, completed tasks if toggle is on, and all tasks with active countdown
  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter(task => !task.completed || (task.removalCountdown && task.removalCountdown > 0));

  const handleAddTask = (title, details) => {
    addTask(title, details);
    setIsFormOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Task Planner</h1>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex-1"></div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              showCompleted
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {showCompleted ? 'Hide Completed' : 'Show Completed'}
          </button>
        </div>

        <TaskList tasks={filteredTasks} allTasks={tasks} showCompleted={showCompleted} onToggle={toggleTask} onDelete={deleteTask} onUpdateDetails={updateTaskDetails} onUpdateTask={updateTask} onReorderTasks={reorderTasks} />

        {isFormOpen && (
          <TaskForm onAdd={handleAddTask} onClose={() => setIsFormOpen(false)} />
        )}

        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            + Add Task
          </button>
        )}
      </div>
    </div>
  );
}
