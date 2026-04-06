# Task Planner Frontend

A simple task management app built with React and Tailwind CSS.

## Features

- ✨ Add new tasks
- ✅ Mark tasks as complete/incomplete
- 🗑️ Delete tasks
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

The test suite includes 11 tests covering:
- ✅ Loading the app with correct title
- ✅ Empty state message display
- ✅ Adding single and multiple tasks
- ✅ Marking tasks as complete/incomplete
- ✅ Deleting tasks
- ✅ Form validation (empty/whitespace inputs)
- ✅ Input clearing after task submission
- ✅ Multi-task operations in sequence

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
│   └── components/
│       ├── TaskForm.jsx   # Form to add new tasks
│       ├── TaskList.jsx   # Renders all tasks
│       └── TaskItem.jsx   # Individual task card
└── tests/
    └── app.spec.js        # Playwright test suite
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
