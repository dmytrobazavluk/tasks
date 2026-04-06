export default function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="w-5 h-5 text-blue-600 cursor-pointer"
      />
      <span
        className={`flex-1 ${
          task.completed ? 'line-through text-gray-400' : 'text-gray-800'
        }`}
      >
        {task.title}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="text-red-500 hover:text-red-700 font-medium text-sm"
      >
        Delete
      </button>
    </div>
  );
}
