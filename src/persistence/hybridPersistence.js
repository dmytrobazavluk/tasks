// Hybrid persistence: localStorage (source of truth) + Google Drive (async sync)
// Maintains sync interface for compatibility with existing code

import { localStoragePersistence } from './localStorage';
import { GoogleDrivePersistence } from './googleDrive';

const LAST_MODIFIED_KEY = 'taskplanner_lastModified';
const PENDING_SYNC_KEY = 'taskplanner_pendingSync';
const ACTIVE_WORKSPACE_ID_KEY = 'taskplanner_activeWorkspaceId';
const ACTIVE_WORKSPACE_NAME_KEY = 'taskplanner_activeWorkspaceName';

export class HybridPersistence {
  constructor() {
    this.local = localStoragePersistence;
    this.drive = new GoogleDrivePersistence();
    this.syncStatus = 'idle';
    // Get user from drive persistence (restored from localStorage)
    this.user = this.drive.user;
    this.syncInterval = null;
    this.retryTimeout = null;

    // Workspace state
    this.workspaces = [];
    this.activeWorkspaceId = localStorage.getItem(ACTIVE_WORKSPACE_ID_KEY);
    this.activeWorkspaceName = localStorage.getItem(ACTIVE_WORKSPACE_NAME_KEY);

    // Callbacks to be set by App.jsx
    this.onSync = null;
    this.onSyncStatusChange = null;
    this.onAuthChange = null;
    this.onWorkspacesChange = null;

    // Attempt silent auth on init
    this.attemptSilentAuth();
  }

  async attemptSilentAuth() {
    try {
      const authenticated = await this.drive.attemptSilentAuth();
      console.log('🔐 Silent auth result:', authenticated, 'User:', !!this.drive.user);
      if (authenticated && this.drive.user) {
        this.user = this.drive.user;
        console.log('✅ User authenticated via silent auth');
        if (this.onAuthChange) {
          this.onAuthChange(this.user);
        }
      } else if (this.drive.user) {
        // User info was restored from localStorage but silent auth failed
        // That's okay - keep the user logged in, they'll re-auth if they try to sync
        this.user = this.drive.user;
        console.log('✅ User restored from localStorage');
        if (this.onAuthChange) {
          this.onAuthChange(this.user);
        }
      }
    } catch (error) {
      console.log('⚠️ Silent auth failed (expected if not previously signed in):', error.message);
    }
  }

  load() {
    const data = this.local.load();

    // If user exists but not authenticated, attempt to get a fresh token
    if (this.user && !this.drive.isAuthenticated) {
      console.log('🔄 User exists but not authenticated, attempting token refresh...');
      this.drive.attemptSilentAuth().then((authenticated) => {
        if (authenticated) {
          console.log('✅ Token refreshed via silent auth');
          this.startBackgroundSync();
        } else {
          // Silent auth failed, but user is logged in via localStorage
          // Mark as ready for sync once they re-authenticate
          this.setSyncStatus('idle');
        }
      });
    } else if (this.drive.isAuthenticated && !this.hasPendingSync()) {
      // Start background Drive sync if authenticated
      this.startBackgroundSync();
    }
    return data;
  }

  save(tasks, categories = [], projects = []) {
    // Always save to local first (sync)
    this.local.save(tasks, categories, projects);

    // Only mark as pending sync if we have actual data
    const hasData = tasks && tasks.length > 0;
    if (hasData) {
      this.setLastModified(new Date().toISOString());
      this.setPendingSync(true);

      if (this.drive.isAuthenticated) {
        console.log('📤 Starting Drive sync...');
        // Async Drive sync (non-blocking)
        this.syncToDrive(tasks, categories, projects).catch((error) => {
          console.error('❌ Async sync to Drive failed:', error);
          this.setSyncStatus('error');
        });
      } else {
        console.log('⚠️ Not authenticated - tasks saved locally, pending sync to Drive');
      }
    }
  }

  clear() {
    this.local.clear();
    localStorage.removeItem(LAST_MODIFIED_KEY);
    localStorage.removeItem(PENDING_SYNC_KEY);
  }

