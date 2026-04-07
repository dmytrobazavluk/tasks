# Implementation Notes

Developer-focused guide to understand code patterns, recent changes, and implementation decisions.

---

## File Changes from Latest Session

### Core Logic Changes

**App.jsx**
- Added `showCompleted` state to control countdown behavior
- Modified `toggleTask()` to check `!showCompleted` before starting countdown
  - Countdown only initializes when toggle is OFF
  - Prevents background timers when showing all completed tasks
- Added `useEffect` hook to cancel active countdowns when toggle turned ON
  - Clears all `removalCountdown` values when `showCompleted` becomes true
  - Ensures clean state when user toggles visibility
- Added `reorderTasks()` function with array bounds checking
  - Adjusts target index when moving forward (accounts for removal shift)
  - Prevents moving task to invalid positions
- Passes `showCompleted` and task reordering callbacks through component hierarchy

**TaskList.jsx**
- Added `draggedTaskId` state to track dragged task
- Added `dragOverIndex` state for blue line indicator position
- Accepts `allTasks` (full array) and `onReorderTasks` callback
- Implemented drag handlers:
  - `handleDragStart()` — sets data transfer ID
  - `handleDragEnd()` — clears drag state
  - `handleDragOver()` — calculates drop position
  - `handleDrop()` — performs reorder
- Renders task groups with proper structure:
  - Container with dragOver/drop handlers
  - Renders blue line indicator at drag position
  - Renders insert line after last task if needed
- Passes drag props to TaskItem (not entire task wrapper)

**TaskItem.jsx**
- Converted expand/collapse from `<button>` to full-header `<div role="button">`
  - Makes entire header clickable, not just arrow icon
  - Improves UX: larger click target, more intuitive
- Added keyboard support: Enter/Space keys toggle expansion
  - `onKeyDown` handler on div with `tabIndex={0}`
- Added hover effect: `hover:bg-gray-50` for visual feedback
- Countdown display conditional: `{task.removalCountdown && !showCompleted && ...}`
  - Only shows countdown when toggle is OFF
  - Prevents confusing UI when showing all completed tasks
- Added draggable handle (⋮⋮) only for incomplete tasks in Today group
  - Receives `onDragStart` and `onDragEnd` callbacks from parent
  - Receives `isToday` and `isDragged` flags
  - Handle disappears for completed tasks
- Added completion date picker modal
  - Shows when user clicks "Mark Done"
  - `getLocalDateTimeString()` helper converts Date to datetime-local format
  - Validates against future dates
  - Defaults to current date/time

**TaskForm.jsx**
- Changed margin from `mb-8` (top) to `mt-6` (bottom)
- Reflects new position at bottom of page
- Form is now conditionally rendered (not always visible)

**src/config.js**
- Centralized countdown configuration
- `COUNTDOWN_CONFIG.duration` — configurable via `window.__TEST_COUNTDOWN_DURATION__`
- `COUNTDOWN_CONFIG.decrement` — 0.1 seconds per tick (100ms intervals)
- Allows fast tests (0.3s) while keeping production reasonable (3s)

**src/utils/taskGrouping.js** (NEW)
- `getTaskGroups(tasks, showCompleted)` groups tasks by date
- Returns `{ today: [...], pastDates: [...] }`
- Today group: all incomplete tasks first, then today's completed tasks
- Past groups: completed tasks grouped by completion date (most recent first)
- Handles local time properly (not UTC)

**src/utils/dateFormat.js** (UPDATED)
- Added `formatGroupDate(dateKey)` for grouping headers
- Formats YYYY-MM-DD as "Apr 5" or "Apr 5, 2025"

### Test Infrastructure Changes

**tests/setup.js**
- Added `openAddForm(page)` helper function
  - Clicks the "+ Add Task" button
  - Waits for form to appear
  - Needed because form is now conditionally rendered
- Added `markTaskDone(page)` helper for completion date picker
  - Handles the modal interaction
  - Clicks Mark Done, waits for datetime input, confirms

