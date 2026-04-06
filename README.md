# Task Planner Frontend

A simple task management app built with React and Tailwind CSS.

## Features

- ✨ Add new tasks with optional details
  - Title is required
  - Details/notes field available during task creation
- ✅ Mark tasks as complete/incomplete with explicit buttons
  - No checkbox—use "Mark Done" / "Unmark Done" buttons (visible when expanded)
  - Completion timestamp tracked automatically
  - 5-second countdown after marking done (visible on button: "Unmark Done (5)" → "(4)" → "(3)" etc.)
  - Click "Unmark Done" anytime during countdown to cancel and revert to incomplete
  - After countdown expires, task becomes a completed task (persisted but hidden by default)
- 👁️ Toggle visibility of completed tasks
  - Completed tasks hidden by default to reduce clutter  
  - "Show Completed" / "Hide Completed" button to toggle visibility
  - Completed tasks remain visible during 5-second countdown period
  - After countdown, completed tasks are hidden until you click "Show Completed"
- 📋 Collapsible task details with read-only view
  - Expand/collapse to show metadata (added date, completion date)
  - View task descriptions and notes in read-only mode
  - Action buttons in expanded view: "Mark Done"/"Unmark Done", "Edit", and "Delete"
- ✏️ Dedicated edit form
  - Click "Edit" button to open edit form
  - Edit both title and description together
  - Save or cancel changes
- 💾 Persist tasks to browser storage (survives page reload)
- 📱 Responsive design

## How to Run

### Prerequisites
- Node.js (v18+)
- npm

### Development Server

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit:
   ```
   http://localhost:8000
   ```

The app will load and you can start adding and managing tasks! The dev server watches for file changes and automatically rebuilds.

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

The test suite includes **40 tests** organized by functionality:

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

**Date Display (4 tests)** — `dates.spec.js`
- Display added date in expanded details
- Hide completion date for incomplete tasks
- Display completion date when completed
- Toggle completion date on state change

**Completed Tasks Toggle (9 tests)** — `toggle.spec.js`
- Show/Hide Completed button visible by default
- Completed tasks hidden initially
- Toggle shows completed tasks
- Toggle hides completed tasks again
- Button text updates based on state
- Display both completed and incomplete tasks correctly
- Completed tasks have correct styling (strikethrough)
- Operations available on completed tasks when visible
- Handle toggling with multiple completed tasks

**Task Removal Countdown (9 tests)** — `countdown.spec.js`
- Tasks don't disappear immediately when marked done
- Countdown displays on unmark button (5, 4, 3, 2, 1)
- Countdown properly decrements
- Task auto-deletes after countdown completes
- Clicking "Unmark Done" cancels countdown
- Edit and delete operations available during countdown
- Countdown visible even with toggle off
- Multiple tasks with concurrent countdowns

**Show Completed Toggle - Visibility (4 tests)** — `show-completed.spec.js`
- Toggle shows completed tasks on button click
- Toggle properly switches "Show Completed" ↔ "Hide Completed" states
- Tasks auto-delete after countdown (not shown with toggle)
- Tasks visible during countdown period

Tests use **Playwright** for headless browser automation and automatically manage the dev server.

## Project Structure

```
frontend/
├── index.html              # Main entry point
├── package.json            # Project metadata and dependencies
├── build.js               # esbuild configuration for production builds
├── dev-server.js          # Development server with auto-rebuild
├── playwright.config.js   # Test configuration
├── dist/
│   └── bundle.js          # Compiled React app (generated)
├── src/
│   ├── main.jsx           # React app initialization
│   ├── App.jsx            # Main component with state management
│   ├── components/
│   │   ├── TaskForm.jsx   # Form to add new tasks
│   │   ├── TaskList.jsx   # Renders all tasks
│   │   └── TaskItem.jsx   # Individual task card with date display
│   ├── models/
│   │   └── Task.js        # Task model and utilities
│   ├── utils/
│   │   └── dateFormat.js  # Date formatting utilities
│   └── persistence/
│       ├── index.js       # Persistence factory
│       ├── localStorage.js # Browser storage implementation
│       └── memory.js      # In-memory implementation
└── tests/
    ├── setup.js              # Common test utilities
    ├── core.spec.js          # Core functionality tests (12 tests)
    ├── validation.spec.js    # Form validation tests (3 tests)
    ├── persistence.spec.js   # Persistence tests (2 tests)
    ├── dates.spec.js         # Date display tests (4 tests)
    ├── toggle.spec.js        # Completed tasks toggle tests (9 tests)
    ├── countdown.spec.js     # Task removal countdown tests (9 tests)
    └── show-completed.spec.js # Show Completed toggle tests (4 tests)
```

## Technology Stack

- **Framework:** React
- **Styling:** Tailwind CSS
- **State Management:** React Hooks (useState)
- **Build Tool:** esbuild (JSX transpilation and bundling)
- **Testing:** Playwright (end-to-end browser testing)
- **Dev Server:** Node.js HTTP server with auto-rebuild

## Future Enhancements

- Backend API integration
- Task priorities and due dates
- Categories/tags
- Database persistence
