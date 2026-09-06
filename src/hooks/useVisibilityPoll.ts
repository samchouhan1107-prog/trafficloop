import { useEffect, useRef } from 'react';

/**
 * Sets up a polling interval that automatically pauses when the browser tab
 * is hidden or the page is not visible (saves network + CPU), then resumes
 * and immediately refreshes when the user returns.
 *
 * @param callback      Async refresh function (returned value is ignored)
 * @param intervalMs    Poll cadence in milliseconds (min 500ms)
 * @param deps          Effect dependencies that restart the polling loop
 * @param enabled       When false, polling is fully disabled
 */
export function useVisibilityPoll(
  callback: () => void | Promise<void>,
  intervalMs: number,
  deps: unknown[] = [],
  enabled = true
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const minInterval = Math.max(500, intervalMs);
    let timer: ReturnType<typeof setInterval> | null = null;
    let isVisible = document.visibilityState === 'visible';
    let inFlight = false;

    const run = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        await callbackRef.current();
      } catch {
        // Poll errors are swallowed; the caller handles its own error state
      } finally {
        inFlight = false;
      }
    };

    const start = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') run();
      }, minInterval);
    };

    const onVisibility = () => {
      const nowVisible = document.visibilityState === 'visible';
      // Refresh immediately when the tab becomes visible again
      if (nowVisible && !isVisible) run();
      isVisible = nowVisible;
      if (nowVisible) start();
      else if (timer) clearInterval(timer);
    };

    document.addEventListener('visibilitychange', onVisibility);
    start();
    // Initial tick
    run();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, intervalMs, enabled]);
}