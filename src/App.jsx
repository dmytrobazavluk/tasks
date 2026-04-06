import { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import { persistence } from './persistence';
import { createTask, toggleTaskCompletion } from './models/Task';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);

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

  const addTask = (title, details = '') => {
    setTasks([...tasks, createTask(title, details)]);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? toggleTaskCompletion(task, !task.completed) : task
    ));
  };

  const updateTaskDetails = (id, details) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, details } : task
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Task Planner</h1>
        <TaskForm onAdd={addTask} />
        <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} onUpdateDetails={updateTaskDetails} />
      </div>
    </div>
  );
}
