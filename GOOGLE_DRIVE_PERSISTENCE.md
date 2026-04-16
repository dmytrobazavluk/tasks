# Google Drive Persistence Layer

**Status:** Planning / Not Yet Implemented  
**Priority:** Medium  
**Complexity:** High  
**Estimated Effort:** 1-2 weeks

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
    this.fileId = null;
  }

  async authenticate() {
    // OAuth 2.0 flow with Google Sign-In
    // Returns: access token
  }

  async findOrCreateFile() {
    // Search Drive for 'task-planner-data.json'
    // If found: use that file ID
    // If not found: create new file
    // Returns: file ID
  }

  async load() {
    // GET: /drive/v3/files/{fileId}?alt=media
    // Returns: { tasks, categories, projects, _metadata }
  }

  async save(data) {
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
  }

  async load() {
    // Always load from local first
    // Check if pending syncs exist
    // If no pending: compare with Google timestamp
    // Return local if newer, Google if newer
  }

  async save(data) {
    // Save to IndexedDB immediately (fast)
    // Mark as _pendingSync: true
    // Attempt async sync to Google (non-blocking)
  }

  startAutoSync() {
    // Listen for online/offline events
    // Retry failed syncs when online
    // Periodic retry (every 5 minutes)
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
  - "data" (key: "current", value: full data object)
  - "syncQueue" (key: auto, value: pending sync objects)
  - "history" (key: timestamp, value: snapshot for debugging)
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

### Phase 2
- [ ] `ConflictResolver` class
- [ ] `mergeData()` function
- [ ] `ConflictDialog` component
- [ ] Conflict detection in save()
- [ ] Handle all conflict scenarios
- [ ] Tests for merge logic
- [ ] Multi-device scenario testing

### Phase 3
- [ ] Error handling for all scenarios
- [ ] User feedback messages
- [ ] Settings component
- [ ] Manual sync button
- [ ] Comprehensive testing
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

### Unit Tests
- `conflictResolver.test.js` - Merge logic
- `dataMerge.test.js` - Data combination
- `googleDrive.test.js` - API calls (mocked)

### Integration Tests
- Load → save → load cycle
- Offline → online sync
- Conflict detection scenarios
- Multi-device sync simulation

### Manual Testing Scenarios
1. Open app on Device A, make changes
2. Open app on Device B, make different changes
3. Device B syncs first
4. Device A tries to sync → conflict dialog appears
5. User chooses merge → both changes preserved

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

1. **Review** this plan with user
2. **Schedule** Phase 1 implementation
3. **Setup** Google Cloud project
4. **Create** feature branch
5. **Start** with GoogleDrivePersistence class
6. **Test** locally before expanding

---

**Created:** 2026-04-14  
**Author:** Claude  
**Status:** Ready to implement when needed