  async signIn() {
    try {
      this.setSyncStatus('syncing');
      const user = await this.drive.authenticate();
      this.user = user;

      // List available workspaces
      let workspaces = [];
      try {
        workspaces = await this.drive.listWorkspaces();
        console.log('📁 Workspaces found:', workspaces.length);
      } catch (error) {
        console.error('Failed to list workspaces:', error);
        workspaces = [];
      }

      this.workspaces = workspaces;

      // If no workspaces exist, create default "My Tasks"
      if (workspaces.length === 0) {
        console.log('📁 No workspaces found, creating "My Tasks"');
        const fileId = await this.drive.findOrCreateFile('My Tasks');
        this.drive.setActiveFile(fileId);
        this.activeWorkspaceId = fileId;
        this.activeWorkspaceName = 'My Tasks';
        this.workspaces = [{ id: fileId, name: 'My Tasks' }];
      } else {
        // Select previously active workspace, or first one
        let selectedWorkspace = null;
        if (this.activeWorkspaceId) {
          selectedWorkspace = workspaces.find(ws => ws.id === this.activeWorkspaceId);
        }
        selectedWorkspace = selectedWorkspace || workspaces[0];

        this.activeWorkspaceId = selectedWorkspace.id;
        this.activeWorkspaceName = selectedWorkspace.name;
        this.drive.setActiveFile(selectedWorkspace.id);
        console.log('📁 Selected workspace:', selectedWorkspace.name);
      }

      // Save active workspace to localStorage
      localStorage.setItem(ACTIVE_WORKSPACE_ID_KEY, this.activeWorkspaceId);
      localStorage.setItem(ACTIVE_WORKSPACE_NAME_KEY, this.activeWorkspaceName);

      // Try to load from Drive on first sign-in
      await this.checkDriveAndMerge();

      if (this.onAuthChange) {
        this.onAuthChange(user);
      }

      // Notify about workspaces
      if (this.onWorkspacesChange) {
        this.onWorkspacesChange(this.workspaces, this.activeWorkspaceId);
      }

      console.log('✅ Sign-in successful, sync enabled');
      this.setSyncStatus('synced');
      return user;
    } catch (error) {
      console.error('❌ Sign-in failed:', error);
      this.setSyncStatus('error');
      throw error;
    }
  }

  signOut() {
    this.drive.logout();
    this.user = null;
    this.workspaces = [];
    this.activeWorkspaceId = null;
    this.activeWorkspaceName = null;
    localStorage.removeItem(ACTIVE_WORKSPACE_ID_KEY);
    localStorage.removeItem(ACTIVE_WORKSPACE_NAME_KEY);
    this.stopAutoSync();
    this.setPendingSync(false);
    this.setSyncStatus('idle');
    if (this.onAuthChange) {
      this.onAuthChange(null);
    }
  }

  async createWorkspace(name) {
    if (!this.drive.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      // Create the new file
      const fileId = await this.drive.findOrCreateFile(name);
      console.log('📁 Workspace created:', name);

      // Refresh workspaces list from Drive
      this.workspaces = await this.drive.listWorkspaces();

      // Switch to the new workspace
      await this.switchWorkspace(fileId);

      return { id: fileId, name };
    } catch (error) {
      console.error('Failed to create workspace:', error);
      throw error;
    }
  }

  async switchWorkspace(fileId) {
    if (!this.drive.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      // If we have pending changes, flush them first
      if (this.hasPendingSync()) {
        console.log('💾 Flushing pending sync before switching workspace');
        await this.syncToDrive(
          this.local.load().tasks,
          this.local.load().categories,
          this.local.load().projects
        );
      }

      // Clear local storage data
      this.local.clear();
      localStorage.removeItem(LAST_MODIFIED_KEY);
      localStorage.removeItem(PENDING_SYNC_KEY);

      // Switch to new file
      this.drive.setActiveFile(fileId);
      this.activeWorkspaceId = fileId;

      // Find workspace name from current list
      let workspace = this.workspaces.find(ws => ws.id === fileId);

      // If not found, fetch the latest workspaces list
      if (!workspace) {
        try {
          this.workspaces = await this.drive.listWorkspaces();
          workspace = this.workspaces.find(ws => ws.id === fileId);
        } catch (error) {
          console.warn('Failed to refresh workspaces list:', error);
        }
      }

      this.activeWorkspaceName = workspace?.name || 'Unknown';

      // Save active workspace to localStorage
      localStorage.setItem(ACTIVE_WORKSPACE_ID_KEY, this.activeWorkspaceId);
      localStorage.setItem(ACTIVE_WORKSPACE_NAME_KEY, this.activeWorkspaceName);

      // Load from Drive
      const driveData = await this.drive.load();

      // Always update local with Drive data (even if empty) and notify UI
      this.local.save(driveData.tasks, driveData.categories, driveData.projects);
      this.setLastModified(driveData._metadata?.lastModified || new Date().toISOString());

      // Always fire onSync to update React state
      if (this.onSync) {
        this.onSync(driveData);
      }

      // Notify about workspace change
      if (this.onWorkspacesChange) {
        this.onWorkspacesChange(this.workspaces, this.activeWorkspaceId);
      }

      this.setSyncStatus('synced');
      console.log('📁 Switched to workspace:', this.activeWorkspaceName);
    } catch (error) {
      console.error('Failed to switch workspace:', error);
      throw error;
    }
  }

