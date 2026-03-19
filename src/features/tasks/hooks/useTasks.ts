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

  // Start/stop polling based on whether any tasks are in_progress
  useEffect(() => {
    const hasInProgress = tasks.some((t) => t.status === 'in_progress');

    if (hasInProgress && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const updated = await silentRefetch();
        // Stop polling if nothing is in_progress anymore
        if (!updated.some((t) => t.status === 'in_progress') && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, POLL_INTERVAL_MS);
    } else if (!hasInProgress && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [tasks, silentRefetch]);

  useEffect(() => { load(); }, [load]);

  return { tasks, setTasks, isLoading, error, refetch: load };
}
