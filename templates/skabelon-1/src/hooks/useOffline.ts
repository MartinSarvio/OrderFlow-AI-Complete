// OrderFlow PWA Generator - Offline Hook
import { useState, useEffect, useCallback } from 'react';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Reset after 3 seconds
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncWhenOnline = useCallback(async (action: () => Promise<void>) => {
    if (isOnline) {
      await action();
    } else {
      // Queue for later sync
      const pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
      pendingActions.push({
        timestamp: Date.now(),
        action: action.toString()
      });
      localStorage.setItem('pendingActions', JSON.stringify(pendingActions));
    }
  }, [isOnline]);

  return {
    isOnline,
    wasOffline,
    syncWhenOnline
  };
}
