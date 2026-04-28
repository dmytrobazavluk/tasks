# Google Drive Persistence Layer

**Status:** Planning / Not Yet Implemented  
**Priority:** Medium  
**Complexity:** High  
**Estimated Effort:** 2-3 weeks
- Phase 1: 3-4 days
- Phase 1.5: 1-2 days
- Phase 1.6: 2-3 days
- Phase 2: 2-3 days
- Phase 3: 2-3 days

---

## Overview

Add browser-based Google Drive integration as an optional persistence layer. Users can optionally sync their tasks to Google Drive while keeping all data local-first (IndexedDB). No backend server required.

### Architecture

```
┌─────────────────────────────────────┐
│  React App (Task Planner)           │
├─────────────────────────────────────┤
│ Google Sign-In (OAuth 2.0)          │
│ Hybrid Persistence Layer            │
│  ├─ IndexedDB (source of truth)    │
│  ├─ Pending Sync Queue              │
│  ├─ Conflict Detection              │
│  └─ Merge Strategy                  │
└─────────────────────────────────────┘
         ↓ (sync)
    [Google Drive API v3]
         ↓
   (user's personal Drive)
```

---

## Key Design Principles

1. **Local-First** - IndexedDB is always source of truth
2. **Async Sync** - Non-blocking background syncs
3. **Offline-Safe** - Works without internet, syncs when available
4. **Multi-Device** - Handle changes from other devices gracefully
5. **User Control** - Show sync status, let users resolve conflicts

---

## Setup Requirements

### Google Cloud Project Setup

```
1. Go to https://console.cloud.google.com/
2. Create new project: "Task Planner"
3. Enable APIs:
   - Google Drive API
   - Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized origins: 
     * http://localhost:8000 (dev)
     * https://yourdomain.com (prod)
   - Authorized redirect URIs:
     * http://localhost:8000/callback
     * https://yourdomain.com/callback
5. Get Client ID and API Key
```

### Environment Variables

```bash
REACT_APP_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
REACT_APP_GOOGLE_API_KEY=AIza...
```

---

## Implementation Plan

### Phase 1: Basic Google Drive Integration (3-4 days)

#### 1.1 Google Drive Persistence Class
- **File:** `src/persistence/googleDrive.js`
- **Features:**
  - OAuth authentication flow
  - Find or create task data file in Drive
  - Load data from Drive
  - Save data to Drive
  - Error handling for CORS, quota, auth failures

```javascript
export class GoogleDrivePersistence {
  constructor() {
    this.authToken = null;
    this.activeFileId = null;
  }

  async authenticate() {
    // OAuth 2.0 flow with Google Sign-In
    // Returns: access token
  }

  async listFiles() {
    // Search Drive for all 'task-planner-*.json' files
    // Returns: [{ id, name, createdTime, modifiedTime }, ...]
    // Sorted by modifiedTime descending
  }

  async findOrCreateFile(fileName = 'task-planner-default.json') {
    // Search Drive for specific task file
    // If found: return that file ID
    // If not found: create new file
    // Returns: file ID
  }

  async setActiveFile(fileId) {
    // Set which file to work with
    // Validate file exists and is accessible
    this.activeFileId = fileId;
  }

  async createNewFile(fileName) {
    // Create new empty task file in Drive
    // Returns: new file ID
  }

  async deleteFile(fileId) {
    // Move file to trash
    // Returns: success boolean
  }

  async renameFile(fileId, newName) {
    // Rename file in Drive
    // Returns: updated file ID
  }

  async load(fileId = this.activeFileId) {
    // GET: /drive/v3/files/{fileId}?alt=media
    // Returns: { tasks, categories, projects, _metadata }
  }

  async save(data, fileId = this.activeFileId) {
    // PATCH: /drive/v3/files/{fileId}?uploadType=media
    // Uploads JSON data
  }
}
```

