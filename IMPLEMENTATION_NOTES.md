# Implementation Notes

Developer-focused guide to understand code patterns, architecture decisions, and recent implementation details.

---

## Version 2.2.0 Changes (2026-04-13)

### Sidebar Count Updates & Grouping Refinements

**What Changed:**
- Sidebar task counts now show incomplete tasks only (not completed)
- Completed tasks in category/project/no-project tabs grouped by completion date
- Future tab excludes tasks scheduled for today or past dates
- No Project tab always visible, even with 0 incomplete tasks

**Why This Matters:**
- Sidebar focuses on actionable work (incomplete tasks)
- Category/project tabs show full work history, properly organized
- Users can see completed work within their context

**Key Files:**
- `src/utils/projectUtils.js` — UPDATED: countTasksInProjectId now returns incomplete only
- `src/utils/categoryUtils.js` — UPDATED: countTasksInCategoryId now returns incomplete only
- `src/utils/taskGrouping.js` — UPDATED: Completed tasks grouped by completion date in categories/projects/no-project

---

## Version 2.1.0 Changes (2026-04-09)

### Major Addition: Projects as Explicit Entities

**What Changed:**
- Similar to categories, projects are now explicit UUID-based entities stored separately
- Tasks reference projects by ID: `task.projectIds: string[]`
- New persistence model stores projects alongside categories and tasks
- Auto-cleanup: projects deleted when no longer assigned to any task

**Why This Matters:**
- Consistent architecture: categories and projects follow same pattern
- Sidebar shows project tabs like category tabs
- Filter tasks by project
- Export/import includes projects

**Key Files:**
- `src/models/Project.js` — NEW: Project factory and validation
- `src/utils/projectUtils.js` — NEW: Project filtering and aggregation
- `src/App.jsx` — UPDATED: Manages projects state, auto-creates/cleanup
- `src/components/Sidebar.jsx` — UPDATED: Shows project tabs alongside categories
- `src/utils/taskExportImport.js` — UPDATED: Exports/imports projects

### Enhanced Scheduling: "Soon" vs Specific Dates

**What Changed:**
- Added `scheduleType` field: 'none', 'soon', or 'specific'
- Tasks can be scheduled "soon" (indefinite future) or for specific dates
- Future tab shows both types, sorted: soon first, then dates descending
- Future tab hides when no scheduled tasks exist

**Key Files:**
- `src/models/Task.js` — UPDATED: Added scheduleType field, new utilities
- `src/components/TaskForm.jsx` — UPDATED: Radio buttons for scheduling mode
- `src/utils/taskGrouping.js` — UPDATED: Future tab grouping logic
- Tests in `scheduling-categories.spec.js` — 5 new tests for this feature

---

## Version 2.0.0 Changes (2026-04-08)

### Major Refactoring: Categories as Explicit Entities

**What Changed:**
- Categories were stored as string arrays directly on tasks: `task.categories: string[]`
- Now categories are explicit entities with IDs and stored separately: `task.categoryIds: string[]` + separate `Category` objects
- New persistence model: `{ tasks: Task[], categories: Category[] }`
- Auto-migration from old format on first load

**Why This Matters:**
- Provides foundation for category features (colors, descriptions, permissions, etc.)
- Proper data model with single source of truth for category metadata
- Cleaner architecture with explicit relationships
- Backward compatible - old data automatically migrates

**Key Files:**
- `src/models/Category.js` — NEW: Category factory and validation
- `src/models/Task.js` — UPDATED: Uses categoryIds instead of categories
- `src/persistence/migrations.js` — NEW: Auto-migration from old format
- `src/utils/categoryUtils.js` — COMPLETE REWRITE: ID-based operations

---

## File Changes from v2.0.0

### Data Model Changes

**src/models/Category.js** (NEW)
- `createCategory(name)` — Factory: generates UUID, returns `{ id, name }`
- `isValidCategory(category)` — Validates Category object structure
- Uses `crypto.randomUUID()` with fallback for older browsers

**src/models/Project.js** (NEW - v2.1.0)
- `createProject(name)` — Factory: generates UUID, returns `{ id, name }`
- `isValidProject(project)` — Validates Project object structure
- Uses `crypto.randomUUID()` with fallback for older browsers
- Follows same pattern as Category model

