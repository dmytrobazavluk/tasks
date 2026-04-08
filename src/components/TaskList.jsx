import { useState, useRef } from 'react';
import TaskItem from './TaskItem';
import {
  getTasksForToday,
  getTasksForCategory,
  getTasksForClosedTab,
  getTodayDateKey,
  getDateKey,
  isToday
} from '../utils/taskGrouping';
import { formatGroupDate } from '../utils/dateFormat';
import { getUniqueCategoriesFromTasks } from '../utils/categoryUtils';

export default function TaskList({
  tasks,
  categories = [],
  selectedTab,
  onToggle,
  onDelete,
  onUpdateDetails,
  onUpdateTask,
  onReorderTasks
}) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const draggedTaskRef = useRef(null);

  // Get unique category names for edit form
  const categoryNames = getUniqueCategoriesFromTasks(tasks, categories);

  // Get groups based on selected tab
  let groups = [];
  let isTodayTab = false;
  let isClosedTab = false;

  if (selectedTab === 'today') {
    groups = getTasksForToday(tasks);
    isTodayTab = true;
  } else if (selectedTab === 'closed') {
    groups = getTasksForClosedTab(tasks);
    isClosedTab = true;
  } else if (selectedTab.startsWith('category:')) {
    const category = selectedTab.substring('category:'.length);
    groups = getTasksForCategory(tasks, category);
  }

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

  const calculateDropIndex = (e, groupTasks) => {
    const taskDivs = e.currentTarget.querySelectorAll('[data-task-group-index]');

    for (let i = 0; i < taskDivs.length; i++) {
      const taskRect = taskDivs[i].getBoundingClientRect();
      const midpoint = taskRect.top + taskRect.height / 2;

      if (e.clientY < midpoint) {
        return i;
      }
    }

    return groupTasks.length;
  };

  const performReorder = (sourceId, groupTasks, dropIndex) => {
    const sourceIndex = tasks.findIndex(t => t.id === sourceId);
    if (sourceIndex === -1) return;

    const sourceTask = tasks[sourceIndex];
    const sourceGroupIndex = groupTasks.findIndex(t => t.id === sourceTask.id);

    if (sourceGroupIndex === -1) return;

    if (dropIndex === sourceGroupIndex) {
      return;
    }

    if (dropIndex === sourceGroupIndex + 1) {
      return;
    }

    let targetIndex;
    if (dropIndex === 0) {
      targetIndex = 0;
    } else if (dropIndex >= groupTasks.length) {
      targetIndex = tasks.length;
    } else {
      const targetTaskId = groupTasks[dropIndex]?.id;
      targetIndex = tasks.findIndex(t => t.id === targetTaskId);
    }

    if (sourceIndex !== targetIndex && targetIndex >= 0 && targetIndex <= tasks.length) {
      onReorderTasks(sourceIndex, targetIndex);
    }
  };

  const handleContainerDragOver = (e, groupTasks) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

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

    const dropIndex = calculateDropIndex(e, groupTasks);
    performReorder(sourceId, groupTasks, dropIndex);

    setDragOverIndex(null);
    draggedTaskRef.current = null;
  };

  const renderTaskGroup = (group) => (
    <div
      key={group.dateKey}
      className="space-y-2 mb-6"
      onDragOver={isTodayTab ? (e) => handleContainerDragOver(e, group.tasks) : undefined}
      onDrop={isTodayTab ? (e) => handleContainerDrop(e, group.tasks) : undefined}
    >
      {/* Group Header */}
      <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
        {formatGroupDate(group.dateKey)}
      </h3>

      {/* Tasks */}
      {group.tasks.length === 0 ? (
        <p className="text-sm text-gray-400">No tasks</p>
      ) : (
        group.tasks.map((task, groupIndex) => (
          <div key={`task-${task.id}`}>
            {isTodayTab && dragOverIndex === groupIndex && (
              <div className="h-0.5 bg-blue-500 my-1 mx-2"></div>
            )}

            <div
              onDragOver={isTodayTab ? (e) => {
                e.preventDefault();
              } : undefined}
              data-task-group-index={groupIndex}
              style={draggedTaskId === task.id ? { opacity: 0.5 } : {}}
            >
              <TaskItem
                task={task}
                isToday={isTodayTab}
                isDragged={draggedTaskId === task.id}
                allCategories={categoryNames}
                categoryObjects={categories}
                onToggle={onToggle}
                onDelete={onDelete}
                onUpdateDetails={onUpdateDetails}
                onUpdateTask={onUpdateTask}
                onDragStart={isTodayTab ? (e) => handleDragStart(e, task.id) : undefined}
                onDragEnd={isTodayTab ? handleDragEnd : undefined}
              />
            </div>

            {isTodayTab && groupIndex === group.tasks.length - 1 && dragOverIndex === group.tasks.length && (
              <div className="h-0.5 bg-blue-500 my-1 mx-2"></div>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div>
      {groups.length === 0 || (groups.length === 1 && groups[0].tasks.length === 0) ? (
        <p className="text-gray-500 text-center py-8">No tasks yet. Add one to get started!</p>
      ) : (
        <div className="space-y-6">
          {groups.map(group => renderTaskGroup(group))}
        </div>
      )}
    </div>
  );
}