#### 1.2 Hybrid Persistence Wrapper
- **File:** `src/persistence/hybridPersistence.js`
- **Features:**
  - Load from local first
  - Compare timestamps with Google
  - Async background sync
  - Pending sync tracking
  - Auto-retry failed syncs

```javascript
export class HybridPersistence {
  constructor() {
    this.drive = new GoogleDrivePersistence();
    this.local = new LocalStoragePersistence();
    this.activeFileId = null;  // Track active file
  }

  async load(fileId) {
    // Set active file if provided
    if (fileId) this.activeFileId = fileId;
    
    // Always load from local first
    // Check if pending syncs exist for this file
    // If no pending: compare with Google timestamp
    // Return local if newer, Google if newer
  }

  async save(data) {
    // Save to IndexedDB immediately (fast)
    // Mark as _pendingSync: true
    // Store activeFileId with pending sync
    // Attempt async sync to Google (non-blocking)
  }

  async switchFile(fileId) {
    // Switch to different file
    // Save current pending changes first
    // Load new file into local
    // Update activeFileId
    // Start syncing for new file
  }

  async listAvailableFiles() {
    // Get list of all task files from Google Drive
    // Returns: file metadata with IDs and names
  }

  async createNewFile(fileName) {
    // Create new file in Drive
    // Initialize with empty task structure
    // Switch to new file
    // Returns: new file ID
  }

  startAutoSync() {
    // Listen for online/offline events
    // Retry failed syncs when online
    // Periodic retry (every 5 minutes)
    // Handle syncs for current active file
  }
}
```

#### 1.3 Google Sign-In Component
- **File:** `src/components/GoogleSignIn.jsx`
- **Features:**
  - "Sign in with Google" button
  - Show user's profile picture/name
  - Logout button
  - Auth status indicator

#### 1.3.5 File Switcher Component (NEW)
- **File:** `src/components/FileSwitcher.jsx`
- **Features:**
  - Dropdown/selector showing available task files in Drive
  - "Create New File" button
  - Quick switch between files
  - Show which file is currently active
  - Show file last modified date
  - Example:
    ```javascript
    <FileSwitcher 
      files={availableFiles}
      currentFileId={activeFileId}
      onSwitch={switchFile}
      onCreate={createNewFile}
    />
    ```

#### 1.4 Integration with App.jsx
- Replace localStorage with hybrid persistence
- Show sync status indicator
- Handle auth flow
- Example:
  ```javascript
  useEffect(() => {
    const hybrid = new HybridPersistence();
    hybrid.startAutoSync();
    const data = await hybrid.load();
    // Load tasks...
  }, []);
  ```

#### 1.5 First Sync Migration (Critical)
- **File:** `src/persistence/hybridPersistence.js` (extend)
- **Purpose:** Preserve existing user tasks when they enable Google Drive sync
- **Scenario:** User has tasks in IndexedDB → signs in with Google → first sync happens
- **Migration Flow:**
  ```javascript
  async firstSync() {
    // Step 1: Load local IndexedDB data
    const localData = await this.local.load();
    
    // Step 2: Check if file exists in Google Drive
    const existingFile = await this.drive.findOrCreateFile();
    
    // Step 3: Handle both cases
    if (fileWasJustCreated) {
      // No remote data: upload local tasks to Drive
      await this.drive.save(localData);
      // Local stays as-is, now also synced to Drive
      return localData;
    } else {
      // File existed: compare timestamps
      const remoteData = await this.drive.load();
      const conflict = ConflictResolver.resolve(
        localData,
        remoteData,
        false // no pending changes on first sync
      );
      
      if (conflict === 'useLocal') {
        // Local is newer, upload to Drive
        await this.drive.save(localData);
        return localData;
      } else {
        // Remote is newer or equal, use it
        await this.local.save(remoteData);
        return remoteData;
      }
    }
  }
  ```