**src/models/Task.js** (UPDATED)
- Changed: `categories: string[]` → `categoryIds: string[]`
- Added: `projectIds: string[]` (v2.1.0)
- Added: `scheduleType: string` ('none'|'soon'|'specific') (v2.1.0)
- Updated: `createTask(title, details, scheduleType, scheduledDate, categoryIds, projectIds)`
- Added: `normalizeScheduledDate(dateStr)` — validates future dates only
- Added: `isScheduledForFuture(task)` — checks if task has specific future date
- Added: `isScheduledSoon(task)` — checks if task has "soon" scheduling (v2.1.0)
- Added: `hasAnyFutureScheduling(task)` — checks either soon or specific date (v2.1.0)
- Updated: `isValidTask()` — backward compatible with old string-based format

### Persistence Layer Changes

**src/persistence/migrations.js** (NEW)
- Detects old format: `task.categories: string[]`
- Auto-converts to new format: `task.categoryIds + Category[]`
- Creates Category entities for each unique category name
- Called automatically on load (transparent to caller)

**src/persistence/localStorage.js** (UPDATED)
- Changed: Single key → Three keys (v2.1.0)
  - `taskplanner_tasks` — Task array with categoryIds and projectIds
  - `taskplanner_categories` — Category array
  - `taskplanner_projects` — Project array (v2.1.0)
- Updated: `load()` returns `{ tasks, categories, projects }`
- Updated: `save(tasks, categories, projects)` — stores all three

**src/persistence/memory.js** (UPDATED)
- Matches localStorage interface
- Stores tasks, categories, and projects separately (v2.1.0)
- Used in tests with auto-migration

### Component Changes

**src/App.jsx** (SIGNIFICANT UPDATES)
- Added: `const [categories, setCategories] = useState([])`
- Added: `const [projects, setProjects] = useState([])` (v2.1.0)
- Updated: Load and save tasks, categories, and projects (v2.1.0)
- Updated: `addTask()` — auto-creates Category and Project entities for new names (v2.1.0)
- Updated: `updateTask()` — handles categoryNames and projectNames (v2.1.0)
- Updated: `deleteTask()` — calls cleanup functions for both entities (v2.1.0)
- Added: `getTabDisplayName()` — resolves category/project ID to name
- Updated: Export/import handlers pass categories and projects (v2.1.0)

**src/components/Sidebar.jsx** (NEW)
- Displays category and project tabs with task counts
- Shows Today, Future (v2.1.0), Closed Tasks, and dynamic category/project tabs
- Active tab highlighted in blue
- Click to filter tasks by category, project, or status
- Future tab hides when no scheduled tasks (v2.1.0)

**src/components/TaskForm.jsx** (UPDATED)
- Added: Category input field (text, comma-separated)
- Added: Project input field (text, comma-separated) (v2.1.0)
- Added: Scheduling mode selector (None/Soon/Specific) (v2.1.0)
- Added: Scheduled date input (date picker, only for "Specific" mode) (v2.1.0)
- Extracts categories, projects, and scheduling from form
- Passes to App for processing

**src/components/TaskList.jsx** (UPDATED)
- Added: `categories` and `projects` props (v2.1.0)
- Updated: Task grouping for sidebar navigation (Today, categories, projects, Future, Closed Tasks) (v2.1.0)
- Passes: Category and Project objects to TaskItem (v2.1.0)

**src/components/TaskItem.jsx** (UPDATED)
- Added: `categoryObjects` and `projectObjects` props (v2.1.0)
- Added: Helpers for resolving IDs to names for edit form (v2.1.0)
- Updated: Edit modal initializes with category and project names (v2.1.0)
- Updated: `handleSaveEdit()` passes both back to App (v2.1.0)

**src/components/ImportModal.jsx** (UPDATED)
- Updated: `importTasks()` destructures `{ tasks, categories, projects }` (v2.1.0)
- Updated: `onImport()` callback passes all three parameters (v2.1.0)

### Utility Changes

