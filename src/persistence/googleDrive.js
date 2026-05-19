// Google Drive persistence layer using Google Identity Services (GIS)
// Handles OAuth 2.0 PKCE flow and Drive API v3 calls

const DRIVE_USER_KEY = 'taskplanner_driveUser';

export class GoogleDrivePersistence {
  constructor() {
    this.accessToken = null;
    this.fileId = null;
    this.user = null;
    this.tokenClient = null;
    this.initGIS();
    // Restore user from localStorage if available
    this.restoreUser();
  }

  initGIS() {
    // Initialize Google Identity Services if available and Client ID is set
    if (typeof window === 'undefined' || !window.google) {
      return;
    }

    const clientId = window.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return; // Will be initialized when needed
    }

    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
          } else if (response.error) {
            console.error('Auth error:', response.error);
            this.accessToken = null;
          }
        },
      });
    } catch (error) {
      console.error('Failed to init GIS:', error);
    }
  }

  ensureTokenClient() {
    // Lazy-initialize if not already done
    if (!this.tokenClient && typeof window !== 'undefined' && window.google && window.GOOGLE_CLIENT_ID) {
      this.initGIS();
    }
    return this.tokenClient;
  }

  async authenticate() {
    const tokenClient = this.ensureTokenClient();
    if (!tokenClient) {
      throw new Error('Google Client ID not configured. Set window.GOOGLE_CLIENT_ID in index.html');
    }

    return new Promise((resolve, reject) => {
      tokenClient.callback = (response) => {
        if (response.access_token) {
          this.accessToken = response.access_token;
          this.user = { authenticated: true };
          this.persistUser();
          resolve(this.user);
        } else if (response.error) {
          reject(new Error(`Google OAuth error: ${response.error}`));
        }
      };

      // Request access token with user prompt (shows popup if needed)
      tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  async attemptSilentAuth() {
    const tokenClient = this.ensureTokenClient();
    if (!tokenClient) return false;

    return new Promise((resolve) => {
      tokenClient.callback = (response) => {
        if (response.access_token) {
          this.accessToken = response.access_token;
          this.user = { authenticated: true };
          this.persistUser();
          resolve(true);
        } else {
          resolve(false);
        }
      };

      // Request with empty prompt = silent (no popup if not already signed in)
      tokenClient.requestAccessToken({ prompt: '' });
    });
  }

  async findOrCreateFile(fileName = 'task-planner-data.json') {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      // Always search by name to support multiple workspaces
      // Don't use this.fileId cache since we can have multiple files
      const encodedName = encodeURIComponent(fileName);
      const listResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name%3D%22${encodedName}%22&spaces=drive&fields=files(id,name)`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }
      );

      if (!listResponse.ok) throw new Error('Failed to list files');
      const listData = await listResponse.json();

      if (listData.files && listData.files.length > 0) {
        this.fileId = listData.files[0].id;
        return this.fileId;
      }

      // File doesn't exist, create it
      return await this.createFile(fileName);
    } catch (error) {
      console.error('Error finding/creating file:', error);
      throw error;
    }
  }

  async createFile(fileName = 'task-planner-data.json') {
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
    };

    const initialData = {
      version: '2.3.0',
      tasks: [],
      categories: [],
      projects: [],
      _metadata: {
        lastModified: new Date().toISOString(),
        createdTime: new Date().toISOString(),
      },
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', new Blob([JSON.stringify(initialData)], { type: 'application/json' }));

    try {
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to create file');
      const data = await response.json();
      this.fileId = data.id;
      return this.fileId;
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  }

  async load() {
    if (!this.accessToken || !this.fileId) {
      throw new Error('Not authenticated or file not found');
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${this.fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!response.ok) throw new Error('Failed to load file');
      const data = await response.json();

      return {
        tasks: data.tasks || [],
        categories: data.categories || [],
        projects: data.projects || [],
        _metadata: data._metadata || { lastModified: new Date().toISOString() },
      };
    } catch (error) {
      console.error('Error loading from Drive:', error);
      throw error;
    }
  }

  async save(tasks, categories, projects) {
    if (!this.accessToken || !this.fileId) {
      throw new Error('Not authenticated or file not found');
    }

    const data = {
      version: '2.3.0',
      tasks,
      categories,
      projects,
      _metadata: {
        lastModified: new Date().toISOString(),
      },
    };

    try {
      const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to save file');
      return await response.json();
    } catch (error) {
      console.error('Error saving to Drive:', error);
      throw error;
    }
  }

  logout() {
    if (this.tokenClient && this.accessToken) {
      // Revoke token
      google.accounts.oauth2.revoke(this.accessToken, () => {
        this.clearUser();
      });
    } else {
      this.clearUser();
    }
  }

  get isAuthenticated() {
    return !!this.accessToken;
  }

  restoreUser() {
    try {
      const stored = localStorage.getItem(DRIVE_USER_KEY);
      if (stored) {
        this.user = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to restore user:', error);
    }
  }

  persistUser() {
    try {
      if (this.user) {
        localStorage.setItem(DRIVE_USER_KEY, JSON.stringify(this.user));
      }
    } catch (error) {
      console.error('Failed to persist user:', error);
    }
  }

  clearUser() {
    this.user = null;
    this.accessToken = null;
    this.fileId = null;
    try {
      localStorage.removeItem(DRIVE_USER_KEY);
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  }

  async listWorkspaces() {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      // List all JSON files created by this app (drive.file scope limits to files this app created)
      const listResponse = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=mimeType='application/json'&spaces=drive&fields=files(id,name)&pageSize=100",
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }
      );

      if (!listResponse.ok) throw new Error('Failed to list workspaces');
      const listData = await listResponse.json();

      return (listData.files || []).map(file => ({
        id: file.id,
        name: file.name,
      }));
    } catch (error) {
      console.error('Error listing workspaces:', error);
      throw error;
    }
  }

  setActiveFile(fileId) {
    this.fileId = fileId;
  }
}
