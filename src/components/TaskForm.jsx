import { useState } from 'react';

export default function TaskForm({ onAdd, onClose, existingCategories = [] }) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && !dateError) {
      const allCategories = [...selectedCategories];
      onAdd(title, details, scheduledDate || null, allCategories);
      setTitle('');
      setDetails('');
      setScheduledDate('');
      setSelectedCategories([]);
      setNewCategory('');
      setDateError('');
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDetails('');
    setScheduledDate('');
    setSelectedCategories([]);
    setNewCategory('');
    setDateError('');
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 bg-white p-4 rounded-lg shadow">
      <div className="space-y-3">
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
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows="2"
        />

        {/* Scheduled Date */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Schedule for a specific date (optional)
          </label>
          <input
            type="date"
            value={scheduledDate}
            onChange={handleDateChange}
            min={getMinDate()}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {dateError && <p className="text-red-600 text-sm mt-1">{dateError}</p>}
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

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Add Task
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
