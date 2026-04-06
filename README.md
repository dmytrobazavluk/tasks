# Task Planner Frontend

A simple task management app built with React and Tailwind CSS.

## Features

- ✨ Add new tasks with optional details
  - Title is required
  - Details/notes field available during task creation
- ✅ Mark tasks as complete/incomplete (with completion timestamp)
- 📋 Collapsible task details with free-form notes
  - Expand/collapse to show metadata (added date, completion date)
  - View and edit task descriptions and notes
- 🗑️ Delete tasks
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

The test suite includes **21 tests** organized by functionality:

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
    ├── setup.js           # Common test utilities
    ├── core.spec.js       # Core functionality tests (8 tests)
    ├── validation.spec.js # Form validation tests (3 tests)
    ├── persistence.spec.js # Persistence tests (2 tests)
    └── dates.spec.js      # Date display tests (4 tests)
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