- **Key Points:**
  - ✅ User's existing tasks are preserved
  - ✅ Tasks get backed up to Drive on first sync
  - ✅ If Drive already has data, merge intelligently
  - ✅ User sees seamless transition to synced state

---

### Phase 1.6: Multi-File Support & File Switching (2-3 days)

#### 1.6.1 File Enumeration API
- **File:** `src/persistence/googleDrive.js` (extend existing)
- **Features:**
  - List all task files from Drive: `listFiles()`
  - Filter by naming pattern: `task-planner-*.json`
  - Return: `[{ id, name, createdTime, modifiedTime }, ...]`
  - Cache file list with 5-minute TTL

#### 1.6.2 File Management Methods
- **File:** `src/persistence/googleDrive.js` (extend existing)
- **Methods:**
  - `createNewFile(name)` - Create blank task file with initial structure
  - `deleteFile(fileId)` - Move to trash (soft delete)
  - `renameFile(fileId, newName)` - Update file name
  - `setActiveFile(fileId)` - Switch working file
  - Validation: ensure file exists and is accessible

#### 1.6.3 File Switcher Component
- **File:** `src/components/FileSwitcher.jsx`
- **Features:**
  - Dropdown showing available files
  - Display file name and last modified date
  - "Create New File" button with input dialog
  - "Delete File" option (with confirmation)
  - "Rename File" option
  - Highlight current active file
  - Loading state while switching files
  - Example placement: header/navigation area

#### 1.6.4 Active File Tracking
- **IndexedDB Update:**
  - Add `activeFileId` to metadata store
  - Persist selected file across sessions
  - Auto-load last active file on app start
  - Allow override via URL parameter: `?fileId=xxx`

#### 1.6.5 File Switch Workflow
1. User clicks dropdown → fetch latest file list
2. User selects file → confirm any unsaved local changes
3. Save pending changes to current file
4. Clear local cache, load new file
5. Start fresh sync for new file
6. Update UI to show active file
7. Resume auto-sync for new file

---

### Phase 2: Multi-Device Sync & Conflict Resolution (2-3 days)

#### 2.1 Conflict Detection
- **File:** `src/persistence/conflictResolver.js`
- **Logic:**
  - Load local and remote data
  - Compare `_lastSyncTime` timestamps
  - Detect: local newer, remote newer, or equal
  - Decide: use local, use remote, or merge

```javascript
export class ConflictResolver {
  resolve(localData, remoteData, hasPendingChanges) {
    // Case 1: Local has unsaved changes → use local
    // Case 2: Remote is newer → use remote (another device updated)
    // Case 3: Local is newer → use local
    // Case 4: Equal → no conflict
    // Returns: 'useLocal' | 'useRemote' | 'merge' | 'none'
  }
}
```

#### 2.2 Data Merge Strategy
- **File:** `src/persistence/dataMerge.js`
- **Logic:**
  - For tasks: keep task if ID exists in either version
  - Use task with latest `lastModified` timestamp
  - For categories/projects: merge by ID
  - Preserve both versions if truly conflicted

```javascript
export function mergeData(localData, remoteData) {
  // Combine tasks by ID, use newer version of each
  // Merge categories: union by ID
  // Merge projects: union by ID
  // Returns: merged data object
}
```

#### 2.3 Conflict Resolution Dialog
- **File:** `src/components/ConflictDialog.jsx`
- **Options:**
  - 🔄 Merge Changes (recommended)
  - 💻 Keep Local Changes
  - ☁️ Load from Google Drive

#### 2.4 Updated HybridPersistence
- Check for conflicts in `save()` before syncing
- Show dialog if conflict detected
- Handle user choice (merge/local/remote)
- Track timestamps at task level for merge detection

---

### Phase 3: Polish & Error Handling (2-3 days)

#### 3.1 Error Scenarios
- **CORS errors** - Suggest checking Google Cloud setup
- **Quota exceeded** - Show message, queue for later
- **Auth expired** - Automatic refresh or re-sign-in
- **Network failures** - Queue sync, retry with backoff
- **Corrupt data** - Fallback to local, show warning

