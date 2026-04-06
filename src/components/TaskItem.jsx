import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateFormat';

export default function TaskItem({ task, onToggle, onDelete, onUpdateDetails, onUpdateTask }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDetails, setEditDetails] = useState(task.details);

  // Handle countdown timer
  useEffect(() => {
    if (!task.removalCountdown || task.removalCountdown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      if (task.removalCountdown === 1) {
        // Clear countdown when it reaches 0 (task stays as completed)
        onUpdateTask(task.id, { removalCountdown: null });
      } else {
        onUpdateTask(task.id, { removalCountdown: task.removalCountdown - 1 });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [task.removalCountdown, task.id, onUpdateTask]);

  const handleUnmarkDone = () => {
    onUpdateTask(task.id, { removalCountdown: null });
    onToggle(task.id);
  };

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

  const handleConfirmDelete = () => {
    onDelete(task.id);
    setIsConfirmingDelete(false);
  };

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition">
      {!isEditing ? (
        <>
          <div className="flex items-start gap-3 p-4">
            <div className="flex-1">
              <span
                className={`block ${
                  task.completed ? 'line-through text-gray-400' : 'text-gray-800'
                }`}
              >
                {task.title}
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-500 hover:text-blue-700 font-medium text-sm"
              title={isExpanded ? 'Hide details' : 'Show details'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
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

                <div className="space-y-2">
                  <div className="flex gap-2">
                    {task.completed ? (
                      <button
                        onClick={handleUnmarkDone}
                        className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-md transition font-medium"
                      >
                        Unmark Done{task.removalCountdown && ` (${task.removalCountdown})`}
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggle(task.id)}
                        className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-600 hover:bg-green-100 rounded-md transition font-medium"
                      >
                        Mark Done
                      </button>
                    )}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setIsConfirmingDelete(true)}
                      className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
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

      {isConfirmingDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Delete Task?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this task? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
