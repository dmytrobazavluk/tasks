import { useState, useRef } from 'react';
import TaskItem from './TaskItem';
import {
  getTasksForTodayByProject,
  getTasksForFutureTab,
  getTasksForCategory,
  getTasksForProjectTab,
  getTasksForClosedTab,
} from '../utils/taskGrouping';
import { formatGroupDate } from '../utils/dateFormat';
import { getUniqueCategoriesFromTasks } from '../utils/categoryUtils';
import { getUniqueProjectsFromTasks } from '../utils/projectUtils';

export default function TaskList({
  tasks,
  categories = [],
  projects = [],
  selectedTab,
  onToggle,
  onDelete,
  onUpdateDetails,
  onUpdateTask,
  onReorderTasks
}) {
  // Task drag state
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragOverGroupKey, setDragOverGroupKey] = useState(null);
  const draggedTaskRef = useRef(null);
  const isDraggingTask = useRef(false);

  // Group drag state (Today tab only)
  const [draggedGroupKey, setDraggedGroupKey] = useState(null);
  const [dragOverGroupIndex, setDragOverGroupIndex] = useState(null);
  const [groupOrder, setGroupOrder] = useState([]);

  const categoryNames = getUniqueCategoriesFromTasks(tasks, categories);
  const projectNames = getUniqueProjectsFromTasks(tasks, projects).map(p => p.name);

  // Compute groups based on selected tab
  let groups = [];
  let isTodayTab = false;

  if (selectedTab === 'today') {
    isTodayTab = true;
    const computedGroups = getTasksForTodayByProject(tasks, projects);
    const keyToGroup = new Map(computedGroups.map(g => [g.groupKey, g]));
    // Preserve user-defined order; append new groups at the end
    const orderedKeys = [
      ...groupOrder.filter(k => keyToGroup.has(k)),
      ...computedGroups.map(g => g.groupKey).filter(k => !groupOrder.includes(k))
    ];
    groups = orderedKeys.map(k => keyToGroup.get(k)).filter(Boolean);
  } else if (selectedTab === 'future') {
    groups = getTasksForFutureTab(tasks);
  } else if (selectedTab === 'closed') {
    groups = getTasksForClosedTab(tasks);
  } else if (selectedTab.startsWith('project:')) {
    groups = getTasksForProjectTab(tasks, selectedTab.substring('project:'.length));
  } else if (selectedTab.startsWith('category:')) {
    groups = getTasksForCategory(tasks, selectedTab.substring('category:'.length));
  }

  // ── Task drag handlers ──────────────────────────────────────────────────────

  const handleDragStart = (e, taskId) => {
    isDraggingTask.current = true;
    draggedTaskRef.current = taskId;
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', String(taskId));
  };

  const handleDragEnd = () => {
    isDraggingTask.current = false;
    setDraggedTaskId(null);
    setDragOverIndex(null);
    setDragOverGroupKey(null);
    draggedTaskRef.current = null;
  };

  const calculateDropIndex = (e, groupTasks) => {
    const taskDivs = e.currentTarget.querySelectorAll('[data-task-group-index]');
    for (let i = 0; i < taskDivs.length; i++) {
      const rect = taskDivs[i].getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) return i;
    }
    return groupTasks.length;
  };

  const performReorder = (sourceId, groupTasks, dropIndex) => {
    const sourceIndex = tasks.findIndex(t => t.id === sourceId);
    if (sourceIndex === -1) return;
    const sourceGroupIndex = groupTasks.findIndex(t => t.id === tasks[sourceIndex].id);
    if (sourceGroupIndex === -1) return;
    if (dropIndex === sourceGroupIndex || dropIndex === sourceGroupIndex + 1) return;

    let targetIndex;
    if (dropIndex === 0) {
      targetIndex = 0;
    } else if (dropIndex >= groupTasks.length) {
      targetIndex = tasks.length;
    } else {
      targetIndex = tasks.findIndex(t => t.id === groupTasks[dropIndex]?.id);
    }

    if (sourceIndex !== targetIndex && targetIndex >= 0 && targetIndex <= tasks.length) {
      onReorderTasks(sourceIndex, targetIndex);
    }
  };

  const handleContainerDragOver = (e, groupTasks, groupKey) => {
    if (draggedGroupKey) return; // group drag in progress — ignore task events
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverGroupKey(groupKey);
    setDragOverIndex(calculateDropIndex(e, groupTasks));
  };

  const handleContainerDrop = (e, groupTasks) => {
    if (draggedGroupKey) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggedTaskId(null);
    setDragOverGroupKey(null);
    const sourceId = parseInt(e.dataTransfer.getData('taskId'));
    if (!sourceId) { setDragOverIndex(null); draggedTaskRef.current = null; return; }
    performReorder(sourceId, groupTasks, calculateDropIndex(e, groupTasks));
    setDragOverIndex(null);
    draggedTaskRef.current = null;
  };

  // ── Group drag handlers (Today tab) ────────────────────────────────────────

  const handleGroupDragStart = (e, groupKey) => {
    if (isDraggingTask.current) { e.preventDefault(); return; }
    setDraggedGroupKey(groupKey);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('groupKey', groupKey);
  };

  const handleGroupDragEnd = () => {
    setDraggedGroupKey(null);
    setDragOverGroupIndex(null);
  };

  const handleGroupDragOver = (e, groupIndex) => {
    if (!draggedGroupKey) return;
    e.preventDefault();
    setDragOverGroupIndex(groupIndex);
  };

  const handleGroupDrop = (e, targetIndex) => {
    e.preventDefault();
    if (!draggedGroupKey) return;
    const sourceIndex = groups.findIndex(g => g.groupKey === draggedGroupKey);
    if (sourceIndex !== -1 && sourceIndex !== targetIndex) {
      const reordered = [...groups];
      const [moved] = reordered.splice(sourceIndex, 1);
      reordered.splice(sourceIndex < targetIndex ? targetIndex - 1 : targetIndex, 0, moved);
      setGroupOrder(reordered.map(g => g.groupKey));
    }
    setDraggedGroupKey(null);
    setDragOverGroupIndex(null);
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderTaskItem = (task, taskIndex, groupKey, groupTaskCount) => (
    <div key={`task-${task.id}-${groupKey}`}>
      {dragOverGroupKey === groupKey && dragOverIndex === taskIndex && (
        <div className="h-0.5 bg-blue-500 my-1 mx-2" />
      )}
      <div
        data-task-group-index={taskIndex}
        onDragOver={(e) => e.preventDefault()}
        style={draggedTaskId === task.id ? { opacity: 0.5 } : {}}
      >
        <TaskItem
          task={task}
          isToday={isTodayTab}
          isDragged={draggedTaskId === task.id}
          allCategories={categoryNames}
          categoryObjects={categories}
          allProjects={projectNames}
          projectObjects={projects}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdateDetails={onUpdateDetails}
          onUpdateTask={onUpdateTask}
          onDragStart={isTodayTab ? (e) => { e.stopPropagation(); handleDragStart(e, task.id); } : undefined}
          onDragEnd={isTodayTab ? handleDragEnd : undefined}
        />
      </div>
      {taskIndex === groupTaskCount - 1 && dragOverGroupKey === groupKey && dragOverIndex === groupTaskCount && (
        <div className="h-0.5 bg-blue-500 my-1 mx-2" />
      )}
    </div>
  );

  // Today tab: project groups with group-level drag-and-drop
  const renderProjectGroup = (group, groupIndex) => (
    <div
      key={group.groupKey}
      onDragOver={(e) => handleGroupDragOver(e, groupIndex)}
      onDrop={(e) => handleGroupDrop(e, groupIndex)}
    >
      {draggedGroupKey && dragOverGroupIndex === groupIndex && (
        <div className="h-0.5 bg-blue-500 mb-3 mx-2" />
      )}
      <div
        className={`space-y-2 mb-6${draggedGroupKey === group.groupKey ? ' opacity-50' : ''}`}
      >
        {/* Group header with drag handle */}
        <div
          draggable
          onDragStart={(e) => handleGroupDragStart(e, group.groupKey)}
          onDragEnd={handleGroupDragEnd}
          className="flex items-center gap-2 cursor-grab select-none"
        >
          <span className="text-gray-400 hover:text-gray-600 transition">⋮⋮</span>
          <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
            {group.label}
          </h3>
        </div>

        {/* Tasks */}
        <div
          onDragOver={(e) => handleContainerDragOver(e, group.tasks, group.groupKey)}
          onDrop={(e) => handleContainerDrop(e, group.tasks)}
        >
          {group.tasks.length === 0 ? (
            <p className="text-sm text-gray-400">No tasks</p>
          ) : (
            group.tasks.map((task, i) => renderTaskItem(task, i, group.groupKey, group.tasks.length))
          )}
        </div>
      </div>
    </div>
  );

  // Non-today tabs: date-keyed groups
  const renderDateGroup = (group) => (
    <div key={group.dateKey} className="space-y-2 mb-6">
      <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
        {formatGroupDate(group.dateKey)}
      </h3>
      {group.tasks.length === 0 ? (
        <p className="text-sm text-gray-400">No tasks</p>
      ) : (
        group.tasks.map((task, i) => renderTaskItem(task, i, group.dateKey, group.tasks.length))
      )}
    </div>
  );

  const isEmpty = groups.length === 0 || groups.every(g => g.tasks.length === 0);

  return (
    <div>
      {isEmpty ? (
        <p className="text-gray-500 text-center py-8">No tasks yet. Add one to get started!</p>
      ) : (
        <div className="space-y-0">
          {isTodayTab
            ? groups.map((group, i) => renderProjectGroup(group, i))
            : groups.map(group => renderDateGroup(group))
          }
        </div>
      )}
    </div>
  );
}