**All test files**
- Updated all expand/collapse selectors: `button:has-text("▶")` → `div[role="button"]`
- Form tests now call `openAddForm(page)` before filling inputs
  - Ensures form is visible before interacting with it
- Updated countdown button selectors: `button:has-text("Unmark Done (0.")`
  - Matches decimal format (2.9, 1.8, 0.7, etc.)
- Updated date tests to verify completion date is set to selected value (not current time)

**tests/reorder.spec.js** (NEW)
- 5 tests for drag-drop reordering structure
- Tests verify:
  - Incomplete tasks have draggable handle
  - Completed tasks don't have draggable handle
  - Today group renders with all tasks
  - Task grouping works correctly
  - Edge case: dragging without movement doesn't cause unexpected moves

---

## Implementation Patterns

### Countdown System (Critical Behavior)

**How countdown works:**
1. User marks task done with `showCompleted` OFF
2. `toggleTask()` initializes `removalCountdown = Math.ceil(3 / 0.1) = 30` ticks
3. `TaskItem.useEffect` runs timer: every 100ms, decrements by 1
4. Countdown display: `30 ticks × 0.1s = 3.0 seconds`
5. When countdown reaches 0, set `removalCountdown: null` (persist as completed)
6. Task hidden from view (unless toggle turned ON to show completed)

**Key edge case — Toggle turned ON during countdown:**
- Component never explicitly stops countdown timers (good for cleanup)
- `useEffect` in App.jsx clears all `removalCountdown` values to null
- This stops visual display and prevents new timers starting
- Old timers still fire but have no effect (task already has countdown = null)

**Why tick-based not time-based:**
- Tick-based countdown is deterministic and testable
- Time-based would require mocking Date/performance APIs
- Tick-based allows configurable test duration without refactoring timers

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

### State Management Hierarchy

```
App.jsx (state owner)
├── showCompleted (boolean)
├── tasks (array of task objects)
├── isFormOpen (boolean)
└── Passes to TaskList and TaskForm

TaskList.jsx (presentation layer)
├── Manages drag state (draggedTaskId, dragOverIndex)
├── Receives showCompleted, tasks, callbacks
├── Groups tasks by date
├── Renders Today + past date groups
└── Passes drag props to TaskItem

TaskItem.jsx (view layer)
├── Receives task, callbacks, drag props
├── Manages expansion state
├── Shows drag handle for incomplete tasks
├── Shows completion date picker modal
└── Emits events: onToggle, onDelete, onUpdateTask, onDragStart/End
```

**Why prop drilling instead of Context?**
- Simple hierarchy doesn't need Context
- Props are explicit and easier to follow
- No performance loss at this scale
- Easier to test individual components with mock props

### Task Grouping Logic

**How grouping works:**
1. `getTaskGroups()` iterates through all tasks
2. Incomplete tasks go to Today group
3. Completed tasks go to their completion date group
4. Within Today: incomplete first, then completed
5. Past groups sorted by date (most recent first)

**Why Today group includes completed tasks:**
- Completed tasks from today should show with incomplete tasks when visible
- Makes sense visually: all work from today in one section
- Simplifies reordering (all incomplete stay in Today)

---

## Known Working Behaviors

1. **Form collapsing** — Form closes after adding task, button reappears
   - `handleAddTask` in App.jsx calls `setIsFormOpen(false)`
   - Form visibility bound to `isFormOpen` state
   - Tests must call `openAddForm(page)` to open form again

2. **Countdown cancellation** — Toggling "Show Completed" ON cancels active countdowns
   - `useEffect` in App.jsx triggered by `showCompleted` change
   - Clears all `removalCountdown` values to null
   - Immediate visual effect (countdown disappears from UI)

3. **Countdown doesn't restart** — Unmarking a completed task keeps it incomplete
   - `toggleTask()` only starts countdown when `!showCompleted`
   - If toggle is ON when you unmark, countdown never starts
   - Expected behavior: toggle OFF, mark done, countdown appears

