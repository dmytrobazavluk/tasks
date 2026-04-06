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

### Step-by-Step Example: Add "Clear All Completed" Button

#### 1. Plan Your Changes
**Files you'll need to modify:**
- `src/App.jsx` — Add handler function
- `src/components/TaskList.jsx` — Add button (optional, or in App)
- `tests/core.spec.js` — Add test

**Think about:**
- Where does the button go? (usually with other action buttons)
- What does clicking it do? (delete all completed tasks)
- What about the countdown? (not relevant here)
- Edge case: What if no completed tasks? (button disabled or hide)

#### 2. Write the Test First (Optional but Recommended)
```javascript
// In tests/core.spec.js
test('should clear all completed tasks', async ({ page }) => {
  await setupPage(page);
  await openAddForm(page);

  const titleInput = page.locator('input[placeholder="Task title..."]');
  const addButton = page.locator('button:has-text("Add Task")').first();

  // Create two tasks
  await titleInput.fill('Task 1');
  await addButton.click();
  await openAddForm(page);
  await titleInput.fill('Task 2');
  await addButton.click();

  // Mark both as complete
  const expandButtons = page.locator('div[role="button"]');
  await expandButtons.nth(0).click();
  let markDoneButton = page.locator('button:has-text("Mark Done")').first();
  await markDoneButton.click();

  await expandButtons.nth(1).click();
  markDoneButton = page.locator('button:has-text("Mark Done")').first();
  await markDoneButton.click();

  // Wait for countdown to finish
  await page.waitForTimeout(400);

  // Click "Clear Completed" button
  const clearButton = page.locator('button:has-text("Clear Completed")');
  await clearButton.click();

  // Both tasks should be gone
  await expect(page.locator('text=Task 1')).not.toBeVisible();
  await expect(page.locator('text=Task 2')).not.toBeVisible();
  
  // But Show Completed toggle should show nothing (all are deleted, not just hidden)
  const showCompletedButton = page.locator('button:has-text("Show Completed")');
  await showCompletedButton.click();
  await expect(page.locator('text=Task 1')).not.toBeVisible();
});
```

#### 3. Implement the Feature
**In `src/App.jsx`:**
```javascript
// Add handler function
const clearCompleted = () => {
  setTasks(tasks.filter(task => !task.completed));
};

// Add button in JSX (near Show Completed toggle)
<button
  onClick={clearCompleted}
  className="px-4 py-2 text-sm font-medium rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition"
>
  Clear Completed
</button>
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
git commit -m "Add Clear Completed button

- New button in header removes all completed tasks
- Added test to verify functionality
- All 44 tests passing"
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
const [showCompleted, setShowCompleted] = useState(false);

// Pass to children if needed
<TaskList showCompleted={showCompleted} ... />
```

### Conditional Rendering Based on State
```javascript
// Use ternary for simple conditions
{isExpanded ? <Details /> : <Summary />}

// Use logical AND for showing/hiding
{isLoading && <LoadingSpinner />}
```

### Countdown-Related Changes
- Always check `!showCompleted` if countdown is involved
- Remember: countdown logic is in `src/App.jsx` and `src/config.js`
- See `IMPLEMENTATION_NOTES.md` for countdown details

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