**src/utils/categoryUtils.js** (COMPLETE REWRITE)
- `getCategoryById(categories, categoryId)` — ID lookup
- `getUniqueCategoriesFromTasks(tasks, categories)` — Resolve IDs to Category objects
- `getTasksByCategoryId(tasks, categoryId)` — Filter by category
- `countTasksInCategoryId(tasks, categoryId)` — Count in category
- `countClosedTasksWithoutCountdown(tasks)` — Count closed (no countdown)
- `cleanupOrphanedCategories(tasks, categories)` — Remove unused
- All operations ID-based

**src/utils/projectUtils.js** (NEW - v2.1.0)
- `getProjectById(projects, projectId)` — ID lookup
- `getUniqueProjectsFromTasks(tasks, projects)` — Resolve IDs to Project objects
- `getTasksByProjectId(tasks, projectId)` — Filter by project
- `countTasksInProjectId(tasks, projectId)` — Count in project
- `cleanupOrphanedProjects(tasks, projects)` — Remove unused
- Follows same pattern as categoryUtils

**src/utils/taskGrouping.js** (UPDATED)
- Updated: `getTasksForCategory(tasks, categoryId)` — uses ID instead of name
- Added: `getTasksForProject(tasks, projectId)` — Filter by project (v2.1.0)
- Added: `getTasksForFutureTab(tasks)` — All scheduled tasks (v2.1.0)
- Added: Support for multiple tab types in grouping logic

**src/utils/taskExportImport.js** (UPDATED)
- Fixed BUG: Categories now included in export (v2.0.0)
- Updated: `exportTasks(tasks, categories, projects)` returns `{ version, tasks, categories, projects }` (v2.1.0)
- Updated: `importTasks(jsonString)` returns `{ tasks, categories, projects }` (v2.1.0)
- Added: Backward compatibility for old array format
- Added: Auto-migration detection and conversion
- Added: Projects validation and import (v2.1.0)

### Test Infrastructure Changes

**tests/setup.js**
- `setupPage(page)` — Initializes memory persistence, 0.3s countdown duration
- `openAddForm(page)` — Opens the task form (now conditionally rendered)

**Test Files Organization**
- 61 tests across 8 files, 100% pass rate
- Core, validation, persistence, dates, countdown, scheduling/categories, export, reorder
- Each test file self-contained with clear patterns
- Recent additions: tests for completed task grouping by date, future tab filtering, no-project tab

---

## Implementation Patterns

### Category System Architecture

**Data Flow:**
1. User enters categories in TaskForm (comma-separated text)
2. App extracts category names and checks if they exist
3. For new names, creates Category entities with UUID
4. Task stores array of category IDs (not names)
5. At display time, resolve IDs back to names for UI

**Why ID-based instead of name-based:**
- Categories become queryable by ID (not string comparison)
- Allows future features: colors, descriptions, icons per category
- IDs stable even if category name changes
- Single source of truth for category metadata

**Auto-Cleanup Pattern:**
- When task deleted or updated, check for orphaned categories
- Category is orphaned if no tasks reference its ID
- `cleanupOrphanedCategories()` removes these
- Called after task deletion/update
- Safe to call multiple times (no duplicates)

### Task Scheduling

**How scheduling works:**
1. User selects date in TaskForm (only future dates allowed)
2. Validation: `normalizeScheduledDate()` checks date > today
3. If past/today, date becomes null (not scheduled)
4. Scheduled tasks DON'T appear in Today tab initially
5. When scheduled date arrives (checked in grouping), task moves to Today
6. In taskGrouping: filter tasks by comparing scheduledDate with today

**Why store as ISO string:**
- Human-readable: "2026-04-15"
- Easy to persist and compare
- No timezone issues (stored as date only, not time)
- Works with date inputs: `<input type="date">`

### Countdown System

**How countdown works:**
1. User marks task done
2. `removalCountdown` initialized to number of 0.1-second ticks (e.g., 30 for 3s)
3. Timer decrements every 100ms
4. When countdown reaches 0, set `removalCountdown: null`
5. Task moves from working location to Closed Tasks (unless it has active category)

**Countdown Grace Period:**
- During countdown, task stays in its original location (Today or category tab)
- User can click "Unmark Done" to revert and cancel countdown
- After countdown, task moves to Closed Tasks
- User can still see and restore the task during grace period

**Why tick-based not time-based:**
- Deterministic and testable
- Can configure duration via `window.__TEST_COUNTDOWN_DURATION__`
- Tests use 0.3s (3 ticks), production uses 3s (30 ticks)

