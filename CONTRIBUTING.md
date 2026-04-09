# Contributing Guide

Welcome to the Task Planner project! This guide explains how to set up your environment, make changes, and contribute to the project.

---

## Before You Start

**Read first:**
1. `README.md` — Understand what the app does
2. `TESTING.md` — Understand how to test
3. This file — You're reading it!

---

## Environment Setup

### Prerequisites
- Node.js v18+ (verify with `node --version`)
- npm v8+ (comes with Node)
- Git (for version control)

### Initial Setup
```bash
# Clone the repo (if not already done)
git clone <repo-url>
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# In another terminal, verify tests pass
npm test
```

**Troubleshooting:**
- **"npm install" fails** → Delete `node_modules/` and `package-lock.json`, try again
- **"Port 8000 already in use"** → Kill process: `lsof -ti:8000 | xargs kill -9`
- **"Tests fail immediately"** → Run `npm test -- --headed` to see what's wrong

---

## Git Workflow

### Branch Naming
```
feature/description    # New feature: feature/dark-mode
fix/description        # Bug fix: fix/countdown-timer-bug
refactor/description   # Refactoring: refactor/extract-countdown-component
docs/description       # Documentation: docs/add-contributing-guide
```

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   ```bash
   # Edit files, test locally
   npm run dev        # See changes in browser
   npm test           # Verify nothing broke
   ```

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add feature description

   - More detailed explanation of what changed
   - Why this change was made
   - Any important notes for reviewers"
   ```

   **Commit message format:**
   - First line: Short description (imperative, under 50 chars)
   - Blank line
   - Detailed explanation (optional but helpful)

   **Examples:**
   ```
   Add dark mode toggle

   - Adds theme state to App.jsx
   - Uses CSS variables for theme colors
   - Persists user preference to localStorage
   - All tests pass
   ```

   ```
   Fix countdown display when toggle is on

   - Countdown timer was still showing even when Show Completed was ON
   - Now properly hides countdown display when toggle is ON
   - Added test to catch this regression
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open PR on GitHub/GitLab with a clear description

---

## How to Add a Feature

### Step-by-Step Example: Add Task Priority Levels

#### 1. Plan Your Changes
**Files you'll need to modify:**
- `src/models/Task.js` — Add priority field to Task model
- `src/components/TaskForm.jsx` — Add priority dropdown to form
- `src/components/TaskItem.jsx` — Display priority with visual indicator
- `src/utils/taskGrouping.js` — Sort tasks by priority within each category
- `tests/core.spec.js` — Add test for priority

**Think about:**
- Where does the priority selector go? (in form and edit modal)
- What priority levels? (High, Medium, Low, or numeric 1-3)
- How do we sort? (within category: High first, then Medium, then Low)
- What about persistence? (included in Task model automatically)
- Edge case: What if task has no priority set? (default to Medium)

#### 2. Write the Test First (Optional but Recommended)
```javascript
// In tests/core.spec.js
test('should assign and display priority levels', async ({ page }) => {
  await setupPage(page);
  await openAddForm(page);

  const titleInput = page.locator('input[placeholder="Task title..."]');
  const addButton = page.locator('button:has-text("Add Task")').first();

  // Add a task (priority defaults to Medium)
  await titleInput.fill('Important task');
  await addButton.click();
  await openAddForm(page);

  // Add another with different priority
  await titleInput.fill('Low priority task');
  
  // Select priority (assuming new dropdown)
  const prioritySelect = page.locator('select[name="priority"]');
  await prioritySelect.selectOption('low');
  await addButton.click();

  // Verify both tasks show priority indicator
  const tasks = page.locator('div[role="button"]');
  
  // First task should have medium priority
  let task1 = tasks.nth(0);
  await expect(task1.locator('text=Medium')).toBeVisible();
  
  // Second task should have low priority
  let task2 = tasks.nth(1);
  await expect(task2.locator('text=Low')).toBeVisible();
});
```

#### 3. Implement the Feature
**In `src/models/Task.js`:**
```javascript
export function createTask(title, details = '', scheduledDate = null, categoryIds = [], priority = 'medium') {
  return {
    id: Date.now(),
    title,
    completed: false,
    details,
    scheduledDate: normalizeScheduledDate(scheduledDate),
    categoryIds: categoryIds.filter(id => id?.trim()),
    priority,  // NEW: default to 'medium'
    addedDate: new Date().toISOString(),
    completionDate: null,
  };
}
```

