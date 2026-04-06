import { useState } from 'react';

export default function TaskForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title, details);
      setTitle('');
      setDetails('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 bg-white p-4 rounded-lg shadow">
      <div className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Add details or notes (optional)..."
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows="2"
        />
        <button
          type="submit"
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Add Task
        </button>
      </div>
    </form>
  );
}