### Drag-and-Drop Implementation

**Data flow:**
1. TaskList manages `draggedTaskId` and `dragOverIndex` state
2. `handleDragStart()` stores task ID in dataTransfer
3. `handleDragOver()` calculates drop position from Y coordinate
4. `setDragOverIndex()` updates UI (shows blue line)
5. `handleDrop()` calls `performReorder()` with final position
6. `performReorder()` checks for no-op cases (same position, adjacent moves)
7. `onReorderTasks()` callback updates App state and persists

**Why blue line indicator:**
- Shows user exactly where task will land
- Updates in real-time during drag
- Critical for accurate drag-drop UX
- State allows showing line conditionally based on position

**Edge case handling:**
- If drop position equals source position: early return (no reorder)
- If dropping just below source: early return (no-op due to shift)
- If dropping beyond group length while source in group: early return

### Completion Date Picker

**How it works:**
1. User clicks "Mark Done" button
2. Modal appears with datetime-local input
3. Default value: current date/time (via `getLocalDateTimeString()`)
4. User can select past dates
5. Validation: prevent future dates
6. On confirm: `onUpdateTask()` with `completionDate` and `completed: true`
7. Also initializes countdown if needed

**Why datetime-local input:**
- Native browser widget (no date library needed)
- Respects user's local timezone
- Allows time selection (not just date)
- Cleaner than custom date picker

**Why calculate removalCountdown in TaskItem:**
- Avoids state update race conditions
- Ensures countdown matches completion in same update
- Modal confirmation handles all updates together

### Sidebar Navigation Logic

**How tabs work:**
1. Sidebar displays Today, Future, Category tabs (dynamic), Projects tabs (dynamic), No Project, and Closed Tasks
2. `getTasksForToday()` — All incomplete + completed today + tasks with active countdown (excluding scheduled tasks)
3. `getTasksForFutureTab()` — All tasks scheduled "soon" or for future dates (excluding today and past)
4. `getTasksForCategory(categoryId)` — All tasks with that category ID, grouped by scheduled date (incomplete) and completion date (complete)
5. `getTasksForProjectTab(projectId)` — All tasks in that project, grouped by scheduled date (incomplete) and completion date (complete)
6. `getTasksWithoutProject()` — All tasks without any project, grouped by scheduled date (incomplete) and completion date (complete)
7. `getTasksForClosedTab()` — Completed tasks WITHOUT active countdown
8. Click tab to filter TaskList display
9. Task counts in sidebar show incomplete tasks only (not completed)

**Sidebar count behavior:**
- `countTasksInCategoryId(tasks, categoryId)` — Returns incomplete tasks only
- `countTasksInProjectId(tasks, projectId)` — Returns incomplete tasks only
- `countTasksWithoutProject(tasks)` — Returns incomplete tasks only
- Completed tasks are still visible in the tab content, just not counted in sidebar

**Why separate closed tab:**
- Shows what's actually complete (not just counting)
- Completed tasks with countdown stay in their working location
- Once countdown expires, they move to Closed Tasks
- User can see the archive separately from active work

**Why completed tasks appear in category/project tabs:**
- Category/project tabs show all work related to that category/project
- Incomplete tasks grouped by scheduled date, completed tasks by completion date
- User can see full task history within a category/project

### State Management Hierarchy

```
App.jsx (state owner)
├── tasks (array of Task objects)
├── categories (array of Category objects)
├── selectedTab (string: null, categoryId, or 'closed')
├── isFormOpen (boolean)
├── persistence (module that loads/saves both)
└── Passes to Sidebar and TaskList

Sidebar.jsx (navigation layer)
├── Receives categories, selectedTab
├── Displays tabs with counts
├── Emits: onSelectTab callback
└── Renders category names resolved from objects

TaskList.jsx (presentation layer)
├── Receives tasks, categories, selectedTab
├── Manages drag state (draggedTaskId, dragOverIndex)
├── Groups tasks by selectedTab
├── Renders tasks for current tab
└── Passes drag props to TaskItem

TaskItem.jsx (view layer)
├── Receives task, categories, callbacks
├── Manages expansion state
├── Shows category names (resolved from IDs)
├── Shows drag handle for incomplete tasks
├── Shows completion date picker modal
└── Emits events: onToggle, onDelete, onUpdateTask, onDragStart/End
```