#### 3.2 User Feedback
- Sync status indicator (synced / pending / error)
- Hover tooltips with last sync time
- Error notifications with retry buttons
- Loading spinners during sync

#### 3.3 Settings/Preferences
- **File:** `src/components/SyncSettings.jsx`
- Options:
  - Enable/disable Google Drive sync
  - Manual sync button
  - **File Management Section:**
    - List of available files (with last modified dates)
    - Switch active file
    - Create new file
    - Delete file
    - Rename file
  - Clear Google Drive file (start fresh)
  - View sync history
  - Choose merge strategy (auto vs manual)

#### 3.4 Testing
- Test offline → online scenarios
- Test concurrent edits on 2 devices
- Test large file handling (10k+ tasks)
- Test auth token expiration
- Test merge logic with complex conflicts

---

## Data Structure

### File Format in Google Drive

```json
{
  "version": "2.3.0",
  "tasks": [
    {
      "id": 1234567890,
      "title": "Sample Task",
      "completed": false,
      "details": "...",
      "categoryIds": ["uuid-1"],
      "projectIds": ["uuid-2"],
      "scheduleType": "none",
      "scheduledDate": null,
      "addedDate": "2026-04-14T10:30:00Z",
      "completionDate": null,
      "removalCountdown": null,
      "lastModified": "2026-04-14T10:30:00Z"
    }
  ],
  "categories": [
    {
      "id": "uuid-1",
      "name": "Work",
      "lastModified": "2026-04-14T10:30:00Z"
    }
  ],
  "projects": [
    {
      "id": "uuid-2",
      "name": "Project A",
      "lastModified": "2026-04-14T10:30:00Z"
    }
  ],
  "_metadata": {
    "lastSyncTime": 1713097800000,
    "lastModified": "2026-04-14T10:30:00Z",
    "deviceId": "device-uuid",
    "syncVersion": 1
  }
}
```

### IndexedDB Structure

```
Database: "TaskPlanner"
Stores:
  - "data" (key: "current", value: full data object for active file)
  - "syncQueue" (key: auto, value: pending sync objects with fileId)
  - "history" (key: timestamp, value: snapshot for debugging)
  - "metadata" (key: "active", value: { activeFileId, files: [...] })
  - "fileCache" (key: fileId, value: { tasks, categories, projects } for each file)
```

### Multi-File Metadata

```json
{
  "activeFileId": "file-id-123",
  "files": [
    {
      "id": "file-id-123",
      "name": "Work Tasks",
      "createdTime": "2026-04-15T10:00:00Z",
      "modifiedTime": "2026-04-28T14:30:00Z",
      "syncStatus": "synced"
    },
    {
      "id": "file-id-456",
      "name": "Personal Projects",
      "createdTime": "2026-04-20T09:00:00Z",
      "modifiedTime": "2026-04-27T18:45:00Z",
      "syncStatus": "pending"
    }
  ]
}
```

---

## Implementation Checklist

### Phase 1
- [ ] Google Cloud project setup
- [ ] Environment variables configured
- [ ] `GoogleDrivePersistence` class
- [ ] `HybridPersistence` wrapper
- [ ] `GoogleSignIn` component
- [ ] Integration with App.jsx
- [ ] Basic load/save working
- [ ] Sync status indicator in UI
- **Unit Tests (Phase 1):**
  - [ ] `GoogleDrivePersistence.test.js` (85%+ coverage)
    - [ ] authenticate() flow
    - [ ] findOrCreateFile() - create new file
    - [ ] load() - fetch from Drive
    - [ ] save() - update Drive
    - [ ] Error scenarios (CORS, quota, auth expired)
  - [ ] `HybridPersistence.test.js` (85%+ coverage)
    - [ ] load() returns local first
    - [ ] save() writes local immediately
    - [ ] save() queues async sync
    - [ ] startAutoSync() retry logic
  - [ ] `GoogleSignIn.test.js` (80%+ coverage)
