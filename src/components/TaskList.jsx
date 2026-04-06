import TaskItem from './TaskItem';

export default function TaskList({ tasks, onToggle, onDelete, onUpdateDetails, onUpdateTask }) {
  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No tasks yet. Add one to get started!</p>
      ) : (
        tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
            onUpdateDetails={onUpdateDetails}
            onUpdateTask={onUpdateTask}
          />
        ))
      )}
    </div>
  );
}