  startAutoSync() {
    if (this.syncInterval) return;

    // Listen for online event
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Initial status
    if (!navigator.onLine) {
      this.setSyncStatus('offline');
      return;
    }

    // Check every 5 minutes
    this.syncInterval = setInterval(() => {
      if (this.drive.isAuthenticated) {
        this.checkDriveAndMerge().catch((error) => {
          console.error('Periodic sync check failed:', error);
          this.setSyncStatus('error');
        });
      }
    }, 5 * 60 * 1000);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  handleOnline() {
    console.log('Back online, attempting sync...');
    if (this.drive.isAuthenticated && this.hasPendingSync()) {
      this.retryPendingSync();
    } else {
      this.setSyncStatus('synced');
    }
  }

  handleOffline() {
    this.setSyncStatus('offline');
  }

  async startBackgroundSync() {
    if (this.syncStatus === 'syncing' || this.syncStatus === 'offline') return;

    try {
      this.setSyncStatus('syncing');
      await this.checkDriveAndMerge();
      if (!this.hasPendingSync()) {
        this.setSyncStatus('synced');
      }
    } catch (error) {
      console.error('Background sync failed:', error);
      this.setSyncStatus('error');
    }
  }

  async checkDriveAndMerge() {
    if (!this.drive.isAuthenticated) {
      console.log('⚠️ Drive not authenticated, skipping merge');
      return;
    }

    try {
      const driveData = await this.drive.load();
      const localData = this.local.load();

      const driveModified = new Date(driveData._metadata?.lastModified || 0).getTime();
      const localModified = new Date(this.getLastModified() || 0).getTime();
      const driveHasData = (driveData.tasks && driveData.tasks.length > 0);

      console.log('🔍 Drive check:', {
        driveTaskCount: driveData.tasks?.length || 0,
        localTaskCount: localData.tasks?.length || 0,
        driveModified: new Date(driveModified).toISOString(),
        localModified: new Date(localModified).toISOString(),
        hasPendingSync: this.hasPendingSync(),
      });

      // If Drive is newer and we don't have pending changes, use Drive data
      // BUT only if Drive actually has data (don't overwrite with empty)
      // Also pull from Drive on first sign-in if local is empty but Drive has data
      const localIsEmpty = !localData.tasks || localData.tasks.length === 0;
      if ((driveModified > localModified || (localIsEmpty && driveHasData)) && !this.hasPendingSync() && driveHasData) {
        console.log('⬇️ Pulling data from Drive (Drive is newer or first sign-in with empty local)');
        this.local.save(driveData.tasks, driveData.categories, driveData.projects);
        this.setLastModified(driveData._metadata.lastModified);
        if (this.onSync) {
          this.onSync(driveData);
        }
      } else if (this.hasPendingSync() || (!driveHasData && localData.tasks.length > 0)) {
        // We have pending changes, OR Drive is empty but we have local data: upload to Drive
        // Safety: never upload empty data to Drive (would erase existing files)
        if (!localData.tasks || localData.tasks.length === 0) {
          console.warn('⚠️ Refusing to push empty data to Drive (would erase file)');
          this.setPendingSync(false);
          return;
        }
        console.log('⬆️ Pushing data to Drive');
        await this.drive.save(localData.tasks, localData.categories, localData.projects);
        this.setPendingSync(false);
        this.setLastModified(new Date().toISOString());
      } else {
        console.log('↔️ Data is in sync');
      }
    } catch (error) {
      console.error('❌ Drive check/merge failed:', error);
      throw error;
    }
  }

  async syncToDrive(tasks, categories, projects) {
    if (!this.drive.isAuthenticated) {
      this.setPendingSync(true);
      return;
    }

    // Safety check: never upload completely empty data (would erase Drive file)
    if (!tasks || tasks.length === 0) {
      console.warn('⚠️ Refusing to sync empty task list to Drive (would erase data)');
      return;
    }

    try {
      await this.drive.save(tasks, categories, projects);
      this.setPendingSync(false);
      this.setSyncStatus('synced');
    } catch (error) {
      this.setPendingSync(true);
      throw error;
    }
  }

  async retryPendingSync() {
    if (!this.drive.isAuthenticated) return;

    try {
      this.setSyncStatus('syncing');
      const localData = this.local.load();
      await this.drive.save(localData.tasks, localData.categories, localData.projects);
      this.setPendingSync(false);
      this.setSyncStatus('synced');
    } catch (error) {
      console.error('Retry sync failed:', error);
      this.setSyncStatus('error');
      // Retry again in 30 seconds
      this.retryTimeout = setTimeout(() => this.retryPendingSync(), 30 * 1000);
    }
  }

  // State management
  setSyncStatus(status) {
    if (this.syncStatus !== status) {
      this.syncStatus = status;
      if (this.onSyncStatusChange) {
        this.onSyncStatusChange(status);
      }
    }
  }

  getSyncStatus() {
    return this.syncStatus;
  }

  getUser() {
    return this.user;
  }

  hasPendingSync() {
    return localStorage.getItem(PENDING_SYNC_KEY) === 'true';
  }

  setPendingSync(pending) {
    if (pending) {
      localStorage.setItem(PENDING_SYNC_KEY, 'true');
    } else {
      localStorage.removeItem(PENDING_SYNC_KEY);
    }
  }

  getLastModified() {
    return localStorage.getItem(LAST_MODIFIED_KEY);
  }

  setLastModified(timestamp) {
    localStorage.setItem(LAST_MODIFIED_KEY, timestamp);
  }
}

// Export singleton instance
export const hybridPersistence = new HybridPersistence();