**Why prop drilling instead of Context?**
- Hierarchy is straightforward
- Props document data dependencies clearly
- No performance loss with 10-50 tasks
- Easier to test components with explicit props

### Category Lifecycle

**Creation:**
- User types category name in TaskForm
- App checks if category exists by name
- If new, creates Category with UUID
- Task gets categoryId added to its categoryIds array
- New category saved to persistence

**Usage:**
- Category ID stored in task.categoryIds
- Sidebar shows all unique categories
- Clicking category tab filters to that category's tasks
- Category counts include all matching tasks

**Deletion (Auto-Cleanup):**
- When task deleted: check if any category is now orphaned
- When task updated: if categoryIds changed, check for orphaned
- `cleanupOrphanedCategories()` removes categories with no tasks
- Called after mutations, safe to call multiple times

---

## Known Working Behaviors

1. **Form collapsing** — Form closes after adding task, button reappears
   - `handleAddTask` in App.jsx calls `setIsFormOpen(false)`
   - Tests must call `openAddForm(page)` to open form again

2. **Auto-category creation** — Categories created on first assignment
   - If user enters new category name, Category object created with UUID
   - If category already exists (by name), reuses existing ID
   - Cleaned up automatically if no longer used

3. **Task scheduling** — Scheduled tasks don't appear in Today until date arrives
   - `normalizeScheduledDate()` validates only future dates allowed
   - `taskGrouping` filters out scheduled tasks from Today
   - When date equals today, task appears in Today tab
   - User can edit scheduled date to unschedule (set to null)

4. **Countdown grace period** — Task stays visible during countdown
   - When marked done, countdown initializes (default 3 seconds)
   - Task remains in its original location (Today or category tab)
   - After countdown expires, moves to Closed Tasks
   - User can click "Unmark Done" to cancel and revert

5. **Category cleanup** — Unused categories automatically removed
   - After deleting a task, check for orphaned categories
   - If category no longer has any tasks, delete it
   - Sidebar dynamically removes the tab
   - Can be safely called multiple times (idempotent)

6. **Drag handle only on incomplete** — Completed tasks can't be reordered
   - Handle only renders for incomplete tasks in Today tab
   - Handle hidden from DOM for completed tasks
   - Drag-drop only works within Today tab

7. **Export includes categories** — Categories now properly exported
   - Export format: `{ version: 1, tasks: [...], categories: [...] }`
   - Import detects old format and auto-migrates if needed
   - Round-trip: export then import preserves all categories

---

## Implementation Decisions & Trade-offs

### Decision: Categories as Explicit Entities with IDs
**Trade-off:** More complex data model vs. proper architecture foundation
- **Pro:** Enables category features (colors, descriptions, etc. in future)
- **Pro:** Single source of truth for category metadata
- **Pro:** Categories queryable by ID, not just string comparison
- **Con:** Must maintain mapping between tasks and categories
- **Con:** Auto-migration complexity on data load
- **Result:** Worth it — future-proofs the architecture, backward compatible

### Decision: UUID-based Category IDs instead of simple names
**Trade-off:** Longer IDs vs. stable, unique references
- **Pro:** Categories stable even if name changes
- **Pro:** Supports concurrent category creation without conflicts
- **Pro:** Works with databases/APIs (not dependent on string equality)
- **Con:** IDs must be persisted and resolved at display time
- **Result:** Worth it — better for extensibility and data integrity

### Decision: Resolve Category IDs to names at display time
**Trade-off:** Runtime lookup vs. cleaner data storage
- **Pro:** Tasks store only IDs (smaller, cleaner data)
- **Pro:** Can change category name without updating all tasks
- **Pro:** Components don't need to know about category details
- **Con:** Need helper functions to resolve IDs to names
- **Result:** Worth it — separation of concerns, data normalization

### Decision: Sidebar tabs instead of "Show Completed" toggle
**Trade-off:** More UI vs. one-click filtering
- **Pro:** User can focus on what matters (Today, specific category, or archive)
- **Pro:** Multiple filtering options clearly visible
- **Pro:** Task counts show at a glance what's in each category
- **Con:** More components and state management
- **Result:** Worth it — better UX, clearer navigation

