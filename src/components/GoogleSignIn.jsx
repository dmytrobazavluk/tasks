import { useState } from 'react';

export default function GoogleSignIn({ user, syncStatus, onSignIn, onSignOut }) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
