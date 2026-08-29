import { useEffect, useRef } from 'react';

/**
 * Hook to poll an asynchronous callback at a set interval (default 6000ms).
 * Only polls when `enabled` is true.
 */
export function useLivePolling(
  callback: () => Promise<any> | void,
  intervalMs: number = 6000,
  enabled: boolean = true
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    // Call immediately on mount
    savedCallback.current();

    const id = setInterval(() => {
      savedCallback.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