4. **Tasks persist after countdown** — Task doesn't delete, just hides
   - When countdown reaches 0, set `removalCountdown: null`
   - Task stays in state with `completed: true`
   - Toggle "Show Completed" to see hidden completed tasks
   - Allows user to reclaim task accidentally marked done

5. **Drag handle only on incomplete** — Completed tasks can't be reordered
   - `isToday && !task.completed` condition on handle
   - Handle removed from DOM for completed tasks
   - Drag-drop logic only operates on Today group

6. **Completion date defaults to now** — User can select past dates only
   - Modal shows current date/time by default
   - Validation prevents selecting future dates
   - Allows backdating task completion

---

## Implementation Decisions & Trade-offs

### Decision: Countdown only when toggle OFF
**Trade-off:** More complex conditional logic vs. cleaner user experience
- **Pro:** Prevents timer overhead when user shows all tasks
- **Pro:** Makes sense semantically (countdown is "go away timer", not needed if visible)
- **Con:** Extra state dependency in toggleTask()
- **Result:** Worth it — matches user mental model

### Decision: Tick-based countdown (30 ticks for 3s) instead of milliseconds
**Trade-off:** Math conversion vs. deterministic testing
- **Pro:** Configurable duration without changing timer logic
- **Pro:** 0.1s precision is reasonable for UI countdown
- **Con:** Slightly more complex calculation: `removalCountdown * COUNTDOWN_CONFIG.decrement`
- **Result:** Worth it — tests run 10x faster with 0.3s duration

### Decision: Only task header draggable, not entire card
**Trade-off:** Requires click target vs. prevents accidental drags
- **Pro:** Buttons/interactions don't trigger drag accidentally
- **Pro:** Clear visual indicator (⋮⋮ handle)
- **Con:** User must drag from handle, not anywhere on task
- **Result:** Worth it — prevents UX issues with button clicks triggering drag

### Decision: Blue line indicator in real-time
**Trade-off:** State updates on every dragOver vs. user clarity
- **Pro:** User knows exactly where task will land
- **Pro:** Updates smoothly during drag
- **Con:** More frequent state updates
- **Result:** Worth it — critical for good UX

### Decision: Task grouping by completion date
**Trade-off:** More complex rendering vs. better organization
- **Pro:** User can see when tasks were completed
- **Pro:** Organizes completed work chronologically
- **Con:** More code, more state management
- **Result:** Worth it — helps users find recently completed tasks

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

1. **Adding features to drag-drop** — Remember edge case handling
   - Current code prevents no-op moves (same position, adjacent)
   - If modifying reorder logic, maintain these checks
   - Test with tasks at start, middle, and end positions

2. **Changing completion date format** — Update validator and display
   - Modal uses datetime-local format (YYYY-MM-DDTHH:MM)
   - Validation prevents future dates
   - Display uses `formatDate()` for consistency

3. **Adding more task grouping** — Update filter and rendering logic
   - `getTaskGroups()` is the source of truth
   - TaskList depends on group structure
   - Reordering only works within Today group

4. **Moving from prop drilling to Context** — Good long-term improvement
   - Would need to update component signatures
   - Tests would still work (no test dependency on prop names)
   - Remember `showCompleted` affects countdown and grouping behavior

---

## Session Commands Reference

```bash
# Development
npm run dev           # Start dev server at http://localhost:8000

# Testing
npm test              # Run all 49 tests (headless, fastest)
npm test:ui          # Interactive Playwright UI (debug failures)
npm test:headed      # Run with visible browser (see what tests do)

# Building
npm run build         # Production build to dist/bundle.js
```

---

## Next Session Checklist

- [ ] Run `npm test` — verify all 49 tests pass
- [ ] Review this file if making countdown, grouping, or drag-drop changes
- [ ] Check memory files for recent session context
- [ ] Update IMPLEMENTATION_NOTES if you change core patterns
