import { useState, useEffect, useRef } from 'react';
import { formatDate, formatDateOnly } from '../utils/dateFormat';
import { formatDetailsText } from '../utils/formatDetails';
import { COUNTDOWN_CONFIG } from '../config';

export default function TaskItem({ task, isToday, isDragged, onToggle, onDelete, onUpdateDetails, onUpdateTask, onDragStart, onDragEnd, allCategories = [], categoryObjects = [], allProjects = [], projectObjects = [] }) {
  // Helper to convert category IDs to names
  const getCategoryNamesFromIds = (categoryIds) => {
    return (categoryIds || []).map(id => {
      const category = categoryObjects.find(cat => cat.id === id);
      return category ? category.name : null;
    }).filter(Boolean);
  };

  // Helper to convert project IDs to names
  const getProjectNamesFromIds = (projectIds) => {
    return (projectIds || []).map(id => {
      const project = projectObjects.find(proj => proj.id === id);
      return project ? project.name : null;
    }).filter(Boolean);
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSelectingCompletionDate, setIsSelectingCompletionDate] = useState(false);
  const [selectedCompletionDateTime, setSelectedCompletionDateTime] = useState('');
  const [validationError, setValidationError] = useState('');
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDetails, setEditDetails] = useState(task.details);
  const [editScheduleType, setEditScheduleType] = useState(task.scheduleType || 'none');
  const [editScheduledDate, setEditScheduledDate] = useState(task.scheduledDate || '');
  const [editCategories, setEditCategories] = useState(getCategoryNamesFromIds(task.categoryIds || []));
  const [newCategory, setNewCategory] = useState('');
  const [editProjects, setEditProjects] = useState(getProjectNamesFromIds(task.projectIds || []));
  const [newProject, setNewProject] = useState('');
  const [dateError, setDateError] = useState('');

  // Track if countdown is being manually cancelled vs naturally completing
  const isManuallyUncompleting = useRef(false);

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
    }, COUNTDOWN_CONFIG.decrement * 1000);

    return () => clearTimeout(timer);
  }, [task.removalCountdown, task.id, onUpdateTask]);

  // Collapse task when countdown naturally completes (not when manually cancelled)
  useEffect(() => {
    if (!task.removalCountdown || task.removalCountdown <= 0) {
      // Only collapse if this wasn't a manual uncomplete
      if (!isManuallyUncompleting.current) {
        setIsExpanded(false);
      } else {
        // Reset flag for next time
        isManuallyUncompleting.current = false;
      }
    }
  }, [task.removalCountdown]);

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    if (date && new Date(date) < new Date()) {
      setDateError('Cannot schedule for a past date');
      setEditScheduledDate('');
    } else {
      setDateError('');
      setEditScheduledDate(date);
    }
  };

  const handleCategoryToggle = (category) => {
    setEditCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleAddNewCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !editCategories.includes(trimmed) && !allCategories.includes(trimmed)) {
      setEditCategories(prev => [...prev, trimmed]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category) => {
    setEditCategories(prev => prev.filter(c => c !== category));
  };

  const handleProjectToggle = (project) => {
    setEditProjects(prev =>
      prev.includes(project)
        ? prev.filter(p => p !== project)
        : [...prev, project]
    );
  };

  const handleAddNewProject = () => {
    const trimmed = newProject.trim();
    if (trimmed && !editProjects.includes(trimmed) && !allProjects.includes(trimmed)) {
      setEditProjects(prev => [...prev, trimmed]);
      setNewProject('');
    }
  };

  const handleRemoveProject = (project) => {
    setEditProjects(prev => prev.filter(p => p !== project));
  };

  const handleUnmarkDone = () => {
    isManuallyUncompleting.current = true;
    onUpdateTask(task.id, { removalCountdown: null });
    onToggle(task.id);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim() && !dateError) {
      // Update task with all fields
      // Pass categoryNames and projectNames (not IDs) - App.jsx will handle conversion
      const finalScheduledDate = editScheduleType === 'specific' ? (editScheduledDate || null) : null;
      onUpdateTask(task.id, {
        title: editTitle,
        details: editDetails,
        scheduleType: editScheduleType,
        scheduledDate: finalScheduledDate,
        categoryNames: editCategories,
        projectNames: editProjects
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDetails(task.details);
    setEditScheduleType(task.scheduleType || 'none');
    setEditScheduledDate(task.scheduledDate || '');
    setEditCategories(getCategoryNamesFromIds(task.categoryIds || []));
    setNewCategory('');
    setEditProjects(getProjectNamesFromIds(task.projectIds || []));
    setNewProject('');
    setDateError('');
    setIsEditing(false);
  };

  const handleConfirmDelete = () => {
    onDelete(task.id);
    setIsConfirmingDelete(false);
  };

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
  };

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleMarkDoneClick = () => {
    const now = new Date();
    const defaultDate = getLocalDateString(now);
    setSelectedCompletionDateTime(defaultDate);
    setValidationError('');
    setIsSelectingCompletionDate(true);
  };

  const handleConfirmCompletion = () => {
    if (!selectedCompletionDateTime) return;

    // Parse date string (YYYY-MM-DD)
    const [year, month, day] = selectedCompletionDateTime.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0); // noon to avoid timezone issues
    const now = new Date();

    // Compare just the dates, not times
    const today = new Date();
    today.setHours(23, 59, 59);

    if (selectedDate > today) {
      setValidationError('Task completion date cannot be in the future');
      return;
    }

    // Proceed with completion
    const isoDate = selectedDate.toISOString();

    // Always start countdown (no showCompleted toggle anymore)
    const removalCountdown = Math.ceil(COUNTDOWN_CONFIG.duration / COUNTDOWN_CONFIG.decrement);

    // Update task with completion date and countdown (don't call onToggle to avoid overwriting the date)
    onUpdateTask(task.id, {
      completed: true,
      completionDate: isoDate,
      removalCountdown: removalCountdown
    });
    setIsSelectingCompletionDate(false);
  };

  const handleCancelCompletion = () => {
    setIsSelectingCompletionDate(false);
    setValidationError('');
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition">
      {!isEditing ? (
        <>
          <div
            className="flex items-start gap-2 p-3 hover:bg-gray-50 transition"
          >
            {isToday && !task.completed && (
              <div
                draggable
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                className="cursor-grab hover:opacity-75 transition flex-shrink-0 text-gray-400 select-none"
                title="Drag to reorder"
              >
                ⋮⋮
              </div>
            )}
            <div
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1 cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsExpanded(!isExpanded);
                }
              }}
            >
              <div className="flex items-center gap-1 flex-wrap">
                {getProjectNamesFromIds(task.projectIds || []).map((projectName) => (
                  <span
                    key={projectName}
                    className="inline-block px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full flex-shrink-0"
                  >
                    {projectName}
                  </span>
                ))}
                <span
                  className={`block ${
                    task.completed ? 'line-through text-gray-400' : 'text-gray-800'
                  }`}
                >
                  {task.title}
                </span>
              </div>
            </div>
            <span className="text-blue-500 font-medium text-sm flex-shrink-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? '▼' : '▶'}
            </span>
          </div>

          {isExpanded && (
            <div className="px-3 pb-2 border-t border-gray-200">
              <div className="pt-2 space-y-2">
                <div className="text-xs text-gray-500 space-y-0.5">
                  <div>
                    <span className="font-medium">Added:</span> {formatDateOnly(task.addedDate)}
                    {getCategoryNamesFromIds(task.categoryIds || []).length > 0 && (
                      <>
                        <span>,</span> <span className="font-medium">Categories:</span>{' '}
                        {getCategoryNamesFromIds(task.categoryIds || []).join(', ')}
                      </>
                    )}
                  </div>
                  {task.completionDate && (
                    <div>
                      <span className="font-medium">Completed:</span>{' '}
                      {formatDateOnly(task.completionDate)}
                    </div>
                  )}
                </div>

                {task.details && (
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-0.5">
                      Details
                    </div>
                    <div className="text-sm text-gray-600 p-1.5 bg-gray-50 rounded whitespace-pre-wrap break-words">
                      {formatDetailsText(task.details)}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    {task.completed ? (
                      <button
                        onClick={handleUnmarkDone}
                        className="flex-1 px-2 py-1.5 text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-md transition font-medium"
                      >
                        Unmark Done{task.removalCountdown && ` (${(task.removalCountdown * COUNTDOWN_CONFIG.decrement).toFixed(1)})`}
                      </button>
                    ) : (
                      <button
                        onClick={handleMarkDoneClick}
                        className="flex-1 px-2 py-1.5 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded-md transition font-medium"
                      >
                        Mark Done
                      </button>
                    )}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 px-2 py-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setIsConfirmingDelete(true)}
                      className="flex-1 px-2 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition font-medium"
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
          {/* Title */}
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

          {/* Details */}
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

          {/* Schedule in the Future */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Schedule in the future (optional)
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="editScheduleType"
                  value="none"
                  checked={editScheduleType === 'none'}
                  onChange={(e) => {
                    setEditScheduleType(e.target.value);
                    setEditScheduledDate('');
                    setDateError('');
                  }}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">Don't schedule</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="editScheduleType"
                  value="soon"
                  checked={editScheduleType === 'soon'}
                  onChange={(e) => {
                    setEditScheduleType(e.target.value);
                    setEditScheduledDate('');
                    setDateError('');
                  }}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">Some time in the future</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="editScheduleType"
                  value="specific"
                  checked={editScheduleType === 'specific'}
                  onChange={(e) => {
                    setEditScheduleType(e.target.value);
                  }}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">Specific date in the future</span>
              </label>
            </div>

            {/* Date input only visible when editScheduleType is 'specific' */}
            {editScheduleType === 'specific' && (
              <div className="mt-2">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={editScheduledDate}
                    onChange={handleDateChange}
                    min={getMinDate()}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editScheduledDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditScheduledDate('');
                        setDateError('');
                      }}
                      className="px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {dateError && <p className="text-red-600 text-sm mt-1">{dateError}</p>}
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Categories
            </label>

            {/* Existing Categories Checkboxes */}
            {allCategories.length > 0 && (
              <div className="space-y-1 mb-2">
                {allCategories.map(category => (
                  <label key={category} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Selected Categories Tags */}
            {editCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {editCategories.map(category => (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {category}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(category)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* New Category Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewCategory();
                  }
                }}
                placeholder="Type new category name..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddNewCategory}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Projects */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Projects
            </label>

            {/* Existing Projects Checkboxes */}
            {allProjects.length > 0 && (
              <div className="space-y-1 mb-2">
                {allProjects.map(project => (
                  <label key={project} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editProjects.includes(project)}
                      onChange={() => handleProjectToggle(project)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">{project}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Selected Projects Tags */}
            {editProjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {editProjects.map(project => (
                  <span
                    key={project}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                  >
                    {project}
                    <button
                      type="button"
                      onClick={() => handleRemoveProject(project)}
                      className="text-purple-600 hover:text-purple-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* New Project Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewProject();
                  }
                }}
                placeholder="Type new project name..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddNewProject}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Buttons */}
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

      {isSelectingCompletionDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">When was this completed?</h2>

            <input
              type="date"
              value={selectedCompletionDateTime}
              onChange={(e) => {
                setSelectedCompletionDateTime(e.target.value);
                // Blur to close the native calendar picker, but keep modal open
                setTimeout(() => e.target.blur(), 0);
              }}
              max={getLocalDateString(new Date())}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {validationError && (
              <p className="text-red-600 text-sm mb-3">{validationError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancelCompletion}
                className="flex-1 px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCompletion}
                className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
