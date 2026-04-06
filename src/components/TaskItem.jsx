import { useState } from 'react';
import { formatDate } from '../utils/dateFormat';

export default function TaskItem({ task, onToggle, onDelete, onUpdateDetails }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [details, setDetails] = useState(task.details);

  const handleDetailsChange = (e) => {
    const newDetails = e.target.value;
    setDetails(newDetails);
    onUpdateDetails(task.id, newDetails);
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition">
      <div className="flex items-start gap-3 p-4">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="w-5 h-5 text-blue-600 cursor-pointer mt-1"
        />
        <div className="flex-1">
          <span
            className={`block ${
              task.completed ? 'line-through text-gray-400' : 'text-gray-800'
            }`}
          >
            {task.title}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-500 hover:text-blue-700 font-medium text-sm"
            title={isExpanded ? 'Hide details' : 'Show details'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-500 hover:text-red-700 font-medium text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="pt-3 space-y-3">
            <div className="text-xs text-gray-500 space-y-1">
              <div>
                <span className="font-medium">Added:</span> {formatDate(task.addedDate)}
              </div>
              {task.completionDate && (
                <div>
                  <span className="font-medium">Completed:</span>{' '}
                  {formatDate(task.completionDate)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Details
              </label>
              <textarea
                value={details}
                onChange={handleDetailsChange}
                placeholder="Add notes or description..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
