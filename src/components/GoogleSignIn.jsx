import { useState, useEffect } from 'react';

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

  const handleSignOut = () => {
    onSignOut();
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
        return 'Sync Error';
      case 'offline':
        return 'Offline';
      default:
        return '';
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
    return (
      <div className="flex items-center gap-3 px-4 py-2">
        {user.picture && (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full"
            onError={(e) => {
              e.target.src = '';
            }}
          />
        )}
        <div className="flex items-center gap-2">
          <div>
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <div className={`w-2 h-2 rounded-full ${getSyncDotColor()}`} />
            <span className="text-xs text-gray-600">{getSyncStatusText()}</span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-600 hover:text-gray-900 ml-2"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
    >
      Sync with Google Drive
    </button>
  );
}
