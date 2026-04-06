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
- Passes `showCompleted` prop through component hierarchy to TaskItem

**TaskList.jsx**
- Now accepts `showCompleted` prop from parent
- Forwards prop to TaskItem children
- Enables conditional rendering of countdown in child components

**TaskItem.jsx**
- Converted expand/collapse from `<button>` to full-header `<div role="button">`
  - Makes entire header clickable, not just arrow icon
  - Improves UX: larger click target, more intuitive
- Added keyboard support: Enter/Space keys toggle expansion
  - `onKeyDown` handler on div with `tabIndex={0}`
- Added hover effect: `hover:bg-gray-50` for visual feedback
- Countdown display conditional: `{task.removalCountdown && !showCompleted && ` (${...})}`
  - Only shows countdown when toggle is OFF
  - Prevents confusing UI when showing all completed tasks

**TaskForm.jsx**
- Changed margin from `mb-8` (top) to `mt-6` (bottom)
- Reflects new position at bottom of page
- Form is now conditionally rendered (not always visible)

**src/config.js**
- Centralized countdown configuration
- `COUNTDOWN_CONFIG.duration` — configurable via `window.__TEST_COUNTDOWN_DURATION__`
- `COUNTDOWN_CONFIG.decrement` — 0.1 seconds per tick (100ms intervals)
- Allows fast tests (0.3s) while keeping production reasonable (3s)

### Test Infrastructure Changes

**tests/setup.js**
- Added `openAddForm(page)` helper function
  - Clicks the "+ Add Task" button
  - Waits for form to appear
  - Needed because form is now conditionally rendered

**All test files**
- Updated all expand/collapse selectors: `button:has-text("▶")` → `div[role="button"]`
  - Form tests now call `openAddForm(page)` before filling inputs
  - Ensures form is visible before interacting with it
- Updated countdown button selectors to use flexible matching: `button:has-text("Unmark Done (0.")`
  - Matches decimal format (2.9, 1.8, 0.7, etc.)
  - More robust than matching exact numbers

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

### State Management Hierarchy

```
App.jsx (state owner)
├── showCompleted (boolean)
├── tasks (array of task objects)
└── Passes both to TaskList

TaskList.jsx (presentation layer)
├── Receives showCompleted, tasks
├── Filters/renders based on state
└── Passes showCompleted to TaskItem

TaskItem.jsx (view layer)
├── Receives task, showCompleted
├── Conditional countdown display uses showCompleted
└── Emits events: onToggle, onDelete, onUpdateTask
```

**Why prop drilling instead of Context?**
- Simple 3-level hierarchy doesn't need Context
- Props are explicit and easier to follow
- No performance loss at this scale
- Easier to test individual components with mock props

### Countdown Display Logic

```javascript
// In TaskItem.jsx button
Unmark Done{task.removalCountdown && !showCompleted && ` (${(task.removalCountdown * COUNTDOWN_CONFIG.decrement).toFixed(1)})`}
```

**Why `!showCompleted` in display:**
- Countdown timer still runs in background (for data consistency)
- But we hide the visual display when toggle is ON
- Prevents confusion: user sees "Unmark Done" without countdown, but task doesn't disappear
- Timer was already cleared by App.jsx's useEffect anyway

### Header Click Handler

```javascript
<div
  onClick={() => setIsExpanded(!isExpanded)}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  }}
>
```

**Why this pattern:**
- `<div role="button">` tells assistive tech it's a button
- `tabIndex={0}` makes it focusable
- `onKeyDown` with Enter/Space adds keyboard support
- Better UX than button-only: larger click target
- More semantically correct than nested buttons

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

5. **Edit/Delete during countdown** — All actions available when task expanded
   - Countdown is just a UI timer, doesn't disable other features
   - User can edit title/details while countdown active
   - User can delete completed task during countdown
   - Cancel countdown via "Unmark Done" button

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

### Decision: Form at bottom instead of top
**Trade-off:** Natural interaction flow vs. unfamiliar layout
- **Pro:** Users see tasks first, then add new ones (natural workflow)
- **Pro:** "+ Add Task" button visible on page load (discoverable)
- **Con:** Requires scroll on small viewports (but responsive design helps)
- **Result:** Worth it — matches user expectations (write after reading)

### Decision: Click anywhere on task header to expand
**Trade-off:** Larger click target vs. accidental clicks
- **Pro:** Much more discoverable (users find it immediately)
- **Pro:** Better for accessibility (larger target)
- **Con:** Clicking task name to read might trigger expand (minor)
- **Result:** Worth it — UX benefit outweighs edge case

---

## Testing Considerations

### Why test duration is 0.3s
- Default countdown: 3 seconds = 30 ticks
- Test countdown: 0.3 seconds = 3 ticks
- Countdown assertion: `await page.waitForTimeout(400)` = 400ms (waits for 3 ticks at 100ms)
- Total test time: ~8 seconds for 43 tests (vs 20+ with 3-second countdowns)

### Why form tests need `openAddForm(page)`
- Form is now conditionally rendered (hidden by default)
- Must click button to make form visible before filling inputs
- Without `openAddForm()`, selectors find nothing and tests timeout

### Why we use `div[role="button"]` not button selectors
- Expand/collapse changed from `<button>` to `<div role="button">`
- Old selectors: `button:has-text("▶")` now return nothing
- New selector: `div[role="button"]` matches the div that was clicked
- This applies to multiple places: expand/collapse, task headers

---

## Potential Gotchas for Future Changes

1. **Adding new countdown feature** — Remember countdown conditional on `!showCompleted`
   - If you add countdown-related feature, check toggle state first
   - Don't assume countdown always runs

2. **Changing form position** — Update `openAddForm()` helper in tests
   - If form moves again, update button selector or click target
   - All tests depend on this helper working

3. **Refactoring countdown display** — Keep decimal format in mind
   - Tests expect: `Unmark Done (2.9)`, `Unmark Done (1.8)`, etc.
   - If you change format, update test selectors: `button:has-text("Unmark Done (0.")`

4. **Moving from prop drilling to Context** — Good long-term improvement
   - Would need to update component signatures
   - Tests would still work (no test dependency on prop names)
   - Remember `showCompleted` affects countdown behavior

---

## Session Commands Reference

```bash
# Development
npm run dev           # Start dev server at http://localhost:8000

# Testing
npm test              # Run all 43 tests (headless, fastest)
npm test:ui          # Interactive Playwright UI (debug failures)
npm test:headed      # Run with visible browser (see what tests do)

# Building
npm run build         # Production build to dist/bundle.js
```

---

## Next Session Checklist

- [ ] Run `npm test` — verify all 43 tests pass
- [ ] Review this file if making countdown or toggle changes
- [ ] Check memory files for recent session context
- [ ] Update IMPLEMENTATION_NOTES if you change core patterns