### Decision: Scheduled tasks DON'T appear in Today until date arrives
**Trade-off:** Hidden complexity vs. cleaner Today view
- **Pro:** Today tab shows only relevant work
- **Pro:** Scheduled tasks don't clutter the active task list
- **Pro:** Automatic promotion when date arrives
- **Con:** User might forget about scheduled tasks (mitigated by sidebar count)
- **Result:** Worth it — keeps Today focused on immediate work

### Decision: Tick-based countdown with configurable duration
**Trade-off:** Math conversion vs. deterministic testing
- **Pro:** Configurable duration without changing timer logic
- **Pro:** Tests run 10x faster with 0.3s duration
- **Pro:** 0.1s tick precision is reasonable for UI countdown
- **Con:** Slightly more complex calculation
- **Result:** Worth it — crucial for fast test execution

---

## Testing Considerations

### Why test duration is 0.3s
- Default countdown: 3 seconds = 30 ticks
- Test countdown: 0.3 seconds = 3 ticks
- Countdown assertion: `await page.waitForTimeout(400)` = 400ms (waits for 3 ticks at 100ms)
- Total test time: ~13 seconds for 49 tests (vs 30+ with 3-second countdowns)

### Why form tests need `openAddForm(page)`
- Form is now conditionally rendered (hidden by default)
- Must click button to make form visible before filling inputs
- Without `openAddForm()`, selectors find nothing and tests timeout

### Why we use `div[role="button"]` not button selectors
- Expand/collapse changed from `<button>` to `<div role="button">`
- Old selectors: `button:has-text("▶")` now return nothing
- New selector: `div[role="button"]` matches the div that was clicked

### Why reorder tests use structure verification
- HTML5 drag-drop is hard to test automatically with Playwright
- Tests focus on structure (draggable attribute present)
- Manual testing required for actual drag-drop behavior
- Implementation logic tested via unit-like tests on calculation functions

---

## Potential Gotchas for Future Changes

1. **Modifying Category model** — Impacts multiple files
   - Changes to Category structure need migration function
   - Update Task.isValidTask() if Category shape changes
   - Sidebar needs to handle new category properties
   - Export/import must include new fields

2. **Changing category ID generation** — Test backward compatibility
   - Current: crypto.randomUUID() with fallback
   - Old data uses UUIDs, new data must also use UUIDs
   - Migration function should handle if IDs change
   - Never change how category IDs are generated without migration

3. **Adding more task grouping** — Remember sidebar tabs are dynamic
   - Today, categories, Closed Tasks are the three tab types
   - If adding new grouping, may need new tab type
   - Task counts must update for each tab type
   - Reordering only works within Today tab

4. **Changing persistence format** — Implement migration function
   - New localStorage format must maintain backward compatibility
   - Add migration function in migrations.js
   - Update load() to call migration on old data
   - Test round-trip: old format → load → new format

5. **Adding context or state management** — Refactor gradually
   - Currently using prop drilling, which works for this scale
   - If migrating to Context, tests still work
   - Components expect tasks and categories as props
   - Changing prop names requires updating all components and tests

6. **Modifying task grouping logic** — Remember multiple dependencies
   - `taskGrouping.js` is the source of truth for grouping
   - Sidebar depends on grouping for tab display
   - TaskList uses grouping to render
   - Tests verify grouping behavior, update them if logic changes

---

## Session Commands Reference

```bash
# Development
npm run dev           # Start dev server at http://localhost:8000

# Testing
npm test              # Run all 61 tests (headless, fastest)
npm test:ui          # Interactive Playwright UI (debug failures)
npm test:headed      # Run with visible browser (see what tests do)

# Building
npm run build         # Production build to dist/bundle.js
```

---

## Next Session Checklist

- [ ] Run `npm test` — verify all 61 tests pass
- [ ] Check memory files at `.claude/projects/.../memory/` for recent context
- [ ] Review this file if making changes to:
  - Category system (IDs, creation, cleanup)
  - Persistence layer (migration, storage format)
  - Task grouping/sidebar (tabs, counts, filtering)
  - Scheduling logic (future date validation, movement)
  - Export/import (format, backward compatibility)
- [ ] Update memory if you make architectural changes
- [ ] Run tests after changes to verify nothing broke
