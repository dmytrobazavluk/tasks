# Testing & Development Guide

## Quick Commands

```bash
npm test              # Run all tests (headless)
npm test:ui          # Run tests with interactive UI
npm test:headed      # Run tests with visible browser
npm run dev          # Start dev server
npm run build        # Build for production
```

## Build System

**Tool:** esbuild
- Compiles JSX → JavaScript (IIFE format)
- Auto-rebuilds on file changes (in dev mode)
- Bundles React and all dependencies into `dist/bundle.js`
- Source maps included for debugging

**Config:**
- Entry: `src/main.jsx`
- Output: `dist/bundle.js`
- JSX Transform: automatic with `jsxImportSource: 'react'`

**Scripts:**
- `build.js` — One-time production build
- `dev-server.js` — Dev server with watch and auto-compile

## Test Suite

**Framework:** Playwright (headless browser automation)
- **82 tests total** organized by feature
- Runs headless by default (no visible browser window)
- Auto-starts dev server before tests
- Reuses existing server if already running (speeds up iterations)
- Average execution time: ~16 seconds

**Test Coverage by Category:**

**Core Functionality (12 tests)** — `tests/core.spec.js`
- Load app with title, empty state display
- Add single/multiple tasks
- Add task details during creation
- Mark tasks complete/incomplete
- Delete tasks
- Multi-operation sequences
- Expand and collapse task details
- Add and edit task details
- Real-time detail updates

**Form Validation (3 tests)** — `tests/validation.spec.js`
- Reject empty task submission
- Reject whitespace-only input
- Clear input after submission

**Persistence (2 tests)** — `tests/persistence.spec.js`
- Tasks survive page reload
- Task state (completion) persists

**Date Display (5 tests)** — `tests/dates.spec.js`
- Display added date in expanded details
- Hide completion date for incomplete tasks
- Display completion date when completed
- Toggle completion date on state change
- Set completion date to custom past date (not current time)

**Task Removal Countdown (11 tests)** — `tests/countdown.spec.js`
- Tasks visible during countdown (grace period)
- Countdown displays on unmark button as decimal seconds (e.g., 2.9, 1.8, 0.7)
- Countdown properly decrements at 0.1 second intervals
- Task moves to Closed Tasks after countdown completes
- Clicking "Unmark Done" cancels countdown and reverts to incomplete
- Edit and delete operations available during countdown
- Multiple tasks with concurrent countdowns
- Countdown behavior during tab switching

**Task Scheduling & Categories & Projects (13 tests)** — `tests/scheduling-categories.spec.js`
- Add task with single category
- Filter tasks by category tab
- Display correct task counts in sidebar
- Display current tab name in header
- Clear scheduled date during edit
- Keep task in category tab during countdown, move to closed after
- Show closed tasks in closed tasks tab
- Keep past-completed task in today tab during countdown
- Add task with "Some time in the future" scheduling
- Display future tasks in correct order (soon first, then dates descending)
- Hide Future tab when no scheduled tasks exist
- Switch between scheduling modes in edit modal
- Count future tasks correctly in sidebar

**Export/Import Functionality (7 tests)** — `tests/export-import.spec.js`
- Have export and import buttons
- Export button is clickable
- Import tasks and categories from JSON file
- Show error for invalid JSON
- Show error for invalid task structure
- Cancel import without changes
- Require file selection before import

**Task Reordering (5 tests)** — `tests/reorder.spec.js`
- Incomplete tasks have draggable handle
- Completed tasks do not have draggable handle
- Today group renders with tasks
- Incomplete and completed tasks are grouped correctly
- Dragging task without significant position change doesn't move it

**Task Details Checkboxes (9 tests)** — `tests/checkboxes.spec.js`
- Display checkbox content from `[]` and `[x]` syntax
- Render mixed checkbox and regular lines in details
- Persist checkbox state after edit and reload
- Support both lowercase `[x]` and uppercase `[X]` as checked
- Toggle individual checkboxes and update task details
- Apply strikethrough styling to checked items
- Reflect checkbox changes immediately in edit form
- Handle multiple checkboxes with independent states
- Maintain checkbox states through edit cycles

