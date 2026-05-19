import { useState } from 'react';

export default function GoogleSignIn({
  user,
  syncStatus,
  workspaces = [],
  activeWorkspaceId,
  onSignIn,
  onSignOut,
  onSelectWorkspace,
  onCreateWorkspace,
}) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      await onSignIn();
    } catch (error) {
      console.error('Sign-in error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      setIsCreatingWorkspace(true);
      await onCreateWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  // Sync status dot color
  const getSyncDotColor = () => {
    switch (syncStatus) {
      case 'synced':
        return 'bg-green-500';
      case 'syncing':
      case 'pending':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-300';
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'synced':
        return 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Error';
      case 'offline':
        return 'Offline';
      default:
        return 'Idle';
    }
  };

  if (isAuthenticating) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <span className="text-sm text-gray-600">Connecting...</span>
      </div>
    );
  }

  if (user) {
    // Show reconnect button if sync status is idle (session may have expired)
    if (syncStatus === 'idle') {
      return (
        <div className="space-y-2">
          <button
            onClick={handleSignIn}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition"
          >
            Reconnect to Google Drive
          </button>
          <button
            onClick={onSignOut}
            className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition"
          >
            Sign Out
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-md">
          <div className={`w-2 h-2 rounded-full ${getSyncDotColor()}`} />
          <span className="text-sm font-medium text-gray-900">Google Drive: {getSyncStatusText()}</span>
        </div>

        {/* Workspace Selector */}
        {workspaces.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <select
              value={activeWorkspaceId || ''}
              onChange={(e) => onSelectWorkspace(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>

            {isCreatingWorkspace ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New workspace..."
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateWorkspace();
                    } else if (e.key === 'Escape') {
                      setIsCreatingWorkspace(false);
                      setNewWorkspaceName('');
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
                  autoFocus
                />
                <button
                  onClick={handleCreateWorkspace}
                  className="px-3 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md transition"
                >
                  ✓
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingWorkspace(true)}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
              >
                + New Workspace
              </button>
            )}
          </div>
        )}

        <button
          onClick={onSignOut}
          className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
    >
      Sync with Google Drive
    </button>
  );
}
