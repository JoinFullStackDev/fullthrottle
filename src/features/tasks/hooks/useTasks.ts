'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Task } from '@/lib/types';
import { listTasks } from '../service';

const POLL_INTERVAL_MS = 15000;

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listTasks();
      setTasks(data);
      setError(null);
      return data;
    } catch (err) {
      setError((err as Error).message);
      return [] as Task[];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const silentRefetch = useCallback(async () => {
    try {
      const data = await listTasks();
      setTasks(data);
      setError(null);
      return data;
    } catch {
      // silent — don't update error state on background polls
      return [] as Task[];
    }
  }, []);

  // Start/stop polling based on active task states; respect tab visibility
  useEffect(() => {
    const needsPolling = tasks.some(
      (t) => t.status === 'in_progress' || t.status === 'waiting',
    );

    const startPolling = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(async () => {
        if (document.visibilityState !== 'visible') return;
        const updated = await silentRefetch();
        const stillNeedsPolling = updated.some(
          (t) => t.status === 'in_progress' || t.status === 'waiting',
        );
        if (!stillNeedsPolling && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    if (needsPolling) {
      startPolling();
    } else {
      stopPolling();
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && needsPolling) {
        startPolling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [tasks, silentRefetch]);

  useEffect(() => { load(); }, [load]);

  return { tasks, setTasks, isLoading, error, refetch: load };
}
