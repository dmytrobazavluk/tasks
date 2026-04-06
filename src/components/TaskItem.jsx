import { formatDate } from '../utils/dateFormat';

export default function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition">
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
        <div className="text-xs text-gray-500 mt-1">
          <div>Added: {formatDate(task.addedDate)}</div>
          {task.completionDate && (
            <div>Completed: {formatDate(task.completionDate)}</div>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="text-red-500 hover:text-red-700 font-medium text-sm"
      >
        Delete
      </button>
    </div>
  );
}