- **Integration Tests (Phase 1):**
  - [ ] Mock Service Worker setup for Google Drive API
  - [ ] End-to-end: authenticate → create file → save → load
  - [ ] Offline → online sync queue

### Phase 1.5 (First Sync Migration)
- [ ] Detect first-time sync scenario
- [ ] Handle existing local IndexedDB data
- [ ] Upload local data to Drive if new file
- [ ] Merge local + Drive data if file exists
- [ ] Preserve user's existing tasks
- **Unit Tests (Phase 1.5):**
  - [ ] `HybridPersistence.test.js` extensions (85%+ coverage)
    - [ ] firstSync() uploads local if Drive empty
    - [ ] firstSync() merges if Drive has data
    - [ ] firstSync() preserves existing tasks
    - [ ] firstSync() uses conflict resolver
- **Integration Tests (Phase 1.5):**
  - [ ] New user: existing local tasks → upload to Drive
  - [ ] Existing user: Drive has data → merge correctly
  - [ ] Manual test: verify no data loss in migration

### Phase 1.6 (Multi-File Support)
- [ ] File enumeration API (`listFiles()`)
- [ ] File management methods (create/delete/rename)
- [ ] `FileSwitcher` component
- [ ] Active file tracking in IndexedDB
- [ ] File switch workflow (save → clear → load)
- [ ] URL parameter support for file selection
- **Unit Tests (Phase 1.6):**
  - [ ] `GoogleDrivePersistence.test.js` extensions
    - [ ] listFiles() returns file list
    - [ ] createNewFile() initializes structure
    - [ ] deleteFile() soft deletes
    - [ ] renameFile() updates name
  - [ ] `HybridPersistence.test.js` extensions
    - [ ] switchFile() saves current before switching
    - [ ] switchFile() clears and loads new file
    - [ ] listAvailableFiles() returns list
  - [ ] `FileSwitcher.test.js` (80%+ coverage)
    - [ ] renders dropdown with files
    - [ ] switches file on selection
    - [ ] create/delete/rename workflows
    - [ ] loading states and error handling
- **Integration Tests (Phase 1.6):**
  - [ ] Create File A → create File B → switch between them
  - [ ] File data isolation verified
  - [ ] Pending syncs per file tracked correctly

### Phase 2
- [ ] `ConflictResolver` class
- [ ] `mergeData()` function
- [ ] `ConflictDialog` component
- [ ] Conflict detection in save()
- [ ] Handle all conflict scenarios
- **Unit Tests (Phase 2):**
  - [ ] `ConflictResolver.test.js` (95%+ coverage)
    - [ ] All decision paths (useLocal/useRemote/merge/none)
    - [ ] Pending changes flag handling
  - [ ] `dataMerge.test.js` (95%+ coverage)
    - [ ] Combine tasks by ID
    - [ ] Merge categories/projects
    - [ ] Preserve timestamps
    - [ ] Handle empty/conflicting data
  - [ ] `ConflictDialog.test.js` (80%+ coverage)
- **Integration Tests (Phase 2):**
  - [ ] Multi-device conflict scenarios (A & B edit same task)
  - [ ] Merge strategy validation
  - [ ] Manual testing: conflict dialog appears and resolves

### Phase 3
- [ ] Error handling for all scenarios
- [ ] User feedback messages
- [ ] Settings component
- [ ] Manual sync button
- **Unit Tests (Phase 3):**
  - [ ] `SyncSettings.test.js` (80%+ coverage)
    - [ ] File management section UI
    - [ ] Error message display
- **Final Coverage Report:**
  - [ ] Overall coverage ≥ 80%
  - [ ] GoogleDrivePersistence 85%+
  - [ ] HybridPersistence 85%+
  - [ ] ConflictResolver 95%+
  - [ ] Components 80%+
  - [ ] Integration tests 70%+
