import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const queryClient = useQueryClient();

  const syncData = useCallback(async () => {
    // Invalidate all queries to refetch fresh data
    await queryClient.invalidateQueries();
    toast.success('Synced with server', {
      description: 'Your data has been updated',
      duration: 3000,
    });
  }, [queryClient]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast.info('Back online', {
          description: 'Syncing your data...',
          duration: 2000,
        });
        syncData();
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.warning('You are offline', {
        description: 'Changes will sync when you reconnect',
        duration: 4000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, syncData]);

  return { isOnline, syncData };
};
