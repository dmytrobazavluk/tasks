import { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import { persistence } from './persistence';

export default function App() {
  const [tasks, setTasks] = useState([]);

  // Load tasks from persistence on mount
  useEffect(() => {
    const savedTasks = persistence.load();
    setTasks(savedTasks);
  }, []);

  // Save tasks to persistence whenever they change
  useEffect(() => {
    persistence.save(tasks);
  }, [tasks]);

  const addTask = (title) => {
    setTasks([...tasks, { id: Date.now(), title, completed: false }]);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Task Planner</h1>
        <TaskForm onAdd={addTask} />
        <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} />
      </div>
    </div>
  );
}