- **CI/CD Setup:**
  - [ ] GitHub Actions test workflow
  - [ ] Coverage reporting to Codecov
  - [ ] Fail build if coverage drops
- [ ] Documentation updates
- [ ] Release notes

---

## Code Examples

### Basic Usage

```javascript
// In App.jsx
import { HybridPersistence } from './persistence/hybridPersistence';

function App() {
  useEffect(() => {
    const persistence = new HybridPersistence();
    persistence.startAutoSync();
    
    const data = await persistence.load();
    setTasks(data.tasks);
    setCategories(data.categories);
  }, []);

  const handleTaskChange = async () => {
    const newData = { tasks, categories, projects };
    await persistence.save(newData); // Non-blocking
  };
}
```

### Google Drive Authentication

```javascript
// In GoogleDrivePersistence
async authenticate() {
  return new Promise((resolve, reject) => {
    window.gapi.auth2.authorize(
      {
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        immediate: false,
      },
      (response) => {
        if (response.error) {
          reject(response.error);
        } else {
          this.authToken = response.getAuthResponse().id_token;
          resolve(this.authToken);
        }
      }
    );
  });
}
```

### Conflict Resolution

```javascript
// In HybridPersistence
async save(data) {
  const remoteData = await this.drive.load();
  const conflict = ConflictResolver.resolve(
    data, 
    remoteData, 
    data._pendingSync
  );

  if (conflict === 'merge') {
    const merged = mergeData(data, remoteData);
    await this._saveAndSync(merged);
  } else if (conflict === 'askUser') {
    const choice = await this._showConflictDialog(data, remoteData);
    // Handle user choice
  } else {
    await this._saveAndSync(data);
  }
}
```

---

## Testing Strategy

### Unit Tests (Jest + Mocks)

#### GoogleDrivePersistence Tests
- **File:** `src/persistence/googleDrive.test.js`
- **Mocks:** Mock `fetch` and Google API calls
- **Coverage:**
  ```javascript
  // Mock Google Drive API responses
  jest.mock('gapi.client.drive.files', () => ({
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }));

  describe('GoogleDrivePersistence', () => {
    test('authenticate() returns access token');
    test('listFiles() returns array of files');
    test('findOrCreateFile() creates new file if not exists');
    test('load() fetches file from Drive');
    test('save() updates file in Drive');
    test('deleteFile() moves to trash');
    test('renameFile() updates file name');
    // Error cases
    test('handles CORS error gracefully');
    test('handles quota exceeded error');
    test('handles auth token expiration');
    test('retries on network failure');
  });
  ```

#### HybridPersistence Tests
- **File:** `src/persistence/hybridPersistence.test.js`
- **Mocks:** Mock both GoogleDrivePersistence and LocalPersistence
- **Coverage:**
  ```javascript
  jest.mock('./googleDrive');
  jest.mock('./localStorage');

  describe('HybridPersistence', () => {
    // Phase 1 tests
    test('load() returns local data on first call');
    test('save() writes to local immediately');
    test('save() queues async Drive sync');
    test('startAutoSync() retries failed syncs');
    
    // Phase 1.5 First Sync Migration
    test('firstSync() uploads local data if Drive is empty');
    test('firstSync() merges if Drive has existing data');
    test('firstSync() preserves existing tasks');
    test('firstSync() uses conflict resolver to decide version');
    
    // Phase 1.6 Multi-File
    test('switchFile() saves current file before switching');
    test('switchFile() clears local cache');
    test('switchFile() loads new file');
    test('listAvailableFiles() returns file list');
    test('createNewFile() initializes with empty structure');
  });
  ```

