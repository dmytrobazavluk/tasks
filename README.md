# Task Planner Frontend

A simple task management app built with React and Tailwind CSS.

## Features

- ✨ **Add tasks with optional details and scheduling**
  - Click "+ Add Task" button to open the form
  - Title is required
  - Optional details/notes field
  - Schedule tasks for specific future dates
  - Assign one or more categories
  - Form closes automatically after adding

- 🏷️ **Flexible Categories**
  - Assign multiple categories to each task
  - Categories auto-created on-the-fly
  - Sidebar tabs show all categories with task counts
  - Filter tasks by category
  - Categories persist in export/import

- 📅 **Task Scheduling**
  - Schedule tasks for specific future dates
  - Scheduled tasks only appear on their assigned date (not in Today)
  - When scheduled date arrives, task moves to Today tab
  - Validate against past dates

- 📂 **Sidebar Navigation** (replaces old "Show Completed" toggle)
  - **Today** tab: All incomplete tasks + tasks completed today
  - **Category tabs**: All tasks with that category (sorted alphabetically)
  - **Closed Tasks** tab: Completed tasks without active countdown
  - Task counts next to each tab
  - Active tab highlighted in blue
  - One-click filtering

- ✅ **Mark tasks as complete/incomplete**
  - Use "Mark Done" / "Unmark Done" buttons (visible when expanded)
  - Set custom completion date/time (defaults to current time)
  - Countdown timer after marking done (3 seconds by default)
  - Countdown displayed as "Unmark Done (2.9)" → "(1.8)" → "(0.7)"
  - Click "Unmark Done" during countdown to revert to incomplete
  - Tasks stay visible during countdown grace period
  - After countdown: tasks completed today stay in Today tab, older completions move to Closed Tasks

- 🎯 **Drag-and-drop reordering**
  - Drag handle (⋮⋮) on the left of each incomplete task in Today tab
  - Blue line indicator shows drop position
  - Completed tasks cannot be reordered
  - Reordering only available in Today tab

- 📋 **Collapsible task details**
  - Click task title to expand/collapse
  - Arrow icon: ▶ (collapsed) or ▼ (expanded)
  - View metadata: added date, completion date
  - Strikethrough styling for completed tasks
  - Action buttons: "Mark Done"/"Unmark Done", "Edit", "Delete"

- ✏️ **Dedicated edit form**
  - Edit title, description, scheduled date, and categories
  - Clear scheduled date or change it to a different future date
  - Add/remove category assignments
  - Save or cancel changes

- 💾 **Persist tasks to browser storage**
  - Tasks survive page reload
  - Categories stored separately with auto-migration from old format

- 📤 **Export/Import**
  - Export all tasks and categories to JSON file
  - Import JSON file to replace all tasks
  - Auto-migration from old formats
  - Filename format: `tasks-YYYY-MM-DD.json`

- 📱 **Responsive design**

## How to Run

### Prerequisites
- Node.js (v18+)
- npm

### Quick Start
```bash
npm install
npm run dev
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

The dev server watches for file changes and automatically rebuilds.

### First Time Setup Issues?
See **[CONTRIBUTING.md](CONTRIBUTING.md)** — Troubleshooting section for common problems.

## Testing

Run automated tests to ensure nothing breaks after making changes:

```bash
# Run all tests
npm test

# Run tests with interactive UI
npm test:ui

