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
- **43 tests total** organized by feature
- Runs headless by default (no visible browser window)
- Auto-starts dev server before tests
- Reuses existing server if already running (speeds up iterations)
- Average execution time: ~8 seconds

**Test Coverage by Category:**

**Core Functionality (10 tests)** — `tests/core.spec.js`
- Load app with title, empty state display
- Add single/multiple tasks
- Mark tasks complete/incomplete
- Delete tasks with confirmation modal
- Edit task details inline and during creation
- Expand/collapse task details
- Multi-operation sequences

**Form Validation (3 tests)** — `tests/validation.spec.js`
- Reject empty task submission
- Reject whitespace-only input
- Form reset after submission

**Persistence (2 tests)** — `tests/persistence.spec.js`
- Tasks survive page reload
- Task completion state persists

**Date Display (4 tests)** — `tests/dates.spec.js`
- Added date shown in expanded details
- Completion date only shown when completed
- Dates update on state changes

**Completed Tasks Toggle (9 tests)** — `tests/toggle.spec.js`
- Show/Hide Completed button behavior
- Completed tasks hidden by default
- Toggle visibility with multiple tasks
- Proper styling (strikethrough) for completed tasks

**Task Removal Countdown (10 tests)** — `tests/countdown.spec.js`
- Countdown displays as decimal seconds (2.9s format)
- Countdown decrements at 0.1s intervals
- Countdown only starts when "Show Completed" is OFF
- Unmark Done cancels countdown
- Edit/Delete available during countdown
- Multiple concurrent countdowns

**Show Completed Toggle Visibility (4 tests)** — `tests/show-completed.spec.js`
- Toggle shows/hides completed tasks
- Countdowns cancel when toggle turned ON
- Button text updates correctly

**Config:** `playwright.config.js`
- Base URL: `http://localhost:8000`
- Browser: Chromium
- Reporter: HTML (view results in `test-results/`)

## Regression Testing Workflow

After making code changes:

```bash
npm test
```

All 43 tests should pass in ~8 seconds. If any fail:
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
| `src/App.jsx` | Main component, state management, countdown logic |
| `src/config.js` | Countdown configuration (production/test durations) |
| `src/components/TaskItem.jsx` | Individual task card with expand/collapse |
| `src/components/TaskList.jsx` | Task list renderer |
| `src/components/TaskForm.jsx` | Add task form |
| `dist/bundle.js` | Compiled app (auto-generated) |
| `tests/setup.js` | Test helpers and initialization |
| `tests/*.spec.js` | 7 test files, 43 total tests |
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
- `localStorage` (default) — Persists to browser storage, survives page reload
- `memory` — In-memory only, lost on reload (used in tests)

**How to switch:**
```javascript
// In browser console or setup script:
window.__APP_CONFIG__ = { persistence: 'memory' };  // Use in-memory
window.__APP_CONFIG__ = { persistence: 'localStorage' };  // Use browser storage
```

**Files:**
- `src/persistence/localStorage.js` — Browser storage implementation
- `src/persistence/memory.js` — In-memory implementation
- `src/persistence/index.js` — Factory that selects implementation

**For Future Server Backend:**
Create `src/persistence/server.js` with API calls:
```javascript
export const serverPersistence = {
  load: async () => { /* GET /api/tasks */ },
  save: async (tasks) => { /* POST /api/tasks */ },
  clear: async () => { /* DELETE /api/tasks */ },
};
```
Then add it to the factory in `index.js`.

**Tests Use In-Memory:**
Tests automatically use memory persistence via `page.addInitScript()` to avoid localStorage conflicts between test runs.

## Known Constraints

- Node.js v19.4.0 (older version, some packages warn about unsupported engine)
- esbuild used instead of Vite due to Node version compatibility
- Tests run in headless mode only (no visual UI during automation)