#### Conflict Resolver Tests
- **File:** `src/persistence/conflictResolver.test.js`
- **Pure logic, no mocks needed**
- **Coverage:**
  ```javascript
  describe('ConflictResolver', () => {
    test('returns "useLocal" when local is newer');
    test('returns "useRemote" when remote is newer');
    test('returns "merge" when both have changes');
    test('returns "none" when equal');
    test('handles pending changes flag correctly');
  });
  ```

#### Data Merge Tests
- **File:** `src/persistence/dataMerge.test.js`
- **Coverage:**
  ```javascript
  describe('mergeData()', () => {
    test('combines tasks by ID, keeps newer version');
    test('merges categories by union');
    test('merges projects by union');
    test('preserves lastModified timestamps');
    test('handles empty local/remote data');
    test('handles conflicting task deletions');
  });
  ```

### Component Tests (Playwright)

#### FileSwitcher Component
- **File:** `src/components/FileSwitcher.test.js`
- **Coverage:**
  ```javascript
  describe('FileSwitcher', () => {
    test('renders dropdown with file list');
    test('shows current active file highlighted');
    test('calls onSwitch() when file selected');
    test('shows create new file dialog');
    test('calls onCreate() with new file name');
    test('shows delete confirmation before deletion');
    test('shows rename input field');
    test('handles loading state during switch');
    test('shows error message on API failure');
  });
  ```

#### GoogleSignIn Component
- **File:** `src/components/GoogleSignIn.test.js`
- **Coverage:**
  ```javascript
  describe('GoogleSignIn', () => {
    test('renders sign-in button when not authenticated');
    test('shows user profile after sign-in');
    test('calls authenticate() on button click');
    test('shows logout button when authenticated');
    test('handles auth errors gracefully');
  });
  ```

### Integration Tests

#### End-to-End Sync Flow (with Mock Server)
```javascript
describe('End-to-End: Sync Workflow', () => {
  // Use MSW (Mock Service Worker) to intercept Google Drive API calls
  beforeAll(() => server.listen());

  test('1. First sign-in: upload local tasks to Drive', async () => {
    // 1. Mock Drive returns empty
    // 2. Call firstSync()
    // 3. Verify local tasks uploaded to Drive
  });

  test('2. Load from Drive: fetch tasks', async () => {
    // 1. Add task to local
    // 2. Save (triggers sync)
    // 3. Clear local
    // 4. Load - should fetch from Drive
  });

  test('3. Offline → Online: queue & retry', async () => {
    // 1. Go offline
    // 2. Make changes
    // 3. Go online
    // 4. Verify changes synced
  });

  test('4. First sync migration: merge existing', async () => {
    // 1. Mock Drive has data
    // 2. Call firstSync()
    // 3. Verify merge happened correctly
  });

  test('5. File switching: save → switch → load', async () => {
    // 1. Create File A with tasks
    // 2. Switch to File B
    // 3. Verify File A saved, File B loaded
  });
});
```

### Manual Testing Scenarios

#### Basic Multi-Device Sync
1. Open app on Device A, make changes
2. Open app on Device B, make different changes
3. Device B syncs first
4. Device A tries to sync → conflict dialog appears
5. User chooses merge → both changes preserved

#### Multi-File Switching
1. Create File A with 10 tasks
2. Sync to Google Drive
3. Create File B with 5 different tasks
4. Switch to File A → verify all 10 tasks load
5. Make changes to File A
6. Switch to File B → changes saved to File A, File B loads
7. Switch back to File A → changes still present
8. Delete File B → File B no longer appears in list
9. Rename File A → new name reflects in UI and Drive

### Coverage Targets

| Area | Target | Strategy |
|------|--------|----------|
| GoogleDrivePersistence | 85%+ | Mock fetch + gapi, test all methods + error cases |
| HybridPersistence | 85%+ | Mock Google + Local, test sync queue + retry logic |
| ConflictResolver | 95%+ | Pure logic, test all decision paths |
| FileSwitcher Component | 80%+ | Playwright, mock API calls |
| Integration Flow | 70%+ | MSW mock server for full workflows |