**Categories Display in Task Details (5 tests)** — `tests/categories-display.spec.js`
- Display categories as comma-separated list in metadata
- Show multiple categories properly formatted
- Hide categories section when task has no categories
- Display categories on same line as Added date with comma separator
- Display categories in filtered category view

**Config:** `playwright.config.js`
- Base URL: `http://localhost:8000`
- Browser: Chromium
- Reporter: HTML (view results in `test-results/`)

## Regression Testing Workflow

After making code changes:

```bash
npm test
```

All 82 tests should pass in ~16 seconds. If any fail:
- Check test output for specific failure message
- Common issues:
  - Form not found: Use `openAddForm(page)` before accessing form inputs
  - Element not visible: Task may be collapsed, call expand via `div[role="button"]`
  - Countdown assertion fails: Check if toggle state matches (countdown only shows when toggle is OFF)
  - Timeout: Increase wait time for slower machines
- Fix the code
- Re-run tests to verify

## Common Test Patterns

**Adding a task:**
```javascript
await openAddForm(page);
const titleInput = page.locator('input[placeholder="Task title..."]');
const addButton = page.locator('button:has-text("Add Task")').first();
await titleInput.fill('Task title');
await addButton.click();
```

**Expanding a task:**
```javascript
const taskHeader = page.locator('div[role="button"]').first();
await taskHeader.click();
```

**Checking countdown is visible:**
```javascript
// Only shows when "Show Completed" toggle is OFF
await expect(page.locator('button:has-text("Unmark Done (0.")')).toBeVisible();
```

**Waiting for countdown to expire:**
```javascript
// Default test duration is 0.3s, so wait a bit longer
await page.waitForTimeout(400);
```

**Showing completed tasks:**
```javascript
const toggleButton = page.locator('button:has-text("Show Completed")');
await toggleButton.click();
```

## Development Flow

1. Make changes to React components in `src/`
2. Dev server automatically rebuilds `dist/bundle.js`
3. Refresh browser to see changes (manual)
4. Run `npm test` to validate nothing broke
5. Commit when tests pass

## Test Helpers and Configuration

**Countdown Configuration** (`src/config.js`)
- Production duration: 3 seconds
- Test duration: 0.3 seconds (via `window.__TEST_COUNTDOWN_DURATION__`)
- Decrement interval: 0.1 seconds (100ms per tick)
- Countdown display: decimal format with 1 decimal place (e.g., 2.9s)

**Test Helpers** (`tests/setup.js`)
- `setupPage(page)` — Common test initialization
  - Sets memory persistence (no localStorage conflicts)
  - Sets countdown duration to 0.3s for fast tests
  - Navigates to app
- `openAddForm(page)` — Opens the task form
  - Clicks the "+ Add Task" button
  - Waits for form to appear

**Example Test Pattern:**
```javascript
import { setupPage, openAddForm } from './setup';

test('should add a task', async ({ page }) => {
  await setupPage(page);
  await openAddForm(page);
  
  const titleInput = page.locator('input[placeholder="Task title..."]');
  await titleInput.fill('My task');
  await page.locator('button:has-text("Add Task")').click();
  
  await expect(page.locator('text=My task')).toBeVisible();
});
```

## Key Files

