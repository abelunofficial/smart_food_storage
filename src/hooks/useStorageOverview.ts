import { useState, useEffect, useCallback } from 'react';
import type { StorageDashboardSnapshot } from '../types';
import { storageService } from '../services';

interface UseStorageOverviewResult {
  snapshot: StorageDashboardSnapshot | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useStorageOverview(): UseStorageOverviewResult {
  const [snapshot, setSnapshot] = useState<StorageDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    storageService
      .getDashboardSnapshot()
      .then((data) => {
        if (isMounted) {
          setSnapshot(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load storage telemetry snapshot'));
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await storageService.getDashboardSnapshot();
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load storage telemetry snapshot'));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    snapshot,
    loading,
    error,
    refresh,
  };
}