### Tools & Setup

**Dependencies:**
```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "msw": "^1.3.0",           // Mock Service Worker for API mocking
    "@playwright/test": "^1.40.0",
    "jest-mock-extended": "^3.0.0"
  }
}
```

**Mock Server Setup:**
```javascript
// src/mocks/googleDriveHandlers.js
import { rest } from 'msw';

export const googleDriveHandlers = [
  // Mock list files endpoint
  rest.get('https://www.googleapis.com/drive/v3/files', (req, res, ctx) => {
    return res(ctx.json({
      files: [
        { id: 'file-1', name: 'task-planner-default.json' },
        { id: 'file-2', name: 'task-planner-work.json' }
      ]
    }));
  }),

  // Mock get file endpoint
  rest.get('https://www.googleapis.com/drive/v3/files/:fileId', (req, res, ctx) => {
    return res(ctx.json({
      tasks: [],
      categories: [],
      projects: [],
      _metadata: { lastSyncTime: Date.now() }
    }));
  }),

  // Add more handlers for create, update, delete...
];
```

### Automation in CI/CD

```yaml
# .github/workflows/test.yml
name: Test Coverage
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run test:unit              # Jest
      - run: npm run test:integration       # MSW + Jest
      - run: npm run test:e2e               # Playwright
      - run: npm run coverage:report        # Coverage report
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true
          flags: google-drive
```

---

## Known Limitations & Future Enhancements

### Current Limitations
- No shared/collaborative editing
- No revision history in Google Drive
- No encryption (data visible in Drive)
- No bandwidth optimization (always full sync)

### Future Enhancements
1. **Selective Sync** - Only sync certain categories/projects
2. **Encryption** - Encrypt data before upload
3. **Revision History** - Keep multiple versions in Drive
4. **Collaborative Editing** - Share task lists with others
5. **Bandwidth Optimization** - Delta sync (only changed items)
6. **Export Formats** - Export as CSV, iCal, etc.
7. **Backup Management** - Auto-backup versioning
8. **Analytics** - Track sync performance, usage stats
9. **File Templates** - Pre-made files for common use cases (work, personal, projects)
10. **File Sharing** - Share specific files with other Google accounts

---

## Resources & References

- [Google Drive API v3 Documentation](https://developers.google.com/drive/api/v3/quickstart/js)
- [Google Auth Library](https://developers.google.com/identity/libraries/gsi/guides)
- [OAuth 2.0 for Web](https://developers.google.com/identity/protocols/oauth2)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

---

## Decision Log

### Why Local-First?
- ✅ Works offline without internet
- ✅ Fast load times (IndexedDB is instant)
- ✅ Reduces API calls and quota usage
- ✅ User owns their data in Drive

### Why Not WebSQL or SQLite?
- IndexedDB is modern standard, better supported
- LocalStorage has 5-10MB limit (too small)
- SQLite adds complexity, extra dependency

### Why Not Firebase?
- Adds backend service (user wanted pure browser)
- Firebase is another account/login
- More complex pricing

### Why Manual Conflict Dialog?
- Merge is safe but can be surprising
- User has most context about their data
- Better for important data (tasks)

---

## Next Steps

1. **Review** this plan with user (including Phase 1.5 migration + Phase 1.6 multi-file)
2. **Schedule** Phase 1 → 1.5 → 1.6 implementation (~2-3 weeks total)
3. **Setup** Google Cloud project
4. **Create** feature branch
5. **Start** with GoogleDrivePersistence class
6. **Implement** Phase 1.5 first sync migration after basic sync works
7. **Implement** Phase 1.6 multi-file support once migration is solid
8. **Test** each phase end-to-end before moving to next
9. **Implement** Phase 2 (conflict resolution) once files are stable

---

**Created:** 2026-04-14  
**Author:** Claude  
**Status:** Ready to implement when needed
