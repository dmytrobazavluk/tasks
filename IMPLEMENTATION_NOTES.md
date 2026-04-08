# Implementation Notes

Developer-focused guide to understand code patterns, architecture decisions, and recent implementation details.

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

**src/models/Task.js** (UPDATED)
- Changed: `categories: string[]` → `categoryIds: string[]`
- Updated: `createTask(title, details, scheduledDate, categoryIds)`
- Added: `normalizeScheduledDate(dateStr)` — validates future dates only
- Added: `isScheduledForFuture(task)` — checks if task has future date
- Updated: `isValidTask()` — backward compatible with old string-based format

### Persistence Layer Changes

**src/persistence/migrations.js** (NEW)
- Detects old format: `task.categories: string[]`
- Auto-converts to new format: `task.categoryIds + Category[]`
- Creates Category entities for each unique category name
- Called automatically on load (transparent to caller)

**src/persistence/localStorage.js** (UPDATED)
- Changed: Single key → Two keys
  - `taskplanner_tasks` — Task array with categoryIds
  - `taskplanner_categories` — Category array
- Updated: `load()` returns `{ tasks, categories }`
- Updated: `save(tasks, categories)` — stores both

**src/persistence/memory.js** (UPDATED)
- Matches localStorage interface
- Stores tasks and categories separately
- Used in tests with auto-migration

### Component Changes

**src/App.jsx** (SIGNIFICANT UPDATES)
- Added: `const [categories, setCategories] = useState([])`
- Updated: Load and save both tasks and categories
- Updated: `addTask()` — auto-creates Category entities for new names
- Updated: `updateTask()` — handles categoryNames parameter, converts to IDs
- Updated: `deleteTask()` — calls `cleanupOrphanedCategories()`
- Added: `getTabDisplayName()` — resolves category ID to name
- Updated: Export/import handlers pass categories

**src/components/Sidebar.jsx** (NEW)
- Displays category tabs with task counts
- Shows Today, Closed Tasks, and dynamic category tabs
- Active tab highlighted in blue
- Click to filter tasks by category

**src/components/TaskForm.jsx** (UPDATED)
- Added: Category input field (text, comma-separated)
- Added: Scheduled date input (date picker)
- Extracts categories and scheduling from form
- Passes to App for processing

**src/components/TaskList.jsx** (UPDATED)
- Added: `categories` prop
- Updated: `getUniqueCategoriesFromTasks()` call includes categories parameter
- Updated: Task grouping for sidebar navigation (Today, categories, Closed Tasks)
- Passes: Category objects to TaskItem

**src/components/TaskItem.jsx** (UPDATED)
- Added: `categoryObjects` prop
- Added: Helper `getCategoryNamesFromIds()` for edit form display
- Updated: Edit modal initializes with category names (from IDs)
- Updated: `handleSaveEdit()` passes `categoryNames` back to App

**src/components/ImportModal.jsx** (UPDATED)
- Updated: `importTasks()` destructures `{ tasks, categories }`
- Updated: `onImport()` callback passes both parameters

### Utility Changes

**src/utils/categoryUtils.js** (COMPLETE REWRITE)
- `getCategoryById(categories, categoryId)` — ID lookup
- `getUniqueCategoriesFromTasks(tasks, categories)` — Resolve IDs to Category objects
- `getTasksByCategoryId(tasks, categoryId)` — Filter by category
- `countTasksInCategoryId(tasks, categoryId)` — Count in category
- `countClosedTasksWithoutCountdown(tasks)` — Count closed (no countdown)
- `cleanupOrphanedCategories(tasks, categories)` — Remove unused
- All operations now ID-based instead of string-based

**src/utils/taskGrouping.js** (UPDATED)
- Updated: `getTasksForCategory(tasks, categoryId)` — uses ID instead of name
- Added: Support for `category` as either string ID or object with id property

**src/utils/taskExportImport.js** (UPDATED)
- Fixed BUG: Categories now included in export
- Updated: `exportTasks(tasks, categories)` returns `{ version, tasks, categories }`
- Updated: `importTasks(jsonString)` returns `{ tasks, categories }`
- Added: Backward compatibility for old array format
- Added: Auto-migration detection and conversion

### Test Infrastructure Changes

**tests/setup.js**
- `setupPage(page)` — Initializes memory persistence, 0.3s countdown duration
- `openAddForm(page)` — Opens the task form (now conditionally rendered)

**Test Files Organization**
- 51 tests across 8 files, 100% pass rate
- Core, validation, persistence, dates, countdown, scheduling, export, reorder
- Each test file self-contained with clear patterns

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
1. Sidebar displays Today, Category tabs (dynamic), and Closed Tasks
2. `getTasksForToday()` — All incomplete + completed today + tasks with active countdown
3. `getTasksForCategory(categoryId)` — All tasks with that category ID (any status)
4. `getTasksForClosedTab()` — Completed tasks WITHOUT active countdown
5. Click tab to filter TaskList display
6. Task counts update in real-time

**Why separate closed tab:**
- Shows what's actually complete (not just counting)
- Completed tasks with countdown stay in their working location
- Once countdown expires, they move to Closed Tasks
- User can see the archive separately from active work

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
npm test              # Run all 51 tests (headless, fastest)
npm test:ui          # Interactive Playwright UI (debug failures)
npm test:headed      # Run with visible browser (see what tests do)

# Building
npm run build         # Production build to dist/bundle.js
```

---

## Next Session Checklist

- [ ] Run `npm test` — verify all 51 tests pass
- [ ] Check memory files at `.claude/projects/.../memory/` for recent context
- [ ] Review this file if making changes to:
  - Category system (IDs, creation, cleanup)
  - Persistence layer (migration, storage format)
  - Task grouping/sidebar (tabs, counts, filtering)
  - Scheduling logic (future date validation, movement)
  - Export/import (format, backward compatibility)
- [ ] Update memory if you make architectural changes
- [ ] Run tests after changes to verify nothing broke