# Run tests in headed mode (see browser)
npm test:headed
```

### Test Coverage

The test suite includes **51 tests** organized by functionality:

**Core Functionality (12 tests)** — `core.spec.js`
- Load app with title, empty state display
- Add single/multiple tasks
- Add task details during creation
- Mark tasks complete/incomplete
- Delete tasks
- Multi-operation sequences
- Expand and collapse task details
- Add and edit task details
- Real-time detail updates

**Form Validation (3 tests)** — `validation.spec.js`
- Reject empty task submission
- Reject whitespace-only input
- Clear input after submission

**Persistence (2 tests)** — `persistence.spec.js`
- Tasks survive page reload
- Task state (completion) persists

**Date Display (5 tests)** — `dates.spec.js`
- Display added date in expanded details
- Hide completion date for incomplete tasks
- Display completion date when completed
- Toggle completion date on state change
- Set completion date to custom past date (not current time)

**Task Removal Countdown (11 tests)** — `countdown.spec.js`
- Tasks visible during countdown (grace period)
- Countdown displays on unmark button as decimal seconds (e.g., 2.9, 1.8, 0.7)
- Countdown properly decrements at 0.1 second intervals
- Task moves to Closed Tasks after countdown completes
- Clicking "Unmark Done" cancels countdown and reverts to incomplete
- Edit and delete operations available during countdown
- Multiple tasks with concurrent countdowns
- Countdown behavior during tab switching

**Task Scheduling & Categories (8 tests)** — `scheduling-categories.spec.js`
- Add task with single category
- Filter tasks by category tab
- Display correct task counts in sidebar
- Display current tab name in header
- Clear scheduled date during edit
- Keep task in category tab during countdown, move to closed after
- Show closed tasks in closed tasks tab
- Keep past-completed task in today tab during countdown

**Export/Import Functionality (7 tests)** — `export-import.spec.js`
- Have export and import buttons
- Export button is clickable
- Import tasks and categories from JSON file
- Show error for invalid JSON
- Show error for invalid task structure
- Cancel import without changes
- Require file selection before import

**Task Reordering (5 tests)** — `reorder.spec.js`
- Incomplete tasks have draggable handle
- Completed tasks do not have draggable handle
- Today group renders with tasks
- Incomplete and completed tasks are grouped correctly
- Dragging task without significant position change doesn't move it

Tests use **Playwright** for headless browser automation and automatically manage the dev server.

## Project Structure

```
frontend/
├── README.md               # Feature documentation (this file)
├── CONTRIBUTING.md         # How to add features and contribute
├── TESTING.md              # Testing guide and patterns
├── PROGRESS.md             # Project progress and status
├── IMPLEMENTATION_NOTES.md # Developer notes on code patterns and decisions
├── package.json            # Project metadata and dependencies
├── build.js               # esbuild configuration for production builds
├── dev-server.js          # Development server with auto-rebuild
├── playwright.config.js   # Test configuration
├── dist/
│   └── bundle.js          # Compiled React app (generated)
├── src/
│   ├── main.jsx           # React app initialization
│   ├── App.jsx            # Main component with state management
│   ├── config.js          # Countdown configuration
│   ├── components/
│   │   ├── Sidebar.jsx    # Category/status tab navigation
│   │   ├── TaskForm.jsx   # Form to add new tasks
│   │   ├── TaskList.jsx   # Renders task groups with drag-drop support
│   │   ├── TaskItem.jsx   # Individual task card with drag handle
│   │   └── ImportModal.jsx # Import modal dialog
│   ├── models/
│   │   ├── Task.js        # Task model and utilities
│   │   └── Category.js    # Category model (NEW)
│   ├── utils/
│   │   ├── dateFormat.js        # Date formatting utilities
│   │   ├── taskGrouping.js      # Task grouping by tab/category
│   │   ├── categoryUtils.js     # Category filtering and aggregation
│   │   └── taskExportImport.js  # Export/import functionality
│   └── persistence/
│       ├── index.js           # Persistence factory
│       ├── localStorage.js    # Browser storage implementation
│       ├── memory.js          # In-memory implementation
│       └── migrations.js      # Format migration utilities
└── tests/
    ├── setup.js                    # Common test utilities
    ├── core.spec.js                # Core functionality tests (12 tests)
    ├── validation.spec.js          # Form validation tests (3 tests)
    ├── persistence.spec.js         # Persistence tests (2 tests)
    ├── dates.spec.js               # Date display tests (5 tests)
    ├── countdown.spec.js           # Task removal countdown tests (11 tests)
    ├── scheduling-categories.spec.js # Scheduling & categories tests (8 tests)
    ├── export-import.spec.js       # Export/import tests (7 tests)
    └── reorder.spec.js             # Task reordering tests (5 tests)
```

## Technology Stack

- **Framework:** React
- **Styling:** Tailwind CSS
- **State Management:** React Hooks (useState)
- **Build Tool:** esbuild (JSX transpilation and bundling)
- **Testing:** Playwright (end-to-end browser testing)
- **Dev Server:** Node.js HTTP server with auto-rebuild

## Data Model

### Task
```javascript
{
  id: number,                    // Generated with Date.now()
  title: string,                 // Required
  completed: boolean,
  details: string,               // Optional
  scheduledDate: string|null,    // ISO date (YYYY-MM-DD) for future scheduling
  categoryIds: string[],         // Array of category UUIDs
  addedDate: string,             // ISO timestamp
  completionDate: string|null,   // ISO timestamp when completed
  removalCountdown: number|null  // Grace period countdown (runtime only)
}
```

### Category
```javascript
{
  id: string,    // UUID
  name: string   // User-provided category name
}
```

## Contributing

Want to add a feature or fix a bug? Start here:

1. **Setup:** Follow "How to Run" section above
2. **Learn:** Read [CONTRIBUTING.md](CONTRIBUTING.md)
3. **Code:** Follow the step-by-step guide in CONTRIBUTING.md
4. **Test:** Run `npm test` to verify changes
5. **Submit:** Create a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- How to add new features (with example)
- Git workflow and conventions
- Code style and patterns
- Testing requirements
- Troubleshooting common issues

## Release History

### v2.0.0 (2026-04-08)
- **NEW:** Categories as explicit entities with IDs
- **NEW:** Task scheduling for future dates
- **NEW:** Sidebar tab navigation (replaces Show Completed toggle)
- **FIXED:** Export/import now includes categories
- **IMPROVED:** Auto-migration from old data formats
- All 51 tests passing

### v1.0.0 (Earlier)
- Core task management with completion countdown
- Task grouping by date
- Drag-and-drop reordering
- Browser persistence
