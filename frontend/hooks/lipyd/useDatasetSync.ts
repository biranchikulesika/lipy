import { useEffect, useState } from 'react';
import { bootDatasetSync, processUploadQueue, subscribeSyncState } from '@/lib/lipyd/datasetSyncService';
import { isSupabaseConfigured } from '@/lib/lipyd/supabaseClient';

const initialState = {
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncing: false,
  pendingCount: 0,
  lastError: '',
  configured: isSupabaseConfigured(),
};

export default function useDatasetSync(sessionConfig: any) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (!sessionConfig || !sessionConfig.contributorId) return undefined;

    let cancelled = false;
    const unsubscribe = subscribeSyncState((nextState: any) => {
      if (cancelled) return;
      setState(nextState);
    });

    bootDatasetSync().catch((error) => {
      if (!cancelled) {
        setState((current) => ({
          ...current,
          lastError: error?.message || 'Unable to start upload sync',
        }));
      }
    });

    processUploadQueue().catch(() => { });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [sessionConfig?.contributorId, sessionConfig?.sessionId]);

  return state;
}