**In `src/components/TaskForm.jsx`:**
```javascript
// Add priority select to the form
<select
  name="priority"
  value={priority}
  onChange={(e) => setPriority(e.target.value)}
  className="px-3 py-2 border rounded text-sm"
>
  <option value="high">High</option>
  <option value="medium">Medium</option>
  <option value="low">Low</option>
</select>

// Pass priority when adding task
onAddTask(title, details, scheduledDate, categoryNames, priority);
```

**In `src/utils/taskGrouping.js`:**
```javascript
// Sort by priority within each category
const priorityOrder = { high: 0, medium: 1, low: 2 };
tasksInCategory.sort((a, b) => {
  const aPriority = priorityOrder[a.priority] ?? 1;
  const bPriority = priorityOrder[b.priority] ?? 1;
  return aPriority - bPriority;
});
```

#### 4. Test It
```bash
# Run just the new test
npm test -- core.spec.js

# Or run all tests
npm test

# View in browser
npm run dev
# Visit http://localhost:8000 and test manually
```

#### 5. Commit
```bash
git add .
git commit -m "Add task priority levels

- Add priority field to Task model (high/medium/low)
- Priority dropdown in add/edit form
- Tasks sorted by priority within each category
- Priority indicator displayed in task header
- All 51 tests passing"
```

---

## Code Style & Conventions

### Component Structure
```javascript
import { useState, useEffect } from 'react';

export default function ComponentName({ prop1, prop2 }) {
  // State
  const [state, setState] = useState(false);

  // Effects
  useEffect(() => {
    // Side effects here
  }, [dependencies]);

  // Handlers
  const handleClick = () => {
    setState(!state);
  };

  // Render
  return (
    <div className="...">
      {/* JSX here */}
    </div>
  );
}
```

### Naming Conventions
- **Components:** PascalCase (`TaskItem.jsx`, `TaskForm.jsx`)
- **Files:** PascalCase for components, lowercase for utils (`dateFormat.js`)
- **Variables/Functions:** camelCase (`isExpanded`, `handleClick`)
- **Constants:** UPPER_SNAKE_CASE (`COUNTDOWN_CONFIG`)

### CSS Classes
- Use Tailwind utility classes
- No custom CSS unless absolutely necessary
- Responsive: mobile-first, add breakpoints (sm:, md:, lg:)

### Comments
- Explain **why**, not **what**
- Code is self-documenting; comments explain decisions
- **Good:** `// Only show countdown when toggle is OFF to prevent timer overhead`
- **Bad:** `// Show countdown`

---

## Testing Requirements

### For Bug Fixes
- Add test that would have caught the bug
- Run `npm test` to verify fix works
- All tests must pass

### For New Features
- Add tests for main functionality
- Test edge cases (empty state, invalid input, etc.)
- Cover both happy path and error cases
- Run `npm test` to verify

### Test Best Practices
- Use existing test patterns (see `tests/core.spec.js`)
- Use `openAddForm(page)` before accessing form
- Use `page.waitForTimeout(400)` to wait for countdown
- Use `div[role="button"]` for expand/collapse
- Check both presence (`toBeVisible()`) and absence (`not.toBeVisible()`)
- For scheduling tests, note that tasks with future scheduling don't appear in Today tab

### Commands
```bash
npm test              # Run all tests
npm test -- file.spec.js  # Run one file
npm test:ui           # Interactive UI for debugging
npm test:headed       # See browser during tests
```

---

## Before Submitting

**Checklist:**
- [ ] Feature works locally (`npm run dev`)
- [ ] All tests pass (`npm test`)
- [ ] No console errors or warnings
- [ ] Code follows style conventions
- [ ] Commit message is clear
- [ ] Branch is up to date with main
- [ ] Tests added/updated for new code
- [ ] README.md or PROGRESS.md updated if needed

---

## Common Patterns to Follow

### Adding State to App.jsx
```javascript
// Follow the existing pattern
const [selectedCategory, setSelectedCategory] = useState(null);
const [tasks, setTasks] = useState([]);
const [categories, setCategories] = useState([]);

// Pass to children if needed
<Sidebar categories={categories} selectedCategory={selectedCategory} ... />
<TaskList tasks={tasks} categories={categories} ... />
```

### Working with Categories
```javascript
// Categories are explicit entities with IDs
const category = {
  id: crypto.randomUUID(),
  name: 'Work'
};

// Tasks reference categories by ID
const task = {
  ...taskData,
  categoryIds: ['uuid-1', 'uuid-2']  // Array of category IDs
};

// Resolve IDs to names at display time
const categoryName = categories.find(c => c.id === categoryId)?.name;
```

