# Task Planner Frontend

A simple task management app built with React and Tailwind CSS.

## Features

- ✨ Add new tasks with optional details
  - Click "+ Add Task" button at the bottom to open the form
  - Title is required
  - Details/notes field available during task creation
  - Form closes automatically after adding task
- ✅ Mark tasks as complete/incomplete with explicit buttons
  - No checkbox—use "Mark Done" / "Unmark Done" buttons (visible when expanded)
  - Completion timestamp tracked automatically
  - 3-second countdown after marking done (displayed as decimal seconds: "Unmark Done (2.9)" → "(1.8)" → "(0.7)" etc.)
  - Countdown only starts when "Show Completed" toggle is OFF
  - Click "Unmark Done" anytime during countdown to cancel and revert to incomplete
  - After countdown expires, task becomes a completed task (persisted but hidden by default)
- 👁️ Toggle visibility of completed tasks
  - Completed tasks hidden by default to reduce clutter  
  - "Show Completed" / "Hide Completed" button (top right) to toggle visibility
  - Completed tasks remain visible during countdown period (when toggle is OFF)
  - When you toggle "Show Completed" ON, all active countdowns are cancelled
  - After countdown expires, completed tasks are hidden until you click "Show Completed"
- 📋 Collapsible task details with read-only view
  - Click anywhere on the task header (title area) to expand/collapse
  - Arrow icon indicates state: ▶ (collapsed) or ▼ (expanded)
  - View metadata when expanded: added date, completion date
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

The test suite includes **43 tests** organized by functionality:

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

**Task Removal Countdown (10 tests)** — `countdown.spec.js`
- Tasks don't disappear immediately when marked done
- Countdown displays on unmark button as decimal seconds (e.g., 2.9, 1.8, 0.7)
- Countdown properly decrements at 0.1 second intervals
- Task hidden after countdown completes (when toggle is off)
- Clicking "Unmark Done" cancels countdown and reverts to incomplete
- Edit and delete operations available during countdown
- Countdown only shows when "Show Completed" toggle is off
- Multiple tasks with concurrent countdowns

**Show Completed Toggle - Visibility (4 tests)** — `show-completed.spec.js`
- Toggle shows completed tasks on button click
- Toggle properly switches "Show Completed" ↔ "Hide Completed" states
- Countdown is disabled when "Show Completed" is on
- Active countdowns are cancelled when toggling to "Show Completed"

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
    ├── countdown.spec.js     # Task removal countdown tests (10 tests)
    └── show-completed.spec.js # Show Completed toggle tests (4 tests)
```

## Technology Stack

- **Framework:** React
- **Styling:** Tailwind CSS
- **State Management:** React Hooks (useState)
- **Build Tool:** esbuild (JSX transpilation and bundling)
- **Testing:** Playwright (end-to-end browser testing)
- **Dev Server:** Node.js HTTP server with auto-rebuild

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

## Future Enhancements

- Backend API integration
- Task priorities and due dates
- Categories/tags
- Database persistence
