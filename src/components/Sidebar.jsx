import { getTodayDateKey } from '../utils/taskGrouping';
import {
  countTodayTasks,
  countTasksInCategory,
  countClosedTasks,
  getUniqueCategoriesFromTasks,
  countClosedTasksWithoutCountdown
} from '../utils/categoryUtils';

export default function Sidebar({ tasks, selectedTab, onSelectTab }) {
  const categories = getUniqueCategoriesFromTasks(tasks);
  const todayCount = countTodayTasks(tasks);
  const closedCount = countClosedTasksWithoutCountdown(tasks);

  return (
    <div className="w-48 bg-gray-50 border-r border-gray-200 p-4">
      <div className="space-y-1">
        {/* Today Tab */}
        <button
          onClick={() => onSelectTab('today')}
          className={`w-full text-left px-4 py-2 rounded-md transition text-sm font-medium ${
            selectedTab === 'today'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          Today <span className="float-right">({todayCount})</span>
        </button>

        {/* Category Tabs */}
        {categories.map(category => (
          <button
            key={category}
            onClick={() => onSelectTab(`category:${category}`)}
            className={`w-full text-left px-4 py-2 rounded-md transition text-sm font-medium ${
              selectedTab === `category:${category}`
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category} <span className="float-right">({countTasksInCategory(tasks, category)})</span>
          </button>
        ))}

        {/* Closed Tasks Tab */}
        {closedCount > 0 && (
          <button
            onClick={() => onSelectTab('closed')}
            className={`w-full text-left px-4 py-2 rounded-md transition text-sm font-medium ${
              selectedTab === 'closed'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Closed Tasks <span className="float-right">({closedCount})</span>
          </button>
        )}
      </div>
    </div>
  );
}