| File | Purpose |
|------|---------|
| `src/main.jsx` | React entry point |
| `src/App.jsx` | Main component, state management, countdown logic, category/task persistence |
| `src/config.js` | Countdown configuration (production/test durations) |
| `src/components/Sidebar.jsx` | Category/status tab navigation |
| `src/components/TaskForm.jsx` | Add task form with category/scheduling inputs |
| `src/components/TaskList.jsx` | Task list renderer with drag-drop support |
| `src/components/TaskItem.jsx` | Individual task card with expand/collapse |
| `src/components/ImportModal.jsx` | Import modal dialog |
| `src/models/Task.js` | Task model, factory, and utilities |
| `src/models/Category.js` | Category model, factory, and utilities |
| `src/models/Project.js` | Project model, factory, and utilities |
| `src/utils/taskGrouping.js` | Task grouping by tab/category/status |
| `src/utils/categoryUtils.js` | Category filtering and aggregation |
| `src/utils/projectUtils.js` | Project filtering and aggregation |
| `src/utils/taskExportImport.js` | Export/import functionality |
| `src/utils/dateFormat.js` | Date formatting utilities |
| `src/persistence/index.js` | Persistence factory |
| `src/persistence/localStorage.js` | Browser storage with auto-migration |
| `src/persistence/memory.js` | In-memory implementation (tests) |
| `src/persistence/migrations.js` | Auto-migration utilities |
| `dist/bundle.js` | Compiled app (auto-generated) |
| `tests/setup.js` | Test helpers and initialization |
| `tests/*.spec.js` | 11 test files, 82 total tests |
| `playwright.config.js` | Test configuration |
| `dev-server.js` | Dev server with rebuild |
| `build.js` | Production build script |

## Debugging Tests

View detailed test results:
```bash
npm test:ui        # Interactive test runner
npm test:headed    # See browser during test run
```

HTML report after test run:
```
test-results/index.html
```

## Persistence Layer

The app has an abstraction layer for data persistence, making it easy to swap implementations:

**Implementations:**
- `localStorage` (default) — Persists tasks AND categories to browser storage, survives page reload
- `memory` — In-memory only, lost on reload (used in tests)

**Storage Format (v2.1.0):**
```javascript
// localStorage keys:
localStorage['taskplanner_tasks']      // Array of Task objects with categoryIds and projectIds
localStorage['taskplanner_categories'] // Array of Category objects
localStorage['taskplanner_projects']   // Array of Project objects

// Each Task object:
{
  id: number,
  title: string,
  completed: boolean,
  details: string,
  scheduleType: string,         // 'none', 'soon', or 'specific'
  scheduledDate: string|null,   // ISO date (YYYY-MM-DD) for 'specific' only
  categoryIds: string[],        // Array of UUID strings
  projectIds: string[],         // Array of UUID strings
  addedDate: string,            // ISO timestamp
  completionDate: string|null,  // ISO timestamp
  removalCountdown: number|null // Not persisted, runtime only
}

// Each Category object:
{
  id: string,      // UUID
  name: string
}

// Each Project object:
{
  id: string,      // UUID
  name: string
}
```

**How to switch:**
```javascript
// In browser console or setup script:
window.__APP_CONFIG__ = { persistence: 'memory' };  // Use in-memory
window.__APP_CONFIG__ = { persistence: 'localStorage' };  // Use browser storage
```

**Files:**
- `src/persistence/localStorage.js` — Browser storage with auto-migration
- `src/persistence/memory.js` — In-memory implementation
- `src/persistence/index.js` — Factory that selects implementation
- `src/persistence/migrations.js` — Auto-migration from old format

**Auto-Migration (v2.0.0):**
When loading old data with `task.categories: string[]`, automatically:
1. Creates Category entities for each unique category name
2. Converts tasks to use `categoryIds` (UUID references)
3. Saves migrated data back to persistence
4. Future loads use new format

**For Future Server Backend:**
Create `src/persistence/server.js` with API calls:
```javascript
export const serverPersistence = {
  load: async () => { /* GET /api/tasks, returns { tasks, categories, projects } */ },
  save: async (tasks, categories, projects) => { /* POST /api/tasks */ },
  clear: async () => { /* DELETE /api/tasks */ },
};
```
Then add it to the factory in `index.js`.

**Tests Use In-Memory:**
Tests automatically use memory persistence via `page.addInitScript()` to avoid localStorage conflicts between test runs. Also sets countdown duration to 0.3s for fast tests.

## Known Constraints

- Node.js v19.4.0 (older version, some packages warn about unsupported engine)
- esbuild used instead of Vite due to Node version compatibility
- Tests run in headless mode only (no visual UI during automation)
