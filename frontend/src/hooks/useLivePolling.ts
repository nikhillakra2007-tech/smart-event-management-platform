import { useEffect, useRef, useCallback } from 'react';

/**
 * Optimized polling hook:
 * - Only polls when `enabled` is true
 * - Pauses when document is hidden (Page Visibility API)
 * - Avoids duplicate calls if callback hasn't changed
 */
export function useLivePolling(
  callback: () => Promise<any> | void,
  intervalMs: number = 6000,
  enabled: boolean = true
) {
  const savedCallback = useRef(callback);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const tick = useCallback(() => {
    if (document.hidden) return;
    savedCallback.current();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Call immediately on mount if visible
    if (!document.hidden) savedCallback.current();

    const id = window.setInterval(tick, intervalMs);
    intervalRef.current = id;

    const handleVisibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [intervalMs, enabled, tick]);
}
