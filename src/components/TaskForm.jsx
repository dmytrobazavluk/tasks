import { useState } from 'react';

export default function TaskForm({ onAdd, onClose, existingCategories = [], existingProjects = [] }) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [scheduleType, setScheduleType] = useState('none');
  const [scheduledDate, setScheduledDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [newProject, setNewProject] = useState('');
  const [dateError, setDateError] = useState('');

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
      setScheduledDate('');
    } else {
      setDateError('');
      setScheduledDate(date);
    }
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleAddNewCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !selectedCategories.includes(trimmed) && !existingCategories.includes(trimmed)) {
      setSelectedCategories(prev => [...prev, trimmed]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category) => {
    setSelectedCategories(prev => prev.filter(c => c !== category));
  };

  const handleProjectToggle = (project) => {
    setSelectedProjects(prev =>
      prev.includes(project)
        ? prev.filter(p => p !== project)
        : [...prev, project]
    );
  };

  const handleAddNewProject = () => {
    const trimmed = newProject.trim();
    if (trimmed && !selectedProjects.includes(trimmed) && !existingProjects.includes(trimmed)) {
      setSelectedProjects(prev => [...prev, trimmed]);
      setNewProject('');
    }
  };

  const handleRemoveProject = (project) => {
    setSelectedProjects(prev => prev.filter(p => p !== project));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && !dateError) {
      const allCategories = [...selectedCategories];
      const allProjects = [...selectedProjects];
      const finalScheduledDate = scheduleType === 'specific' ? (scheduledDate || null) : null;
      onAdd(title, details, scheduleType, finalScheduledDate, allCategories, allProjects);
      setTitle('');
      setDetails('');
      setScheduleType('none');
      setScheduledDate('');
      setSelectedCategories([]);
      setNewCategory('');
      setSelectedProjects([]);
      setNewProject('');
      setDateError('');
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDetails('');
    setScheduleType('none');
    setScheduledDate('');
    setSelectedCategories([]);
    setNewCategory('');
    setSelectedProjects([]);
    setNewProject('');
    setDateError('');
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 md:mt-6 bg-white p-3 md:p-4 rounded-lg shadow">
      <div className="space-y-3 md:space-y-3">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Details */}
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Add details or notes (optional)..."
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
          rows={6}
        />

        {/* Schedule in the Future */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Schedule in the future (optional)
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="scheduleType"
                value="none"
                checked={scheduleType === 'none'}
                onChange={(e) => {
                  setScheduleType(e.target.value);
                  setScheduledDate('');
                  setDateError('');
                }}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Don't schedule</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="scheduleType"
                value="soon"
                checked={scheduleType === 'soon'}
                onChange={(e) => {
                  setScheduleType(e.target.value);
                  setScheduledDate('');
                  setDateError('');
                }}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Some time in the future</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="scheduleType"
                value="specific"
                checked={scheduleType === 'specific'}
                onChange={(e) => {
                  setScheduleType(e.target.value);
                }}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Specific date in the future</span>
            </label>
          </div>

          {/* Date input only visible when scheduleType is 'specific' */}
          {scheduleType === 'specific' && (
            <div className="mt-2">
              <input
                type="date"
                value={scheduledDate}
                onChange={handleDateChange}
                min={getMinDate()}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
          {existingCategories.length > 0 && (
            <div className="space-y-1 mb-2">
              {existingCategories.map(category => (
                <label key={category} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          )}

          {/* Selected Categories Tags */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedCategories.map(category => (
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
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddNewCategory}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
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
          {existingProjects.length > 0 && (
            <div className="space-y-1 mb-2">
              {existingProjects.map(project => (
                <label key={project} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes(project)}
                    onChange={() => handleProjectToggle(project)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">{project}</span>
                </label>
              ))}
            </div>
          )}

          {/* Selected Projects Tags */}
          {selectedProjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedProjects.map(project => (
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
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddNewProject}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Add
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 px-4 md:px-6 py-3 md:py-3 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Add Task
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 md:px-6 py-3 md:py-3 text-sm md:text-base bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
