import { useState, useRef } from 'react';
import TaskItem from './TaskItem';
import { getTaskGroups } from '../utils/taskGrouping';
import { formatGroupDate } from '../utils/dateFormat';

export default function TaskList({ tasks, allTasks, showCompleted, onToggle, onDelete, onUpdateDetails, onUpdateTask, onReorderTasks }) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const draggedTaskRef = useRef(null);

  // Group tasks by date
  const groups = getTaskGroups(tasks, showCompleted);

  const handleDragStart = (e, taskId) => {
    draggedTaskRef.current = taskId;
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', String(taskId));
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverIndex(null);
    draggedTaskRef.current = null;
  };

  const handleDragOver = (e, taskIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;

    let newIndex;
    if (e.clientY < midpoint) {
      newIndex = taskIndex;
    } else {
      newIndex = taskIndex + 1;
    }

    setDragOverIndex(newIndex);
  };

  const calculateDropIndex = (e, groupTasks) => {
    // Find which task position the cursor is over by checking Y coordinates
    const taskDivs = e.currentTarget.querySelectorAll('[data-task-group-index]');

    for (let i = 0; i < taskDivs.length; i++) {
      const taskRect = taskDivs[i].getBoundingClientRect();
      const midpoint = taskRect.top + taskRect.height / 2;

      if (e.clientY < midpoint) {
        return i;
      }
    }

    // Cursor is below all tasks, return end position
    return groupTasks.length;
  };

  const performReorder = (sourceId, groupTasks, dropIndex) => {
    const sourceIndex = allTasks.findIndex(t => t.id === sourceId);
    if (sourceIndex === -1) return;

    // Find where source task is in the current group
    const sourceTask = allTasks[sourceIndex];
    const sourceGroupIndex = groupTasks.findIndex(t => t.id === sourceTask.id);

    // If source task is not in this group, something is wrong
    if (sourceGroupIndex === -1) return;

    // If drop index is same as source position in group, don't move (no-op)
    if (dropIndex === sourceGroupIndex) {
      return;
    }

    // Also handle the case where dropping just below the source task doesn't actually move it
    // After removing source, inserting at sourceGroupIndex+1 would put it right where it was
    if (dropIndex === sourceGroupIndex + 1) {
      return;
    }

    // Map group index to array index
    let targetIndex;
    if (dropIndex === 0) {
      targetIndex = 0;
    } else if (dropIndex >= groupTasks.length) {
      targetIndex = allTasks.length;
    } else {
      const targetTaskId = groupTasks[dropIndex]?.id;
      targetIndex = allTasks.findIndex(t => t.id === targetTaskId);
    }

    if (sourceIndex !== targetIndex && targetIndex >= 0 && targetIndex <= allTasks.length) {
      onReorderTasks(sourceIndex, targetIndex);
    }
  };

  const handleDrop = (e, taskIndex, groupTasks) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedTaskId(null);

    const sourceId = parseInt(e.dataTransfer.getData('taskId'));
    if (!sourceId) {
      setDragOverIndex(null);
      draggedTaskRef.current = null;
      return;
    }

    // When drop happens on a task element, use dragOverIndex which was calculated
    // during dragOver events on the entire group. Don't recalculate since
    // e.currentTarget is just this single task, not the whole group
    const dropIndex = dragOverIndex !== null ? dragOverIndex : taskIndex;
    performReorder(sourceId, groupTasks, dropIndex);

    setDragOverIndex(null);
    draggedTaskRef.current = null;
  };

  const handleContainerDragOver = (e, groupTasks) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Calculate where drop will occur and show blue line
    const newDragOverIndex = calculateDropIndex(e, groupTasks);
    setDragOverIndex(newDragOverIndex);
  };

  const handleContainerDrop = (e, groupTasks) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedTaskId(null);

    const sourceId = parseInt(e.dataTransfer.getData('taskId'));
    if (!sourceId) {
      setDragOverIndex(null);
      draggedTaskRef.current = null;
      return;
    }

    // Always calculate from drop event for accuracy
    const dropIndex = calculateDropIndex(e, groupTasks);
    performReorder(sourceId, groupTasks, dropIndex);

    setDragOverIndex(null);
    draggedTaskRef.current = null;
  };

  const renderTaskGroup = (groupTasks, isToday = false) => (
    <div
      className="space-y-2"
      onDragOver={isToday ? (e) => handleContainerDragOver(e, groupTasks) : undefined}
      onDrop={isToday ? (e) => handleContainerDrop(e, groupTasks) : undefined}
    >
      {groupTasks.map((task, groupIndex) => (
        <div key={`task-${task.id}`}>
          {isToday && dragOverIndex === groupIndex && (
            <div className="h-0.5 bg-blue-500 my-1 mx-2"></div>
          )}

          <div
            onDragOver={isToday ? (e) => handleDragOver(e, groupIndex) : undefined}
            onDrop={isToday ? (e) => handleDrop(e, groupIndex, groupTasks) : undefined}
            data-task-group-index={groupIndex}
            style={draggedTaskId === task.id ? { opacity: 0.5 } : {}}
          >
            <TaskItem
              task={task}
              showCompleted={showCompleted}
              isToday={isToday}
              isDragged={draggedTaskId === task.id}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdateDetails={onUpdateDetails}
              onUpdateTask={onUpdateTask}
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDragEnd={handleDragEnd}
            />
          </div>

          {isToday && groupIndex === groupTasks.length - 1 && dragOverIndex === groupTasks.length && (
            <div className="h-0.5 bg-blue-500 my-1 mx-2"></div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {tasks.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No tasks yet. Add one to get started!</p>
      ) : (
        <div className="space-y-6">
          {groups.today.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Today</h2>
              {renderTaskGroup(groups.today, true)}
            </div>
          )}

          {groups.pastDates.map(group => (
            <div key={group.dateKey}>
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
                {formatGroupDate(group.dateKey)}
              </h2>
              {renderTaskGroup(group.tasks, false)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
