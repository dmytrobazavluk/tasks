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
- 11 tests total
- Runs headless by default (no visible browser window)
- Auto-starts dev server before tests
- Reuses existing server if already running (speeds up iterations)

**Test Coverage:**
1. Load app with title
2. Display empty state message
3. Add single task
4. Add multiple tasks
5. Mark task complete (strikethrough)
6. Unmark completed task
7. Delete task
8. Reject empty task submission
9. Reject whitespace-only task
10. Clear input after submission
11. Multi-operation sequence (add, complete, delete)

**Config:** `playwright.config.js`
- Base URL: `http://localhost:8000`
- Browser: Chromium
- Reporter: HTML (view results in `test-results/`)

## Regression Testing Workflow

After making code changes:

```bash
npm test
```

All 11 tests should pass. If any fail:
- Check test output for specific failure
- Fix the code
- Re-run tests to verify

## Development Flow

1. Make changes to React components in `src/`
2. Dev server automatically rebuilds `dist/bundle.js`
3. Refresh browser to see changes (manual)
4. Run `npm test` to validate nothing broke
5. Commit when tests pass

## Key Files

| File | Purpose |
|------|---------|
| `src/main.jsx` | React entry point |
| `src/App.jsx` | Main component, state management |
| `src/components/*.jsx` | Reusable components |
| `dist/bundle.js` | Compiled app (auto-generated) |
| `tests/app.spec.js` | Test suite |
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
