import { useState } from 'react';
import { formatDate } from '../utils/dateFormat';

export default function TaskItem({ task, onToggle, onDelete, onUpdateDetails, onUpdateTask }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDetails, setEditDetails] = useState(task.details);

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      // Update both title and details
      onUpdateTask(task.id, { title: editTitle, details: editDetails });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDetails(task.details);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition">
      {!isEditing ? (
        <>
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

                {task.details && (
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      Details
                    </div>
                    <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                      {task.details}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Details
            </label>
            <textarea
              value={editDetails}
              onChange={(e) => setEditDetails(e.target.value)}
              placeholder="Add notes or description..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