### Working with Scheduling
```javascript
// Scheduled date is ISO string (YYYY-MM-DD) for future dates only
const task = {
  ...taskData,
  scheduledDate: '2026-04-15'  // Only future dates
};

// Past/current dates are normalized to null
const normalizedDate = new Date(dateStr) > new Date() ? dateStr : null;
```

### Conditional Rendering Based on State
```javascript
// Use ternary for simple conditions
{isExpanded ? <Details /> : <Summary />}

// Use logical AND for showing/hiding
{isLoading && <LoadingSpinner />}
```

### Category-Related Changes
- Categories are auto-created when first assigned, auto-deleted when unused
- Always work with category IDs (`categoryIds`) internally, resolve to names for display
- When editing tasks, convert category names back to IDs before saving
- See `src/utils/categoryUtils.js` for helpers like `getUniqueCategoriesFromTasks()`

### Project-Related Changes
- Projects follow the same pattern as categories (IDs, auto-creation, auto-cleanup)
- Always work with project IDs (`projectIds`) internally, resolve to names for display
- When editing tasks, convert project names back to IDs before saving
- See `src/utils/projectUtils.js` for helpers like `getUniqueProjectsFromTasks()`
- Projects are displayed as sidebar tabs like categories

### Scheduling-Related Changes
- Tasks can have `scheduleType: 'none'`, `'soon'`, or `'specific'`
- For 'specific': validate scheduled date is in future using `normalizeScheduledDate()`
- Scheduled tasks don't appear in Today tab initially, only in Future tab
- When scheduled date arrives, task automatically moves to Today tab
- Future tab hides when no tasks are scheduled
- See `src/models/Task.js` for scheduling utilities: `normalizeScheduledDate()`, `isScheduledForFuture()`, `isScheduledSoon()`, `hasAnyFutureScheduling()`

### Countdown-Related Changes
- Countdown initializes when a task is marked done
- Countdown is a grace period: task stays visible but can be unmarked
- After countdown, task moves to Closed Tasks tab (unless it has a category)
- See `IMPLEMENTATION_NOTES.md` for countdown timer details

### Persistence
- Changes to tasks automatically persist (handled in App.jsx)
- Don't manually call persistence.save() in components
- Persistence layer is in `src/persistence/`

---

## Troubleshooting Development

### App won't start
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run dev
```

### Changes not showing up
```bash
# Dev server rebuilds automatically, but:
# 1. Check console for errors
# 2. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
# 3. Stop server (Ctrl+C) and restart
```

### Tests fail with timeout
```bash
# Most common cause: form not visible
# Solution: Use openAddForm(page) before filling inputs

# Second most common: task not expanded
# Solution: Click div[role="button"] to expand

# Still failing? Run with visible browser:
npm test:headed
```

### One test fails but others pass
```bash
# Run just that test file
npm test -- dates.spec.js

# Run just that one test (first line is test name)
npm test -- countdown.spec.js -t "should show countdown"
```

---

## What to Work On First

**Good first issues for new contributors:**
- [ ] Add TypeScript support (big but valuable)
- [ ] Add dark mode toggle (moderate, good practice)
- [ ] Add task search/filter (moderate, useful feature)
- [ ] Improve mobile responsiveness (small, good for CSS practice)
- [ ] Add keyboard shortcuts (moderate, improves UX)
- [ ] Add task categories/tags (large, extends functionality)

**Ask in issues/discussions if unclear!**

---

## Getting Help

**When stuck:**
1. Check `IMPLEMENTATION_NOTES.md` for code patterns
2. Look at existing tests for examples
3. Check `TESTING.md` for test patterns
4. Review comments in similar code
5. Open an issue describing the problem

**When asking for help:**
- Describe what you tried
- Show error message or unexpected behavior
- Link relevant code
- What you expected vs. what happened

---

## Summary

1. **Setup:** `npm install` → `npm run dev` → `npm test`
2. **Branch:** Create feature branch with naming convention
3. **Code:** Follow patterns in existing code
4. **Test:** Add tests, verify all pass
5. **Commit:** Clear message explaining why
6. **Push:** Create PR with description
7. **Review:** Fix feedback, push again
8. **Merge:** Done!

**Questions?** Check README.md, TESTING.md, and IMPLEMENTATION_NOTES.md before asking.

Good luck! 🚀
